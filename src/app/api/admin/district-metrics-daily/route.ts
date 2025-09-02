import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("districtId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]; // ถ้าไม่ส่งมาใช้วันนี้

  if (!districtId) {
    return NextResponse.json({ error: "ต้องระบุ districtId" }, { status: 400 });
  }

  try {
    const client = await pool.connect();

   const query = `
  SELECT 
    water_quality,
    water_volume,
    pressure,
    efficiency
  FROM district_metrics_daily
  WHERE district_id = $1 AND date = $2
  LIMIT 1;
`;


    const result = await client.query(query, [districtId, date]);
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "ไม่พบข้อมูล metrics ของเขตนี้ในวันดังกล่าว" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching district metrics:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล metrics" }, { status: 500 });
  }
}
