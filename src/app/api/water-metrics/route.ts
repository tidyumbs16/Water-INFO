import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!pool) {
      return res.status(500).json({ message: 'Database connection not established.' });
    }
    const { rows } = await pool.query(
      `SELECT date, SUM(water_volume) as total_volume, AVG(water_quality) as avg_quality
       FROM district_metrics GROUP BY date ORDER BY date DESC LIMIT 7`
    );
    return res.status(200).json(rows);
  }
  res.status(405).json({ message: 'Method not allowed' });
}
