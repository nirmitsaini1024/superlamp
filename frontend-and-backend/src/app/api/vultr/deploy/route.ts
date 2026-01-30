import { NextRequest, NextResponse } from "next/server";

const VULTR_API_BASE = "https://api.vultr.com/v2";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.VULTR_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Vultr API key not configured",
          details: "Set VULTR_API_KEY in your environment (e.g. .env.local)",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      region,
      plan,
      app_id,
      image_id,
      label,
      hostname,
      enable_ipv6 = true,
    } = body as {
      region?: string;
      plan?: string;
      app_id?: number;
      image_id?: string;
      label?: string;
      hostname?: string;
      enable_ipv6?: boolean;
    };

    if (!region || !plan) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["region", "plan"],
        },
        { status: 400 }
      );
    }

    // Marketplace applications require image_id; one-click apps use app_id
    if (!image_id && app_id == null) {
      return NextResponse.json(
        {
          error: "Missing application: provide image_id (marketplace) or app_id",
          required: ["region", "plan", "image_id or app_id"],
        },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      region: String(region),
      plan: String(plan),
      enable_ipv6: Boolean(enable_ipv6),
    };
    if (image_id != null && String(image_id).trim()) {
      payload.image_id = String(image_id).trim();
    } else if (app_id != null) {
      payload.app_id = Number(app_id);
    }
    if (label != null && String(label).trim()) payload.label = String(label).trim();
    if (hostname != null && String(hostname).trim()) payload.hostname = String(hostname).trim();

    const res = await fetch(`${VULTR_API_BASE}/instances`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.error || "Vultr API request failed",
          details: data,
          status: res.status,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      instance: data.instance ?? data,
    });
  } catch (err) {
    console.error("[api/vultr/deploy]", err);
    return NextResponse.json(
      { error: "Deploy failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 } 
    );
  }
}
