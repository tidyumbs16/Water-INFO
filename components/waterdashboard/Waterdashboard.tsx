"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface District {
  district_id: string;
  district_name: string;
}

interface DistrictMetrics {
  date?: string;
  water_quality: number | string | null;
  water_volume: number | string | null;
  pressure: number | string | null;
  efficiency: number | string | null;
  quality_trend: number | string | null;
  volume_trend: number | string | null;
  pressure_trend: number | string | null;
  efficiency_trend: number | string | null;
}

interface WaterDashboardProps {
  onDistrictSelect?: (districtId: string) => void;
}

// 🛠 helper: ป้องกัน NaN
const formatNumber = (value: any, digits: number = 2, fallback: string = "-") => {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num.toFixed(digits);
};

// 🛠 trend icon
const renderTrendIcon = (trend: number | string | null) => {
  if (trend === null) return "➖";
  const val = Number(trend);
  if (isNaN(val)) return "➖";
  if (val > 0) return "📈";
  if (val < 0) return "📉";
  return "➖";
};

// 🛠 summary
const generateSummary = (metrics: DistrictMetrics, days: number) => {
  const prefix =
    days === 0
      ? `📅 วันที่ ${new Date().toISOString().split("T")[0]}`
      : `📅 สรุปย้อนหลัง ${days} วัน`;

  return (
    `${prefix}\n` +
    `- คุณภาพน้ำ: ${formatNumber(metrics.water_quality, 2)} pH → ${renderTrendIcon(metrics.quality_trend)}\n` +
    `- ปริมาณน้ำ: ${formatNumber(metrics.water_volume, 0)} L → ${renderTrendIcon(metrics.volume_trend)}\n` +
    `- ความดัน: ${formatNumber(metrics.pressure, 2)} psi → ${renderTrendIcon(metrics.pressure_trend)}\n` +
    `- ประสิทธิภาพ: ${formatNumber(metrics.efficiency, 1)} % → ${renderTrendIcon(metrics.efficiency_trend)}`
  );
};

export default function WaterDashboard({ onDistrictSelect }: WaterDashboardProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [metrics, setMetrics] = useState<DistrictMetrics | null>(null);
  const [days, setDays] = useState<number>(0);

  // โหลด list เขต
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await fetch("/api/districts");
        if (!res.ok) throw new Error("Failed to fetch districts");
        const data: District[] = await res.json();
        setDistricts(data);
        if (data.length > 0) {
          setSelectedDistrict(data[0].district_id);
          onDistrictSelect?.(data[0].district_id);
        }
      } catch (err) {
        console.error("Error loading districts:", err);
      }
    };
    fetchDistricts();
  }, [onDistrictSelect]);

  // โหลด metrics ของเขตที่เลือก
useEffect(() => {
  if (!selectedDistrict) return;
  onDistrictSelect?.(selectedDistrict);

const fetchMetrics = async () => {
  try {
    const url =
      days > 0
        ? `/api/water-data/${selectedDistrict}?days=${days}`
        : `/api/water-data/${selectedDistrict}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch metrics");

    const data = await res.json();

    // ✅ เลือกชุดข้อมูลตาม days
    if (days === 0) {
      setMetrics(data.latest || null);
    } else if (days === 7) {
      setMetrics(data.avg7days || null);
    } else if (days === 30) {
      setMetrics(data.avg30days || null);
    }
  } catch (err) {
    console.error("Error loading metrics:", err);
  }
};
  fetchMetrics();
}, [selectedDistrict, days, onDistrictSelect]);

  return (
    <div className="p-6 space-y-6">
      {/* Dropdowns */}
      <div className="flex gap-4 flex-wrap">
        <select
          className="bg-gray-800 text-white p-3 rounded-lg text-lg"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          {districts.map((d) => (
            <option key={d.district_id} value={d.district_id}>
              {d.district_name}
            </option>
          ))}
        </select>

        <select
          className="bg-gray-800 text-white p-3 rounded-lg text-lg"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
        >
          <option value={0}>ค่าปัจจุบัน</option>
          <option value={7}>ย้อนหลัง 7 วัน</option>
          <option value={30}>ย้อนหลัง 30 วัน</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <AnimatePresence mode="wait">
        {metrics && (
          <motion.div
            key={`${selectedDistrict}-${days}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="p-6 bg-blue-500 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">คุณภาพน้ำ</div>
              <div className="flex items-center mt-3">
                <span className="text-3xl">{renderTrendIcon(metrics.quality_trend)}</span>
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.water_quality, 2)} pH
                </span>
              </div>
            </div>

            <div className="p-6 bg-green-500 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">ปริมาณน้ำ</div>
              <div className="flex items-center mt-3">
                <span className="text-3xl">{renderTrendIcon(metrics.volume_trend)}</span>
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.water_volume, 0)} L
                </span>
              </div>
            </div>

            <div className="p-6 bg-orange-500 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">ความดัน</div>
              <div className="flex items-center mt-3">
                <span className="text-3xl">{renderTrendIcon(metrics.pressure_trend)}</span>
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.pressure, 2)} psi
                </span>
              </div>
            </div>

            <div className="p-6 bg-purple-500 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">ประสิทธิภาพ</div>
              <div className="flex items-center mt-3">
                <span className="text-3xl">{renderTrendIcon(metrics.efficiency_trend)}</span>
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.efficiency, 1)} %
                </span>
              </div>
            </div>

            {/* Trend cards */}
            <div className="p-6 bg-cyan-600 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">แนวโน้มคุณภาพ</div>
              <div className="flex items-center mt-3 text-3xl">
                {formatNumber(metrics.quality_trend, 1)}
              </div>
            </div>

            <div className="p-6 bg-lime-600 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">แนวโน้มปริมาณ</div>
              <div className="flex items-center mt-3 text-3xl">
                {formatNumber(metrics.volume_trend, 1)}
              </div>
            </div>

            <div className="p-6 bg-yellow-600 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">แนวโน้มความดัน</div>
              <div className="flex items-center mt-3 text-3xl">
                {formatNumber(metrics.pressure_trend, 1)}
              </div>
            </div>

            <div className="p-6 bg-pink-600 text-white rounded-xl shadow-lg">
              <div className="text-xl font-semibold">แนวโน้มประสิทธิภาพ</div>
              <div className="flex items-center mt-3 text-3xl">
                {formatNumber(metrics.efficiency_trend, 1)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {metrics && (
        <div className="bg-gray-900 p-4 rounded-lg text-white mt-6 shadow-lg">
          <h2 className="text-lg font-semibold text-blue-400">📝 ข้อมูลสรุป</h2>
          <pre className="mt-3 whitespace-pre-wrap leading-relaxed">
            {generateSummary(metrics, days)}
          </pre>
        </div>
      )}
    </div>
  );
}