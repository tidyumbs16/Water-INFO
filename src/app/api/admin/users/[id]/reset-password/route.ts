// app/api/admin/users/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db'; // Import PostgreSQL pool from your shared library
import { authenticateRequest } from '@/lib/auth';
import { logActivity } from '@/lib/activityLogger'; // Assuming this utility exists
import bcrypt from 'bcrypt';
import { z } from 'zod'; // Import Zod for robust validation

// Define a schema for the request body using Zod
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters long' }) // กำหนดความยาวขั้นต่ำของรหัสผ่าน
    .max(128, { message: 'Password cannot exceed 128 characters' }), // กำหนดความยาวสูงสุด
});

/**
 * @function POST
 * @description Handles POST requests to reset an admin user's password by ID.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The ID of the user to reset the password for.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and authorize the request
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId, email, role } = authResult;

  // Only 'super_admin' or 'admin' can reset passwords for other users
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions to reset passwords.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for password reset' }, { status: 400 });
  }

  // Prevent a user from resetting their own password via this endpoint
  if (id === userId) {
    return NextResponse.json({ message: 'Forbidden: You cannot reset your own password via this endpoint.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // 2. Validate the request body with Zod
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      // Return a 400 response with the validation error message
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }
    const { newPassword } = validation.data;

    // 3. Hash the new password before updating the database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update the password_hash in the database for the specified user ID
    const updateQuery = `
      UPDATE admin_users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, email, role;
    `;
    const result = await pool!.query(updateQuery, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found or nothing to update' }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    console.log(`User ${userId} (${email}) successfully reset password for user: ${updatedUser.username} (ID: ${id}).`);

    // 5. Log the activity
    await logActivity({
      user_id: userId,
      action: 'PASSWORD_RESET',
      details: {
        message: `รีเซ็ตรหัสผ่านผู้ใช้: ${updatedUser.username} (ID: ${id})`
      },
      entity_id: id,
      entity_type: 'admin_user'
    });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Error resetting password for user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal server error while resetting password', error: (error as Error).message }, { status: 500 });
  }
}
