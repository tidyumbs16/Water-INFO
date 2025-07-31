// src/app/api/admin/districts/route.ts
// ตัวอย่าง API Route สำหรับจัดการข้อมูลเขต/อำเภอ (Districts)
// พร้อมการบันทึกกิจกรรมลงใน Activity Log

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Import pool จากไฟล์ db.ts ของคุณ
import { logActivity } from '@/lib/activityLogger'; // ฟังก์ชันสำหรับบันทึกกิจกรรมลงใน Activity Log

// ฟังก์ชันจำลองสำหรับการดึง User ID จาก Request (คุณต้องปรับใช้ตามระบบ Authentication จริงของคุณ)
// ในระบบจริง คุณจะทำการยืนยัน JWT Token และดึง user_id ออกมา
async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // TODO: ในระบบจริง คุณจะต้องทำการ verify token และ extract user ID
    // ตัวอย่างง่ายๆ สำหรับการทดสอบ:
    // const decodedToken = verify(token, process.env.JWT_SECRET);
    // return decodedToken.userId;
    return 'admin_user_001'; // ID ผู้ใช้จำลองสำหรับการทดสอบ
  }
  return null;
}

// GET Request: ดึงข้อมูลเขต/อำเภอทั้งหมด หรือตาม ID
export async function GET(req: Request) {
  // ตรวจสอบว่า pool ถูก initialize หรือไม่
  if (!pool) {
    console.error('Database pool is not initialized. Cannot process GET request.');
    return NextResponse.json({ message: 'Database connection not available.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // ดึง ID จาก Query Parameter (ถ้ามี)

    const client = await pool.connect();
    try {
      let query = 'SELECT id, name, description FROM districts';
      const params = [];

      if (id) {
        query += ' WHERE id = $1';
        params.push(id);
      }

      const result = await client.query(query, params);
      return NextResponse.json(result.rows, { status: 200 });
    } catch (dbError: any) {
      console.error('Database error in GET /api/admin/districts:', dbError);
      return NextResponse.json({ message: 'Failed to fetch districts', error: dbError.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error in GET /api/admin/districts:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}


// POST Request: สร้างเขต/อำเภอใหม่
export async function POST(req: Request) {
  // ตรวจสอบว่า pool ถูก initialize หรือไม่
  if (!pool) {
    console.error('Database pool is not initialized. Cannot process POST request.');
    return NextResponse.json({ message: 'Database connection not available.' }, { status: 500 });
  }

  try {
    const { name, description } = await req.json();
    const userId = await getUserIdFromRequest(req); // ดึง User ID จาก Request

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: User ID not found' }, { status: 401 });
    }

    // เริ่มต้น Transaction เพื่อให้การดำเนินการเป็น Atomic (สร้างข้อมูลและบันทึก Log พร้อมกัน)
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // เริ่ม Transaction

      // 1. สร้างเขต/อำเภอใหม่ในฐานข้อมูล
      const insertQuery = `
        INSERT INTO districts (name, description)
        VALUES ($1, $2)
        RETURNING id; -- ดึง ID ของข้อมูลที่เพิ่งสร้าง
      `;
      const result = await client.query(insertQuery, [name, description]);
      const newDistrictId = result.rows[0].id;

      // 2. บันทึกกิจกรรม "CREATE" ลงใน Activity Log
      await logActivity({
        user_id: userId,
        action: 'CREATE',
        entity_type: 'District',
        entity_id: newDistrictId,
        details: {
          district_name: name,
          description: description,
          created_by: userId,
        },
      });

      await client.query('COMMIT'); // ยืนยัน Transaction
      return NextResponse.json({ message: 'District created successfully', id: newDistrictId }, { status: 201 });

    } catch (transactionError: any) {
      await client.query('ROLLBACK'); // ยกเลิก Transaction หากมีข้อผิดพลาด
      console.error('Transaction failed during district creation:', transactionError);
      return NextResponse.json({ message: 'Failed to create district', error: transactionError.message }, { status: 500 });
    } finally {
      client.release(); // คืน Connection กลับสู่ Pool
    }

  } catch (error: any) {
    console.error('Error in POST /api/admin/districts:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// PUT Request: อัปเดตข้อมูลเขต/อำเภอ
export async function PUT(req: Request) {
  // ตรวจสอบว่า pool ถูก initialize หรือไม่
  if (!pool) {
    console.error('Database pool is not initialized. Cannot process PUT request.');
    return NextResponse.json({ message: 'Database connection not available.' }, { status: 500 });
  }

  try {
    const { id, name, description } = await req.json();
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: User ID not found' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'District ID is required for update' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // (Optional) ดึงข้อมูลเก่าก่อนอัปเดตเพื่อบันทึกใน Log
      const oldDistrictQuery = 'SELECT name, description FROM districts WHERE id = $1;';
      const oldDistrictResult = await client.query(oldDistrictQuery, [id]);
      const oldDistrict = oldDistrictResult.rows[0];

      // 1. อัปเดตข้อมูลเขต/อำเภอ
      const updateQuery = `
        UPDATE districts
        SET name = $1, description = $2
        WHERE id = $3;
      `;
      const result = await client.query(updateQuery, [name, description, id]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'District not found' }, { status: 404 });
      }

      // 2. บันทึกกิจกรรม "UPDATE" ลงใน Activity Log
      await logActivity({
        user_id: userId,
        action: 'UPDATE',
        entity_type: 'District',
        entity_id: id,
        details: {
          old_name: oldDistrict?.name || 'N/A',
          old_description: oldDistrict?.description || 'N/A',
          new_name: name,
          new_description: description,
          updated_by: userId,
        },
      });

      await client.query('COMMIT');
      return NextResponse.json({ message: 'District updated successfully' }, { status: 200 });

    } catch (transactionError: any) {
      await client.query('ROLLBACK');
      console.error('Transaction failed during district update:', transactionError);
      return NextResponse.json({ message: 'Failed to update district', error: transactionError.message }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error in PUT /api/admin/districts:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

// DELETE Request: ลบข้อมูลเขต/อำเภอ
export async function DELETE(req: Request) {
  // ตรวจสอบว่า pool ถูก initialize หรือไม่
  if (!pool) {
    console.error('Database pool is not initialized. Cannot process DELETE request.');
    return NextResponse.json({ message: 'Database connection not available.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id'); // ดึง ID จาก Query Parameter
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized: User ID not found' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ message: 'District ID is required for deletion' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // (Optional) ดึงข้อมูลก่อนลบเพื่อบันทึกใน Log
      const getDistrictQuery = 'SELECT name FROM districts WHERE id = $1;';
      const districtResult = await client.query(getDistrictQuery, [id]);
      const districtName = districtResult.rows[0]?.name;

      // 1. ลบข้อมูลเขต/อำเภอ
      const deleteQuery = 'DELETE FROM districts WHERE id = $1;';
      const result = await client.query(deleteQuery, [id]);

      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'District not found' }, { status: 404 });
      }

      // 2. บันทึกกิจกรรม "DELETE" ลงใน Activity Log
      await logActivity({
        user_id: userId,
        action: 'DELETE',
        entity_type: 'District',
        entity_id: id,
        details: {
          district_name: districtName || 'Unknown District', // ใช้ชื่อที่ดึงมา หรือ 'Unknown'
          deleted_by: userId,
        },
      });

      await client.query('COMMIT');
      return NextResponse.json({ message: 'District deleted successfully' }, { status: 200 });

    } catch (transactionError: any) {
      await client.query('ROLLBACK');
      console.error('Transaction failed during district deletion:', transactionError);
      return NextResponse.json({ message: 'Failed to delete district', error: transactionError.message }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/districts:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
