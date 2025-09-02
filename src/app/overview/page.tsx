"use client";
import NavbarComponent from "@/components/navbar";
import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

// API Endpoints
const API_ENDPOINTS = {
  districts: "http://localhost:3000/api/districts",
  metrics: "http://localhost:3000/api/metrics/daily"
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

// ---------- Interfaces ----------
interface District {
  district_id: string;
  district_name: string;
}

interface TrendItem {
  date: string;
  water_quality_avg: number;
  water_volume_avg: number;
  pressure_avg: number;
  efficiency_avg: number;
}

interface MetricsOverview {
  average: {
    water_quality_avg?: number;
    water_volume_avg?: number;
    pressure_avg?: number;
    efficiency_avg?: number;
  };
  trends: TrendItem[];
  pieData: PieDataItem[];
}

interface PieDataItem {
  name: string;
  value: number;
}

// ---------- Helper ----------
const safeParse = (val: any): number => {
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : 0;
};

const safeNumberFormat = (val: any, digits: number = 2): string => {
  const num = Number(val);
  return Number.isFinite(num) ? num.toFixed(digits) : "0.00";
};

// ---------- Components ----------
function OverviewCard({ title, value, unit }: { title: string; value: number | null | undefined; unit: string }) {
  const displayValue = Number.isFinite(value) ? Number(value).toLocaleString() : "N/A";
  return (
    <div className="bg-white shadow rounded-xl p-6 text-center hover:shadow-md transition">
      <h3 className="text-gray-500 font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">
        {displayValue}
        <span className="text-lg text-gray-500"> {unit}</span>
      </p>
    </div>
  );
}

export default function App() {
  const [overview, setOverview] = useState<MetricsOverview>({
    average: {},
    trends: [],
    pieData: []
  });

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  // pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">(10);

  // ---------- Fetch Districts ----------
  useEffect(() => {
    fetch(API_ENDPOINTS.districts)
      .then((response) => response.json())
      .then((data: District[]) => setDistricts(data || []))
      .catch((err) => console.error("Error fetching districts:", err))
      .finally(() => setLoadingDistricts(false));
  }, []);

  // ---------- Fetch Metrics ----------
  useEffect(() => {
    setLoadingMetrics(true);

    const params = new URLSearchParams();
    if (selectedDistrict) params.set("district_id", selectedDistrict);

    const end = new Date();
    const start = new Date();

    if (dateRange === "today") {
      params.set("start", end.toISOString().split("T")[0]);
      params.set("end", end.toISOString().split("T")[0]);
    } else if (dateRange === "7d") {
      start.setDate(end.getDate() - 7);
      params.set("start", start.toISOString().split("T")[0]);
      params.set("end", end.toISOString().split("T")[0]);
    } else if (dateRange === "30d") {
      start.setDate(end.getDate() - 30);
      params.set("start", start.toISOString().split("T")[0]);
      params.set("end", end.toISOString().split("T")[0]);
    } else if (dateRange === "custom" && selectedDate) {
      params.set("start", selectedDate);
      params.set("end", selectedDate);
    }

    fetch(`${API_ENDPOINTS.metrics}?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        const allMetrics = (data || []).flatMap((d: any) => d?.data || []);

        if (allMetrics.length === 0) {
          setOverview({ average: {}, trends: [], pieData: [] });
          return;
        }

        const average = {
          water_quality_avg: allMetrics.reduce((a: number, b: { water_quality: any; }) => a + safeParse(b.water_quality), 0) / (allMetrics.length || 1),
          water_volume_avg: allMetrics.reduce((a: number, b: { water_volume: any; }) => a + safeParse(b.water_volume), 0) / (allMetrics.length || 1),
          pressure_avg: allMetrics.reduce((a: number, b: { pressure: any; }) => a + safeParse(b.pressure), 0) / (allMetrics.length || 1),
          efficiency_avg: allMetrics.reduce((a: number, b: { efficiency: any; }) => a + safeParse(b.efficiency), 0) / (allMetrics.length || 1),
        };

        const trends: TrendItem[] = allMetrics.map((m: any) => ({
          date: m.date ?? "-",
          water_quality_avg: safeParse(m.water_quality),
          water_volume_avg: safeParse(m.water_volume),
          pressure_avg: safeParse(m.pressure),
          efficiency_avg: safeParse(m.efficiency),
        }));

        const pieData: PieDataItem[] = [
          { name: "คุณภาพน้ำ", value: average.water_quality_avg ?? 0 },
          { name: "ปริมาณน้ำ", value: average.water_volume_avg ?? 0 },
          { name: "แรงดัน", value: average.pressure_avg ?? 0 },
          { name: "ประสิทธิภาพ", value: average.efficiency_avg ?? 0 },
        ];

        setOverview({ average, trends, pieData });
      })
      .catch((err) => console.error("Error fetching overview:", err))
      .finally(() => setLoadingMetrics(false));
  }, [selectedDistrict, dateRange, selectedDate]);

  // ---------- Pagination Logic ----------
  let currentRows = overview.trends;
  let totalPages = 1;

  if (rowsPerPage !== "all") {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    currentRows = overview.trends.slice(indexOfFirstRow, indexOfLastRow);
    totalPages = Math.ceil(overview.trends.length / rowsPerPage);
  }

  // ---------- Render ----------
  return (
    <div className="bg-gray-50 font-sans min-h-screen">
      
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-blue-700">💧 Water Dashboard Overview</h1>

        {/* ฟิลเตอร์ */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-md">
          <label className="text-gray-600 font-medium whitespace-nowrap">เลือกเขต:</label>
          <select
            className="bg-gray-100 p-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
          >
            <option value="">ทั้งหมด</option>
            {districts.map((d) => (
              <option key={d.district_id} value={d.district_id}>
                {d.district_name}
              </option>
            ))}
          </select>

          <label className="text-gray-600 font-medium whitespace-nowrap">ช่วงเวลา:</label>
          <select
            className="bg-gray-100 p-2 rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">วันนี้</option>
            <option value="7d">ย้อนหลัง 7 วัน</option>
            <option value="30d">ย้อนหลัง 30 วัน</option>
            <option value="custom">กำหนดเอง</option>
          </select>

          {dateRange === "custom" && (
            <input
              type="date"
              className="p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}
        </div>

        {loadingMetrics ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* การ์ดค่าเฉลี่ย */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <OverviewCard title="Water Quality" value={overview.average.water_quality_avg} unit="%" />
              <OverviewCard title="Water Volume" value={overview.average.water_volume_avg} unit="m³" />
              <OverviewCard title="Pressure" value={overview.average.pressure_avg} unit="PSI" />
              <OverviewCard title="Efficiency" value={overview.average.efficiency_avg} unit="%" />
            </div>

            {/* กราฟวงกลม */}
            <div className="bg-white shadow rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Average Distribution</h2>
              {overview.pieData.length > 0 && overview.pieData.some((d) => (d.value ?? 0) > 0) ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={overview.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      dataKey="value"
 label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {overview.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => safeNumberFormat(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center">ไม่มีข้อมูลสำหรับแสดงผล</p>
              )}
            </div>

            {/* กราฟแท่ง */}
            <div className="bg-white shadow rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Trends (Bar Chart)</h2>
              {overview.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={overview.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="water_quality_avg" fill="#3b82f6" name="Quality (%)" />
                    <Bar dataKey="water_volume_avg" fill="#10b981" name="Volume (m³)" />
                    <Bar dataKey="pressure_avg" fill="#f59e0b" name="Pressure (PSI)" />
                    <Bar dataKey="efficiency_avg" fill="#ef4444" name="Efficiency (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center">ไม่มีข้อมูล</p>
              )}
            </div>

            {/* กราฟเส้น */}
            <div className="bg-white shadow rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Trends (Line Chart)</h2>
              {overview.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={overview.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="water_quality_avg" stroke="#3b82f6" strokeWidth={2} name="Quality (%)" />
                    <Line type="monotone" dataKey="water_volume_avg" stroke="#10b981" strokeWidth={2} name="Volume (m³)" />
                    <Line type="monotone" dataKey="pressure_avg" stroke="#f59e0b" strokeWidth={2} name="Pressure (PSI)" />
                    <Line type="monotone" dataKey="efficiency_avg" stroke="#ef4444" strokeWidth={2} name="Efficiency (%)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center">ไม่มีข้อมูล</p>
              )}
            </div>

            {/* ตารางย้อนหลัง */}
            {overview.trends.length > 0 && (
              <div className="bg-white shadow rounded-xl p-6 overflow-hidden">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">ตารางข้อมูลย้อนหลัง</h2>

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-3 py-2 text-left font-normal">วันที่</th>
                        <th className="border px-3 py-2 text-left font-normal">คุณภาพน้ำ (%)</th>
                        <th className="border px-3 py-2 text-left font-normal">ปริมาณน้ำ (m³)</th>
                        <th className="border px-3 py-2 text-left font-normal">แรงดัน (PSI)</th>
                        <th className="border px-3 py-2 text-left font-normal">ประสิทธิภาพ (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.map((row, i) => (
                        <tr key={i} className="text-center">
                          <td className="border px-3 py-1 text-left">{row.date}</td>
                          <td className="border px-3 py-1 text-left">{safeNumberFormat(row.water_quality_avg)}</td>
                          <td className="border px-3 py-1 text-left">{safeNumberFormat(row.water_volume_avg)}</td>
                          <td className="border px-3 py-1 text-left">{safeNumberFormat(row.pressure_avg)}</td>
                          <td className="border px-3 py-1 text-left">{safeNumberFormat(row.efficiency_avg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {currentRows.map((row, i) => (
                    <div key={i} className="border rounded-lg p-4 shadow-sm bg-gray-50">
                      <p className="text-sm text-gray-600"><span className="font-semibold">วันที่:</span> {row.date}</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">คุณภาพน้ำ:</span> {safeNumberFormat(row.water_quality_avg)} %</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">ปริมาณน้ำ:</span> {safeNumberFormat(row.water_volume_avg)} m³</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">แรงดัน:</span> {safeNumberFormat(row.pressure_avg)} PSI</p>
                      <p className="text-sm text-gray-600"><span className="font-semibold">ประสิทธิภาพ:</span> {safeNumberFormat(row.efficiency_avg)} %</p>
                    </div>
                  ))}
                </div>

                {/* Pagination + Dropdown */}
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-3">
                  {/* Dropdown เลือกจำนวนแถว */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="rowsPerPage" className="text-gray-600 text-sm">แถวต่อหน้า:</label>
                    <select
                      id="rowsPerPage"
                      value={rowsPerPage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "all") {
                          setRowsPerPage("all");
                        } else {
                          const num = Number(value);
                          setRowsPerPage([10, 20, 50].includes(num) ? num : 10);
                        }
                        setCurrentPage(1);
                      }}
                      className="p-1 border border-gray-300 rounded"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value="all">ทั้งหมด</option>
                    </select>
                  </div>

                  {/* Pagination */}
                  {rowsPerPage !== "all" && (
                    <div className="flex items-center gap-2">
                      <button
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        ⏮ หน้าแรก
                      </button>
                      <button
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                      >
                        ◀ ก่อนหน้า
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded ${currentPage === page ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                      >
                        ถัดไป ▶
                      </button>
                      <button
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        หน้าสุดท้าย ⏭
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  
  );
}
