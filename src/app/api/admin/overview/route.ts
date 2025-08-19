// src/app/api/admin/overview/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  let client;
  try {
    client = await pool!.connect();

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId");
    const range = searchParams.get("range"); // today | 7d | 30d
    const date = searchParams.get("date");   // YYYY-MM-DD

    // WHERE clause
    let whereClause = "WHERE 1=1";
    if (districtId) whereClause += ` AND district_id = '${districtId}'`;
   if (date) {
  whereClause += ` AND date = '${date}'`;
} else if (range === "today") {
  whereClause += ` AND date = CURRENT_DATE`;
} else if (range === "7d") {
  whereClause += ` AND date >= CURRENT_DATE - INTERVAL '7 days'`;
} else if (range === "30d") {
  whereClause += ` AND date >= CURRENT_DATE - INTERVAL '30 days'`;
}

    // ค่าเฉลี่ย
    const avgQuery = `
      SELECT
        ROUND(AVG(water_quality)::numeric, 2) AS water_quality_avg,
        ROUND(AVG(water_volume)::numeric, 2) AS water_volume_avg,
        ROUND(AVG(pressure)::numeric, 2) AS pressure_avg,
        ROUND(AVG(efficiency)::numeric, 2) AS efficiency_avg
      FROM district_metrics_daily
      ${whereClause};
    `;
    const avgResult = await client.query(avgQuery);

    const average = {
      water_quality_avg: Number(avgResult.rows[0]?.water_quality_avg) || 0,
      water_volume_avg: Number(avgResult.rows[0]?.water_volume_avg) || 0,
      pressure_avg: Number(avgResult.rows[0]?.pressure_avg) || 0,
      efficiency_avg: Number(avgResult.rows[0]?.efficiency_avg) || 0,
    };

    // แนวโน้ม
    const trendQuery = `
      SELECT
        date,
        ROUND(water_quality::numeric, 2) AS water_quality_avg,
        ROUND(water_volume::numeric, 2) AS water_volume_avg,
        ROUND(pressure::numeric, 2) AS pressure_avg,
        ROUND(efficiency::numeric, 2) AS efficiency_avg
      FROM district_metrics_daily
      ${whereClause}
      ORDER BY date ASC;
    `;
    const trendResult = await client.query(trendQuery);
    let trends = trendResult.rows;

    // auto-fill (เฉพาะ 7d, 30d)
    if (range === "7d") trends = fillMissingDates(trends, 7);
    if (range === "30d") trends = fillMissingDates(trends, 30);

    // ข้อมูล Pie Chart
    const pieData = [
      { name: "Quality", value: average.water_quality_avg },
      { name: "Volume", value: average.water_volume_avg },
      { name: "Pressure", value: average.pressure_avg },
      { name: "Efficiency", value: average.efficiency_avg },
    ];

    return NextResponse.json({ average, trends, pieData });

  } catch (err) {
    console.error("Error fetching overview:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}

// เติมวันย้อนหลัง
function fillMissingDates(trends: any[], days: number) {
  const today = new Date();
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const found = trends.find(t => t.date === dateStr);
    result.push(
      found || {
        date: dateStr,
        water_quality_avg: 0,
        water_volume_avg: 0,
        pressure_avg: 0,
        efficiency_avg: 0,
      }
    );
  }
  return result;
}
