// app/api/admin/users/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../../../../lib/db";
import { authenticateRequest } from "../../../../../../../lib/auth";
import { logActivity } from "../../../../../../../lib/activityLogger";
import bcrypt from "bcrypt";
import { z } from "zod";

// Zod schema
const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password cannot exceed 128 characters" }),
});

export async function POST(req: NextRequest, context: any) {
  // 1. Auth
  const authResult = authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;

  const { userId, email, role } = authResult;
  const { id } = context.params; // ✅ ใช้ context: any

  if (!id) {
    return NextResponse.json(
      { message: "User ID is required for password reset" },
      { status: 400 }
    );
  }

  if (role !== "super_admin" && role !== "admin") {
    return NextResponse.json(
      { message: "Forbidden: You do not have sufficient permissions to reset passwords." },
      { status: 403 }
    );
  }

  if (id === userId) {
    return NextResponse.json(
      { message: "Forbidden: You cannot reset your own password via this endpoint." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newPassword } = validation.data;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateQuery = `
      UPDATE admin_users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, email, role;
    `;
    const result = await pool!.query(updateQuery, [hashedPassword, id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "User not found or nothing to update" },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];
    await logActivity({
      user_id: userId,
      action: "PASSWORD_RESET",
      details: {
        message: `รีเซ็ตรหัสผ่านผู้ใช้: ${updatedUser.username} (ID: ${id})`,
      },
      entity_id: id,
      entity_type: "admin_user",
    });

    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error resetting password for user ${id}:`, error);
    return NextResponse.json(
      {
        message: "Internal server error while resetting password",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
