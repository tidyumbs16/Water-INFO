// AquaNextDashboard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Sensor, District } from '../../../../src/types/index';
import {
  Home,
  BarChart3,
  Users,
  Settings,
  Database,
  Bell,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
  Activity,
  TrendingUp,
  Zap,
  MoreVertical,
  Maximize2,
  RefreshCw,
  Download,
  Eye,
  Filter,
  BarChart, 
} from 'lucide-react';

const AquaNextDashboard: React.FC = () => {
  const [sensorData, setSensorData] = useState<Sensor[]>([]);
  // ปรับโครงสร้าง state สำหรับ district summary
  const [districtSummary, setDistrictSummary] = useState({
    totalDistricts: null as number | null,
    statusNormal: null as number | null,
    statusWarning: null as number | null,
    statusCritical: null as number | null,
  });
  // เพิ่ม state สำหรับ sensor summary
  const [sensorSummary, setSensorSummary] = useState({
    totalSensors: null as number | null,
    statusNormalActive: null as number | null,
    statusWarning: null as number | null,
    statusAbnormal: null as number | null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        setIsLoading(false);
        return;
      }

      // --- Fetch Sensor Data (สำหรับตารางด้านล่าง) ---
      console.log('AquaNextDashboard: Fetching sensor list data...');
      const sensorListResponse = await fetch('http://localhost:3001/api/sensors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (sensorListResponse.ok) {
        const sensorListDataFetched = await sensorListResponse.json();
        console.log('AquaNextDashboard: Sensor list data fetched successfully:', sensorListDataFetched);

        if (sensorListDataFetched.success && Array.isArray(sensorListDataFetched.data)) {
          const formattedData = sensorListDataFetched.data.map((sensor: Sensor) => ({
            ...sensor,
            last_update: sensor.last_update ? new Date(sensor.last_update).toLocaleString() : 'N/A'
          }));
          setSensorData(formattedData);
        } else {
            console.warn('AquaNextDashboard: Sensor list data format unexpected:', sensorListDataFetched);
            setSensorData([]);
        }

      } else {
        const errorData = await sensorListResponse.json();
        console.error('AquaNextDashboard: Error fetching sensor list data:', sensorListResponse.status, errorData);
        setError(errorData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลเซนเซอร์');
      }

      // --- Fetch Dashboard Summary Data (Districts & Sensors) ---
      console.log('AquaNextDashboard: Fetching dashboard summary data...');
      const summaryResponse = await fetch('http://localhost:3001/api/districts/summary', { // ยังคงเรียก API เดิม
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        console.log('AquaNextDashboard: Dashboard summary data fetched successfully:', summaryData);

        if (summaryData.success && summaryData.data) {
          // อัปเดต state สำหรับ districtSummary
          setDistrictSummary({
            totalDistricts: summaryData.data.districts.totalDistricts,
            statusNormal: summaryData.data.districts.statusNormal,
            statusWarning: summaryData.data.districts.statusWarning,
            statusCritical: summaryData.data.districts.statusCritical,
          });
          // อัปเดต state สำหรับ sensorSummary
          setSensorSummary({
            totalSensors: summaryData.data.sensors.totalSensors,
            statusNormalActive: summaryData.data.sensors.statusNormalActive,
            statusWarning: summaryData.data.sensors.statusWarning,
            statusAbnormal: summaryData.data.sensors.statusAbnormal,
          });
        } else {
          console.warn('AquaNextDashboard: Dashboard summary data format unexpected:', summaryData);
          setError(prev => prev ? `${prev} และข้อมูลสรุป Dashboard ไม่ถูกต้อง` : 'ข้อมูลสรุป Dashboard ไม่ถูกต้อง');
        }

      } else {
        const errorData = await summaryResponse.json();
        console.error('AquaNextDashboard: Error fetching dashboard summary:', summaryResponse.status, errorData);
        setError(prev => prev ? `${prev} และเกิดข้อผิดพลาดในการดึงข้อมูลสรุป Dashboard: ${errorData.message || ''}` : `เกิดข้อผิดพลาดในการดึงข้อมูลสรุป Dashboard: ${errorData.message || ''}`);
      }

    } catch (err: any) {
      console.error('AquaNextDashboard: Network or server error during data fetch:', err);
      setError(err.message || 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
      console.log('AquaNextDashboard: Finished data fetching process.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ... (getStatusColor, getStatusIcon, getStatusText functions เหมือนเดิม) ...
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-red-500';
      case 'offline': return 'bg-slate-500';
      case 'active': return 'bg-emerald-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'calibrating': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-400" />;
      case 'critical': return <XCircle size={16} className="text-red-400" />;
      case 'offline': return <Clock size={16} className="text-slate-400" />;
      case 'active': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'inactive': return <XCircle size={16} className="text-gray-400" />;
      case 'maintenance': return <Settings size={16} className="text-blue-400" />;
      case 'error': return <AlertCircle size={16} className="text-red-400" />;
      case 'calibrating': return <RefreshCw size={16} className="text-purple-400" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return 'ปกติ';
      case 'warning': return 'เตือน';
      case 'critical': return 'วิกฤต';
      case 'offline': return 'ออฟไลน์';
      case 'active': return 'ทำงาน';
      case 'inactive': return 'ไม่ทำงาน';
      case 'maintenance': return 'บำรุงรักษา';
      case 'error': return 'ข้อผิดพลาด';
      case 'calibrating': return 'กำลังสอบเทียบ';
      default: return 'ไม่ทราบ';
    }
  };


  return (
    <div className="flex-1 w-full">
      {/* Error Display */}
      {error && (
        <div className="flex items-center bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500 mb-4" />
          <span className="text-lg text-slate-600">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <>
          {/* Status Cards - Districts */}
          <h2 className="text-2xl font-bold text-slate-800 mb-4">ข้อมูลสรุปเขต</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Districts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-blue-500/10 border border-blue-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <MapPin className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{districtSummary.totalDistricts !== null ? districtSummary.totalDistricts : 'N/A'}</p>
                  <p className="text-sm text-slate-500">เขต</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-600">เขตทั้งหมด</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <TrendingUp size={14} className="mr-1" />
                <span>พื้นที่ครอบคลุม</span>
              </div>
            </div>

            {/* Normal Status - Districts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-emerald-500/10 border border-emerald-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{districtSummary.statusNormal !== null ? districtSummary.statusNormal : 'N/A'}</p>
                  <p className="text-sm text-slate-500">เขต</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-emerald-600">สถานะปกติ</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <Activity size={14} className="mr-1" />
                <span>เขตทำงานปกติ</span>
              </div>
            </div>

            {/* Warning Status - Districts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-amber-500/10 border border-amber-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <AlertTriangle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{districtSummary.statusWarning !== null ? districtSummary.statusWarning : 'N/A'}</p>
                  <p className="text-sm text-slate-500">เขต</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-amber-600">เขตต้องเฝ้าระวัง</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <Zap size={14} className="mr-1" />
                <span>ตรวจสอบแล้ว</span>
              </div>
            </div>

            {/* Critical Status - Districts */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-red-500/10 border border-red-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                  <XCircle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{districtSummary.statusCritical !== null ? districtSummary.statusCritical : 'N/A'}</p>
                  <p className="text-sm text-slate-500">เขต</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-600">เขตผิดปกติ</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <AlertTriangle size={14} className="mr-1" />
                <span>ต้องแก้ไขด่วน</span>
              </div>
            </div>
          </div>

          {/* Status Cards - Sensors */}
          <h2 className="text-2xl font-bold text-slate-800 mb-4 mt-8">ข้อมูลสรุปเซนเซอร์</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Sensors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-blue-500/10 border border-blue-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                  <BarChart className="text-white" size={24} /> {/* ใช้ BarChart icon */}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{sensorSummary.totalSensors !== null ? sensorSummary.totalSensors : 'N/A'}</p>
                  <p className="text-sm text-slate-500">จุด</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-600">เซนเซอร์ทั้งหมด</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <TrendingUp size={14} className="mr-1" />
                <span>จำนวนเซนเซอร์ที่ติดตั้ง</span>
              </div>
            </div>

            {/* Normal/Active Status - Sensors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-emerald-500/10 border border-emerald-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{sensorSummary.statusNormalActive !== null ? sensorSummary.statusNormalActive : 'N/A'}</p>
                  <p className="text-sm text-slate-500">จุด</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-emerald-600">เซนเซอร์ปกติ/ทำงาน</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <Activity size={14} className="mr-1" />
                <span>ทำงานปกติ</span>
              </div>
            </div>

            {/* Warning Status - Sensors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-amber-500/10 border border-amber-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                  <AlertTriangle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{sensorSummary.statusWarning !== null ? sensorSummary.statusWarning : 'N/A'}</p>
                  <p className="text-sm text-slate-500">จุด</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-amber-600">เซนเซอร์ต้องเฝ้าระวัง</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <Zap size={14} className="mr-1" />
                <span>ตรวจสอบแล้ว</span>
              </div>
            </div>

            {/* Abnormal Status - Sensors (รวม Critical, Error, Offline, Inactive, Maintenance, Calibrating) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-red-500/10 border border-red-100 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl">
                  <XCircle className="text-white" size={24} />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-800">{sensorSummary.statusAbnormal !== null ? sensorSummary.statusAbnormal : 'N/A'}</p>
                  <p className="text-sm text-slate-500">จุด</p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-red-600">เซนเซอร์ผิดปกติ</h3>
              <div className="mt-3 flex items-center text-sm text-slate-600">
                <AlertTriangle size={14} className="mr-1" />
                <span>ต้องแก้ไขด่วน</span>
              </div>
            </div>
          </div>

          {/* Sensor Data Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200/60">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">รายละเอียดจุดตรวจวัดทั้งหมด</h3>
                <p className="text-sm text-slate-600 mt-1">ข้อมูลเซนเซอร์และสถานะการทำงาน</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Filter size={16} className="text-slate-600" />
                </button>
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Maximize2 size={16} className="text-slate-600" />
                </button>
                <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-slate-600" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60">
                    <th className="text-left p-4 font-semibold text-slate-700">จุดตรวจวัด</th>
                    <th className="text-left p-4 font-semibold text-slate-700">สถานะ</th>
                    <th className="text-left p-4 font-semibold text-slate-700">ค่าวัด</th>
                    <th className="text-left p-4 font-semibold text-slate-700">อัปเดตล่าสุด</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        <Database className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>ไม่พบข้อมูลเซนเซอร์</p>
                      </td>
                    </tr>
                  ) : (
                    sensorData.map((sensor) => (
                      <tr key={sensor.id} className="border-b border-slate-200/60 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(sensor.status)} shadow-lg`}></div>
                            <div>
                              <p className="font-semibold text-slate-800">{sensor.name}</p>
                              <p className="text-sm text-slate-500">{sensor.description || 'ไม่มีรายละเอียด'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(sensor.status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              sensor.status === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                              sensor.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                              sensor.status === 'critical' ? 'bg-red-100 text-red-700' :
                              sensor.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              sensor.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                              sensor.status === 'maintenance' ? 'bg-blue-100 text-blue-700' :
                              sensor.status === 'error' ? 'bg-red-100 text-red-700' :
                              sensor.status === 'calibrating' ? 'bg-purple-100 text-purple-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {getStatusText(sensor.status)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">
                            {typeof sensor.value === 'number' ? sensor.value.toFixed(2) : 'N/A'} {sensor.unit}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock size={14} />
                            <span className="text-sm">{sensor.last_update}</span>
                          </div>
                        </td>
                       
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AquaNextDashboard;