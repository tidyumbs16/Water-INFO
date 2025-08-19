import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { AlertLog } from '../../../interfaces/index';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต: ไม่พบ Token' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
  }

  try {
    jwt.verify(token, jwtSecret);
  } catch (error) {
    return NextResponse.json({ message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', error: (error as Error).message }, { status: 403 });
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
        COALESCE(al.threshold_info::text, '') AS threshold_value, 
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

  if (isResolved && isResolved !== 'all') {
    sqlQuery += ` AND al.is_resolved = $${paramIndex++}`;
    queryParams.push(isResolved === 'true');
  }

  sqlQuery += ` ORDER BY al.created_at DESC`;

  try {
    const result = await pool!.query<AlertLog>(sqlQuery, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching alerts log:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการแจ้งเตือน', error: (error as Error).message }, { status: 500 });
  }
}
