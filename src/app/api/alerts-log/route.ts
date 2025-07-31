import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Import query function for database
import { AlertLog } from '../../interfaces/index'; // Check the path to your interfaces

export async function GET(req: NextRequest) {
const authToken = process.env.JWT_SECRET; // Ensure you have your JWT secret set in .env.local
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized: No Token provided' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // Replace 'my-secret-admin-token' with your actual token validation logic
  if (token !== 'authToken') {
    return NextResponse.json({ message: 'Forbidden: Invalid Token' }, { status: 403 });
  }
  // --- End Authentication Token Check ---

  const { searchParams } = new URL(req.url);
  const districtId = searchParams.get('district_id');
  const isResolved = searchParams.get('is_resolved'); // 'true', 'false', 'all'

  let sqlQuery = `
    SELECT
        al.*,
        d.name AS district_name
    FROM
        alerts_log al
    LEFT JOIN
        districts d ON al.district_id = d.id
    WHERE 1=1
  `;
  const queryParams: (string | boolean)[] = [];
  let paramIndex = 1;

  if (districtId && districtId !== 'all') {
    sqlQuery += ` AND al.district_id = $${paramIndex++}`;
    queryParams.push(districtId);
  }

  if (isResolved !== 'all' && isResolved !== null) {
    sqlQuery += ` AND al.is_resolved = $${paramIndex++}`;
    queryParams.push(isResolved === 'true'); // Convert 'true'/'false' string to boolean
  }

  sqlQuery += ` ORDER BY al.created_at DESC`; // Order by most recent first

  try {
    const result = await pool !.query<AlertLog>(sqlQuery, queryParams);
    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching alerts log:', error);
    return NextResponse.json({ message: 'Error fetching alert history data', error: error.message }, { status: 500 });
  }
}
