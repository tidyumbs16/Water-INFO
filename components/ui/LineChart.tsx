'use client'; // This component needs to be a Client Component to use recharts.

import React from 'react';
import {
  LineChart as RechartsLineChart, // Rename to avoid conflict with our component name
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interface for the data that the LineChart expects.
// Assuming data points have a 'date' (for X-axis) and a 'value' (for Y-axis).
interface ChartDataPoint {
  date: string; // The date string (e.g., '2025-06-24')
  value: number; // The numeric value for the metric
}

// Props for the LineChart component.
interface LineChartProps {
  data: ChartDataPoint[]; // Array of data points to display.
  title: string;          // Title of the chart.
  dataKey: string;        // The key in ChartDataPoint for the X-axis (e.g., 'date').
  valueKey: string;       // The key in ChartDataPoint for the Y-axis (e.g., 'value').
  yAxisLabel?: string;    // Optional label for the Y-axis.
  lineColor?: string;     // Optional color for the line (default is '#8884d8').
}

/**
 * @function LineChart
 * @description A reusable Line Chart component using Recharts library.
 * It displays a single line representing a trend over time (or any category).
 *
 * @param {LineChartProps} props - The properties for the LineChart.
 * @returns {JSX.Element} A responsive Line Chart.
 */
export default function LineChart({
  data,
  title,
  dataKey,
  valueKey,
  yAxisLabel,
  lineColor = '#8884d8', // Default line color
}: LineChartProps) {
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
      <ResponsiveContainer width="100%" height="85%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /> {/* Dotted grid lines */}
          <XAxis dataKey={dataKey} /> {/* X-axis for date/category */}
          <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} /> {/* Y-axis with optional label */}
          <Tooltip cursor={{ strokeDasharray: '3 3' }} /> {/* Shows data on hover */}
          <Legend /> {/* Displays legend for the line */}
          <Line
            type="monotone" // Smooth curve
            dataKey={valueKey} // The value to plot on Y-axis
            stroke={lineColor} // Line color
            activeDot={{ r: 8 }} // Larger dot on hover
            strokeWidth={2} // Line thickness
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
