// app/api/provinces/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // ต้อง import pool เข้ามา

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('regionId');

    if (!regionId) {
      return NextResponse.json({ error: 'Missing regionId parameter' }, { status: 400 });
    }

    const result = await pool !.query('SELECT DISTINCT province FROM districts WHERE region = $1', [regionId]);
    const provinces = result.rows.map((r: { province: string }) => ({
      id: r.province,
      name: r.province,
      regionId: regionId // เพิ่ม regionId เข้าไปตาม Province interface
    }));

    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json({ error: 'Failed to fetch provinces', details: (error as Error).message }, { status: 500 });
  }
}