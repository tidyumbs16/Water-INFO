import pool from '@/lib/db';
import { NextResponse } from 'next/server';

interface District {
  district_id: string;
  district_name: string;
}

export async function GET(request: Request) {
  try {
    if (!pool) {
      console.error('Database pool is not initialized.');
      return NextResponse.json({ error: 'Database connection not established.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');

    let queryText = 'SELECT id, name FROM districts';
    const queryValues: string[] = [];

    if (provinceId) {
      queryText += ' WHERE province = $1'; // ปรับให้ตรงกับ DB จริง
      queryValues.push(provinceId);
    }

    const result = await pool.query(queryText, queryValues);

    const districts: District[] = result.rows.map(row => ({
      district_id: row.id,
      district_name: row.name
    }));

    return NextResponse.json(districts);
  } catch (error) {
    console.error('API Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts from database.' }, { status: 500 });
  }
}
