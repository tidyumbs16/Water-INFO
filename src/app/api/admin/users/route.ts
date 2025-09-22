// app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
// ตรวจสอบให้แน่ใจว่า path ของไฟล์เหล่านี้ถูกต้อง
import { authenticateRequest } from '../../../../../lib/auth';
import pool from '../../../../../lib/db';
import bcrypt from 'bcrypt'; // Ensure bcryptjs is installed and types are available
import { z } from 'zod';

// กำหนด Schema สำหรับการสร้างผู้ใช้ใหม่ด้วย Zod
const newUserSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  email: z.string().email({ message: 'Invalid email address' }),
  role: z.enum(['super_admin', 'admin', 'editor', 'user'], {
    message: 'Invalid role specified. Allowed roles are: super_admin, admin, editor, user',
  }),
});

/**
 * @function GET
 * @description จัดการคำขอ GET เพื่อดึงข้อมูลผู้ใช้ที่เป็น admin ทั้งหมด
 * ต้องมีสิทธิ์ 'super_admin' หรือ 'admin' เท่านั้น
 * @param {NextRequest} request - ออบเจ็กต์คำขอ Next.js ที่เข้ามา
 * @returns {NextResponse} การตอบกลับในรูปแบบ JSON ที่มีรายการผู้ใช้ admin หรือข้อความแสดงข้อผิดพลาด
 */
export async function GET(request: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์คำขอด้วย JWT token
    const authResult = authenticateRequest(request);

    // หากการตรวจสอบสิทธิ์ล้มเหลว ให้ส่งการตอบกลับข้อผิดพลาดจาก authenticateRequest
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // แยกข้อมูลผู้ใช้จาก token ที่ถอดรหัสแล้ว
    const { userId, email, role } = authResult;

    // 2. ตรวจสอบสิทธิ์ตามบทบาทของผู้ใช้
    if (role !== 'super_admin' && role !== 'admin') {
      console.warn(`Access denied for user ${userId} (${email}) with role ${role}. 'super_admin' or 'admin' role required to view admin users.`);
      return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions to view admin users.' }, { status: 403 });
    }

    // ตรวจสอบ pool ฐานข้อมูล
    if (!pool) {
      throw new Error('Database pool is not initialized.');
    }

    // 3. ดึงข้อมูลผู้ใช้ admin ทั้งหมดจากฐานข้อมูล
    const selectQuery = `
      SELECT id, username, email, role, created_at, updated_at
      FROM admin_users
      ORDER BY id ASC;
    `;
    const result = await pool.query(selectQuery);

    console.log(`User ${userId} (${email}) with role ${role} successfully fetched all admin users.`);
    return NextResponse.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal server error while fetching admin users', error: errorMessage }, { status: 500 });
  }
}

/**
 * @function POST
 * @description จัดการคำขอ POST เพื่อสร้างผู้ใช้ admin ใหม่
 * ต้องมีสิทธิ์ 'super_admin' หรือ 'admin' เท่านั้น
 * @param {NextRequest} request - ออบเจ็กต์คำขอ Next.js ที่เข้ามา
 * @returns {NextResponse} การตอบกลับในรูปแบบ JSON ที่ระบุความสำเร็จหรือความล้มเหลว
 */
export async function POST(request: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์คำขอ
    const authResult = authenticateRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId, email, role } = authResult;

    // 2. ตรวจสอบสิทธิ์ตามบทบาทของผู้ใช้
    if (role !== 'super_admin' && role !== 'admin') {
      console.warn(`Access denied for user ${userId} (${email}) with role ${role}. 'super_admin' or 'admin' role required to create admin users.`);
      return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions to create admin users.' }, { status: 403 });
    }

    // ตรวจสอบ pool ฐานข้อมูล
    if (!pool) {
      throw new Error('Database pool is not initialized.');
    }

    const body = await request.json();

    // 3. ตรวจสอบความถูกต้องของ body ของคำขอด้วย Zod
    const validation = newUserSchema.safeParse(body);
    if (!validation.success) {
      // ส่งคืนการตอบกลับ 400 พร้อมข้อความแสดงข้อผิดพลาดในการตรวจสอบ
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }
    const { username, password, email: newEmail, role: newRole } = validation.data;

    // 4. แฮชรหัสผ่านของผู้ใช้ใหม่ก่อนจัดเก็บ
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. แทรกผู้ใช้ใหม่ลงในฐานข้อมูล
    const insertQuery = `
      INSERT INTO admin_users (username, password_hash, email, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, username, email, role, created_at, updated_at;
    `;
    const result = await pool.query(insertQuery, [username, hashedPassword, newEmail, newRole]);

    const newUser = result.rows[0];
    console.log(`User ${userId} (${email}) with role ${role} successfully created new admin user: ${newUser.username}`);
    return NextResponse.json({ message: 'Admin user created successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin user:', error);
    if ((error as any).code === '23505') { // รหัสข้อผิดพลาดการละเมิดความไม่ซ้ำของ PostgreSQL
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
    }
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ message: 'Internal server error while creating admin user', error: errorMessage }, { status: 500 });
  }
}
