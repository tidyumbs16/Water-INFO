// scripts/dailyMetricsSeed.ts
import pool from "@/lib/db";
import dayjs from "dayjs";

// ------------------ Helper ------------------
function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// ------------------ Core Function ------------------
async function insertDailyMetrics(date: string) {
  const client = await pool!.connect();

  let insertedCount = 0;
  let skippedCount = 0;

  try {
    const districtsResult = await client.query(`SELECT id FROM districts`);
    const districts = districtsResult.rows;

    for (const district of districts) {
      try {
        await client.query(
          `INSERT INTO district_metrics_daily (
            district_id, date,
            water_quality, water_volume, pressure, efficiency,
            quality_trend, volume_trend, pressure_trend, efficiency_trend
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            district.id,
            date,
            randomFloat(5, 10),
            randomInt(1_000_000, 4_000_000),
            randomFloat(30, 50),
            randomFloat(90, 100, 1),
            randomFloat(-1, 1, 1),
            randomFloat(-5, 5, 1),
            randomFloat(-1, 1, 1),
            randomFloat(-1, 1, 1),
          ]
        );
        console.log(`✅ Insert ${district.id} วันที่ ${date}`);
        insertedCount++;
      } catch (err: any) {
        if (err.code === "23505") {
          console.log(`⏭ ข้าม ${district.id} วันที่ ${date} (มีข้อมูลแล้ว)`);
          skippedCount++;
        } else {
          console.error(`❌ Error:`, err);
        }
      }
    }
  } finally {
    client.release();
    return { insertedCount, skippedCount };
  }
}

// ------------------ Modes ------------------
export async function seedByDays(days: number[] = [7, 30]) {
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const d of days) {
    const date = dayjs().subtract(d, "day").format("YYYY-MM-DD");
    const result = await insertDailyMetrics(date);
    totalInserted += result.insertedCount;
    totalSkipped += result.skippedCount;
  }

  console.log("\n📊 สรุปแบบ Days:");
  console.log(`   ➕ Inserted: ${totalInserted}`);
  console.log(`   ⏭ Skipped: ${totalSkipped}`);
}

export async function seedByRange(from: string, to: string) {
  let totalInserted = 0;
  let totalSkipped = 0;

  const start = dayjs(from);
  const end = dayjs(to);

  for (let d = start; d.isBefore(end) || d.isSame(end, "day"); d = d.add(1, "day")) {
    const date = d.format("YYYY-MM-DD");
    const result = await insertDailyMetrics(date);
    totalInserted += result.insertedCount;
    totalSkipped += result.skippedCount;
  }

  console.log("\n📊 สรุปแบบ Range:");
  console.log(`   ➕ Inserted: ${totalInserted}`);
  console.log(`   ⏭ Skipped: ${totalSkipped}`);
}

export async function seedSingleDay(date: string) {
  const result = await insertDailyMetrics(date);

  console.log("\n📊 สรุปแบบ Single Day:");
  console.log(`   ➕ Inserted: ${result.insertedCount}`);
  console.log(`   ⏭ Skipped: ${result.skippedCount}`);
}
