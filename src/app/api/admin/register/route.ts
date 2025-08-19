// File: pages/api/admin/register.ts (for a Next.js API route)

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Import your database connection pool
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const { username, password, email, role } = await req.json();

  // Basic validation to ensure required fields are present
  if (!username || !password || !email || !role) {
    return NextResponse.json({ message: 'โปรดระบุชื่อผู้ใช้, รหัสผ่าน, อีเมล และบทบาทให้ครบถ้วน' }, { status: 400 });
  }

  try {
    // 1. Check if the username already exists in the database
    const existingUser = await pool !.query(
      `SELECT * FROM admin WHERE username = $1`,
      [username]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ message: 'ชื่อผู้ใช้ถูกใช้งานแล้ว โปรดเลือกชื่อผู้ใช้อื่น' }, { status: 409 });
    }
    
    // 2. Hash the password securely using bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Insert the new user into the 'admin' table
    await pool !.query(
      `INSERT INTO admin (username, password_hash, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [username, password_hash, email, role]
    );

    return NextResponse.json({ message: 'ลงทะเบียนผู้ดูแลระบบสำเร็จ' }, { status: 201 });

  } catch (error: any) {
    console.error('Error during registration:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน', error: error.message }, { status: 500 });
  }
}
