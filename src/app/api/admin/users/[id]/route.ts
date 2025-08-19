// app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, DecodedToken } from '@/lib/auth'; // Import authentication utilities
import pool from '@/lib/db'; // Import PostgreSQL pool from your shared library
import bcrypt from 'bcrypt';// Import bcryptjs for password hashing
import { z } from 'zod'; // Import Zod for robust validation

// A mock function to simulate logging user activity.
// In a real application, this would write to a database or a logging service.
async function logActivity(logData: any) {
  console.log('Activity Log:', JSON.stringify(logData, null, 2));
}

// Define a schema for the request body of the PUT request using Zod
// All fields are optional, as the user might only update one field.
const userUpdateSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  role: z.enum(['super_admin', 'admin', 'editor', 'user']).optional(), // Ensure role is one of the valid values
}).strict(); // Use .strict() to prevent additional, unexpected fields

/**
 * @function GET
 * @description Handles GET requests to retrieve a single admin user by ID.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The ID of the user to retrieve.
 * @returns {NextResponse} A JSON response containing the user data or an error message.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate the request and get user info from the token
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId, email, role } = authResult;

  // 2. Authorize based on user role
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions.' }, { status: 403 });
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    // 3. Fetch the user from the database by ID
    const selectQuery = `
      SELECT id, username, email, role, created_at, updated_at
      FROM admin_users
      WHERE id = $1;
    `;
    const result = await pool!.query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userData = result.rows[0];
    console.log(`User ${userId} (${email}) fetched details for user ${userData.username} (ID: ${id}).`);
    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal server error while fetching user', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @function PUT
 * @description Handles PUT requests to update an existing admin user by ID.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The ID of the user to update.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and authorize the request
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId, email, role } = authResult;
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for update' }, { status: 400 });
  }

  try {
    const body = await request.json();
    
    // 2. Validate the request body with Zod
    const validation = userUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }
    const { username, password, email: newEmail, role: newRole } = validation.data;

    // Prevent a user from changing their own role
    if (id === userId && newRole && newRole !== role) {
      return NextResponse.json({ message: "Forbidden: You cannot change your own role." }, { status: 403 });
    }

    let hashedPassword = undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (username) {
      updates.push(`username = $${valueIndex++}`);
      values.push(username);
    }
    if (newEmail) {
      updates.push(`email = $${valueIndex++}`);
      values.push(newEmail);
    }
    if (newRole) {
      updates.push(`role = $${valueIndex++}`);
      values.push(newRole);
    }
    if (hashedPassword) {
      updates.push(`password_hash = $${valueIndex++}`);
      values.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ message: 'No data provided to update' }, { status: 400 });
    }

    // Add updated_at timestamp to the list of updates
    updates.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE admin_users
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING id, username, email, role, created_at, updated_at;
    `;
    values.push(id); // Add the user ID for the WHERE clause

    const result = await pool!.query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found or nothing to update' }, { status: 404 });
    }

    const updatedUser = result.rows[0];
    console.log(`User ${userId} (${email}) updated admin user: ${updatedUser.username} (ID: ${id}).`);
    
    // Log the activity
    await logActivity({
      userId: userId,
      eventType: 'USER_UPDATED',
      description: `แก้ไขข้อมูลผู้ใช้: ${updatedUser.username} (ID: ${id})`,
      relatedId: id,
      severity: 'INFO',
      details: {
        updatedFields: Object.keys(validation.data), // Log the fields that were updated
      }
    });

    return NextResponse.json({ message: 'User updated successfully', user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error);
    if ((error as any).code === '23505') {
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error while updating user', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @function DELETE
 * @description Handles DELETE requests to delete an admin user by ID.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @param {object} context - The context object containing route parameters.
 * @param {string} context.params.id - The ID of the user to delete.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and authorize the request
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { userId, email, role } = authResult;
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions.' }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for deletion' }, { status: 400 });
  }

  // Prevent a user from deleting their own account
  if (id === userId) {
    return NextResponse.json({ message: 'Forbidden: You cannot delete your own account.' }, { status: 403 });
  }

  try {
    // 2. Delete the user from the database by ID
    const deleteQuery = `
      DELETE FROM admin_users
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool!.query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'User not found or already deleted' }, { status: 404 });
    }

    const deletedUser = result.rows[0];
    console.log(`User ${userId} (${email}) deleted admin user: ${deletedUser.username} (ID: ${id}).`);
    
    // Log the activity
    await logActivity({
      userId: userId,
      eventType: 'USER_DELETED',
      description: `ลบผู้ใช้: ${deletedUser.username} (ID: ${id})`,
      relatedId: id,
      severity: 'WARNING',
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json({ message: 'Internal server error while deleting user', error: (error as Error).message }, { status: 500 });
  }
}
