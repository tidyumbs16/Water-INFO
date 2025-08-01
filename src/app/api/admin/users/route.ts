// app/api/admin_users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, DecodedToken } from '@/lib/auth'; // Import authentication utilities
import pool from '@/lib/db';
import bcrypt from 'bcryptjs'; 

/**
 * @function GET
 * @description Handles GET requests to retrieve all admin users.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {NextResponse} A JSON response containing the list of admin users or an error message.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate the request using the JWT token
  const authResult = authenticateRequest(request);

  // If authentication fails, return the error response from authenticateRequest
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Destructure user information from the decoded token
  const { userId, email, role } = authResult;

  // 2. Authorize based on user role: Only 'super_admin' or 'admin' can view all users
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}. 'super_admin' or 'admin' role required to view admin users.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions to view admin users.' }, { status: 403 });
  }

  try {
    // 3. Fetch all admin users from the database
    // IMPORTANT: DO NOT select 'password_hash' directly when returning to the client
    const selectQuery = `
      SELECT id, username, email, role, created_at, updated_at
      FROM admin_users
      ORDER BY id ASC;
    `;
    const result = await query(selectQuery);

    console.log(`User ${userId} (${email}) with role ${role} successfully fetched all admin users.`);
    return NextResponse.json(result.rows, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ message: 'Internal server error while fetching admin users', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @function POST
 * @description Handles POST requests to create a new admin user.
 * Requires 'super_admin' or 'admin' role for access.
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate the request
  const authResult = authenticateRequest(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { userId, email, role } = authResult;

  // 2. Authorize based on user role: Only 'super_admin' or 'admin' can create new users
  if (role !== 'super_admin' && role !== 'admin') {
    console.warn(`Access denied for user ${userId} (${email}) with role ${role}. 'super_admin' or 'admin' role required to create admin users.`);
    return NextResponse.json({ message: 'Forbidden: You do not have sufficient permissions to create admin users.' }, { status: 403 });
  }

  try {
    const { username, password, email: newEmail, role: newRole } = await request.json();

    // Basic input validation
    if (!username || !password || !newEmail || !newRole) {
      return NextResponse.json({ message: 'Username, password, email, and role are required' }, { status: 400 });
    }

    // Validate the new role to be one of the allowed roles (e.g., 'admin', 'normal_admin', 'super_admin')
    const allowedRoles = ['admin', 'normal_admin', 'super_admin'];
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json({ message: `Invalid role specified. Allowed roles are: ${allowedRoles.join(', ')}` }, { status: 400 });
    }

    // 3. Hash the new user's password before storing it
    const salt = await bcrypt.genSalt(10); // Generate a salt for hashing
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

    // 4. Insert the new user into the database
    const insertQuery = `
      INSERT INTO admin_users (username, password_hash, email, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, username, email, role, created_at, updated_at;
    `;
    const result = await query(insertQuery, [username, hashedPassword, newEmail, newRole]);

    const newUser = result.rows[0];
    console.log(`User ${userId} (${email}) with role ${role} successfully created new admin user: ${newUser.username}`);
    return NextResponse.json({ message: 'Admin user created successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Error creating admin user:', error);
    // Handle specific database errors if needed (e.g., duplicate username/email)
    if ((error as any).code === '23505') { // PostgreSQL unique violation error code
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error while creating admin user', error: (error as Error).message }, { status: 500 });
  }
}
