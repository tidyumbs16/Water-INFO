// src/app/api/admin/alerts-log/[id]/resolve/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../../../../lib/db";

export async function PUT(req: Request, context: any) {
  const { id } = context.params; // ✅ ใช้ context: any ให้ build ผ่านชัวร์

  try {
    const result = await pool!.query(
      `UPDATE alerts_log
       SET is_resolved = true,
           resolved_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "ไม่พบข้อมูลแจ้งเตือน" }, { status: 404 });
    }

    return NextResponse.json({
      message: "อัปเดตสถานะสำเร็จ",
      alert: result.rows[0],
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการอัปเดตแจ้งเตือน",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
