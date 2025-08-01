// app/api/admin/districts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken, DecodedToken } from '@/lib/auth'; // ตรวจสอบว่า import ถูกต้อง
import { District } from '../../../../../lib/definitions'; // ตรวจสอบว่า import ถูกต้อง

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for authentication (ใช้ร่วมกับไฟล์ [id]/route.ts)
const authenticateRequest = (req: NextRequest): DecodedToken | NextResponse => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized: No token provided or malformed header' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const decodedToken = verifyToken(token);
  if (!decodedToken) {
    return NextResponse.json({ message: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }
  return decodedToken;
};

/**
 * GET /api/admin/districts
 * ดึงข้อมูลเขต/อำเภอทั้งหมด พร้อมการค้นหา
 */
export async function GET(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';

    const queryParams: any[] = [];
    let whereClause = '';

    if (searchTerm) {
      whereClause = `WHERE name ILIKE $1 OR province ILIKE $2 OR region ILIKE $3`;
      const searchValue = `%${searchTerm}%`;
      queryParams.push(searchValue, searchValue, searchValue);
    }

    const dataQuery = `
      SELECT id, name, province, region, status, description, created_at, updated_at
      FROM districts
      ${whereClause}
      ORDER BY updated_at DESC;
    `;

    const client = await pool.connect();
    try {
      const dataResult = await client.query<District>(dataQuery, queryParams);
      
      // FIX: ส่งข้อมูลกลับเป็น Array ตรงๆ เพื่อให้เข้ากับโค้ด Frontend
      return NextResponse.json(dataResult.rows);

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 });
  }
}

/**
 * POST /api/admin/districts
 * สร้างเขต/อำเภอใหม่
 */
export async function POST(request: NextRequest) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { name, province, region, status, description } = await request.json();

    if (!name || !province || !region) {
        return NextResponse.json({ error: 'Name, province, and region are required fields.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertQuery = `
        INSERT INTO districts (name, province, region, status, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const result = await client.query<District>(insertQuery, [name, province, region, status, description]);
      
      await client.query('COMMIT');
      
      return NextResponse.json(result.rows[0], { status: 201 });

    } catch (transactionError: any) {
      await client.query('ROLLBACK');
      console.error('Transaction failed during district creation:', transactionError);
      return NextResponse.json({ error: 'Failed to create district', details: transactionError.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error creating district:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
