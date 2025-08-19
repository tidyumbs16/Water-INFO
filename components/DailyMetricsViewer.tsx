"use client";
import React, { useEffect, useState } from "react";

interface DistrictMetrics {
  date?: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number;
  volume_trend: number;
  pressure_trend: number;
  efficiency_trend: number;
}

interface SummaryProps {
  metrics: DistrictMetrics | null;
  days: number;
}

// ฟังก์ชันช่วยเลือก Icon trend
const renderTrendIcon = (trend: number) => {
  if (trend > 0) return "📈 เพิ่มขึ้น";
  if (trend < 0) return "📉 ลดลง";
  return "➖ ทรงตัว";
};

// ฟังก์ชันสรุปข้อความ
const generateSummary = (metrics: DistrictMetrics, days: number) => {
  const prefix =
    days === 0
      ? `📅 วันที่ ${new Date().toISOString().split("T")[0]}`
      : `📅 สรุปย้อนหลัง ${days} วัน`;

  return (
    `${prefix}\n` +
    `- คุณภาพน้ำ: ${metrics.water_quality} pH → ${renderTrendIcon(metrics.quality_trend)}\n` +
    `- ปริมาณน้ำ: ${metrics.water_volume} L → ${renderTrendIcon(metrics.volume_trend)}\n` +
    `- ความดัน: ${metrics.pressure} psi → ${renderTrendIcon(metrics.pressure_trend)}\n` +
    `- ประสิทธิภาพ: ${metrics.efficiency} % → ${renderTrendIcon(metrics.efficiency_trend)}`
  );
};

// Component สรุป
export default function MetricsSummary({ metrics, days }: SummaryProps) {
  if (!metrics) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg text-white mt-6">
        <h2 className="text-lg font-semibold text-blue-400">ข้อมูลรายวัน</h2>
        <p className="mt-2 text-gray-400">ไม่มีข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg text-white mt-6 shadow-lg">
      <h2 className="text-lg font-semibold text-blue-400">📝 ข้อมูลสรุป</h2>
      <pre className="mt-3 whitespace-pre-wrap leading-relaxed">
        {generateSummary(metrics, days)}
      </pre>
    </div>
  );
}
