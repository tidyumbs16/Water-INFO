// app/api/districts/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');

    if (!provinceId) {
      return NextResponse.json({ error: 'Missing provinceId parameter' }, { status: 400 });
    }

    const result = await pool !.query(
      // *** แก้ไขตรงนี้: เปลี่ยน district_id เป็น id ***
      'SELECT id, district_name, province, region, city, contact, capacity, status FROM districts WHERE province = $1',
      [provinceId]
    );

    const districts = result.rows.map((d: any) => ({
      // *** แก้ไขตรงนี้: เปลี่ยน d.district_id เป็น d.id ***
      id: d.id, // ใช้ id จาก DB เป็น unique key
      name: d.district_name,
      provinceId: d.province,
      provinceName: d.province,
      regionId: d.region,
      regionName: d.region,
      address: d.city || 'ยังไม่มีข้อมูลที่อยู่', // ใช้ city หรือ placeholder
      contact: d.contact || 'ยังไม่มีข้อมูลติดต่อ', // ดึงจาก DB ได้เลย
      capacity: d.capacity || 'ยังไม่มีข้อมูลความจุ', // ดึงจาก DB ได้เลย
      status: d.status || 'ปกติ', // ดึงจาก DB ได้เลย
    }));

    return NextResponse.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json({ error: 'Failed to fetch districts', details: (error as Error).message }, { status: 500 });
  }
}