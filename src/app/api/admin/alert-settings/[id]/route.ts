import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import jwt from 'jsonwebtoken';

const validateToken = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, message: 'ไม่ได้รับอนุญาต: ไม่พบ Token', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return { isValid: false, message: 'Server config error: JWT_SECRET missing', status: 500 };
    }
    jwt.verify(token, jwtSecret);
    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, message: `Token ไม่ถูกต้องหรือหมดอายุ: ${error.message}`, status: 403 };
  }
};

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateToken(req);
  if (!auth.isValid) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID ต้องเป็นตัวเลข' }, { status: 400 });
  }

  try {
    const result = await pool !.query(`DELETE FROM alert_settings WHERE id = $1 RETURNING *;`, [id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'ไม่พบการตั้งค่าที่ต้องการลบ' }, { status: 404 });
    }
    return NextResponse.json({ message: 'ลบการตั้งค่าสำเร็จ', setting: result.rows[0] });
  } catch (error: any) {
    console.error('Error deleting alert setting:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการลบการตั้งค่า', error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateToken(req);
  if (!auth.isValid) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'ID ต้องเป็นตัวเลข' }, { status: 400 });
  }

  const { metric_name, min_good, max_good, min_warning, max_warning, min_critical, max_critical, is_enabled } = await req.json();

  if (!metric_name) {
    return NextResponse.json({ message: 'ต้องระบุ metric_name' }, { status: 400 });
  }

  try {
    const result = await pool !.query(
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
      return NextResponse.json({ message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' }, { status: 404 });
    }

    return NextResponse.json({ message: 'อัปเดตข้อมูลสำเร็จ', setting: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating alert setting:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล', error: error.message }, { status: 500 });
  }
}
