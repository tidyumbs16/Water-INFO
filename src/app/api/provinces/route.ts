// app/api/provinces/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!pool) {
    console.error("Database pool is not initialized.");
    return NextResponse.json(
      { error: "Database not initialized" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("regionId");

    if (!regionId) {
      return NextResponse.json(
        { error: "Missing regionId parameter" },
        { status: 400 }
      );
    }

    const result = await pool!.query(
      `
      SELECT DISTINCT province 
      FROM districts 
      WHERE region = $1 
      ORDER BY province ASC;
    `,
      [regionId]
    );

    const provinces = result.rows.map((r: { province: string }) => ({
      id: r.province,
      name: r.province,
      regionId: regionId,
    }));

    return NextResponse.json(provinces);
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch provinces",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
