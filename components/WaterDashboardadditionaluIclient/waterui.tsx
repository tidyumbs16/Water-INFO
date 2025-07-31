'use client'; 

import React, { useState, useEffect } from 'react';
interface District {
  id: string;
  name: string;
}

interface DistrictMetrics {
  district_id: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number | null;
  volume_trend: number | null;
  pressure_trend: number | null;
  efficiency_trend: number | null;
  date?: string; // Add date column if exists
  created_at?: string; // Add created_at if exists
}

export default function WaterDashboardClient({ initialDistricts, initialMetrics }: { initialDistricts: District[], initialMetrics: DistrictMetrics | null }) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [currentMetrics, setCurrentMetrics] = useState<DistrictMetrics | null>(initialMetrics);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCurrentMetricsData() {
      setIsLoading(true);
      setError(null);
      try {
        // *** แก้ไขบรรทัดนี้: เปลี่ยน URL ของ fetch ***
        const response = await fetch(`/api/water-data/${selectedDistrict}`); // <--- เปลี่ยนจาก /api/water-metrics เป็น /api/water-data/

        if (!response.ok) {
          // เพิ่มรายละเอียดของ Error เพื่อช่วย Debug
          const errorText = await response.text(); 
          throw new Error(`Network response was not ok for current metrics. Status: ${response.status}. Details: ${errorText}`);
        }
        const data = await response.json();
        setCurrentMetrics(data);
      } catch (err: any) { // ใช้ any เพื่อให้เข้าถึง err.message ได้ง่ายขึ้น
        console.error("Error fetching current district metrics:", err);
        // ปรับปรุงข้อความ Error ที่แสดงบน UI
        setError(`เกิดข้อผิดพลาดในการโหลดข้อมูลเมตริกปัจจุบัน: ${err.message || 'ไม่ทราบข้อผิดพลาด'}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedDistrict) {
      fetchCurrentMetricsData();
    }
  }, [selectedDistrict]);

  const formatNumber = (num: number | null | undefined, unit: string = '') => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString() + unit;
  };

  const formatTrend = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const indicator = value > 0 ? '▲' : value < 0 ? '▼' : '▬';
    const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';
    return <span className={`${color} font-bold`}>{indicator} {Math.abs(value).toFixed(1)}%</span>;
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-7xl mx-auto bg-gradient-to-br from-indigo-50 via-blue-50 to-teal-50 font-inter rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out hover:shadow-3xl">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-8 drop-shadow-sm leading-tight">
        🌊 สถิติประปา Insight 💧
      </h1>
      <p className="text-center text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
        ข้อมูลเชิงลึกระบบประปาเพื่อการบริหารจัดการน้ำอย่างมีประสิทธิภาพ!
      </p>

      {/* District Selection Dropdown */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
        <label htmlFor="district-select" className="block text-lg font-semibold text-gray-800 mb-2">
          เลือกเขตประปา:
        </label>
        <select
          id="district-select"
          className="block w-full md:w-1/2 lg:w-1/3 px-4 py-2 border-2 border-indigo-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-800 text-base"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          disabled={isLoading}
        >
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* Current Metrics Display */}
      {isLoading ? (
        <p className="text-center text-indigo-500 text-xl animate-pulse">กำลังโหลดข้อมูลเมตริกปัจจุบัน...</p>
      ) : error ? (
        <p className="text-center text-rose-600 text-xl font-semibold">⚠️ {error}</p>
      ) : currentMetrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-blue-700 mb-2">
              <i className="fas fa-tint mr-2 text-blue-500"></i> คุณภาพน้ำ
            </h3>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">{formatNumber(currentMetrics.water_quality)} <span className="text-2xl font-semibold"></span>pH</p>
            <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.quality_trend)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-green-700 mb-2">
              <i className="fas fa-water mr-2 text-green-500"></i> ปริมาณน้ำ (ลูกบาศก์เมตร)
            </h3>
            <p className="text-4xl font-extrabold text-green-600 mt-2">{formatNumber(currentMetrics.water_volume)}</p>
            <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.volume_trend)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-purple-700 mb-2">
              <i className="fas fa-tachometer-alt mr-2 text-purple-500"></i> แรงดันน้ำ (PSI)
            </h3>
            <p className="text-4xl font-extrabold text-purple-600 mt-2">{formatNumber(currentMetrics.pressure)}</p>
            <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.pressure_trend)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold text-orange-700 mb-2">
              <i className="fas fa-chart-line mr-2 text-orange-500"></i> ประสิทธิภาพการจ่ายน้ำ
            </h3>
            <p className="text-4xl font-extrabold text-orange-600 mt-2">{formatNumber(currentMetrics.efficiency)}<span className="text-2xl font-semibold">%</span></p>
            <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.efficiency_trend)}</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg">ไม่สามารถแสดงข้อมูลเมตริกปัจจุบันได้</p>
      )}

      <p className="text-center text-base text-gray-500 mt-8">
        🚀 เชื่อมต่อกับข้อมูลจริงเพื่อ Dashboad ที่อัปเดตแบบเรียลไทม์!
      </p>
    </div>
  );
}