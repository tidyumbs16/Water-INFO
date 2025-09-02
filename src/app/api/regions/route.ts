// app/api/regions/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // ใช้ export { pool } จาก lib/db

export async function GET() {
  if (!pool) {
    console.error("Database pool is not initialized.");
    return NextResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }

  try {
    const result = await pool!.query(`
      SELECT DISTINCT region
      FROM districts
      WHERE region IS NOT NULL
      ORDER BY region ASC;
    `);

    const regions = result.rows.map((r: { region: string }) => ({
      id: r.region,
      name: r.region,
    }));

    return NextResponse.json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}
