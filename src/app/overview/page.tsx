'use client';

import NavbarComponent from '@/components/navbar';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function OverviewPage() {
  const [overview, setOverview] = useState<any>({
    average: {
      water_quality_avg: 0,
      water_volume_avg: 0,
      pressure_avg: 0,
      efficiency_avg: 0
    },
    trends: [],
    pieData: []
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/overview')
      .then((res) => res.json())
      .then((data) => setOverview(data))
      .catch((err) => console.error('Error fetching overview:', err));
  }, []);

  return (
    <div className="p-6 space-y-6">
         <NavbarComponent />
      <h1 className="text-2xl font-bold">💧 Water Dashboard Overview</h1>

      {/* การ์ดแสดงค่าเฉลี่ย */}
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
              <Pie
                data={overview.pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent ?? 0).toFixed(0)}%`}
              >
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
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">7-Day Trends (Bar Chart)</h2>
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
      <div className="bg-white shadow rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">7-Day Trends (Line Chart)</h2>
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
