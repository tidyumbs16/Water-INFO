
import pool from '../../../../../lib/db'; 
import { NextResponse } from 'next/server'; 



interface HistoricalMetric {
  date: string; 
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
}



/**
 * @function GET
 * @description 
 
 *
 * @param {Request} request - The incoming Next.js Request object.
 * @param {any} context - The context object containing dynamic route parameters.
 * @returns {Promise<NextResponse>} A JSON response with historical data or an error.
 */
export async function GET(request: Request, context: any) {
  try {
    // Extract districtId from context.params, as it's a dynamic route segment.
    const districtId = context.params.districtId;

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '7'; // Default to 7 days if not specified

    // Basic input validation for districtId and days.
    if (!districtId) {
      return NextResponse.json({ error: 'Missing districtId in path parameters' }, { status: 400 });
    }
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays <= 0) {
      return NextResponse.json({ error: 'Invalid days parameter. Must be a positive number.' }, { status: 400 });
    }

    // SQL query to fetch historical data for the last N days for the specified district.
    // We select relevant metrics and order by date and creation timestamp to ensure chronological order.
    // Ensure your `district_metrics` table has 'date' (DATE type) and 'created_at' (TIMESTAMP WITH TIME ZONE) columns.
    if (!pool) {
      return NextResponse.json({ error: 'Database connection is not available.' }, { status: 500 });
    }
    const { rows: historicalData } = await pool.query<HistoricalMetric>(
      `SELECT date, water_quality, water_volume, pressure, efficiency
       FROM district_metrics
       WHERE district_id = $1 AND date >= CURRENT_DATE - INTERVAL '${numDays - 1} days'
       ORDER BY date ASC, created_at ASC`, // Order by date ascending for chart display
      [districtId] // Pass the dynamic districtId as a parameter to the query.
    );

    // Return the fetched historical data as a JSON response.
    return NextResponse.json(historicalData);
  } catch (error) {
    // Log any errors that occur during the API request processing or database query.
    console.error('API Error fetching historical water metrics:', error);
    // Return a 500 Internal Server Error response to the client.
    return NextResponse.json({ error: 'Failed to fetch historical data' }, { status: 500 });
  }
}
