import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const districtIdParam = searchParams.get('district_id'); // อาจจะมีหลายค่า

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // แปลง district_id เป็น array ถ้ามีส่งมา
    let districtIds: number[] = [];
    if (districtIdParam) {
      districtIds = districtIdParam
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(Boolean);
    }

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          d.id AS district_id,
          d.name AS district_name,
          dm.date,
          dm.water_quality, dm.water_volume, dm.pressure, dm.efficiency,
          dm.quality_trend, dm.volume_trend, dm.pressure_trend, dm.efficiency_trend
        FROM district_metrics_daily dm
        JOIN districts d ON d.id = dm.district_id
        WHERE dm.date BETWEEN $1 AND $2
      `;
      const params: any[] = [startDate, endDate];

      // ถ้ามี districtIds ให้เพิ่มเงื่อนไข
      if (districtIds.length > 0) {
        const placeholders = districtIds.map((_, idx) => `$${idx + 3}`).join(', ');
        query += ` AND d.id IN (${placeholders})`;
        params.push(...districtIds);
      }

      query += ` ORDER BY dm.date ASC, d.id ASC`;

      const result = await client.query(query, params);

      // จัดกลุ่มข้อมูลตาม district
      const grouped = result.rows.reduce((acc: any[], row) => {
        let districtGroup = acc.find(d => d.district_id === row.district_id);
        if (!districtGroup) {
          districtGroup = {
            district_id: row.district_id,
            district_name: row.district_name,
            data: [],
          };
          acc.push(districtGroup);
        }
        districtGroup.data.push({
          date: row.date,
          water_quality: row.water_quality,
          water_volume: row.water_volume,
          pressure: row.pressure,
          efficiency: row.efficiency,
          quality_trend: row.quality_trend,
          volume_trend: row.volume_trend,
          pressure_trend: row.pressure_trend,
          efficiency_trend: row.efficiency_trend,
        });
        return acc;
      }, []);

      return NextResponse.json(grouped);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const {
      districtId,
      date,
      water_quality,
      water_volume,
      pressure,
      efficiency,
      quality_trend,
      volume_trend,
      pressure_trend,
      efficiency_trend
    } = await req.json();

    if (!districtId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO district_metrics_daily (
          district_id, date,
          water_quality, water_volume, pressure, efficiency,
          quality_trend, volume_trend, pressure_trend, efficiency_trend,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *;
      `;
      const result = await client.query(query, [
        districtId, date,
        water_quality, water_volume, pressure, efficiency,
        quality_trend, volume_trend, pressure_trend, efficiency_trend
      ]);
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
