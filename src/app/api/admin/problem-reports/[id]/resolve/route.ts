import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // แก้ไข: นำเข้า pool โดยตรง
import jwt from 'jsonwebtoken'; // นำเข้า jsonwebtoken

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // --- การตรวจสอบ Token (Authentication) ---
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
      return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
    }
    // ตรวจสอบ JWT Token
    jwt.verify(token, jwtSecret);
    // หาก verify สำเร็จ โค้ดจะดำเนินต่อไป

  } catch (error: any) {
    console.warn('Forbidden access: Invalid Token', error.message);
    return NextResponse.json({ message: 'ไม่อนุญาต: Token ไม่ถูกต้อง หรือหมดอายุ', error: error.message }, { status: 403 });
  }
  // --- สิ้นสุดการตรวจสอบ Token ---

  const { id } = params; // ดึง ID ของ Problem Report จาก URL parameters
  const { is_resolved } = await req.json(); // ดึงสถานะ is_resolved จาก Request Body

  if (typeof is_resolved !== 'boolean') {
    return NextResponse.json({ message: 'สถานะ is_resolved ไม่ถูกต้อง' }, { status: 400 });
  }

  try {
    let resolvedByUsername: string | null = null;
    if (is_resolved) {
      const decodedToken: any = jwt.decode(token);
      resolvedByUsername = decodedToken?.username || 'Admin User'; // ใช้ username จาก Token
    } else {
      resolvedByUsername = null;
    }

    // แก้ไข: เรียกใช้ pool!.query โดยตรง
    const result = await pool!.query(
      `
      UPDATE problem_reports
      SET
        is_resolved = $1,
        resolved_by_username = $2,
        resolved_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END
      WHERE id = $3
      RETURNING *;
      `,
      [is_resolved, resolvedByUsername, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบรายงานปัญหาที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({ message: 'อัปเดตสถานะรายงานปัญหาสำเร็จ', report: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating problem report with ID ${id}:`, error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะรายงานปัญหา', error: error.message }, { status: 500 });
  }
}
