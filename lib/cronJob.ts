import cron from "node-cron";
import pool from "../lib/db";

async function generateDailyMetrics() {
  console.log("⏳ เริ่มสุ่มข้อมูล Metrics ประจำวัน...");

  try {
    const districts = await pool!.query(`SELECT id FROM districts`);

    for (const district of districts.rows) {
      const metrics = {
        water_quality: parseFloat((Math.random() * 5 + 5).toFixed(2)),
        water_volume: Math.floor(Math.random() * 3000000 + 1000000),
        pressure: parseFloat((Math.random() * 20 + 30).toFixed(2)),
        efficiency: parseFloat((Math.random() * 10 + 90).toFixed(1)),
        quality_trend: parseFloat((Math.random() * 2 - 1).toFixed(1)),
        volume_trend: parseFloat((Math.random() * 10 - 5).toFixed(1)),
        pressure_trend: parseFloat((Math.random() * 2 - 1).toFixed(1)),
        efficiency_trend: parseFloat((Math.random() * 2 - 1).toFixed(1)),
      };

      await pool!.query(
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
          efficiency_trend = EXCLUDED.efficiency_trend`,
        [
          district.id,
          metrics.water_quality,
          metrics.water_volume,
          metrics.pressure,
          metrics.efficiency,
          metrics.quality_trend,
          metrics.volume_trend,
          metrics.pressure_trend,
          metrics.efficiency_trend,
        ]
      );
    }

    console.log("✅ สุ่มข้อมูลเสร็จเรียบร้อย");
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาดในการสุ่มข้อมูล:", err);
  }
}

// 🚀 เรียกครั้งแรกตอน start server (จะได้มีค่า)
generateDailyMetrics();

// ⏰ ตั้งเวลา 10 โมงเช้า ทุกวัน (Asia/Bangkok)
cron.schedule("0 10 * * *", generateDailyMetrics, {
  timezone: "Asia/Bangkok",
});

console.log("🚀 Cron job พร้อมทำงานแล้ว (สุ่มทุกวัน 10 โมง)");
