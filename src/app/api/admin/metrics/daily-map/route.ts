// app/api/admin/metrics/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyToken } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  // ✅ Auth check
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // ✅ Query params
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("districtId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]; // default วันนี้

  if (!districtId) {
    return NextResponse.json(
      { error: "districtId is required" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();

    const query = `
      SELECT id, district_id, date, water_quality, water_volume, pressure, efficiency
      FROM district_metrics_daily
      WHERE district_id = $1 AND date = $2
      LIMIT 1;
    `;
    const values = [districtId, date];

    const result = await client.query(query, values);
    client.release();

    // ✅ ถ้าไม่เจอข้อมูล
    if (result.rows.length === 0) {
      return NextResponse.json({ message: "No metrics found for this date" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]); // ส่ง object เดียว
  } catch (err) {
    console.error("Error fetching metrics:", err);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
