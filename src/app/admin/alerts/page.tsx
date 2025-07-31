'use client';

import React, { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Loader2, X, CheckCircle, AlertCircle, Bell, Settings, Filter, CheckSquare, MessageSquare } from "lucide-react";
import { useRouter } from 'next/navigation';
import { AlertSetting, AlertLog, District, ProblemReport } from '../../interfaces'; // Import ProblemReport interface

const AlertManagementPage: React.FC = () => {
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [alertsLog, setAlertsLog] = useState<AlertLog[]>([]);
  const [problemReports, setProblemReports] = useState<ProblemReport[]>([]); // State for storing problem reports
  const [districts, setDistricts] = useState<District[]>([]); // For Filter
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for Alert Settings Modal
  const [isSettingModalOpen, setIsSettingModalOpen] = useState<boolean>(false);
  const [currentSetting, setCurrentSetting] = useState<AlertSetting | null>(null);
  const [formMetricName, setFormMetricName] = useState<string>('');
  const [formMinGood, setFormMinGood] = useState<string>('');
  const [formMaxGood, setFormMaxGood] = useState<string>('');
  const [formMinWarning, setFormMinWarning] = useState<string>('');
  const [formMaxWarning, setFormMaxWarning] = useState<string>('');
  const [formMinCritical, setFormMinCritical, ] = useState<string>('');
  const [formMaxCritical, setFormMaxCritical] = useState<string>('');
  const [formIsEnabled, setFormIsEnabled] = useState<boolean>(true);
  
  // States for Form submission (for Alert Settings Modal)
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for Alerts Log Filters
  const [filterDistrictId, setFilterDistrictId] = useState<string>('');
  const [filterIsResolved, setFilterIsResolved] = useState<string>('false'); // 'true', 'false', 'all'

  // States for Problem Reports Filters
  const [filterReportIsResolved, setFilterReportIsResolved] = useState<string>('false'); // 'true', 'false', 'all'

  const router = useRouter();
  const API_BASE_URL = '/api/admin';

  useEffect(() => {
    fetchData();
    fetchDistricts(); // Fetch districts for filter dropdown
  }, [filterDistrictId, filterIsResolved, filterReportIsResolved]); // Fetch data again when filters change

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      // Fetch Alert Settings
      const settingsResponse = await fetch(`${API_BASE_URL}/alert-settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const settingsData = await settingsResponse.json();
      if (settingsResponse.ok) {
        setAlertSettings(settingsData);
      } else {
        throw new Error(settingsData.message || 'ไม่สามารถดึงข้อมูลการตั้งค่าการแจ้งเตือนได้');
      }

      // Fetch Alerts Log
      const alertsLogResponse = await fetch(`${API_BASE_URL}/alerts-log?district_id=${filterDistrictId}&is_resolved=${filterIsResolved}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const alertsLogData = await alertsLogResponse.json();
      if (alertsLogResponse.ok) {
        setAlertsLog(alertsLogData);
      } else {
        throw new Error(alertsLogData.message || 'ไม่สามารถดึงประวัติการแจ้งเตือนได้');
      }

      // Fetch Problem Reports (กู้คืนส่วนนี้)
      const problemReportsResponse = await fetch(`${API_BASE_URL}/problem-reports?is_resolved=${filterReportIsResolved}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const problemReportsData = await problemReportsResponse.json();
      if (problemReportsResponse.ok) {
        setProblemReports(problemReportsData);
      } else {
        throw new Error(problemReportsData.message || 'ไม่สามารถดึงรายงานปัญหาได้');
      }

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      if (err.message.includes('ไม่ได้รับอนุญาต')) { // Specific check for auth issues
        localStorage.removeItem('authToken');
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/districts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data: District[] = await response.json();
        setDistricts(data);
      } else {
        console.error('Failed to fetch districts for filter:', await response.json());
      }
    } catch (err) {
      console.error('Network error fetching districts for filter:', err);
    }
  };

  // --- Alert Settings Modal Logic ---
  const openSettingModal = (setting: AlertSetting | null = null) => {
    setCurrentSetting(setting);
    setFormMetricName(setting ? setting.metric_name : '');
    setFormMinGood(setting?.min_good !== null && setting?.min_good !== undefined ? String(setting.min_good) : '');
    setFormMaxGood(setting?.max_good !== null && setting?.max_good !== undefined ? String(setting.max_good) : '');
    setFormMinWarning(setting?.min_warning !== null && setting?.min_warning !== undefined ? String(setting.min_warning) : '');
    setFormMaxWarning(setting?.max_warning !== null && setting?.max_warning !== undefined ? String(setting.max_warning) : '');
    setFormMinCritical(setting?.min_critical !== null && setting?.min_critical !== undefined ? String(setting.min_critical) : '');
    setFormMaxCritical(setting?.max_critical !== null && setting?.max_critical !== undefined ? String(setting.max_critical) : '');
    setFormIsEnabled(setting ? setting.is_enabled : true);
    setFormError(null);
    setSuccessMessage(null);
    setIsSettingModalOpen(true);
  };

  const closeSettingModal = () => {
    setIsSettingModalOpen(false);
    setCurrentSetting(null);
    setFormMetricName('');
    setFormMinGood('');
    setFormMaxGood('');
    setFormMinWarning('');
    setFormMaxWarning('');
    setFormMinCritical('');
    setFormMaxCritical('');
    setFormIsEnabled(true);
    setFormError(null);
    setSuccessMessage(null);
    fetchData(); // Refresh data after closing modal
  };

  const handleSettingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const payload = {
      metric_name: formMetricName,
      min_good: formMinGood === '' ? null : parseFloat(formMinGood),
      max_good: formMaxGood === '' ? null : parseFloat(formMaxGood),
      min_warning: formMinWarning === '' ? null : parseFloat(formMinWarning),
      max_warning: formMaxWarning === '' ? null : parseFloat(formMaxWarning),
      min_critical: formMinCritical === '' ? null : parseFloat(formMinCritical),
      max_critical: formMaxCritical === '' ? null : parseFloat(formMaxCritical),
      is_enabled: formIsEnabled,
    };

    const method = currentSetting ? 'PUT' : 'POST';
    const url = currentSetting ? `${API_BASE_URL}/alert-settings/${currentSetting.id}` : `${API_BASE_URL}/alert-settings`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(null), 3000); // Clear success message after 3 seconds
      } else {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    } catch (err) {
      console.error('Error submitting alert setting form:', err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
      fetchData(); // Refresh data after submission
    }
  };

  const handleDeleteSetting = async (settingId: number) => {
    // *** เปลี่ยนจาก confirm() เป็น window.alert() ชั่วคราว ***
    // แนะนำให้สร้าง Custom Modal UI สำหรับการยืนยันใน Production
    if (!window.confirm('คุณแน่ใจหรือไม่ที่ต้องการลบการตั้งค่าการแจ้งเตือนนี้?')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/alert-settings/${settingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('ลบการตั้งค่าสำเร็จ');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
      } else {
        setError(data.message || 'ไม่สามารถลบการตั้งค่าได้');
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            router.push('/admin/login');
        }
      }
    } catch (err) {
      console.error('Error deleting alert setting:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Alerts Log Logic ---
  const handleResolveAlert = async (alertId: number, isResolved: boolean) => {
    const actionText = isResolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข';
    // *** เปลี่ยนจาก confirm() เป็น window.alert() ชั่วคราว ***
    // แนะนำให้สร้าง Custom Modal UI สำหรับการยืนยันใน Production
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่ต้องการเปลี่ยนสถานะการแจ้งเตือนนี้เป็น "${actionText}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/alerts-log/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_resolved: isResolved }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`อัปเดตสถานะการแจ้งเตือนสำเร็จเป็น "${actionText}"`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData(); // Refresh alerts log
      } else {
        setError(data.message || 'ไม่สามารถอัปเดตสถานะการแจ้งเตือนได้');
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            router.push('/admin/login');
        }
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Problem Reports Logic (กู้คืนส่วนนี้) ---
  const handleResolveProblemReport = async (reportId: string, isResolved: boolean) => {
    const actionText = isResolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข';
    // *** เปลี่ยนจาก confirm() เป็น window.alert() ชั่วคราว ***
    // แนะนำให้สร้าง Custom Modal UI สำหรับการยืนยันใน Production
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่ต้องการเปลี่ยนสถานะรายงานปัญหานี้เป็น "${actionText}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/problem-reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_resolved: isResolved }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`อัปเดตสถานะรายงานปัญหาสำเร็จเป็น "${actionText}"`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData(); // Refresh problem reports
      } else {
        setError(data.message || 'ไม่สามารถอัปเดตสถานะรายงานปัญหาได้');
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            router.push('/admin/login');
        }
      }
    } catch (err) {
      console.error('Error resolving problem report:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse and display threshold_value (which is now a JSON string)
  const formatThresholdValue = (thresholdJson: string | null | undefined) => {
    if (!thresholdJson) return 'N/A';
    try {
      const parsed = JSON.parse(thresholdJson);
      // ตรวจสอบว่ามี key 'min' และ 'max' หรือไม่
      if (typeof parsed.min === 'number' && typeof parsed.max === 'number') {
        return `${parsed.min.toFixed(2)} - ${parsed.max.toFixed(2)}`;
      } else if (typeof parsed.value === 'number') { // ถ้ามีแค่ key 'value'
        return parsed.value.toFixed(2);
      } else if (typeof parsed === 'number') { // ถ้าเป็นแค่ตัวเลขตรงๆ
        return parsed.toFixed(2);
      }
      return thresholdJson; // คืนค่าเดิมถ้าไม่สามารถ Parse ได้ตามที่คาดหวัง
    } catch (e) {
      console.error("Error parsing threshold JSON:", e);
      return thresholdJson; // คืนค่าเดิมหาก Parse ไม่ได้
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-cyan-400" />
        <p className="ml-3 text-lg text-slate-400">กำลังโหลดข้อมูลการแจ้งเตือน...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-slate-400 text-center">{error}</p>
        <button
          onClick={fetchData}
          className="mt-6 px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
        >
          ลองโหลดใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-white flex items-center">
          <Bell className="mr-3 w-10 h-10 text-cyan-400" /> การแจ้งเตือน
        </h1>
        <button
          onClick={() => openSettingModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg"
        >
          <Settings className="w-5 h-5" />
          <span>ตั้งค่าการแจ้งเตือน</span>
        </button>
      </header>

      {successMessage && (
        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 rounded-xl p-4 mb-6 flex items-center space-x-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Alert Settings Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Settings className="mr-2 w-8 h-8 text-slate-400" /> การตั้งค่าเกณฑ์การแจ้งเตือน
        </h2>
        {alertSettings.length === 0 ? (
          <div className="text-center p-10 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <p className="text-slate-400 text-lg">ยังไม่มีการตั้งค่าการแจ้งเตือน</p>
            <button
              onClick={() => openSettingModal()}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg mx-auto"
            >
              <PlusCircle className="w-5 h-5" />
              <span>เพิ่มการตั้งค่าแรกของคุณ</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Metric
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ปกติ (Min-Max)
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เตือน (Min-Max)
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    วิกฤต (Min-Max)
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {alertSettings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white capitalize">
                      {typeof setting.metric_name === 'string' ? setting.metric_name.replace(/_/g, ' ') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {typeof setting.min_good === 'number' ? setting.min_good : 'N/A'} - {typeof setting.max_good === 'number' ? setting.max_good : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {setting.min_warning !== null ? setting.min_warning : 'N/A'} - {setting.max_warning !== null ? setting.max_warning : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {setting.min_critical !== null ? setting.min_critical : 'N/A'} - {setting.max_critical !== null ? setting.max_critical : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${setting.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {setting.is_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openSettingModal(setting)}
                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-200"
                        title="แก้ไข"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSetting(setting.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alerts Log Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Bell className="mr-2 w-8 h-8 text-slate-400" /> ประวัติการแจ้งเตือน (จากระบบ)
        </h2>

        {/* Filters for Alerts Log */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">ตัวกรอง:</span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="filterDistrict" className="text-slate-400 text-sm">เขต:</label>
            <select
              id="filterDistrict"
              value={filterDistrictId}
              onChange={(e) => setFilterDistrictId(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="">ทั้งหมด</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="filterResolved" className="text-slate-400 text-sm">สถานะ:</label>
            <select
              id="filterResolved"
              value={filterIsResolved}
              onChange={(e) => setFilterIsResolved(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="false">ยังไม่แก้ไข</option>
              <option value="true">แก้ไขแล้ว</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
        </div>

        {alertsLog.length === 0 ? (
          <div className="text-center p-10 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <p className="text-slate-400 text-lg">ไม่พบประวัติการแจ้งเตือนจากระบบตามตัวกรองที่เลือก</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เขต
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Metric
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ค่าปัจจุบัน
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เกณฑ์ที่ถูกละเมิด
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ข้อความ
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เวลาเกิด
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {alertsLog.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {alert.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {alert.district_name || alert.district_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {alert.metric_name.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.alert_type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {alert.alert_type === 'critical' ? 'วิกฤต' : 'เตือน'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {typeof alert.current_value === 'number' ? alert.current_value.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatThresholdValue(alert.threshold_value)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs overflow-hidden text-ellipsis">
                      {alert.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(alert.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${alert.is_resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {alert.is_resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข'}
                      </span>
                      {alert.resolved_by_username && (
                        <p className="text-xs text-slate-500 mt-1">โดย: {alert.resolved_by_username}</p>
                      )}
                      {alert.resolved_at && (
                        <p className="text-xs text-slate-500">เมื่อ: {new Date(alert.resolved_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!alert.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id, true)}
                          className="text-emerald-400 hover:text-emerald-300 mr-4 transition-colors duration-200"
                          title="ทำเครื่องหมายว่าแก้ไขแล้ว"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {alert.is_resolved && (
                        <button
                          onClick={() => handleResolveAlert(alert.id, false)}
                          className="text-red-400 hover:text-red-300 mr-4 transition-colors duration-200"
                          title="ทำเครื่องหมายว่ายังไม่แก้ไข"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Problem Reports Section (กู้คืนส่วนนี้) */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
          <MessageSquare className="mr-2 w-8 h-8 text-slate-400" /> รายงานปัญหาจากผู้ใช้
        </h2>

        {/* Filters for Problem Reports */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">ตัวกรอง:</span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="filterReportResolved" className="text-slate-400 text-sm">สถานะ:</label>
            <select
              id="filterReportResolved"
              value={filterReportIsResolved}
              onChange={(e) => setFilterReportIsResolved(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <option value="false">ยังไม่แก้ไข</option>
              <option value="true">แก้ไขแล้ว</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
        </div>

        {problemReports.length === 0 ? (
          <div className="text-center p-10 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <p className="text-slate-400 text-lg">ไม่พบรายงานปัญหาจากผู้ใช้ตามตัวกรองที่เลือก</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เบอร์โทรศัพท์
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ประเภทปัญหา
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    หัวข้อ
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ความสำคัญ
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    ไฟล์แนบ
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    เวลาแจ้ง
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {problemReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {report.id.substring(0, 8)}... {/* แสดงแค่บางส่วนของ UUID */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {report.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {report.issue_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {report.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 max-w-xs overflow-hidden text-ellipsis">
                      {report.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${report.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {report.priority === 'low' ? 'ต่ำ' :
                         report.priority === 'medium' ? 'ปานกลาง' :
                         report.priority === 'high' ? 'สูง' :
                         'วิกฤต'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {report.attachment_url ? (
                        <a href={report.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          ดูไฟล์
                        </a>
                      ) : (
                        'ไม่มี'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(report.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.is_resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {report.is_resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข'}
                      </span>
                      {report.resolved_by_username && (
                        <p className="text-xs text-slate-500 mt-1">โดย: {report.resolved_by_username}</p>
                      )}
                      {report.resolved_at && (
                        <p className="text-xs text-slate-500">เมื่อ: {new Date(report.resolved_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!report.is_resolved && (
                        <button
                          onClick={() => handleResolveProblemReport(report.id, true)}
                          className="text-emerald-400 hover:text-emerald-300 mr-4 transition-colors duration-200"
                          title="ทำเครื่องหมายว่าแก้ไขแล้ว"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {report.is_resolved && (
                        <button
                          onClick={() => handleResolveProblemReport(report.id, false)}
                          className="text-red-400 hover:text-red-300 mr-4 transition-colors duration-200"
                          title="ทำเครื่องหมายว่ายังไม่แก้ไข"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal for Add/Edit Alert Setting */}
      {isSettingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
            <button
              onClick={closeSettingModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              {currentSetting ? 'แก้ไขการตั้งค่าการแจ้งเตือน' : 'เพิ่มการตั้งค่าการแจ้งเตือนใหม่'}
            </h2>

            <form onSubmit={handleSettingSubmit} className="space-y-6">
              <div>
                <label htmlFor="formMetricName" className="block text-slate-300 text-sm font-medium mb-2">ชื่อ Metric (เช่น water_quality)</label>
                <input
                  type="text"
                  id="formMetricName"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={formMetricName}
                  onChange={(e) => setFormMetricName(e.target.value)}
                  disabled={!!currentSetting || formLoading} // Metric Name แก้ไขไม่ได้ ถ้าเป็นโหมดแก้ไข
                  required
                />
                {currentSetting && <p className="text-sm text-slate-400 mt-1">ไม่สามารถแก้ไขชื่อ Metric ได้</p>}
              </div>

              {/* Threshold Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="minGood" className="block text-slate-300 text-sm font-medium mb-2">ปกติ (Min)</label>
                  <input type="number" step="0.01" id="minGood" value={formMinGood} onChange={(e) => setFormMinGood(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                <div>
                  <label htmlFor="maxGood" className="block text-slate-300 text-sm font-medium mb-2">ปกติ (Max)</label>
                  <input type="number" step="0.01" id="maxGood" value={formMaxGood} onChange={(e) => setFormMaxGood(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                {/* Spacer for alignment */}
                <div></div> 
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="minWarning" className="block text-slate-300 text-sm font-medium mb-2">เตือน (Min)</label>
                  <input type="number" step="0.01" id="minWarning" value={formMinWarning} onChange={(e) => setFormMinWarning(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                <div>
                  <label htmlFor="maxWarning" className="block text-slate-300 text-sm font-medium mb-2">เตือน (Max)</label>
                  <input type="number" step="0.01" id="maxWarning" value={formMaxWarning} onChange={(e) => setFormMaxWarning(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                {/* Spacer for alignment */}
                <div></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="minCritical" className="block text-slate-300 text-sm font-medium mb-2">วิกฤต (Min)</label>
                  <input type="number" step="0.01" id="minCritical" value={formMinCritical} onChange={(e) => setFormMinCritical(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                <div>
                  <label htmlFor="maxCritical" className="block text-slate-300 text-sm font-medium mb-2">วิกฤต (Max)</label>
                  <input type="number" step="0.01" id="maxCritical" value={formMaxCritical} onChange={(e) => setFormMaxCritical(e.target.value)} disabled={formLoading} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50" />
                </div>
                {/* Spacer for alignment */}
                <div></div>
              </div>

              <div>
                <label htmlFor="formIsEnabled" className="flex items-center space-x-2 text-slate-300 text-sm font-medium">
                  <input
                    type="checkbox"
                    id="formIsEnabled"
                    checked={formIsEnabled}
                    onChange={(e) => setFormIsEnabled(e.target.checked)}
                    disabled={formLoading}
                    className="form-checkbox h-5 w-5 text-cyan-600 rounded"
                  />
                  <span>เปิดใช้งานการแจ้งเตือนนี้</span>
                </label>
              </div>

              {formError && (
                <div className="flex items-center text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center text-emerald-400 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-sm">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-cyan-700 hover:to-blue-800 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formLoading}
              >
                {formLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                <span>{currentSetting ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มการตั้งค่า'}</span>
              </button>
              <button
                type="button"
                onClick={closeSettingModal}
                className="w-full mt-3 bg-slate-700/50 text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formLoading}
              >
                ยกเลิก
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagementPage;
