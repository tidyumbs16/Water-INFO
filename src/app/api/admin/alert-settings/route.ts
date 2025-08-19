import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AlertSetting } from '../../../interfaces/index';
import jwt from 'jsonwebtoken';

/**
 * ฟังก์ชันช่วยเหลือสำหรับการตรวจสอบ JWT Token
 * @param req NextRequest object
 * @returns Object ที่มีสถานะการตรวจสอบ Token
 */
const validateToken = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access: No Token provided');
    return { isValid: false, message: 'ไม่ได้รับอนุญาต: ไม่พบ Token', status: 401 };
  }
  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ไม่ได้ถูกกำหนดใน .env.local');
      return { isValid: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์', status: 500 };
    }
    jwt.verify(token, jwtSecret);
    return { isValid: true };
  } catch (error: any) {
    console.warn('Forbidden access: Invalid Token', error.message);
    return { isValid: false, message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', status: 403 };
  }
};

/**
 * API Route สำหรับดึงข้อมูล Alert Settings
 * @param req NextRequest object
 * @returns NextResponse object ที่มีข้อมูลการตั้งค่าหรือข้อผิดพลาด
 */
export async function GET(req: NextRequest) {
  const auth = validateToken(req);
  if (!auth.isValid) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  try {
    // เพิ่มการตรวจสอบ pool เพื่อป้องกันข้อผิดพลาด 500 หากการเชื่อมต่อฐานข้อมูลล้มเหลว
    if (!pool) {
      console.error('Database connection pool is not available.');
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, { status: 500 });
    }
    const result = await pool.query<AlertSetting>(`SELECT * FROM alert_settings ORDER BY metric_name ASC`);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching alert settings:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่าการแจ้งเตือน', error: error.message }, { status: 500 });
  }
}

/**
 * API Route สำหรับเพิ่ม Alert Setting ใหม่
 * @param req NextRequest object
 * @returns NextResponse object ที่มีข้อมูลการตั้งค่าที่เพิ่มใหม่หรือข้อผิดพลาด
 */
export async function POST(req: NextRequest) {
  const auth = validateToken(req);
  if (!auth.isValid) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { metric_name, min_good, max_good, min_warning, max_warning, min_critical, max_critical, is_enabled } = await req.json();

  if (!metric_name) {
    return NextResponse.json({ message: 'โปรดระบุชื่อ Metric' }, { status: 400 });
  }

  try {
    // เพิ่มการตรวจสอบ pool เพื่อป้องกันข้อผิดพลาด 500
    if (!pool) {
      console.error('Database connection pool is not available.');
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, { status: 500 });
    }
    const result = await pool.query(
  `
  INSERT INTO alert_settings (
    metric_name,
    min_good,
    max_good,
    min_warning,
    max_warning,
    min_critical,
    max_critical,
    is_enabled,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  RETURNING *;
  `,
  [
    metric_name,
    min_good,
    max_good,
    min_warning,
    max_warning,
    min_critical,
    max_critical,
    is_enabled
  ]
);
    return NextResponse.json({ message: 'เพิ่มการตั้งค่าสำเร็จ', setting: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating alert setting:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเพิ่มการตั้งค่า', error: error.message }, { status: 500 });
  }
}

/**
 * API Route สำหรับแก้ไข Alert Setting
 * @param req NextRequest object
 * @returns NextResponse object ที่มีข้อมูลการตั้งค่าที่อัปเดตหรือข้อผิดพลาด
 */
export async function PUT(req: NextRequest) {
  const auth = validateToken(req);
  if (!auth.isValid) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { id, metric_name, min_good, max_good, min_warning, max_warning, min_critical, max_critical, is_enabled } = await req.json();

  if (!id || !metric_name) {
    return NextResponse.json({ message: 'โปรดระบุ ID และชื่อ Metric' }, { status: 400 });
  }

  try {
    // เพิ่มการตรวจสอบ pool เพื่อป้องกันข้อผิดพลาด 500
    if (!pool) {
      console.error('Database connection pool is not available.');
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, { status: 500 });
    }
    const result = await pool.query(
      `
      UPDATE alert_settings
      SET
        metric_name = $1,
        min_good = $2,
        max_good = $3,
        min_warning = $4,
        max_warning = $5,
        min_critical = $6,
        max_critical = $7,
        is_enabled = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *;
      `,
      [metric_name, min_good, max_good, min_warning, max_warning, min_critical, max_critical, is_enabled, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบการตั้งค่าที่ต้องการแก้ไข' }, { status: 404 });
    }
    return NextResponse.json({ message: 'อัปเดตการตั้งค่าสำเร็จ', setting: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating alert setting:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า', error: error.message }, { status: 500 });
  }
}

/**
 * API Route สำหรับลบ Alert Setting
 * @param req NextRequest object
 * @returns NextResponse object ที่มีข้อมูลการตั้งค่าที่ถูกลบหรือข้อผิดพลาด
 */
export async function DELETE(req: NextRequest) {
  const auth = validateToken(req);
  if (!auth.isValid) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ message: 'โปรดระบุ ID ของการตั้งค่าที่ต้องการลบ' }, { status: 400 });
  }

  try {
    // เพิ่มการตรวจสอบ pool เพื่อป้องกันข้อผิดพลาด 500
    if (!pool) {
      console.error('Database connection pool is not available.');
      return NextResponse.json({ message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' }, { status: 500 });
    }
    const result = await pool.query(`DELETE FROM alert_settings WHERE id = $1 RETURNING *;`, [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบการตั้งค่าที่ต้องการลบ' }, { status: 404 });
    }
    return NextResponse.json({ message: 'ลบการตั้งค่าสำเร็จ', setting: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting alert setting:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบการตั้งค่า', error: error.message }, { status: 500 });
  }
}
