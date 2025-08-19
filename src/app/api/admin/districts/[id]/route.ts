// app/api/admin/districts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken, DecodedToken } from '@/lib/auth';
import { District } from '../../../../../../lib/definitions';
import { validate as isUuid } from 'uuid';

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


export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) {
        return authResult;
    }

    try {
       
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'Invalid or missing District ID' }, { status: 400 });
        }

        // 1. รับข้อมูลทั้งหมดจาก request body รวมถึงข้อมูล metrics
        const { 
            name, province, region, status, description,
            water_quality, water_volume, pressure, efficiency,
            quality_trend, volume_trend, pressure_trend, efficiency_trend
        } = await request.json();

        // 2. เริ่ม Transaction เพื่อให้การทำงานกับ 2 ตารางเป็นหนึ่งเดียว
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 3. เตรียมคำสั่งและค่าสำหรับอัปเดตตาราง 'districts'
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

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

            if (updates.length > 0) {
                updates.push(`updated_at = CURRENT_TIMESTAMP`);
                values.push(id);
    
                const updateDistrictQuery = `
                    UPDATE districts
                    SET ${updates.join(', ')}
                    WHERE id = $${paramIndex}
                    RETURNING *;
                `;
                const updateResult = await client.query<District>(updateDistrictQuery, values);
    
                if (updateResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ error: 'District not found or no changes made' }, { status: 404 });
                }
            }
            
            // 4. ตรวจสอบและแทรก (INSERT) ข้อมูล Metrics ใหม่
            const hasMetricsData = [water_quality, water_volume, pressure, efficiency].some(v => v !== undefined && v !== null);

            if (hasMetricsData) {
                const insertMetricsQuery = `
                    INSERT INTO district_metrics (
                        district_id, water_quality, water_volume, pressure, efficiency,
                        quality_trend, volume_trend, pressure_trend, efficiency_trend, date
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW());
                `;
                const metricsValues = [
                    id,
                    water_quality, water_volume, pressure, efficiency,
                    quality_trend, volume_trend, pressure_trend, efficiency_trend
                ];
                
                await client.query(insertMetricsQuery, metricsValues);
            }

            await client.query('COMMIT'); // ยืนยัน Transaction
            return NextResponse.json({ message: 'District and metrics updated successfully' });

        } catch (transactionError: any) {
            await client.query('ROLLBACK'); // ยกเลิก Transaction หากมีข้อผิดพลาด
            console.error('Transaction failed during district update:', transactionError);
            return NextResponse.json({ message: 'Failed to update district', error: transactionError.message }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Error updating district:', error);
        return NextResponse.json({ error: error.message || 'Failed to update district' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/districts/:id
 * ลบเขตตาม ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Invalid or missing District ID' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // ลบข้อมูล metrics ของเขตก่อน (ถ้ามี foreign key constraint)
      await client.query('DELETE FROM district_metrics WHERE district_id = $1;', [id]);

      // ลบข้อมูลเขต
      const deleteResult = await client.query('DELETE FROM districts WHERE id = $1 RETURNING *;', [id]);

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'District not found' }, { status: 404 });
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'District deleted successfully', deleted: deleteResult.rows[0] });

    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Error deleting district:', err);
      return NextResponse.json({ error: 'Failed to delete district', details: err.message }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

