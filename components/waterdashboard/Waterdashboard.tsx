"use client"
import React, { useState, useEffect } from 'react';
import { Droplets, TrendingUp, TrendingDown, Minus, Activity, Beaker, CloudRain, AlertTriangle, Zap, Target, ChevronDown, MapPin, Thermometer } from 'lucide-react';

// Interfaces for data structures (Unchanged)
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number | null;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'critical';
  animationDelay?: string;
}

interface District {
  id: string;
  name: string;
}

interface WaterData {
  district_id: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number;
  volume_trend: number;
  pressure_trend: number;
  efficiency_trend: number;
  created_at: string;
  date: string;
}

// MetricCard Component (Unchanged, it's already robust)
const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, trend, icon, status, animationDelay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), parseInt(animationDelay || '0'));
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const statusColors = {
    good: 'from-emerald-500/20 to-cyan-500/20 border-emerald-400/30',
    warning: 'from-amber-500/20 to-orange-500/20 border-amber-400/30',
    critical: 'from-red-500/20 to-pink-500/20 border-red-400/30'
  };

  const iconColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    critical: 'text-red-400'
  };

  const trendIcon = trend === null || trend === 0 ?
    <Minus className="w-4 h-4 text-slate-400" /> :
    (typeof trend === 'number' && trend > 0) ?
    <TrendingUp className="w-4 h-4 text-emerald-400" /> :
    <TrendingDown className="w-4 h-4 text-red-400" />;

  return (
    <div className={`relative overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-700 transform hover:scale-105 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    } ${statusColors[status]} group`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 opacity-90"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative p-8">
        <div className="flex items-start justify-between mb-6">
          <div className={`p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 ${iconColors[status]}`}>
            {icon}
          </div>
          {status === 'critical' && (
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-slate-300 text-sm font-medium tracking-wide uppercase">{title}</h3>

          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-black text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {unit && <span className="text-slate-400 text-lg font-medium">{unit}</span>}
          </div>

          {trend !== null && (
            <div className="flex items-center space-x-2 text-sm">
              {trendIcon}
              <span className={`font-semibold ${
                trend === 0 ? 'text-slate-400' :
                (trend ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {trend === 0 ? 'คงที่' : `${Math.abs(trend ?? 0)}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// === MAIN DASHBOARD COMPONENT (REFACTORED) ===
const ModernWaterDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDistrict, setSelectedDistrict] = useState<string>(''); // เริ่มต้นเป็นค่าว่าง
  const [isLoading, setIsLoading] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [waterData, setWaterData] = useState<WaterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // **สำคัญ:** ตรวจสอบว่า URL ของ Backend API ถูกต้อง
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. ดึงข้อมูลเขตทั้งหมดเมื่อ Component โหลดครั้งแรก
  useEffect(() => {
    const fetchDistricts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching districts...');
        const response = await fetch(`${API_BASE_URL}/districts`);
        if (!response.ok) {
          throw new Error(`ไม่สามารถโหลดข้อมูลเขตได้ (Status: ${response.status})`);
        }
        const data: District[] = await response.json();
        console.log('Districts loaded:', data);
        setDistricts(data);

        // ถ้ามีข้อมูลเขต ให้เลือกเขตแรกเป็นค่าเริ่มต้น
        if (data.length > 0) {
          setSelectedDistrict(data[0].id);
        } else {
          // กรณีไม่มีข้อมูลเขตเลย
          throw new Error('ไม่พบข้อมูลเขตในระบบ');
        }

      } catch (err: any) {
        console.error('Error fetching districts:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        setDistricts([]); // เคลียร์ข้อมูลเขตเมื่อเกิด error
      } finally {
        setIsLoading(false);
      }
    };
    fetchDistricts();
  }, []); // <-- Dependency array ว่าง หมายถึงให้ทำงานครั้งเดียว




  // 2. ดึงข้อมูลน้ำของเขตที่เลือก
  useEffect(() => {
    const fetchWaterData = async (districtId: string) => {
      // ไม่ต้อง fetch ถ้าไม่มี districtId
      if (!districtId) return;

      setIsLoading(true);
      setError(null); // เคลียร์ error เก่าทุกครั้งที่พยายามโหลดใหม่
      try {
        console.log(`Fetching water data for district: ${districtId}`);
        const response = await fetch(`${API_BASE_URL}/water-data/${districtId}`);
        if (!response.ok) {
          throw new Error(`ไม่สามารถโหลดข้อมูลน้ำของเขตนี้ได้ (Status: ${response.status})`);
        }
        const data: WaterData = await response.json();
        console.log('Water data loaded:', data);
        setWaterData(data);
      } catch (err: any) {
        console.error('Error fetching water data:', err);
        setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลน้ำ');
        setWaterData(null); // **สำคัญ:** เคลียร์ข้อมูลน้ำเมื่อเกิด error
      } finally {
        setIsLoading(false);
      }
    };





    fetchWaterData(selectedDistrict);
    
    // ตั้งค่า auto-refresh ทุก 30 วินาที
    const interval = setInterval(() => {
        fetchWaterData(selectedDistrict);
    }, 30000);

    return () => clearInterval(interval); // Cleanup เมื่อ component unmount หรือ district เปลี่ยน

  }, [selectedDistrict]); // <-- ทำงานซ้ำทุกครั้งที่ `selectedDistrict` เปลี่ยน

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
  };

  // --- ส่วนของการแสดงผล (Render Logic) ---

  const selectedDistrictName = districts.find(d => d.id === selectedDistrict)?.name || '';

  // 1. สถานะ Loading (ตอนโหลดครั้งแรกสุด)
  if (isLoading && !districts.length && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">กำลังโหลดข้อมูลระบบ...</p>
        </div>
      </div>
    );
  }
  
  // 2. สถานะ Error (เมื่อโหลดข้อมูลพื้นฐานไม่ได้เลย)
  if (error && !districts.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  //ห้ามยุ่งกับส่วนนี้ //
  // ฟังก์ชันคำนวณสถานะและข้อมูล (ไม่มีการเปลี่ยนแปลง)
  const getStatus = (type: string, value: number): 'good' | 'warning' | 'critical' => {
    switch (type) {
      case 'water_volume': return value < 100000 ? 'critical' : value < 300000 ? 'warning' : 'good';
      case 'water_quality': return value < 6.5 || value > 8.5 ? 'critical' : value < 7.0 || value > 8.0 ? 'warning' : 'good';
      case 'pressure': return value < 35 ? 'critical' : value < 40 ? 'warning' : 'good';
      case 'efficiency': return value < 90 ? 'critical' : value < 95 ? 'warning' : 'good';
      default: return 'good';
    }
  };

  const metrics = waterData ? (() => {
    const waterQualityValue = typeof waterData.water_quality === 'number'
      ? waterData.water_quality
      : (typeof waterData.water_quality === 'string' && !isNaN(parseFloat(waterData.water_quality)))
        ? parseFloat(waterData.water_quality)
        : 0;

    const pressureValue = typeof waterData.pressure === 'number'
      ? waterData.pressure
      : (typeof waterData.pressure === 'string' && !isNaN(parseFloat(waterData.pressure)))
        ? parseFloat(waterData.pressure)
        : 0;

    const efficiencyValue = typeof waterData.efficiency === 'number'
      ? waterData.efficiency
      : (typeof waterData.efficiency === 'string' && !isNaN(parseFloat(waterData.efficiency)))
        ? parseFloat(waterData.efficiency)
        : 0;

    return [
      { id: 1, title: "ปริมาณน้ำในระบบ", value: Math.round(waterData.water_volume / 1000), unit: "พันลิตร", trend: waterData.volume_trend, icon: <Droplets className="w-8 h-8" />, status: getStatus('water_volume', waterData.water_volume) },
      { id: 2, title: "ประสิทธิภาพระบบ", value: efficiencyValue, unit: "%", trend: waterData.efficiency_trend, icon: <Activity className="w-8 h-8" />, status: getStatus('efficiency', efficiencyValue) },
      { id: 3, title: "คุณภาพน้ำ pH", value: waterQualityValue.toFixed(2), unit: "", trend: waterData.quality_trend, icon: <Beaker className="w-8 h-8" />, status: getStatus('water_quality', waterQualityValue) },
      { id: 4, title: "ฝนตกประมาณ", value: Math.max(0, (waterData.volume_trend || 0) * 10).toFixed(1), unit: "มม.", trend: (waterData.volume_trend || 0) > 0 ? 15 : ((waterData.volume_trend || 0) < 0 ? -5 : 0), icon: <CloudRain className="w-8 h-8" />, status: (Math.max(0, (waterData.volume_trend || 0) * 10)) > 50 ? 'good' : 'good' },
      { id: 5, title: "ความดันระบบ", value: pressureValue.toFixed(2), unit: "บาร์", trend: waterData.pressure_trend, icon: <Target className="w-8 h-8" />, status: getStatus('pressure', pressureValue) },
      { id: 6, title: "การใช้พลังงาน", value: Math.round(100 - efficiencyValue), unit: "kWh", trend: -(waterData.efficiency_trend || 0), icon: <Zap className="w-8 h-8" />, status: getStatus('efficiency', 100 - efficiencyValue) },
    ];
  })() : [];

//ห้ามยุ่งกับส่วนนี้ //


  const criticalCount = metrics.filter(m => m.status === 'critical').length;
  const warningCount = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Background and Grid Overlay (Unchanged) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header (Unchanged) */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-400/30">
              <Droplets className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              AquaFlow
            </h1>
          </div>
          <p className="text-2xl text-slate-400 font-light">ระบบจัดการน้ำอัจฉริยะ</p>
          <div className="mt-4 text-slate-500">
            <span className="text-sm">อัปเดตล่าสุด: </span>
            <span className="text-cyan-400 font-mono">
              {currentTime.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}
            </span>
          </div>
        </div>
        
        {/* District Selector */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-cyan-400" />
            </div>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-300 appearance-none cursor-pointer"
              disabled={isLoading || !districts.length}
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id} className="bg-slate-800 text-white">
                  {district.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
          </div>
        </div>

        {/* --- Data Display Area --- */}
        {isLoading && !waterData && (
          <div className="text-center text-slate-400">กำลังโหลดข้อมูลสำหรับ {selectedDistrictName}...</div>
        )}

        {error && !waterData && (
           <div className="max-w-2xl mx-auto bg-red-900/50 border border-red-500/50 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">ไม่สามารถแสดงข้อมูลได้</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {waterData && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  {...metric as MetricCardProps}
                  animationDelay={`${index * 100}ms`}
                />
              ))}
            </div>

            {/* Status Bar */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${criticalCount > 0 ? 'bg-red-400' : warningCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                  <span className="text-slate-300 font-medium">
                    {criticalCount > 0 ? `พบปัญหาวิกฤต ${criticalCount} รายการ` : warningCount > 0 ? `พบการเตือน ${warningCount} รายการ` : 'ระบบทำงานปกติ'}
                  </span>
                </div>
                {/* Legend (Unchanged) */}
                 <div className="flex items-center space-x-6 text-sm text-slate-400">
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-emerald-400 rounded-full"></div><span>ปกติ</span></div>
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-amber-400 rounded-full"></div><span>ระวัง</span></div>
                    <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-red-400 rounded-full"></div><span>วิกฤต</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModernWaterDashboard;