// app/api/regions/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // ต้อง import pool เข้ามา

export async function GET() {
  try {
    const result = await pool ! .query('SELECT DISTINCT region FROM districts');
    const regions = result.rows.map((r: { region: string }) => ({ id: r.region, name: r.region }));
    return NextResponse.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
  }
}