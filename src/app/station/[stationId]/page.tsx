// app/station/[stationId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface StationData {
  id: string;
  name: string;
  province?: string;
  region?: string;
  population?: number;
  status?: string;
  description?: string;
}

interface MetricsDaily {
  date: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
}

export default function StationDetailPage() {
  const params = useParams<{ stationId: string }>();
  const [station, setStation] = useState<StationData | null>(null);
  const [metrics, setMetrics] = useState<MetricsDaily | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.stationId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [stationRes, metricsRes] = await Promise.all([
          fetch(`/api/stations/${params.stationId}`),
          fetch(`/api/stations/${params.stationId}/metrics/daily`),
        ]);

        if (!stationRes.ok) {
          throw new Error(`โหลดข้อมูลสถานีไม่สำเร็จ (status: ${stationRes.status})`);
        }

        const stationData: StationData = await stationRes.json();
        setStation(stationData);

        if (metricsRes.ok) {
          const metricsData: MetricsDaily = await metricsRes.json();
          setMetrics(metricsData);
        }
      } catch (err) {
        console.error("Error fetching station:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.stationId]);

  if (loading) return <p className="p-8 text-center text-gray-600">กำลังโหลด...</p>;
  if (error) return <p className="p-8 text-center text-red-500">❌ {error}</p>;
  if (!station) return <p className="p-8 text-center text-red-500">ไม่พบข้อมูลสถานี</p>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-3xl font-bold text-blue-700">
          📊 ข้อมูลสถานี: {station.name || "ไม่ทราบชื่อ"}
        </h1>

        {/* ✅ ข้อมูลทั่วไป */}
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">📍 ข้อมูลทั่วไป</h2>
          <p><b>จังหวัด:</b> {station.province || "ไม่มีข้อมูล"}</p>
          <p><b>ภูมิภาค:</b> {station.region || "ไม่มีข้อมูล"}</p>
          <p><b>รายละเอียด:</b> {station.description || "ไม่มีข้อมูล"}</p>
        </div>

        {/* ✅ ค่ามาตรฐานน้ำ */}
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">💧 ค่ามาตรฐานน้ำ (วันนี้)</h2>
          {metrics ? (
            <ul className="list-disc ml-5 space-y-1">
              <li>คุณภาพน้ำ: {metrics.water_quality ?? "-"}%</li>
              <li>แรงดันน้ำ: {metrics.pressure ?? "-"} PSI</li>
              <li>ปริมาณน้ำสำรอง: {metrics.water_volume ?? "-"} m³</li>
              <li>ประสิทธิภาพ: {metrics.efficiency ?? "-"}%</li>
            </ul>
          ) : (
            <p className="text-gray-400">ไม่มีข้อมูลวันนี้</p>
          )}
        </div>

        {/* ✅ การวิเคราะห์ */}
        <div className="bg-purple-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">📈 การวิเคราะห์</h2>
          <p className="text-gray-700">
            สถานี {station.name || "ไม่ทราบชื่อ"}{" "}
            {metrics
              ? "มีแนวโน้มการใช้น้ำเพิ่มขึ้น คุณภาพน้ำอยู่ในเกณฑ์ดี แรงดันน้ำคงที่"
              : "ไม่มีข้อมูลเพียงพอ"}.
            อย่างไรก็ตามควรเฝ้าระวังปริมาณน้ำสำรองเพื่อเตรียมแผนการผลิตในอนาคต
          </p>
        </div>
      </div>
    </div>
  );
}
