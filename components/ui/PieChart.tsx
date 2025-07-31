'use client'; // This component needs to be a Client Component to use recharts.

import React from 'react';
import {
  PieChart as RechartsPieChart, // Rename to avoid conflict with our component name
  Pie,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interface for the data that the PieChart expects.
// It should have a key for the name (label) and a key for the value.
interface ChartDataPoint {
  [key: string]: string | number; // Flexible type for name and value keys.
}

// Props for the PieChart component.
interface PieChartProps {
  data: ChartDataPoint[]; // Array of data points to display.
  title: string;          // Title of the chart.
  nameKey: string;        // The key in ChartDataPoint for the slice name (e.g., 'district_name').
  valueKey: string;       // The key in ChartDataPoint for the slice value (e.g., 'water_volume').
  colors?: string[];      // Optional array of colors for the pie slices.
}

// Default colors for the pie chart if not provided.
const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

/**
 * @function PieChart
 * @description A reusable Pie Chart component using Recharts library.
 * It displays data as a pie chart, showing proportions of a whole.
 *
 * @param {PieChartProps} props - The properties for the PieChart.
 * @returns {JSX.Element} A responsive Pie Chart.
 */
export default function PieChart({
  data,
  title,
  nameKey,
  valueKey,
  colors = DEFAULT_COLORS, // Use default colors if not provided
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>ไม่มีข้อมูลสำหรับกราฟนี้</p>
      </div>
    );
  }

  // Custom Tooltip content to show name, value, and percentage.
  // This function is passed to the Tooltip component's content prop.
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const total = data.reduce((sum, entry) => sum + (entry[valueKey] as number), 0);
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(2) : 0;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md text-sm">
          <p className="font-bold text-gray-900">{item.name}</p>
          <p className="text-gray-700">{`${item.valueKey}: ${item.value.toLocaleString()}`}</p>
          <p className="text-gray-700">{`Percentage: ${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full p-4">
      <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%" // Center X position
            cy="50%" // Center Y position
            labelLine={false} // Hide lines connecting labels to slices
            outerRadius={80} // Outer radius of the pie
            fill="#8884d8" // Fallback fill color
            dataKey={valueKey} // Key for the value of each slice
            nameKey={nameKey} // Key for the name/label of each slice
            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} // Label with name and percentage
          >
            {/* Map over data to assign a color to each slice */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} /> {/* Use the custom tooltip */}
          <Legend /> {/* Displays the legend for slices */}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
