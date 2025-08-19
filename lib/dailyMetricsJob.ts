// scripts/dailyMetricsCron.ts
import cron from "node-cron";
import pool from "@/lib/db";

// ฟังก์ชันสุ่มข้อมูลและบันทึกลง DB
async function insertDailyMetrics() {
  try {
    const client = await pool!.connect();

    // ดึง district ทั้งหมด
    const districtsResult = await client.query(`SELECT id FROM districts`);

    for (const district of districtsResult.rows) {
      // สุ่มค่าทุก metric
      const water_quality = parseFloat((Math.random() * 5 + 5).toFixed(2)); // 5.00 - 10.00
      const water_volume = Math.floor(Math.random() * 3000000 + 1000000);    // 1M - 4M
      const pressure = parseFloat((Math.random() * 20 + 30).toFixed(2));     // 30.00 - 50.00
      const efficiency = parseFloat((Math.random() * 10 + 90).toFixed(1));   // 90.0 - 100.0

      const quality_trend = parseFloat((Math.random() * 2 - 1).toFixed(1));  // -1.0 - 1.0
      const volume_trend = parseFloat((Math.random() * 10 - 5).toFixed(1));  // -5.0 - 5.0
      const pressure_trend = parseFloat((Math.random() * 2 - 1).toFixed(1));
      const efficiency_trend = parseFloat((Math.random() * 2 - 1).toFixed(1));

  await client.query(
  `INSERT INTO district_metrics_daily (
     district_id, date,
     water_quality, water_volume, pressure, efficiency,
     quality_trend, volume_trend, pressure_trend, efficiency_trend
   )
   VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
   ON CONFLICT (district_id, date)
   DO UPDATE SET
     water_quality = EXCLUDED.water_quality,
     water_volume = EXCLUDED.water_volume,
     pressure = EXCLUDED.pressure,
     efficiency = EXCLUDED.efficiency,
     quality_trend = EXCLUDED.quality_trend,
     volume_trend = EXCLUDED.volume_trend,
     pressure_trend = EXCLUDED.pressure_trend,
     efficiency_trend = EXCLUDED.efficiency_trend`
  , [
    district.id,
    water_quality,
    water_volume,
    pressure,
    efficiency,
    quality_trend,
    volume_trend,
    pressure_trend,
    efficiency_trend
  ]
);
    }
    client.release();
    console.log("✅ สุ่มข้อมูล metrics ประจำวันเสร็จแล้ว");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
  }
}

// ตั้งเวลาให้ทำงานทุกวันเวลา 10:00
cron.schedule("0 10 * * *", async () => {
  console.log("⏳ เริ่มสุ่มข้อมูล metrics ประจำวัน...");
  await insertDailyMetrics();
  await pool !.end();
}, {
  timezone: "Asia/Bangkok"
});

console.log("📅 Cron job สำหรับสุ่ม metrics รายวันถูกตั้งค่าเรียบร้อย");
