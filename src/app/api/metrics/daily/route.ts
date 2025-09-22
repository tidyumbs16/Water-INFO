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

    // ✅ แก้ให้รองรับทั้ง UUID และ number
    let districtIds: string[] = [];
    if (districtIdParam) {
      districtIds = districtIdParam.split(',').map(id => id.trim()).filter(Boolean);
    }

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          d.id AS district_id,
          d.name AS district_name,
          dm.date::date AS date,
          dm.water_quality, dm.water_volume, dm.pressure, dm.efficiency,
          dm.quality_trend, dm.volume_trend, dm.pressure_trend, dm.efficiency_trend
        FROM district_metrics_daily dm
        JOIN districts d ON d.id = dm.district_id
        WHERE dm.date::date BETWEEN $1::date AND $2::date
      `;
      const params: any[] = [startDate, endDate];

      if (districtIds.length > 0) {
        query += ` AND d.id = ANY($3)`;
        params.push(districtIds);
      }

      query += ` ORDER BY dm.date ASC, d.id ASC`;

      const result = await client.query(query, params);

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
