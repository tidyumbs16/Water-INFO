import { pool } from "../../../../lib/db"; // ตรวจสอบ path ให้ตรง

export interface District {
  id: string;
  name: string;
  province: string;
  region: string;
  status: string | null;
  description: string | null;
  population: number | null;
  lat: number | null;
  lng: number | null;
}

export async function getStationById(districtId: string): Promise<District | null> {
  if (!pool) {
    console.error("Database connection pool is not initialized.");
    return null;
  }

  try {
    const query = `
      SELECT 
        id,
        name,
        province,
        region,
        status,
        description,
      FROM districts
      WHERE id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [districtId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (err) {
    console.error("Error fetching district by ID:", err);
    throw err;
  }
}
