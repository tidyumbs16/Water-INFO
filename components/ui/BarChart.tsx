'use client'; // This component needs to be a Client Component to use recharts.

import React from 'react';
import {
  BarChart as RechartsBarChart, // Rename to avoid conflict with our component name
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interface for the data that the BarChart expects.
// It should have a key for the category (e.g., 'name') and a key for the value (e.g., 'value').
interface ChartDataPoint {
  [key: string]: string | number; // Flexible type for category and value keys.
}

// Props for the BarChart component.
interface BarChartProps {
  data: ChartDataPoint[]; // Array of data points to display.
  title: string;          // Title of the chart.
  xAxisDataKey: string;   // The key in ChartDataPoint for the X-axis categories (e.g., 'district_name').
  barValueKey: string;    // The key in ChartDataPoint for the value of the bars (e.g., 'water_volume').
  yAxisLabel?: string;    // Optional label for the Y-axis.
  barColor?: string;      // Optional color for the bars (default is '#8884d8').
}

/**
 * @function BarChart
 * @description A reusable Bar Chart component using Recharts library.
 * It displays bars representing values for different categories.
 *
 * @param {BarChartProps} props - The properties for the BarChart.
 * @returns {JSX.Element} A responsive Bar Chart.
 */
export default function BarChart({
  data,
  title,
  xAxisDataKey,
  barValueKey,
  yAxisLabel,
  barColor = '#8884d8', // Default bar color
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>ไม่มีข้อมูลสำหรับกราฟนี้</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="95%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} /> {/* Lighter hover effect */}
          <Legend />
          <Bar dataKey={barValueKey} fill={barColor} /> {/* The main bar series */}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
