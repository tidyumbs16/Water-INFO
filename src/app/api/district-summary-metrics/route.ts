// src/app/api/district-summary-metrics/route.ts
import { NextResponse } from 'next/server';
import { DistrictSummaryMetrics } from '@/src/types/index'; // สมมติว่าคุณตั้งค่า Path Alias @/types
import pool from '@/lib/db'; // สมมติว่าคุณตั้งค่า Path Alias @/lib/db

export async function GET() {
  let client;
  try {
    if (!pool) {
      console.error('Database pool is not initialized. Cannot fetch summary metrics.');
      return NextResponse.json(
        { error: 'Database connection not established. Please check DATABASE_URL in .env.local' },
        { status: 500 }
      );
    }
    client = await pool.connect();

    const totalDistrictsResult = await client.query<{count: string}>('SELECT COUNT(*) FROM districts');
    const totalDistricts = parseInt(totalDistrictsResult.rows[0]?.count || '0', 10);

    // คุณต้องปรับ Query ตรงนี้สำหรับ activeSensors และ criticalAlerts
    // ถ้ายังไม่มีตาราง/ข้อมูล ให้ปล่อยเป็น 0 ไปก่อนได้
    const activeSensors = 0; // แทนที่ด้วย Query จริง เช่น SELECT COUNT(*) FROM sensors WHERE status = 'active'
    const criticalAlerts = 0; // แทนที่ด้วย Query จริง เช่น SELECT COUNT(*) FROM alerts WHERE severity = 'critical'

    const avgEfficiencyResult = await client.query<{avgefficiency: number}>(`
      SELECT AVG(efficiency) AS avgEfficiency
      FROM district_metrics
    `);
    const avgEfficiency = Number(avgEfficiencyResult.rows[0]?.avgefficiency || 0);

    const summary: DistrictSummaryMetrics = {
      totalDistricts: totalDistricts,
      activeSensors: activeSensors,
      criticalAlerts: criticalAlerts,
      avgEfficiency: avgEfficiency,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Failed to fetch summary metrics from database:", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message || 'Unknown database error'}` },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}