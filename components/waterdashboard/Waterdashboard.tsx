"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Activity,
  Gauge,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

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
  if (trend === null) return <Minus className="h-6 w-6" />;
  const val = Number(trend);
  if (isNaN(val)) return <Minus className="h-6 w-6" />;
  if (val > 0) return <TrendingUp className="h-6 w-6 text-emerald-300" />;
  if (val < 0) return <TrendingDown className="h-6 w-6 text-red-300" />;
  return <Minus className="h-6 w-6" />;
};

// 🛠 summary
const generateSummary = (metrics: DistrictMetrics, days: number) => {
  const prefix =
    days === 0
      ? `📅 วันที่ ${new Date().toISOString().split("T")[0]}`
      : `📅 สรุปย้อนหลัง ${days} วัน`;

  return (
    `${prefix}\n` +
    `- คุณภาพน้ำ: ${formatNumber(metrics.water_quality, 2)} pH → ${metrics.quality_trend}\n` +
    `- ปริมาณน้ำ: ${formatNumber(metrics.water_volume, 0)} L → ${metrics.volume_trend}\n` +
    `- ความดัน: ${formatNumber(metrics.pressure, 2)} psi → ${metrics.pressure_trend}\n` +
    `- ประสิทธิภาพ: ${formatNumber(metrics.efficiency, 1)} % → ${metrics.efficiency_trend}`
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
      <div className="flex gap-4 flex-wrap items-center">
        <select
          className="bg-white/80 text-gray-800 p-3 rounded-xl text-base shadow-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          className="bg-white/80 text-gray-800 p-3 rounded-xl text-base shadow-md border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
        >
          <option value={0}>ค่าปัจจุบัน</option>
          <option value={7}>ย้อนหลัง 7 วัน</option>
          <option value={30}>ย้อนหลัง 30 วัน</option>
        </select>
      </div>

      {/* 🟢 Overview Card */}
      {metrics && (
        <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
          <h2 className="text-xl font-bold mb-3">🌍 ภาพรวมเขต {districts.find(d => d.district_id === selectedDistrict)?.district_name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <Droplets className="mx-auto h-6 w-6" />
              <p className="mt-1 text-sm">คุณภาพน้ำ</p>
              <p className="font-bold text-lg">{formatNumber(metrics.water_quality, 2)} pH</p>
            </div>
            <div>
              <Activity className="mx-auto h-6 w-6" />
              <p className="mt-1 text-sm">ปริมาณน้ำ</p>
              <p className="font-bold text-lg">{formatNumber(metrics.water_volume, 0)} L</p>
            </div>
            <div>
              <Gauge className="mx-auto h-6 w-6" />
              <p className="mt-1 text-sm">ความดัน</p>
              <p className="font-bold text-lg">{formatNumber(metrics.pressure, 2)} psi</p>
            </div>
            <div>
              <BarChart3 className="mx-auto h-6 w-6" />
              <p className="mt-1 text-sm">ประสิทธิภาพ</p>
              <p className="font-bold text-lg">{formatNumber(metrics.efficiency, 1)} %</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <AnimatePresence mode="wait">
        {metrics && (
          <motion.div
            key={`${selectedDistrict}-${days}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* การ์ดคุณภาพน้ำ */}
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Droplets className="h-5 w-5" /> คุณภาพน้ำ
              </h3>
              <div className="flex items-center mt-3">
                {renderTrendIcon(metrics.quality_trend)}
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.water_quality, 2)} pH
                </span>
              </div>
            </div>

            {/* การ์ดปริมาณน้ำ */}
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5" /> ปริมาณน้ำ
              </h3>
              <div className="flex items-center mt-3">
                {renderTrendIcon(metrics.volume_trend)}
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.water_volume, 0)} L
                </span>
              </div>
            </div>

            {/* การ์ดความดัน */}
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Gauge className="h-5 w-5" /> ความดัน
              </h3>
              <div className="flex items-center mt-3">
                {renderTrendIcon(metrics.pressure_trend)}
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.pressure, 2)} psi
                </span>
              </div>
            </div>

            {/* การ์ดประสิทธิภาพ */}
            <div className="p-6 rounded-2xl shadow-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5" /> ประสิทธิภาพ
              </h3>
              <div className="flex items-center mt-3">
                {renderTrendIcon(metrics.efficiency_trend)}
                <span className="ml-3 text-2xl font-bold">
                  {formatNumber(metrics.efficiency, 1)} %
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📝 Summary */}
      {metrics && (
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl text-gray-900 shadow-xl border border-gray-200">
          <h2 className="text-lg font-bold text-blue-600">📝 ข้อมูลสรุป</h2>
          <pre className="mt-3 whitespace-pre-wrap leading-relaxed text-sm text-gray-700">
            {generateSummary(metrics, days)}
          </pre>
        </div>
      )}
    </div>
  );
}
