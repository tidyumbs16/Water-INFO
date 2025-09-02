import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ map region English → ไทย ให้ตรงกับ DB จริง
const regionMapping: Record<string, string> = {
  UpperNorth: "ภาคเหนือ",   // รวมตอนบน-ตอนล่างเข้าด้วยกัน
  LowerNorth: "ภาคเหนือ",
  Northeast: "ภาคตะวันออกเฉียงเหนือ",
  Central: "ภาคกลาง",
  East: "ภาคตะวันออก",
  West: "ภาคตะวันตก",
  South: "ภาคใต้",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let region = searchParams.get("region");

  // ✅ แปลง region English → ไทย ก่อน query
  if (region && regionMapping[region]) {
    region = regionMapping[region];
  }

  try {
    const client = await pool.connect();

    const query = `
      SELECT 
        id,
        name,
        province,
        region,
        status,
        description
      FROM districts
      ${region ? "WHERE region = $1" : ""}
      ORDER BY updated_at DESC;
    `;

    const result = await client.query(query, region ? [region] : []);
    client.release();

    // ✅ Map ค่า fallback กัน frontend error
    const mapped = result.rows.map((row: any, i: number) => ({
      id: row.id ?? `dist-${i}`,
      name: row.name ?? "-",
      province: row.province ?? "-",
      region: row.region ?? "-",
      status: row.status ?? "ไม่ทราบ",
      description: row.description ?? "",
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching districts:", err);
    return NextResponse.json(
      { error: "Failed to fetch districts" },
      { status: 500 }
    );
  }
}
