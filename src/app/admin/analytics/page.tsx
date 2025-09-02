"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

import * as XLSX from "xlsx";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function OverviewPage() {
  const [overview, setOverview] = useState<any>({
    average: {},
    trends: [],
    pieData: []
  });

  const [districts, setDistricts] = useState<{ district_id: string, district_name: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // โหลดเขต
  useEffect(() => {
    fetch("http://localhost:3000/api/districts")
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(err => console.error("Error fetching districts:", err));
  }, []);

  // โหลด overview
  useEffect(() => {
    const url = new URL("http://localhost:3000/api/admin/overview");
    if (selectedDistrict) url.searchParams.append("districtId", selectedDistrict);

    if (dateRange === "today") {
      url.searchParams.append("range", "today");
    } else if (dateRange === "7d") {
      url.searchParams.append("range", "7d");
    } else if (dateRange === "30d") {
      url.searchParams.append("range", "30d");
    } else if (dateRange === "single" && selectedDate) {
      const d = new Date(selectedDate);
      const onlyDate =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");
      url.searchParams.append("date", onlyDate);
    }

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => setOverview(data))
      .catch((err) => console.error("Error fetching overview:", err));
  }, [selectedDistrict, dateRange, selectedDate]);

  // ฟังก์ชัน Export Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(overview.trends);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trends");
    XLSX.writeFile(workbook, "water_dashboard.xlsx");
  };

  // ฟังก์ชัน Export Image (PNG)
  const exportToImage = () => {
    const node = document.getElementById("dashboard");
    if (!node) return;
    htmlToImage.toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = "water_dashboard.png";
      link.href = dataUrl;
      link.click();
    });
  };

  // ฟังก์ชัน Export PDF
  const exportToPDF = () => {
    const node = document.getElementById("dashboard");
    if (!node) return;
    htmlToImage.toPng(node).then((dataUrl) => {
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("water_dashboard.pdf");
    });
  };

  // Pagination logic
  const totalPages = Math.ceil((overview.trends?.length ?? 0) / rowsPerPage);
  const currentRows = overview.trends.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div id="dashboard" className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">💧 Water Dashboard Overview</h1>

      {/* ปุ่ม Export */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
        >
          📊 Export Excel
        </button>
        <button
          onClick={exportToImage}
          className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
        >
          🖼 Export Image
        </button>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600"
        >
          📑 Export PDF
        </button>
      </div>

      {/* ฟิลเตอร์ */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="text-gray-600">เลือกเขต:</label>
        <select className="bg-gray-100 p-2 rounded" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)}>
          <option value="">ทั้งหมด</option>
          {districts.map(d => (
            <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
          ))}
        </select>

        <label className="text-gray-600">ช่วงเวลา:</label>
        <select className="bg-gray-100 p-2 rounded" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="today">ปัจจุบัน</option>
          <option value="7d">ย้อนหลัง 7 วัน</option>
          <option value="30d">ย้อนหลัง 30 วัน</option>
          <option value="single">เฉพาะวัน</option>
        </select>

        {dateRange === "single" && (
          <input
            type="date"
            className="p-2 border rounded"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        )}
      </div>

      {/* การ์ดค่าเฉลี่ย */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OverviewCard title="Water Quality" value={overview?.average?.water_quality_avg ?? 0} unit="%" />
        <OverviewCard title="Water Volume" value={overview?.average?.water_volume_avg ?? 0} unit="m³" />
        <OverviewCard title="Pressure" value={overview?.average?.pressure_avg ?? 0} unit="PSI" />
        <OverviewCard title="Efficiency" value={overview?.average?.efficiency_avg ?? 0} unit="%" />
      </div>

      {/* กราฟวงกลม */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Average Distribution</h2>
        {overview?.pieData?.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overview.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name ?? ''} ${(percent ? (percent * 100).toFixed(0) : 0)}%`
                }
              >
                {overview.pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center">ไม่มีข้อมูลสำหรับแสดงผล</p>
        )}
      </div>

      {/* กราฟแท่ง */}
      <div id="barChart" className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Trends (Bar Chart)</h2>
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
      </div>

      {/* กราฟเส้น */}
      <div id="lineChart" className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Trends (Line Chart)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={overview.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="water_quality_avg" stroke="#3b82f6" name="Quality (%)" />
            <Line type="monotone" dataKey="water_volume_avg" stroke="#10b981" name="Volume (m³)" />
            <Line type="monotone" dataKey="pressure_avg" stroke="#f59e0b" name="Pressure (PSI)" />
            <Line type="monotone" dataKey="efficiency_avg" stroke="#ef4444" name="Efficiency (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ตารางย้อนหลัง */}
      {overview.trends.length > 0 && (
        <div className="bg-white shadow rounded-xl p-6 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">📊 ตารางข้อมูลย้อนหลัง</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 text-sm">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold border-b">วันที่</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">คุณภาพน้ำ (%)</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">ปริมาณน้ำ (m³)</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">แรงดัน (PSI)</th>
                  <th className="px-3 py-2 text-left font-semibold border-b">ประสิทธิภาพ (%)</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row: any, i: number) => (
                  <tr
                    key={i}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                  >
                    <td className="px-3 py-2 border-b">
                      {new Date(row.date).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 border-b">{Number(row.water_quality_avg ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b">{Number(row.water_volume_avg ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b">{Number(row.pressure_avg ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2 border-b">{Number(row.efficiency_avg ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              ◀ ก่อนหน้า
            </button>
            <span className="text-sm text-gray-600">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              ถัดไป ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">
        {value !== undefined && value !== null ? value.toFixed(2) : "--"}
        <span className="text-lg">{unit}</span>
      </p>
    </div>
  );
}
