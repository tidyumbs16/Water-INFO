// src/app/api/activity-logs/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Handles GET requests to fetch activity logs.
 * This API route retrieves data from the 'activity_log' table,
 * including the 'action' and 'details' columns.
 *
 * @returns {NextResponse} A JSON response containing the activity logs or an error message.
 */
export async function GET() {
  try {
    // Fetch all columns from the 'activity_log' table.
    // Ensure that 'action' and 'details' columns exist in your database.
    const { rows } = await sql`SELECT * FROM activity_log ORDER BY timestamp DESC;`;

    // Return the fetched activity logs as a JSON response.
    return NextResponse.json({ logs: rows }, { status: 200 });
  } catch (error) {
    // Log the error for debugging purposes.
    console.error('Failed to fetch activity logs:', error);

    // Return an error response.
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

/**
 * Handles POST requests to add a new activity log.
 * This example assumes you might want to add new logs via this endpoint.
 * You can expand this function based on your application's needs.
 *
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function POST(request: Request) {
  try {
    const { message, action, details } = await request.json();

    // Validate incoming data (optional but recommended)
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Insert a new activity log into the 'activity_log' table.
    // Ensure the column names match your database schema.
    await sql`
      INSERT INTO activity_log (message, action, details)
      VALUES (${message}, ${action || ''}, ${details ? JSON.stringify(details) : null});
    `;

    // Return a success response.
    return NextResponse.json({ message: 'Activity log added successfully' }, { status: 201 });
  } catch (error) {
    // Log the error for debugging purposes.
    console.error('Failed to add activity log:', error);

    // Return an error response.
    return NextResponse.json({ error: 'Failed to add activity log' }, { status: 500 });
  }
}
