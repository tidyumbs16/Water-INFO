import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // แก้ไข: นำเข้า pool โดยตรง
import { AlertLog } from '../../../interfaces/index'; // ตรวจสอบ Path ของ interfaces ของคุณ
import jwt from 'jsonwebtoken'; // นำเข้า jsonwebtoken

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access: No Token provided');
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต: ไม่พบ Token' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ไม่ได้ถูกกำหนดใน .env.local');
      return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
    }
    // ตรวจสอบ JWT Token
    jwt.verify(token, jwtSecret);
    // หาก verify สำเร็จ โค้ดจะดำเนินต่อไป

  } catch (error: any) {
    console.warn('Forbidden access: Invalid Token', error.message);
    return NextResponse.json({ message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', error: error.message }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get('district_id');
  const isResolved = searchParams.get('is_resolved');

  let sqlQuery = `
    SELECT
        al.id,
        al.district_id,
        d.name AS district_name,
        al.metric_name,
        al.alert_type,
        al.current_value::numeric AS current_value, 
        al.threshold_info::text AS threshold_value, 
        al.message,
        al.is_resolved,
        al.resolved_at,
        al.created_at
    FROM
        alerts_log al
    LEFT JOIN
        districts d ON al.district_id = d.id
    WHERE 1=1
  `;
  const queryParams: (string | boolean)[] = [];
  let paramIndex = 1;

  if (districtId && districtId !== 'all') {
    sqlQuery += ` AND al.district_id = $${paramIndex++}`;
    queryParams.push(districtId);
  }

  if (isResolved !== 'all' && isResolved !== null) {
    sqlQuery += ` AND al.is_resolved = $${paramIndex++}`;
    queryParams.push(isResolved === 'true');
  }

  sqlQuery += ` ORDER BY al.created_at DESC`;

  try {
    // แก้ไข: เรียกใช้ pool!.query โดยตรง
    const result = await pool!.query<AlertLog>(sqlQuery, queryParams);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching alerts log:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการแจ้งเตือน', error: error.message }, { status: 500 });
  }
}
