'use client';

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Edit, Trash2, Loader2, X, CheckCircle, AlertCircle, Bell, Settings, Filter, CheckSquare, MessageSquare } from "lucide-react";
import { useRouter } from 'next/navigation';
import { AlertSetting, AlertLog, District, ProblemReport } from '../../interfaces/index'; // Import ProblemReport interface
import { id } from "zod/v4/locales/index.cjs";

// Define interfaces if they are not in a separate file or for clarity
// interface AlertSetting {
//   id: number;
//   metric_name: string;
//   min_good: number | null;
//   max_good: number | null;
//   min_warning: number | null;
//   max_warning: number | null;
//   min_critical: number | null;
//   max_critical: number | null;
//   is_enabled: boolean;
// }
// interface AlertLog {
//   id: number;
//   district_id: string;
//   district_name: string;
//   metric_name: string;
//   alert_type: 'warning' | 'critical';
//   current_value: number;
//   threshold_value: string;
//   message: string;
//   created_at: string;
//   is_resolved: boolean;
//   resolved_by_username: string | null;
//   resolved_at: string | null;
// }
// interface District {
//   id: string;
//   name: string;
// }
// interface ProblemReport {
//   id: string;
//   phone_number: string;
//   problem_type: string;
//   subject: string;
//   details: string;
//   importance: 'low' | 'medium' | 'high';
//   created_at: string;
//   is_resolved: boolean;
// }


