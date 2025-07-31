// src/app/api/water-data/[districtId]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Import your database utility


interface DistrictMetrics {
  district_id: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number | null;
  volume_trend: number | null;
  pressure_trend: number | null;
  efficiency_trend: number | null;
  created_at?: string; // หรือ Date
  date?: string; // หรือ Date - ตรวจสอบว่าคอลัมน์นี้มีใน DB จริง
}

export async function GET(
  request: Request,
  { params }: { params: { districtId: string } }
) {
  const resolvedParams = await params;
const { districtId } = resolvedParams;
  let client;

  try {
    if (!pool) {
      console.error('Database pool is not initialized. Cannot fetch water data.');
      return NextResponse.json(
        { error: 'Database connection not established. Check DATABASE_URL environment variable.' },
        { status: 500 }
      );
    }

    client = await pool.connect();

    let query: string;
    let queryParams: (string | number)[];

    // --- จัดการกรณี districtId เป็น 'all' หรือเป็น District ID เฉพาะ ---
    if (districtId === 'all') {
      // ถ้า districtId เป็น 'all' เราจะดึงข้อมูลรวม หรือค่าเฉลี่ยล่าสุด
      // สมมติว่าในตาราง district_metrics อาจจะมี record สำหรับ 'all' district_id
      // หรืออาจจะดึงค่าเฉลี่ยล่าสุดของทุกเขต
      // ณ ที่นี้ ผมจะสมมติว่าคุณต้องการดึงข้อมูลล่าสุดสำหรับ district_id = 'all'
      // ถ้าไม่มี อาจจะต้องเปลี่ยน Logic เป็นการคำนวณค่าเฉลี่ยจากทุกเขตจริง ๆ
      query = `
        SELECT
          'all' as district_id, -- กำหนดให้ district_id เป็น 'all' สำหรับผลลัพธ์รวม
          AVG(water_quality) as water_quality,
          AVG(water_volume) as water_volume,
          AVG(pressure) as pressure,
          AVG(efficiency) as efficiency,
          -- สำหรับ trend อาจจะต้องมี logic การคำนวณที่ซับซ้อนกว่านี้
          -- หรือถ้าคุณเก็บ quality_trend ของภาพรวมใน district_id = 'all' ก็ใช้ได้เลย
          AVG(quality_trend) as quality_trend,
          AVG(volume_trend) as volume_trend,
          AVG(pressure_trend) as pressure_trend,
          AVG(efficiency_trend) as efficiency_trend,
          MAX(created_at) as created_at, -- ใช้ created_at ล่าสุด
          NULL as date -- ถ้าคุณไม่มีคอลัมน์ date ที่เป็นค่ารวม
        FROM district_metrics;
      `;
      queryParams = []; // ไม่มี parameter สำหรับ query นี้
      
      // *** หรือถ้าคุณมี record สำหรับ district_id = 'all' โดยเฉพาะ (แนะนำ) ***
      // query = `
      //   SELECT
      //     district_id,
      //     water_quality,
      //     water_volume,
      //     pressure,
      //     efficiency,
      //     quality_trend,
      //     volume_trend,
      //     pressure_trend,
      //     efficiency_trend,
      //     created_at,
      //     date
      //   FROM district_metrics
      //   WHERE district_id = $1
      //   ORDER BY created_at DESC
      //   LIMIT 1;
      // `;
      // queryParams = [districtId]; // ก็ยังใช้ $1 สำหรับ 'all' ได้เลย
      
    } else {
      // กรณีที่เป็น districtId เฉพาะเจาะจง
      query = `
        SELECT
          district_id,
          water_quality,
          water_volume,
          pressure,
          efficiency,
          quality_trend,
          volume_trend,
          pressure_trend,
          efficiency_trend,
          created_at,
          date -- *** โปรดตรวจสอบว่าคอลัมน์ 'date' มีอยู่จริงในตาราง 'district_metrics' ***
        FROM district_metrics
        WHERE district_id = $1
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      queryParams = [districtId];
    }

    // ทำการ Query ข้อมูล
    const result = await client.query<DistrictMetrics>(query, queryParams);

    if (result.rows.length === 0) {
      console.warn(`No water data found for district ID: ${districtId}.`);
      return NextResponse.json({ error: `No water data found for district ID: ${districtId}` }, { status: 404 });
    }

    // ส่งข้อมูล row แรกกลับไป (ซึ่งควรเป็นข้อมูลล่าสุด)
    return NextResponse.json(result.rows[0]);

  } catch (error: any) {
    console.error(`Error fetching water data for district ${districtId}:`, error);
    // ส่งรายละเอียด error message กลับไปใน dev mode เพื่อช่วย Debug
    const errorMessage = process.env.NODE_ENV === 'development' ? error.message : 'Unknown error occurred.';
    return NextResponse.json(
      { error: `Failed to fetch water data for district ${districtId}`, details: errorMessage },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release(); // คืน client กลับสู่ pool เสมอ
    }
  }
}