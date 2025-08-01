// app/api/admin/districts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken, DecodedToken } from '@/lib/auth'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง
import { District } from '../../../../../../lib/definitions'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง
import { validate as isUuid } from 'uuid'; // เปลี่ยนชื่อ validate เป็น isUuid เพื่อความชัดเจน

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for authentication
const authenticateRequest = (req: NextRequest): DecodedToken | NextResponse => {
  const authHeader = req.headers.get('Authorization');
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Authentication failed: No Authorization header or malformed. Header:', authHeader);
    return NextResponse.json({ message: 'Unauthorized: No token provided or malformed header' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  console.log('Extracted Token (first 30 chars):', token.substring(0, 30) + '...');

  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    console.warn('Authentication failed: Invalid or expired token. verifyToken returned null.');
    return NextResponse.json({ message: 'Unauthorized: Invalid or expired token' }, { status: 401 });
  }

  console.log('Authentication successful. Decoded Token:', decodedToken);
  return decodedToken;
};

// GET /api/admin/districts/[id] - Fetch a single district by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = params;
    const districtId = parseInt(id);
   if (isNaN(districtId)) {
      return NextResponse.json({ error: 'Invalid or missing District ID' }, { status: 400 });
    }

    const result = await pool.query<District>(
      `SELECT id, name, province, region, status, created_at, updated_at, description
       FROM districts
       WHERE id = $1;`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching district by ID:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch district' }, { status: 500 });
  }
}

// PUT /api/admin/districts/[id] - Update a district by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid or missing District ID for update' }, { status: 400 });
    }

    const { name, province, region, status, description } = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // เริ่ม Transaction

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (province !== undefined) {
        updates.push(`province = $${paramIndex++}`);
        values.push(province);
      }
      if (region !== undefined) {
        updates.push(`region = $${paramIndex++}`);
        values.push(region);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (updates.length === 0) {
        // ไม่จำเป็นต้อง Rollback เพราะยังไม่ได้ทำอะไรกับ DB
        return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id); // ID จะเป็นพารามิเตอร์สุดท้ายสำหรับ WHERE clause

      const query = `
        UPDATE districts
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *;
      `;

      // *** FIX: Use client.query instead of pool.query ***
      const result = await client.query<District>(query, values);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK'); // Rollback ถ้าไม่พบ District
        return NextResponse.json({ error: 'District not found or no changes made' }, { status: 404 });
      }

      await client.query('COMMIT'); // ยืนยัน Transaction
      return NextResponse.json(result.rows[0]);

    } catch (transactionError: any) {
      await client.query('ROLLBACK'); // ยกเลิก Transaction หากมีข้อผิดพลาด
      console.error('Transaction failed during district update:', transactionError);
      return NextResponse.json({ message: 'Failed to update district', error: transactionError.message }, { status: 500 });
    } finally {
      client.release(); // คืน Connection กลับสู่ Pool
    }

  } catch (error: any) {
    console.error('Error updating district:', error);
    return NextResponse.json({ error: error.message || 'Failed to update district' }, { status: 500 });
  }
}

// DELETE /api/admin/districts/[id] - Delete a district by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = params;
    // ตรวจสอบว่า id ไม่มีค่า หรือเป็นสตริงว่างเปล่า
    // แก้ไขจาก `if (id)` ที่ผิดพลาด ให้เป็น `if (!id)`
    if (!id) {
      console.warn('Invalid or missing District ID for deletion.');
      return NextResponse.json({ error: 'Invalid or missing District ID for deletion' }, { status: 400 });
    }
    // Logging เพื่อดูว่า ID ที่ได้รับมามีค่าเป็นอะไร
    console.log(`Attempting to delete district with ID: ${id}`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // เริ่ม Transaction

      const deleteQuery = `DELETE FROM districts WHERE id = $1;`;
      
      const result = await client.query(
        deleteQuery,
        [id]
      );

      if (result.rowCount === 0) {
        await client.query('ROLLBACK'); // Rollback ถ้าไม่พบ District
        return NextResponse.json({ error: 'District not found or already deleted' }, { status: 404 });
      }

      await client.query('COMMIT'); // ยืนยัน Transaction
      return NextResponse.json({ message: 'District deleted successfully' });

    } catch (transactionError: any) {
      await client.query('ROLLBACK'); // ยกเลิก Transaction หากมีข้อผิดพลาด
      console.error('Transaction failed during district deletion:', transactionError);
      return NextResponse.json({ message: 'Failed to delete district', error: transactionError.message }, { status: 500 });
    } finally {
      client.release(); // คืน Connection กลับสู่ Pool
    }

  } catch (error: any) {
    console.error('Error deleting district:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete district' }, { status: 500 });
  }
}

