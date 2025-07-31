import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // นำเข้า pool โดยตรง
import jwt from 'jsonwebtoken';
import { Sensor } from '../../../interfaces/index'; // ตรวจสอบ Path ของ interfaces ให้ถูกต้อง

export async function POST(req: NextRequest) {
  // --- การตรวจสอบ Token (Authentication) ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access to /api/admin/sensors: No Token provided');
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต: ไม่พบ Token' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ไม่ได้ถูกกำหนดใน .env.local');
      return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
    }
    jwt.verify(token, jwtSecret);
  } catch (error: any) {
    console.warn('Forbidden access to /api/admin/sensors: Invalid Token', error.message);
    return NextResponse.json({ message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', error: error.message }, { status: 403 });
  }
  // --- สิ้นสุดการตรวจสอบ Token ---

  const { serial_number, name, description, status, value, unit, district_id, sensor_type, location_description } = await req.json();

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!serial_number || !name || !status || !district_id || !sensor_type) {
    console.warn('Missing required fields for sensor creation');
    return NextResponse.json({ message: 'โปรดระบุ Serial Number, ชื่อ, สถานะ, เขตประปา และประเภทเซนเซอร์' }, { status: 400 });
  }

  try {
    // 1. ตรวจสอบว่า serial_number มีอยู่แล้วหรือไม่
    const existingSensor = await pool!.query(
      `SELECT id FROM sensors WHERE serial_number = $1`,
      [serial_number]
    );

    if (existingSensor.rows.length > 0) {
      // ถ้าพบ serial_number ซ้ำ ให้ส่ง Error 409 Conflict กลับไป
      console.warn(`Attempt to add duplicate serial_number: ${serial_number}. Returning 409 Conflict.`);
      return NextResponse.json({ message: `Serial Number '${serial_number}' มีอยู่ในระบบแล้ว` }, { status: 409 });
    }

    // 2. ถ้า serial_number ไม่ซ้ำ ก็ทำการ INSERT
    const result = await pool!.query<Sensor>(
      `
      INSERT INTO sensors (serial_number, name, description, status, value, unit, district_id, sensor_type, location_description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
      `,
      [serial_number, name, description, status, value, unit, district_id, sensor_type, location_description]
    );

    console.log(`Sensor '${serial_number}' added successfully.`);
    return NextResponse.json({ message: 'เพิ่มเซนเซอร์สำเร็จ', sensor: result.rows[0] }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding sensor:', error);
    // ตรวจสอบ error.code สำหรับ Unique Violation โดยเฉพาะ (PostgreSQL code '23505')
    if (error.code === '23505' && error.constraint === 'sensors_serial_number_key') {
        console.warn(`Database unique constraint violation for serial_number: ${serial_number}. Returning 409 Conflict.`);
        return NextResponse.json({ message: `Serial Number '${serial_number}' มีอยู่ในระบบแล้ว (จาก Constraint)` }, { status: 409 });
    }
    // สำหรับ Error อื่นๆ ที่ไม่เกี่ยวข้องกับ Unique Constraint
    console.error(`Unexpected error during sensor addition: ${error.message}`);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มเซนเซอร์', error: error.message }, { status: 500 });
  }
}