const AlertManagementPage: React.FC = () => {
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [alertsLog, setAlertsLog] = useState<AlertLog[]>([]);
  const [problemReports, setProblemReports] = useState<ProblemReport[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
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
  const [formMinCritical, setFormMinCritical] = useState<string>('');
  const [formMaxCritical, setFormMaxCritical] = useState<string>('');
  const [formIsEnabled, setFormIsEnabled] = useState<boolean>(true);
  
  // States for Form submission (for Alert Settings Modal)
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for Alerts Log Filters
  const [filterDistrictId, setFilterDistrictId] = useState<string>('');
  const [filterIsResolved, setFilterIsResolved] = useState<string>('false');

  // States for Problem Reports Filters
  const [filterReportIsResolved, setFilterReportIsResolved] = useState<string>('false');

  const router = useRouter();
  const API_BASE_URL = '/api/admin';

  // Memoized fetch function to prevent re-creation on every render
  const fetchData = useCallback(async () => {
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

      // Fetch Alerts Log with filters
      const alertsLogResponse = await fetch(`${API_BASE_URL}/alerts-log?district_id=${filterDistrictId}&is_resolved=${filterIsResolved}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const alertsLogData = await alertsLogResponse.json();
      if (alertsLogResponse.ok) {
        setAlertsLog(alertsLogData);
      } else {
        throw new Error(alertsLogData.message || 'ไม่สามารถดึงประวัติการแจ้งเตือนได้');
      }

      // Fetch Problem Reports with filter
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
      if (err.message.includes('ไม่ได้รับอนุญาต')) {
        localStorage.removeItem('authToken');
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterDistrictId, filterIsResolved, filterReportIsResolved, router]);

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

  useEffect(() => {
    fetchData();
    fetchDistricts();
  }, [fetchData]); // Use fetchData in dependency array

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
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    } catch (err) {
      console.error('Error submitting alert setting form:', err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
      fetchData();
    }
  };

  const handleDeleteSetting = async (settingId: number) => {
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
        
        // C-1: Update the state directly for a snappier UI response
        setAlertsLog(prevLogs => {
          if (filterIsResolved === 'true') {
            // If the filter is 'resolved', add the updated alert to the list
            const updatedAlert = prevLogs.find(alert => alert.id === alertId);
            if (updatedAlert) {
              return [{ ...updatedAlert, is_resolved: isResolved }, ...prevLogs];
            }
            return prevLogs;
          } else if (filterIsResolved === 'false') {
            // If the filter is 'unresolved', remove the updated alert from the list
            return prevLogs.filter(alert => alert.id !== alertId);
          }
          // If the filter is 'all', update the specific alert in the list
          return prevLogs.map(alert =>
            alert.id === alertId ? { ...alert, is_resolved: isResolved } : alert
          );
        });

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

  // --- Problem Reports Logic ---
  const handleResolveProblemReport = async (reportId: string, isResolved: boolean) => {
    const actionText = isResolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข';
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
        
        // C-2: THIS IS THE KEY CHANGE. Instead of refetching all data,
        // we directly update the local state to remove the resolved item.
        setProblemReports(prevReports => prevReports.filter(report => report.id !== reportId));
        
        // Optional: Refetch data to ensure consistency with the server, but the UI update is instant.
        // fetchData();
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

  const formatThresholdValue = (thresholdJson: string | null | undefined) => {
    if (!thresholdJson) return 'N/A';
    try {
      const parsed = JSON.parse(thresholdJson);
      if (typeof parsed.min === 'number' && typeof parsed.max === 'number') {
        return `${parsed.min.toFixed(2)} - ${parsed.max.toFixed(2)}`;
      } else if (typeof parsed.value === 'number') {
        return parsed.value.toFixed(2);
      } else if (typeof parsed === 'number') {
        return parsed.toFixed(2);
      }
      return thresholdJson;
    } catch (e) {
      console.error("Error parsing threshold JSON:", e);
      return thresholdJson;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center  text-white">
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
  <div className="flex-1 p-10 bg-gradient-to-br from-blue-50 via-white to-blue-50 text-gray-900">
    {/* Header */}
    <header className="mb-8 flex justify-between items-center">
      <h1 className="text-4xl font-extrabold text-blue-700 flex items-center">
        <Bell className="mr-3 w-10 h-10 text-blue-500" /> การแจ้งเตือน
      </h1>
      <button
        onClick={() => openSettingModal()}
        className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg"
      >
        <Settings className="w-5 h-5" />
        <span>ตั้งค่าการแจ้งเตือน</span>
      </button>
    </header>

    {/* Success Message */}
    {successMessage && (
      <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 mb-6 flex items-center space-x-3 animate-fade-in">
        <CheckCircle className="w-6 h-6" />
        <span>{successMessage}</span>
      </div>
    )}

    {/* Alert Settings Section */}
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-blue-700 mb-6 flex items-center">
        <Settings className="mr-2 w-8 h-8 text-blue-500" /> การตั้งค่าเกณฑ์การแจ้งเตือน
      </h2>
      {alertSettings.length === 0 ? (
        <div className="text-center p-10 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-blue-500 text-lg">ยังไม่มีการตั้งค่าการแจ้งเตือน</p>
          <button
            onClick={() => openSettingModal()}
            className="mt-6 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg mx-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>เพิ่มการตั้งค่าแรกของคุณ</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xl">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ปกติ (Min-Max)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">เตือน (Min-Max)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">วิกฤต (Min-Max)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {alertSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 capitalize">
                    {typeof setting.metric_name === 'string' ? setting.metric_name.replace(/_/g, ' ') : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {typeof setting.min_good === 'number' ? setting.min_good : 'N/A'} - {typeof setting.max_good === 'number' ? setting.max_good : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {setting.min_warning !== null ? setting.min_warning : 'N/A'} - {setting.max_warning !== null ? setting.max_warning : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {setting.min_critical !== null ? setting.min_critical : 'N/A'} - {setting.max_critical !== null ? setting.max_critical : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${setting.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {setting.is_enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openSettingModal(setting)}
                      className="text-blue-500 hover:text-blue-700 mr-4 transition-colors duration-200"
                      title="แก้ไข"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSetting(setting.id)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
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

    {/* Problem Reports Section */}
    <section>
      <h2 className="text-3xl font-bold text-blue-700 mb-6 flex items-center">
        <MessageSquare className="mr-2 w-8 h-8 text-blue-500" /> รายงานปัญหาจากผู้ใช้
      </h2>

      {/* Filter */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <span className="text-blue-600">ตัวกรอง:</span>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="filterReportResolved" className="text-blue-500 text-sm">สถานะ:</label>
          <select
            id="filterReportResolved"
            value={filterReportIsResolved}
            onChange={(e) => setFilterReportIsResolved(e.target.value)}
            className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="false">ยังไม่แก้ไข</option>
            <option value="true">แก้ไขแล้ว</option>
            <option value="all">ทั้งหมด</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {problemReports.length === 0 ? (
        <div className="text-center p-10 bg-blue-50 border border-blue-200 rounded-2xl">
          <p className="text-blue-500 text-lg">ไม่พบรายงานปัญหาจากผู้ใช้ตามตัวกรองที่เลือก</p>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden shadow-xl">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">เบอร์โทรศัพท์</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ประเภทปัญหา</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">หัวข้อ</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">รายละเอียด</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ความสำคัญ</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">เวลาเกิด</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-blue-700 uppercase tracking-wider">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {problemReports.map((report) => (
                <tr key={report.id} className="hover:bg-blue-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{report.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{report.problem_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{report.subject}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs overflow-hidden text-ellipsis">{report.details}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.importance === 'high' ? 'bg-red-100 text-red-800' :
                      report.importance === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.importance === 'high' ? 'สูง' : report.importance === 'medium' ? 'กลาง' : 'ต่ำ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.is_resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {report.is_resolved ? 'แก้ไขแล้ว' : 'ยังไม่แก้ไข'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(report.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!report.is_resolved && (
                      <button
                        onClick={() => handleResolveProblemReport(report.id, true)}
                        className="text-green-500 hover:text-green-700 transition-colors duration-200"
                        title="ทำเครื่องหมายว่าแก้ไขแล้ว"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {report.is_resolved && (
                      <button
                        onClick={() => handleResolveProblemReport(report.id, false)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
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

    {/* Setting Modal */}
    {isSettingModalOpen && (
      <div className="fixed inset-0 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white border border-blue-200 rounded-2xl w-full max-w-2xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-blue-700">{currentSetting ? 'แก้ไขการตั้งค่าการแจ้งเตือน' : 'เพิ่มการตั้งค่าการแจ้งเตือนใหม่'}</h3>
            <button onClick={closeSettingModal} className="text-blue-400 hover:text-blue-700 transition-colors duration-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          {formError && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-4 flex items-center space-x-3">
              <AlertCircle className="w-6 h-6" />
              <span>{formError}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl p-4 mb-4 flex items-center space-x-3">
              <CheckCircle className="w-6 h-6" />
              <span>{successMessage}</span>
            </div>
          )}
          <form onSubmit={handleSettingSubmit}>
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-blue-700 mb-2">Metric Name</label>
                <input
                  type="text"
                  value={formMetricName}
                  onChange={(e) => setFormMetricName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-blue-700 mb-2">เกณฑ์ปกติ (Min-Max)</label>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={formMinGood}
                    onChange={(e) => setFormMinGood(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={formMaxGood}
                    onChange={(e) => setFormMaxGood(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-blue-700 mb-2">เกณฑ์เตือน (Min-Max)</label>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={formMinWarning}
                    onChange={(e) => setFormMinWarning(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={formMaxWarning}
                    onChange={(e) => setFormMaxWarning(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-blue-700 mb-2">เกณฑ์วิกฤต (Min-Max)</label>
                <div className="flex space-x-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Min"
                    value={formMinCritical}
                    onChange={(e) => setFormMinCritical(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Max"
                    value={formMaxCritical}
                    onChange={(e) => setFormMaxCritical(e.target.value)}
                    className="w-full px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formIsEnabled}
                  onChange={(e) => setFormIsEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <label className="text-blue-700">เปิดใช้งาน</label>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={closeSettingModal}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200"
              >
                {currentSetting ? 'บันทึกการแก้ไข' : 'เพิ่มการตั้งค่า'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)
}

export default AlertManagementPage;
