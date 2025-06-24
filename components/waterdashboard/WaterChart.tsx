import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AreaChart, BarChart, LineChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "../../lib/utils"

interface WaterChartProps {
  title: string;
  type: 'area' | 'bar' | 'line';
  districtId: string;
  fullWidth?: boolean;
}

const WaterChart = ({ title, type, districtId, fullWidth }: WaterChartProps) => {
  // Generate sample data based on district and chart type
  const generateData = () => {
    const baseData = [
      { name: 'จ.', value: 8.2, volume: 1200, pressure: 42 },
      { name: 'อ.', value: 8.1, volume: 1180, pressure: 41 },
      { name: 'พ.', value: 8.4, volume: 1220, pressure: 44 },
      { name: 'พฤ.', value: 8.3, volume: 1250, pressure: 43 },
      { name: 'ศ.', value: 8.0, volume: 1100, pressure: 40 },
      { name: 'ส.', value: 8.5, volume: 1300, pressure: 45 },
      { name: 'อา.', value: 8.2, volume: 1150, pressure: 42 },
    ];

    if (type === 'line') {
      return [
        { name: 'ม.ค.', quality: 8.1, volume: 1100, efficiency: 94 },
        { name: 'ก.พ.', quality: 8.3, volume: 1150, efficiency: 95 },
        { name: 'มี.ค.', quality: 8.2, volume: 1200, efficiency: 93 },
        { name: 'เม.ย.', quality: 8.4, volume: 1250, efficiency: 96 },
        { name: 'พ.ค.', quality: 8.0, volume: 1180, efficiency: 92 },
        { name: 'มิ.ย.', quality: 8.5, volume: 1300, efficiency: 97 },
      ];
    }

    // Modify data based on selected district
    if (districtId !== 'all') {
      return baseData.map(item => ({
        ...item,
        value: item.value + (Math.random() - 0.5) * 0.4,
        volume: item.volume + (Math.random() - 0.5) * 200,
        pressure: item.pressure + (Math.random() - 0.5) * 4,
      }));
    }

    return baseData;
  };

  const data = generateData();

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#06b6d4" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorQuality)" 
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Bar dataKey="volume" fill="url(#colorVolume)" radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                backdropFilter: 'blur(10px)'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="quality" 
              stroke="#1e40af" 
              strokeWidth={3}
              dot={{ fill: '#1e40af', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#1e40af', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="efficiency" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        );

      default:
        return <div />;
    }
  };

  return (
    <Card className={cn(
      "glass-effect shadow-xl border-0 hover:shadow-2xl transition-all duration-300",
      fullWidth && "lg:col-span-2"
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            type === 'area' && "bg-cyan-500",
            type === 'bar' && "bg-green-500", 
            type === 'line' && "bg-blue-500"
          )} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterChart;
