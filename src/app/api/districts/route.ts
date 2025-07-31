import  pool  from '@/lib/db'; // เปลี่ยนจาก import pool เป็น import { pool }
import { NextResponse } from 'next/server'; 


interface District {
  id: string;   
  name: string; 
}

/**
 * @function GET
 * @description 
 *
 * @param {Request} request - The incoming Next.js Request object.
 * @returns {Promise<NextResponse>} A JSON response containing the list of districts
 */
export async function GET(request: Request) {
  try {
    if (!pool) {
      // ตรวจสอบให้แน่ใจว่า pool ถูก initialize แล้ว
      console.error('Database pool is not initialized in API route.');
      return NextResponse.json({ error: 'Database connection not established.' }, { status: 500 });
    }

    const result = await pool.query('SELECT id, name FROM districts');
    const districts: District[] = result.rows; 

    return NextResponse.json(districts);
  } catch (error) {
    console.error('API Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts from database.' }, { status: 500 });
  }
}
