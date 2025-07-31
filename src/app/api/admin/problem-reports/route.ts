import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // แก้ไข: นำเข้า pool โดยตรง
import jwt from 'jsonwebtoken'; // นำเข้า jsonwebtoken
import { ProblemReport } from '../../../interfaces/index'; // ตรวจสอบ Path ของ interfaces/index ให้ถูกต้อง

export async function GET(req: NextRequest) {
  // --- การตรวจสอบ Token (Authentication) ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Unauthorized access to /api/admin/problem-reports: No Token provided');
    return NextResponse.json({ message: 'ไม่ได้รับอนุญาต: ไม่พบ Token' }, { status: 401 });
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
    console.warn('Forbidden access to /api/admin/problem-reports: Invalid Token', error.message);
    return NextResponse.json({ message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', error: error.message }, { status: 403 });
  }
  // --- สิ้นสุดการตรวจสอบ Token ---

  const { searchParams } = new URL(req.url);
  const isResolved = searchParams.get('is_resolved'); // 'true', 'false', 'all'

  let sqlQuery = `
    SELECT
        id,
        description,
        is_resolved,
        created_at
    FROM
        problem_reports
    WHERE 1=1
  `;
  const queryParams: (string | boolean)[] = [];
  let paramIndex = 1;

  if (isResolved !== 'all' && isResolved !== null) {
    sqlQuery += ` AND is_resolved = $${paramIndex++}`;
    queryParams.push(isResolved === 'true'); // แปลง 'true'/'false' string เป็น boolean
  }

  sqlQuery += ` ORDER BY created_at DESC`; // เรียงลำดับจากใหม่ไปเก่า

  try {
    // แก้ไข: เรียกใช้ pool!.query โดยตรง
    const result = await pool!.query<ProblemReport>(sqlQuery, queryParams);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching problem reports:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายงานปัญหา', error: error.message }, { status: 500 });
  }
}
