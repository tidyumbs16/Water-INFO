import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL ERROR: DATABASE_URL is not set in environment variables.');
}

export const pool = connectionString ? new Pool({ connectionString }) : undefined;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

// --- Type Definitions ---

// ใช้ชื่อ field ให้ตรงกับตารางจริง
export interface District {
  id: string;
  name: string;
  provinceName: string;   // province
  regionName: string;     // region
  address: string | null;
  contact: string | null;
  capacity: string | null;
  population: number | null;
  status: string | null;
  description: string | null;
}

export interface Province {
  id: string;       // ใช้ province name เป็น id
  name: string;
  regionName: string;
}

export interface Region {
  id: string;       // ใช้ region name เป็น id
  name: string;
}

// --- Database Functions ---

/**
 * ดึงรายชื่อ Region ทั้งหมด
 */
export async function getRegions(): Promise<Region[]> {
  if (!pool) throw new Error('Database connection is not configured.');
  try {
    const result = await pool.query<{ region: string }>(`
      SELECT DISTINCT region
      FROM districts
      WHERE region IS NOT NULL
      ORDER BY region ASC
    `);

    return result.rows.map(r => ({
      id: r.region,
      name: r.region,
    }));
  } catch (err) {
    console.error('Error fetching regions:', err);
    throw err;
  }
}

/**
 * ดึงข้อมูลจังหวัด (กรองตาม region ถ้ามี)
 */
export async function getProvinces(region?: string): Promise<Province[]> {
  if (!pool) throw new Error('Database connection is not configured.');
  try {
    let queryText = `
      SELECT DISTINCT province, region
      FROM districts
      WHERE province IS NOT NULL
    `;
    const queryParams: string[] = [];

    if (region) {
      queryText += ` AND region = $1`;
      queryParams.push(region);
    }

    queryText += ` ORDER BY province ASC`;

    const result = await pool.query<{ province: string; region: string }>(queryText, queryParams);

    return result.rows.map(r => ({
      id: r.province,
      name: r.province,
      regionName: r.region,
    }));
  } catch (err) {
    console.error('Error fetching provinces:', err);
    throw err;
  }
}

/**
 * ดึงข้อมูล District ตาม id
 */
export async function getDistrictById(id: string): Promise<District | null> {
  if (!pool) throw new Error("Database connection is not configured.");
  try {
    const query = `
      SELECT 
        id,
        name,
        province AS "provinceName",
        region AS "regionName",
        address,
        contact,
        capacity,
        population,
        status,
        description
      FROM districts
      WHERE id = $1
      LIMIT 1;
    `;

    const result = await pool.query<District>(query, [id]);

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (err) {
    console.error(`Error fetching district by ID (${id}):`, err);
    throw err;
  }
}

export default pool;
