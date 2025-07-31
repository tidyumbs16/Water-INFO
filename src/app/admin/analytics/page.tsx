'use client'; // This component needs to be a Client Component for interactivity and hooks.

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
// Import Lucide React icons. Ensure you have 'lucide-react' installed: npm install lucide-react
import { BarChart3, Users, TrendingUp, Activity, Bell, Settings, Calendar, Download, Info, Trash2, KeyRound, CheckCircle } from 'lucide-react';

// --- Interfaces สำหรับข้อมูลที่คาดว่าจะได้รับจาก API ---
// (คุณควรปรับให้ตรงกับโครงสร้างข้อมูลจริงจาก Backend ของคุณ)

interface OverviewStats {
  totalUsers: number;
  revenue: number;
  conversion: number;
  growth: number;
}

interface MonthlyChartData {
  name: string; // เช่น 'Jan', 'Feb'
  users: number;
  revenue: number;
}

interface DeviceUsageData {
  name: string;  // เช่น 'Desktop', 'Mobile'
  value: number; // เปอร์เซ็นต์หรือจำนวน
  color: string; // สีสำหรับ Pie Chart
}

interface ChartData {
  monthlyData: MonthlyChartData[];
  deviceUsage: DeviceUsageData[];
}

interface ActivityItem {
  icon: string; // ชื่อ icon เป็น string (จะถูก map ไปยัง LucideReact component)
  text: string;
  time: string;
  color: string; // Tailwind CSS background color class
}

// --- Main AnalyticsDashboard Component ---
const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [animatedValues, setAnimatedValues] = useState<OverviewStats>({
    totalUsers: 0,
    revenue: 0,
    conversion: 0,
    growth: 0
  });
  const [chartData, setChartData] = useState<MonthlyChartData[]>([]);
  const [pieData, setPieData] = useState<DeviceUsageData[]>([]);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map string icon names to actual LucideReact components
  const iconMap: { [key: string]: React.ElementType } = {
    BarChart3: BarChart3,
    Users: Users,
    TrendingUp: TrendingUp,
    Activity: Activity,
    Bell: Bell,
    Settings: Settings,
    Calendar: Calendar,
    Download: Download,
    Info: Info,
    Trash2: Trash2,
    KeyRound: KeyRound,
    CheckCircle: CheckCircle
  };

  // Data Fetching and Animated Counter Effect
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken'); // Get JWT token from localStorage

        if (!token) {
          setError("ไม่พบ JWT Token โปรดเข้าสู่ระบบใหม่");
          setIsLoading(false);
          return;
        }

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        // --- REAL API CALLS ---
        const [statsResponse, chartsResponse, activityResponse] = await Promise.all([
          fetch('/api/analytics/overview', { headers }).then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          }),
          fetch('/api/analytics/charts', { headers }).then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          }),
          fetch('/api/analytics/activity', { headers }).then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
        ]);

        setOverviewStats(statsResponse);
        setChartData(chartsResponse.monthlyData);
        setPieData(chartsResponse.deviceUsage);
        setActivityData(activityResponse);

        // Start animated counter with fetched targets
        const targets = {
          totalUsers: statsResponse.totalUsers,
          revenue: statsResponse.revenue,
          conversion: statsResponse.conversion,
          growth: statsResponse.growth
        };

        const duration = 1500; // Animation duration in ms
        const steps = 60;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          const easeOut = 1 - Math.pow(1 - progress, 3); // Easing function

          setAnimatedValues({
            totalUsers: Math.floor(targets.totalUsers * easeOut),
            revenue: Math.floor(targets.revenue * easeOut),
            conversion: Number((targets.conversion * easeOut).toFixed(1)),
            growth: Number((targets.growth * easeOut).toFixed(1))
          });

          if (currentStep >= steps) {
            clearInterval(timer);
            // Ensure final values are exactly the targets
            setAnimatedValues(targets);
          }
        }, stepDuration);

        return () => clearInterval(timer); // Cleanup on unmount
      } catch (err: any) {
        console.error("Failed to fetch analytics data:", err);
        setError(`ไม่สามารถโหลดข้อมูลวิเคราะห์ได้: ${err.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
        // Optionally, redirect to login if it's an auth error
        if (err.message.includes('401') || err.message.includes('403')) {
          // You might want to clear token and redirect to login page
          // localStorage.removeItem('jwt_token');
          // window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []); // Empty dependency array to run once on component mount

  // Prepare stats array using fetched overviewStats
  const stats = overviewStats ? [
    {
      icon: iconMap.Users,
      value: animatedValues.totalUsers.toLocaleString(),
      label: 'Total Users',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50'
    },
    {
      icon: iconMap.TrendingUp,
      value: `$${animatedValues.revenue.toLocaleString()}`,
      label: 'Revenue',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    {
      icon: iconMap.Activity,
      value: `${animatedValues.conversion}%`,
      label: 'Conversion Rate',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    {
      icon: iconMap.BarChart3,
      value: `+${animatedValues.growth}%`,
      label: 'Growth',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50'
    }
  ] : [];


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="text-xl text-indigo-700 font-semibold">กำลังโหลดข้อมูลวิเคราะห์...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-xl border border-red-200">
          <Info className="w-12 h-12 text-red-500" />
          <p className="text-xl text-red-700 font-semibold text-center">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()} // Simple reload to re-attempt fetch
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  วิเคราะห์ข้อมูล
                </h1>
                <p className="text-sm text-gray-600">Analytics Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-1 w-fit">
          {['overview', 'analytics', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-white shadow-lg text-indigo-600 transform scale-105'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon; // Get the actual LucideReact component
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <div className="flex space-x-2">
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Feed */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {activityData.map((item, index) => {
                const ActivityIcon = iconMap[item.icon]; // Get the actual LucideReact component
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/60 transition-colors cursor-pointer">
                    <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center`}>
                      {ActivityIcon && <ActivityIcon className="w-5 h-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Users</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="users" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Device Usage</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-6 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
