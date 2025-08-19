'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

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
      url.searchParams.append("date", new Date().toISOString().split("T")[0]);
    } else if (dateRange === "7d") {
      url.searchParams.append("range", "7d");
    } else if (dateRange === "30d") {
      url.searchParams.append("range", "30d");
    } else if (dateRange === "custom" && selectedDate) {
      url.searchParams.append("date", selectedDate);
    }

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => setOverview(data))
      .catch((err) => console.error("Error fetching overview:", err));
  }, [selectedDistrict, dateRange, selectedDate]);

  // ---------- Export Functions ----------
  const exportCSV = (data: any[], filename = "overview.csv") => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = (data: any[], filename = "overview.xlsx") => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Overview");
    XLSX.writeFile(workbook, filename);
  };

  const exportChartAsImage = (id: string, filename = "chart.png") => {
    const node = document.getElementById(id);
    if (!node) return;
    htmlToImage.toPng(node).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    });
  };

  const exportDashboardPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const dashboard = document.getElementById("dashboard");
    if (!dashboard) return;

    const imgData = await htmlToImage.toPng(dashboard);
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dashboard.pdf");
  };
  // --------------------------------------

  return (
    <div id="dashboard" className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">💧 Water Dashboard Overview</h1>

      {/* ปุ่ม Export */}
      <div className="flex gap-3 mb-4">
        <button onClick={() => exportCSV(overview.trends)} className="bg-blue-500 text-white px-3 py-2 rounded">📥 Export CSV</button>
        <button onClick={() => exportExcel(overview.trends)} className="bg-green-500 text-white px-3 py-2 rounded">📊 Export Excel</button>
        <button onClick={() => exportChartAsImage("lineChart", "line_chart.png")} className="bg-purple-500 text-white px-3 py-2 rounded">📸 Export Line Chart</button>
        <button onClick={exportDashboardPDF} className="bg-red-500 text-white px-3 py-2 rounded">📄 Export PDF</button>
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
          <option value="custom">เลือกวันเอง</option>
        </select>

        {dateRange === "custom" && (
          <input type="date" className="p-2 border rounded" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        )}
      </div>

      {/* การ์ดค่าเฉลี่ย */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OverviewCard title="Water Quality" value={overview?.average?.water_quality_avg ?? 0} unit="%" />
        <OverviewCard title="Water Volume" value={overview?.average?.water_volume_avg ?? 0} unit="%" />
        <OverviewCard title="Pressure" value={overview?.average?.pressure_avg ?? 0} unit="%" />
        <OverviewCard title="Efficiency" value={overview?.average?.efficiency_avg ?? 0} unit="%" />
      </div>

      {/* กราฟวงกลม */}
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Average Distribution</h2>
        {overview?.pieData?.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={overview.pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value"
                label={({ name, percent }) => `${name} ${(percent ?? 0).toFixed(0)}%`}>
                {overview.pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
            <Bar dataKey="water_volume_avg" fill="#10b981" name="Volume (%)" />
            <Bar dataKey="pressure_avg" fill="#f59e0b" name="Pressure (%)" />
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
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="water_quality_avg" stroke="#3b82f6" name="Quality (%)" />
            <Line type="monotone" dataKey="water_volume_avg" stroke="#10b981" name="Volume (%)" />
            <Line type="monotone" dataKey="pressure_avg" stroke="#f59e0b" name="Pressure (%)" />
            <Line type="monotone" dataKey="efficiency_avg" stroke="#ef4444" name="Efficiency (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, unit }: { title: string; value: number; unit: string }) {
  return (
    <div className="bg-white shadow rounded-xl p-4 text-center">
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">
        {value ?? '--'}<span className="text-lg">{unit}</span>
      </p>
    </div>
  );
}
