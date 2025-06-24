'use client'
import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Waves, Droplet, BarChart3, TrendingUp } from 'lucide-react';
import StatCard from '../../components/waterdashboard/StatCard';
import WaterChart from '../../components/waterdashboard/WaterChart';

const WaterDashboard = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const districts = [
    { id: 'all', name: 'ทุกเขตประปา' },
    { id: 'district1', name: 'เขตประปาที่ 1 - กรุงเทพเหนือ' },
    { id: 'district2', name: 'เขตประปาที่ 2 - กรุงเทพใต้' },
    { id: 'district3', name: 'เขตประปาที่ 3 - ธนบุรี' },
    { id: 'district4', name: 'เขตประปาที่ 4 - นนทบุรี' },
    { id: 'district5', name: 'เขตประปาที่ 5 - ปทุมธานี' },
    { id: 'district6', name: 'เขตประปาที่ 6 - สมุทรปราการ' },
  ];

  // Enhanced mockup data with more realistic values
  const getDistrictData = (districtId: string) => {
    const mockupData = {
      all: { 
        waterQuality: 8.2, 
        waterVolume: 2850000, 
        pressure: 42, 
        efficiency: 94.5,
        qualityTrend: 0.3,
        volumeTrend: 5.2,
        pressureTrend: 1.8,
        efficiencyTrend: 2.1
      },
      district1: { 
        waterQuality: 8.4, 
        waterVolume: 480000, 
        pressure: 45, 
        efficiency: 96.2,
        qualityTrend: 0.5,
        volumeTrend: 7.3,
        pressureTrend: 3.2,
        efficiencyTrend: 3.1
      },
      district2: { 
        waterQuality: 8.1, 
        waterVolume: 520000, 
        pressure: 41, 
        efficiency: 93.8,
        qualityTrend: -0.2,
        volumeTrend: 4.1,
        pressureTrend: 0.5,
        efficiencyTrend: 1.8
      },
      district3: { 
        waterQuality: 8.3, 
        waterVolume: 390000, 
        pressure: 43, 
        efficiency: 95.1,
        qualityTrend: 0.4,
        volumeTrend: 6.8,
        pressureTrend: 2.1,
        efficiencyTrend: 2.9
      },
      district4: { 
        waterQuality: 8.0, 
        waterVolume: 450000, 
        pressure: 40, 
        efficiency: 92.5,
        qualityTrend: -0.1,
        volumeTrend: 3.2,
        pressureTrend: -0.8,
        efficiencyTrend: 1.2
      },
      district5: { 
        waterQuality: 8.2, 
        waterVolume: 510000, 
        pressure: 44, 
        efficiency: 94.8,
        qualityTrend: 0.2,
        volumeTrend: 5.9,
        pressureTrend: 2.5,
        efficiencyTrend: 2.4
      },
      district6: { 
        waterQuality: 8.1, 
        waterVolume: 500000, 
        pressure: 42, 
        efficiency: 93.2,
        qualityTrend: 0.1,
        volumeTrend: 4.7,
        pressureTrend: 1.3,
        efficiencyTrend: 1.9
      },
    };

    return mockupData[districtId as keyof typeof mockupData] || mockupData.all;
  };

  const currentData = getDistrictData(selectedDistrict);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="water-gradient p-3 rounded-full">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
              ระบบติดตามคุณภาพน้ำประปา
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            แสดงข้อมูลคุณภาพน้ำและสถิติการใช้งานแบบเรียลไทม์จากเขตประปาต่างๆ ในกรุงเทพมหานครและปริมณฑล
          </p>
        </div>

        {/* District Selector */}
        <Card className="glass-effect shadow-xl border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                เลือกเขตประปา:
              </label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="md:w-80 bg-white/50 border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="เลือกเขตประปา" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-blue-200">
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id} className="hover:bg-blue-50">
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="คุณภาพน้ำ"
            value={`${currentData.waterQuality}/10`}
            unit="คะแนน"
            icon={<Droplet className="h-6 w-6" />}
            trend={currentData.qualityTrend}
            className="from-blue-500 to-cyan-500"
          />
          <StatCard
            title="ปริมาณน้ำ"
            value={`${(currentData.waterVolume / 1000000).toFixed(1)}M`}
            unit="ลิตร/วัน"
            icon={<Waves className="h-6 w-6" />}
            trend={currentData.volumeTrend}
            className="from-cyan-500 to-teal-500"
          />
          <StatCard
            title="ความดันน้ำ"
            value={currentData.pressure.toString()}
            unit="PSI"
            icon={<TrendingUp className="h-6 w-6" />}
            trend={currentData.pressureTrend}
            className="from-teal-500 to-green-500"
          />
          <StatCard
            title="ประสิทธิภาพ"
            value={currentData.efficiency.toString()}
            unit="%"
            icon={<BarChart3 className="h-6 w-6" />}
            trend={currentData.efficiencyTrend}
            className="from-green-500 to-emerald-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WaterChart
            title="คุณภาพน้ำรายสัปดาห์"
            type="area"
            districtId={selectedDistrict}
          />
          <WaterChart
            title="ปริมาณการใช้น้ำรายวัน"
            type="bar"
            districtId={selectedDistrict}
          />
        </div>

        <WaterChart
          title="สถิติประจำเดือน - ภาพรวมทั้งหมด"
          type="line"
          districtId={selectedDistrict}
          fullWidth
        />
      </div>
    </div>
  );
};

export default WaterDashboard;
