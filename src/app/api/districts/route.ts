import pool from '@/lib/db'; 
import { NextResponse } from 'next/server'; 

// Interface for the district data structure
interface District {
  id: string;   
  name: string; 
}

/**
 * @function GET
 * @description Fetches a list of districts, optionally filtered by province_id.
 *
 * @param {Request} request - The incoming Next.js Request object.
 * @returns {Promise<NextResponse>} A JSON response containing the list of districts
 */
export async function GET(request: Request) {
  try {
    // Ensure the database pool is initialized
    if (!pool) {
      console.error('Database pool is not initialized in API route.');
      return NextResponse.json({ error: 'Database connection not established.' }, { status: 500 });
    }

    // Extract the search parameters from the request URL
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');

    // Prepare variables for the SQL query and its parameters
    let queryText = 'SELECT id, name FROM districts';
    const queryValues = [];

    // Check if provinceId is provided to filter the results
    if (provinceId) {
      // โค้ดที่แก้ไข: เปลี่ยน "provinceId" เป็น "province_id" เพื่อให้ตรงกับรูปแบบ snake_case ที่นิยมใช้
      queryText += ' WHERE "province" = $1'; 
      queryValues.push(provinceId);
    } 

    // Execute the query using the prepared text and values
    const result = await pool.query(queryText, queryValues);
    const districts: District[] = result.rows; 

    // Return the fetched districts as a JSON response
    return NextResponse.json(districts);
  } catch (error) {
    console.error('API Error fetching districts:', error);
    // Return a 500 status with an error message on failure
    return NextResponse.json({ error: 'Failed to fetch districts from database.' }, { status: 500 });
  }
}
