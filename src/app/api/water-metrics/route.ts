import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export const dynamic = "force-dynamic"; // กัน cache ถ้าจำเป็น

export async function GET() {
  if (!pool) {
    return NextResponse.json(
      { message: "Database connection not established." },
      { status: 500 }
    );
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
         date, 
         SUM(water_volume) AS total_volume, 
         AVG(water_quality) AS avg_quality
       FROM district_metrics
       GROUP BY date
       ORDER BY date DESC
       LIMIT 7`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching water metrics:", error);
    return NextResponse.json(
      { message: "Failed to fetch water metrics" },
      { status: 500 }
    );
  }
}
