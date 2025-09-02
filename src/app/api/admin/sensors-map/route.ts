// app/api/admin/sensors-map/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("districtId");
  const date = searchParams.get("date");
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!districtId || !date) {
    return NextResponse.json(
      { error: "Missing required params: districtId, date" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();

    // ✅ Metrics ของวันนั้น
    const metricsQuery = `
      SELECT *
      FROM district_metrics_daily
      WHERE district_id = $1
      AND DATE(date) = $2
      LIMIT 1
    `;
    const metricsResult = await client.query(metricsQuery, [districtId, date]);

    // ✅ Sensors ของวันนั้น
    const sensorsQuery = `
      SELECT id, district_id, sensor_type, value, unit, status, last_update, description
      FROM sensors
      WHERE district_id = $1
        AND DATE(last_update) = $2
      ORDER BY last_update DESC
      LIMIT $3 OFFSET $4
    `;
    const sensorsResult = await client.query(sensorsQuery, [
      districtId,
      date,
      limit,
      offset,
    ]);

    client.release();

    return NextResponse.json({
      districtId,
      date,
      metrics: metricsResult.rows[0] || null,
      sensors: sensorsResult.rows || [],
    });
  } catch (err) {
    console.error("Error fetching sensors-map:", err);
    return NextResponse.json(
      { error: "Failed to fetch sensors-map" },
      { status: 500 }
    );
  }
}
