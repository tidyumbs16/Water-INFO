// app/api/stations/[stationId]/metrics/daily/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { stationId: string } }
) {
  try {
    const { stationId } = await params; // ✅ ต้อง await ใน Next.js 13+
    const today = new Date().toISOString().split("T")[0];

    const query = `
      SELECT id, district_id, date, water_quality, water_volume, pressure, efficiency
      FROM district_metrics_daily
      WHERE district_id = $1 AND date = $2
      LIMIT 1;
    `;

    const result = await pool !.query(query, [stationId, today]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No metrics found for today" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching daily metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily metrics" },
      { status: 500 }
    );
  }
}
