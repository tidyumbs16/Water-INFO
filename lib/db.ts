import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('CRITICAL ERROR: DATABASE_URL is not set');
}

// Export the pool so it can be imported and used in other files
export const pool = connectionString ? new Pool({ connectionString }) : undefined;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on PostgreSQL client:', err);
  });
}

// Type Definitions
export interface Station {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  regionId: string; // คาดว่านี่คือ ID ของภูมิภาค
  regionName: string; // คาดว่านี่คือชื่อของภูมิภาค
  address: string | null;
  contact: string | null;
  capacity: string | null;
  status: string | null;
}

export interface Province {
  id: string;
  name: string;
  regionId: string;
}

export interface Region {
  id: string;
  name: string;
}

// --- Database Functions ---
export async function getRegions(): Promise<Region[]> {
  if (!pool) {
    console.warn('Database pool is not initialized. Returning empty array for regions.');
    return [];
  }
  try {
    const result = await pool.query(`
      SELECT DISTINCT region_id AS id, region_name AS name 
      FROM stations 
      WHERE region_id IS NOT NULL AND region_name IS NOT NULL
      ORDER BY region_name ASC
    `);
    return result.rows;
  } catch (err) {
    console.error('Error fetching regions from stations:', err);
    return [];
  }
}

/**
 * ดึงข้อมูลจังหวัดจากตาราง 'stations'
 * สามารถกรองตาม regionId ได้ (ถ้ามี)
 * @param regionId (Optional) ID ของภูมิภาคที่ต้องการกรองจังหวัด
 * @returns Promise<Province[]> รายการจังหวัด
 */
export async function getProvinces(regionId?: string): Promise<Province[]> {
  if (!pool) {
    console.warn('Database pool is not initialized. Returning empty array for provinces.');
    return [];
  }
  try {
    let queryText = `
      SELECT DISTINCT province_id AS id, province_name AS name, region_id AS "regionId"
      FROM stations 
      WHERE province_id IS NOT NULL AND province_name IS NOT NULL
    `;
    const queryParams: string[] = [];

    if (regionId) {
      queryText += ` AND region_id = $1`;
      queryParams.push(regionId);
    }

    queryText += ` ORDER BY province_name ASC`;

    const result = await pool.query(queryText, queryParams);
    return result.rows;
  } catch (err) {
    console.error('Error fetching provinces from stations:', err);
    return [];
  }
}
 export default pool;