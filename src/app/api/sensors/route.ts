import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // ตรวจสอบ Path ของ lib/db ให้ถูกต้อง (ใช้ alias @ ได้ถ้าตั้งค่าใน tsconfig.json)
import { Sensor } from '@/src/types/index'; // ตรวจสอบ Path ของ types/data ให้ถูกต้อง
import jwt from 'jsonwebtoken'; // นำเข้า jsonwebtoken

export async function GET(request: NextRequest) { // เปลี่ยนจาก Request เป็น NextRequest เพื่อเข้าถึง headers
  // --- การตรวจสอบ Token (Authentication) ---
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access to /api/sensors: No Token provided');
    return NextResponse.json({ success: false, message: 'ไม่ได้รับอนุญาต: ไม่พบ Token' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ไม่ได้ถูกกำหนดใน .env.local');
      return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
    }
    // ตรวจสอบ JWT Token
    jwt.verify(token, jwtSecret);
    // หาก verify สำเร็จ โค้ดจะดำเนินต่อไป

  } catch (error: any) {
    console.warn('Forbidden access to /api/sensors: Invalid Token', error.message);
    return NextResponse.json({ success: false, message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ' }, { status: 403 });
  }
  // --- สิ้นสุดการตรวจสอบ Token ---

  try {
    // ตรวจสอบว่า pool ถูก initialize แล้ว
    if (!pool) {
      console.error('Database pool is not initialized in /api/sensors route.');
      return NextResponse.json({ success: false, error: 'Database connection not established.' }, { status: 500 });
    }

    // ดึง Query Parameters จาก Request URL
    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // กำหนดค่าเริ่มต้นสำหรับ limit และ offset
    const queryLimit = parseInt(limitParam || '100', 10);
    const queryOffset = parseInt(offsetParam || '0', 10);

    let queryText = `
      SELECT
          id,
          name,
          value,
          district_id,
          unit,
          status,
          last_update,
          description,
          created_at,
          sensor_type,
          serial_number,
          location_description
      FROM sensors
      WHERE 1=1 -- เงื่อนไขเริ่มต้นที่จริงเสมอ เพื่อให้เพิ่ม AND ได้ง่าย
    `;
    const queryParams: (string | number)[] = [];
    let paramCount = 1;

    // เพิ่มเงื่อนไขการกรองตาม district_id ถ้ามีการระบุมา
    if (districtId) {
      queryText += ` AND district_id = $${paramCount}`;
      queryParams.push(districtId);
      paramCount++;
    }

    // เพิ่มการเรียงลำดับ
    queryText += ` ORDER BY created_at DESC, id ASC`;

    // เพิ่ม LIMIT และ OFFSET
    queryText += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(queryLimit, queryOffset);

    // ดึงข้อมูลจากตาราง 'sensors'
    const result = await pool.query(queryText, queryParams);

    // Cast result.rows เป็น Sensor[]
    const sensors: Sensor[] = result.rows;

    return NextResponse.json({ success: true, data: sensors }); // ส่งกลับเป็น { success: true, data: [...] }
  } catch (error: any) {
    console.error('API Error fetching sensors:', error);
    return NextResponse.json(
      { success: false, message: 'ไม่สามารถดึงข้อมูลเซนเซอร์จากฐานข้อมูลได้.', error: error.message },
      { status: 500 }
    );
  }
}
