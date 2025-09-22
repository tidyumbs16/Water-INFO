import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../../lib/db'; // นำเข้าฟังก์ชัน query สำหรับ Database
import jwt from 'jsonwebtoken'; // นำเข้า jsonwebtoken

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'โปรดระบุชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 });
  }

  try {
    // ดึง JWT_SECRET จาก Environment Variables
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET ไม่ได้ถูกกำหนดใน .env.local');
      return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการตั้งค่าเซิร์ฟเวอร์' }, { status: 500 });
    }

    // ตรวจสอบข้อมูลผู้ใช้ใน Database (ตัวอย่าง)
    // ใน Production ควรมีการ Hash รหัสผ่านและเปรียบเทียบอย่างปลอดภัย
    // ตรวจสอบให้แน่ใจว่าตาราง 'users' ของคุณมีข้อมูลผู้ใช้ที่ถูกต้อง
    // เช่น: INSERT INTO users (username, password, role) VALUES ('admin', 'password123', 'super_admin');
    const result = await pool !.query(
      `SELECT id, username, role FROM users WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const user = result.rows[0];

    // สร้าง JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '7d' } // Token จะหมดอายุใน 7 วัน
    );

    return NextResponse.json({ message: 'เข้าสู่ระบบสำเร็จ', token: token, user: { id: user.id, username: user.username, role: user.role } }, { status: 200 });

  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message }, { status: 500 });
  }
}
