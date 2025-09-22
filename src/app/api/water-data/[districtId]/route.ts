// src/app/api/water-data/[districtId]/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../../lib/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ districtId: string }> }
) {
  try {
    const { districtId } = await context.params; // ✅ await

    const query = `
      WITH latest AS (
        SELECT 
          water_quality,
          water_volume,
          pressure,
          efficiency,
          quality_trend,
          volume_trend,
          pressure_trend,
          efficiency_trend,
          date AS recorded_at
        FROM district_metrics_daily
        WHERE district_id = $1
        ORDER BY date DESC
        LIMIT 1
      ),
      avg7 AS (
        SELECT 
          ROUND(AVG(water_quality)::numeric, 2) AS water_quality,
          ROUND(AVG(water_volume)::numeric, 2) AS water_volume,
          ROUND(AVG(pressure)::numeric, 2) AS pressure,
          ROUND(AVG(efficiency)::numeric, 2) AS efficiency,
          ROUND(AVG(quality_trend)::numeric, 1) AS quality_trend,
          ROUND(AVG(volume_trend)::numeric, 1) AS volume_trend,
          ROUND(AVG(pressure_trend)::numeric, 1) AS pressure_trend,
          ROUND(AVG(efficiency_trend)::numeric, 1) AS efficiency_trend
        FROM district_metrics_daily
        WHERE district_id = $1
          AND date >= CURRENT_DATE - INTERVAL '7 days'
      ),
      avg30 AS (
        SELECT 
          ROUND(AVG(water_quality)::numeric, 2) AS water_quality,
          ROUND(AVG(water_volume)::numeric, 2) AS water_volume,
          ROUND(AVG(pressure)::numeric, 2) AS pressure,
          ROUND(AVG(efficiency)::numeric, 2) AS efficiency,
          ROUND(AVG(quality_trend)::numeric, 1) AS quality_trend,
          ROUND(AVG(volume_trend)::numeric, 1) AS volume_trend,
          ROUND(AVG(pressure_trend)::numeric, 1) AS pressure_trend,
          ROUND(AVG(efficiency_trend)::numeric, 1) AS efficiency_trend
        FROM district_metrics_daily
        WHERE district_id = $1
          AND date >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        (SELECT row_to_json(latest)  FROM latest)  AS latest,
        (SELECT row_to_json(avg7)    FROM avg7)    AS avg7days,
        (SELECT row_to_json(avg30)   FROM avg30)   AS avg30days;
    `;

    const result = await pool!.query(query, [String(districtId)]);

    return NextResponse.json(result.rows[0] || {});
  } catch (error) {
    console.error("❌ Error fetching water metrics:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลได้", details: String(error) },
      { status: 500 }
    );
  }
}
