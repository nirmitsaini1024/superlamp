import { NextResponse } from "next/server";

const VULTR_API_BASE = "https://api.vultr.com/v2";

export async function GET() {
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

    const res = await fetch(`${VULTR_API_BASE}/instances`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.error || "Failed to fetch instances",
          details: data,
          status: res.status,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      instances: data.instances || [],
    });
  } catch (err) {
    console.error("[api/vultr/instances]", err);
    return NextResponse.json(
      { error: "Failed to fetch instances", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
