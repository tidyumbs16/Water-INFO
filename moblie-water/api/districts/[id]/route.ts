// app/api/districts/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Missing district ID' }, { status: 400 });
  }

  try {
    const result = await pool !.query(
      'SELECT id, district_name as name, province, region, city, contact, capacity, status FROM districts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'District not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching district with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch district data', details: (error as Error).message }, { status: 500 });
  }
}