// app/api/admin/districts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { verifyToken, DecodedToken } from "../../../../../../lib/auth";
import { District } from "../../../../../../lib/definitions";

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Helper function for authentication
const authenticateRequest = (req: NextRequest): DecodedToken | NextResponse => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Unauthorized: No token provided or malformed header" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return NextResponse.json(
      { message: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }

  return decodedToken;
};

// ✅ UPDATE District
export async function PUT(req: NextRequest, context: any) {
  const authResult = authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = context.params; // ✅ ใช้ context: any

  if (!id) {
    return NextResponse.json(
      { error: "Invalid or missing District ID" },
      { status: 400 }
    );
  }

  try {
    const {
      name,
      province,
      region,
      status,
      description,
      water_quality,
      water_volume,
      pressure,
      efficiency,
      quality_trend,
      volume_trend,
      pressure_trend,
      efficiency_trend,
    } = await req.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update districts
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (province !== undefined) {
        updates.push(`province = $${paramIndex++}`);
        values.push(province);
      }
      if (region !== undefined) {
        updates.push(`region = $${paramIndex++}`);
        values.push(region);
      }
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description);
      }

      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const updateDistrictQuery = `
          UPDATE districts
          SET ${updates.join(", ")}
          WHERE id = $${paramIndex}
          RETURNING *;
        `;
        const updateResult = await client.query<District>(
          updateDistrictQuery,
          values
        );

        if (updateResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "District not found or no changes made" },
            { status: 404 }
          );
        }
      }

      // Insert metrics if provided
      const hasMetricsData = [
        water_quality,
        water_volume,
        pressure,
        efficiency,
      ].some((v) => v !== undefined && v !== null);

      if (hasMetricsData) {
        const insertMetricsQuery = `
          INSERT INTO district_metrics (
            district_id, water_quality, water_volume, pressure, efficiency,
            quality_trend, volume_trend, pressure_trend, efficiency_trend, date
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW());
        `;
        const metricsValues = [
          id,
          water_quality,
          water_volume,
          pressure,
          efficiency,
          quality_trend,
          volume_trend,
          pressure_trend,
          efficiency_trend,
        ];

        await client.query(insertMetricsQuery, metricsValues);
      }

      await client.query("COMMIT");
      return NextResponse.json({
        message: "District and metrics updated successfully",
      });
    } catch (transactionError: any) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { message: "Failed to update district", error: transactionError.message },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update district" },
      { status: 500 }
    );
  }
}

// ✅ DELETE District
export async function DELETE(req: NextRequest, context: any) {
  const authResult = authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Invalid or missing District ID" },
      { status: 400 }
    );
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM district_metrics WHERE district_id = $1;", [
        id,
      ]);

      const deleteResult = await client.query(
        "DELETE FROM districts WHERE id = $1 RETURNING *;",
        [id]
      );

      if (deleteResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "District not found" }, { status: 404 });
      }

      await client.query("COMMIT");
      return NextResponse.json({
        message: "District deleted successfully",
        deleted: deleteResult.rows[0],
      });
    } catch (err: any) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Failed to delete district", details: err.message },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
