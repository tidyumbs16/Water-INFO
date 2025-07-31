import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db'; // Import query function for database

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // --- Authentication Token Check ---
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized: No Token provided' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  // Replace 'my-secret-admin-token' with your actual token validation logic
  if (token !== 'my-secret-admin-token') {
    return NextResponse.json({ message: 'Forbidden: Invalid Token' }, { status: 403 });
  }
  // --- End Authentication Token Check ---

  const { id } = params; // Get Alert Log ID from URL parameters
  const { is_resolved } = await req.json(); // Get is_resolved status from request body

  if (typeof is_resolved !== 'boolean') {
    return NextResponse.json({ message: 'Invalid is_resolved status' }, { status: 400 });
  }

  try {
    let resolvedByUsername: string | null = null;
    // In production, you should extract the username from the authenticated Admin's JWT token
    // For now, using a placeholder
    if (is_resolved) {
      resolvedByUsername = 'Admin User'; // Replace with actual Admin username logic
    } else {
      // If setting to unresolved, clear resolved_by_username and resolved_at
      resolvedByUsername = null;
    }

    const result = await pool !.query(
      `
      UPDATE alerts_log
      SET
        is_resolved = $1,
        resolved_by_username = $2,
        resolved_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END -- Set resolved_at when status is TRUE, clear when FALSE
      WHERE id = $3
      RETURNING *;
      `,
      [is_resolved, resolvedByUsername, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Alert log not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Alert log status updated successfully', alert: result.rows[0] }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating alerts log with ID ${id}:`, error);
    return NextResponse.json({ message: 'Error updating alert log status', error: error.message }, { status: 500 });
  }
}
