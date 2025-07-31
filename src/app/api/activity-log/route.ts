// app/api/activity-log/route.ts
// This API Route will fetch activity logs from your PostgreSQL database.

import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Adjust the path to your database utility - This is correct!

// Define an interface for the data structure of an activity log entry
interface ActivityLogEntry {
  id: string;
  event_type: string;
  description: string;
  timestamp: string; // ISO string from TIMESTAMP WITH TIME ZONE
  user_id: string | null;
  related_id: string | null;
  severity: string | null;
}

/**
 * @function GET
 * @description Handles GET requests to fetch activity logs.
 * It queries the 'activity_log' table in the PostgreSQL database.
 * @returns {Promise<NextResponse>} A JSON response containing the activity logs
 * or an error message.
 */
export async function GET(request: Request) {
  try {
    // Note: You can add authentication/authorization logic here if needed,
    // similar to what we discussed for admin_users.

    // Fetch all activity logs, ordered by timestamp in descending order (most recent first).
    // You can add LIMIT here if you only want to fetch a certain number of recent logs.
    const logs: ActivityLogEntry[] = await query(
      `SELECT id, event_type, description, timestamp, user_id, related_id, severity
         FROM activity_log
         ORDER BY timestamp DESC`
    );

    // Return the fetched logs as a JSON response.
    return NextResponse.json(logs);
  } catch (error) {
    // Log the error for server-side debugging.
    console.error('API Error fetching activity logs:', error);
    // Return a 500 Internal Server Error response to the client.
    return NextResponse.json({ error: 'Failed to fetch activity logs from database.' }, { status: 500 });
  }
}

/**
 * @function query
 * @description A helper function to execute SQL queries using the PostgreSQL pool.
 * This function was previously a placeholder and is now implemented.
 * @param {string} sql - The SQL query string.
 * @param {any[]} [params] - Optional parameters for the SQL query.
 * @returns {Promise<ActivityLogEntry[]>} A promise that resolves to an array of ActivityLogEntry.
 */
async function query(sql: string, params?: any[]): Promise<ActivityLogEntry[]> {
  try {
    // Acquire a client from the connection pool
    const client = await pool !.connect();
    try {
      // Execute the query
      const result = await client.query(sql, params);
      // Return the rows from the query result
      return result.rows;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Database query error in activity-log route:', error);
    throw error;
  }
}