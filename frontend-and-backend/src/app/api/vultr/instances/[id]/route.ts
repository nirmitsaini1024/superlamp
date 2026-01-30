import { NextRequest, NextResponse } from "next/server";

const VULTR_API_BASE = "https://api.vultr.com/v2";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const instanceId = params.id;
    if (!instanceId) {
      return NextResponse.json(
        { error: "Instance ID is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${VULTR_API_BASE}/instances/${instanceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    // Vultr returns 204 No Content on successful delete
    if (res.status === 204 || res.ok) {
      return NextResponse.json({
        success: true,
        message: "Instance deleted successfully",
      });
    }

    const data = await res.json().catch(() => ({}));

    return NextResponse.json(
      {
        error: data.error || "Failed to delete instance",
        details: data,
        status: res.status,
      },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
    );
  } catch (err) {
    console.error("[api/vultr/instances/[id]]", err);
    return NextResponse.json(
      { error: "Failed to delete instance", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
