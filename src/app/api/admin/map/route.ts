import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../../lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const districtId = searchParams.get("districtId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const client = await pool!.connect();

    // ดึง districts
    const districtQuery = `
      SELECT id, name, province, region, status, lat, lng, population
      FROM districts
      ${region ? "WHERE region = $1" : ""}
      ORDER BY updated_at DESC;
    `;
    const districtRes = await client.query(districtQuery, region ? [region] : []);
    const districts = districtRes.rows;

    // ดึง sensors
    let sensors: any[] = [];
    if (districtId) {
      const sensorQuery = `
        SELECT id, district_id, sensor_type, value, unit, status, last_update
        FROM sensors
        WHERE district_id = $1
        ORDER BY last_update DESC;
      `;
      const sensorRes = await client.query(sensorQuery, [districtId]);
      sensors = sensorRes.rows;
    }

    // ดึง metrics
    let metrics: any = null;
    if (districtId) {
      const metricQuery = `
        SELECT id, district_id, date, water_quality, water_volume, pressure, efficiency
        FROM district_metrics_daily
        WHERE district_id = $1 AND date = $2
        LIMIT 1;
      `;
      const metricRes = await client.query(metricQuery, [districtId, date]);
      metrics = metricRes.rows[0] || null;
    }

    client.release();
    return NextResponse.json({ districts, sensors, metrics });
  } catch (error) {
    console.error("API /map error:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}
