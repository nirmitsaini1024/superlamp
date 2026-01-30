import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [marketplaceData, regionsData, plansData] = await Promise.all([
      readJson<{ applications: unknown[]; meta?: unknown }>("marketplace.json"),
      readJson<{ regions: unknown[]; meta?: unknown }>("vultr-regions.json"),
      readJson<{ plans: unknown[] }>("vultr-plans.json"),
    ]);

    const applications = marketplaceData?.applications ?? [];
    const regions = regionsData?.regions ?? [];
    const plans = plansData?.plans ?? [];

    return NextResponse.json({
      applications,
      regions,
      plans,
      meta: {
        applicationsTotal: Array.isArray(applications) ? applications.length : 0,
        regionsTotal: Array.isArray(regions) ? regions.length : 0,
        plansTotal: Array.isArray(plans) ? plans.length : 0,
      },
    });
  } catch (error) {
    console.error("[api/marketplace]", error);
    return NextResponse.json(
      { error: "Failed to load marketplace data" },
      { status: 500 }
    );
  }
}
