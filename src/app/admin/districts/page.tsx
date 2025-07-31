"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, MapPin, XCircle, CheckCircle, ChevronLeft } from 'lucide-react';

// Define the District type for better type safety
interface District {
  id: string;
  name: string; // Changed from 'district_name' to 'name' to match backend
  province: string;
  region: string; // Added region to match backend
  status: string; // Added status to match backend
  description?: string;
  updated_at?: string; // Added updated_at to match backend

  // เพิ่ม fields อื่นๆ ที่จำเป็นจากตาราง district_metrics (ถ้ามีและจะใช้ในอนาคต)
  water_quality?: number;
  water_volume?: number;
  pressure?: number;
  efficiency?: number;
  quality_trend?: string;
  volume_trend?: string;
  pressure_trend?: string;
  efficiency_trend?: string;
}

const DistrictManagementPage: React.FC = () => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(null);

  // States for Add District Modal
  const [newDistrictName, setNewDistrictName] = useState<string>('');
  const [newDistrictProvince, setNewDistrictProvince] = useState<string>('');
  const [newDistrictRegion, setNewDistrictRegion] = useState<string>(''); // New state for region
  const [newDistrictStatus, setNewDistrictStatus] = useState<string>('active'); // New state for status, with a default
  const [newDistrictDescription, setNewDistrictDescription] = useState<string>('');

  // States for Edit District Modal
  const [editDistrictId, setEditDistrictId] = useState<string>('');
  const [editDistrictName, setEditDistrictName] = useState<string>('');
  const [editDistrictProvince, setEditDistrictProvince] = useState<string>('');
  const [editDistrictRegion, setEditDistrictRegion] = useState<string>(''); // New state for region
  const [editDistrictStatus, setEditDistrictStatus] = useState<string>(''); // New state for status
  const [editDistrictDescription, setEditDistrictDescription] = useState<string>('');

  // States for Delete Confirmation Modal
  const [deleteDistrictId, setDeleteDistrictId] = useState<string>('');
  const [deleteDistrictName, setDeleteDistrictName] = useState<string>('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for metrics in Edit Modal (kept as is)
  const [editWaterQuality, setEditWaterQuality] = useState<number | undefined>(undefined);
  const [editWaterVolume, setEditWaterVolume] = useState<number | undefined>(undefined);
  const [editPressure, setEditPressure] = useState<number | undefined>(undefined);
  const [editEfficiency, setEditEfficiency] = useState<number | undefined>(undefined);
  const [editQualityTrend, setEditQualityTrend] = useState<string | undefined>(undefined);
  const [editVolumeTrend, setEditVolumeTrend] = useState<string | undefined>(undefined);
  const [editPressureTrend, setEditPressureTrend] = useState<string | undefined>(undefined);
  const [editEfficiencyTrend, setEditEfficiencyTrend] = useState<string | undefined>(undefined);

  // Function to fetch districts from the backend
  const fetchDistricts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        setIsLoading(false);
        // window.location.href = '/admin/login'; // Redirect to login if no token
        return;
      }

      const response = await fetch('/api/admin/districts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseData = await response.json(); // รับค่า JSON response ทั้งหมด

      if (response.ok) {
        // *** แก้ไขตรงนี้: Backend ส่งข้อมูลเป็น Array โดยตรง ไม่ได้อยู่ใน property 'data' ***
        if (Array.isArray(responseData)) { // ตรวจสอบว่า responseData เป็น Array โดยตรง
          setDistricts(responseData); // ใช้ responseData ที่เป็น Array โดยตรง
        } else {
          console.error("API ตอบกลับสำเร็จ แต่ responseData ไม่ใช่ Array หรือมีรูปแบบไม่ถูกต้อง:", responseData);
          setError("รูปแบบข้อมูลเขตที่ได้รับไม่ถูกต้อง");
          setDistricts([]); // ตั้งค่าเป็น Array ว่างเพื่อป้องกัน error .map
        }
      } else {
        setError(responseData.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลเขต');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('authToken');
          // window.location.href = '/admin/login'; // Redirect to login on auth error
        }
        setDistricts([]); // ตั้งค่าเป็น Array ว่างในกรณีเกิด Error
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
      setDistricts([]); // ตั้งค่าเป็น Array ว่างในกรณี Network Error
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to fetch districts on component mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Helper to show temporary success messages
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000); // Clear after 3 seconds
  };

  // Handle adding a new district
  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/districts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDistrictName, // Changed from 'district_name' to 'name'
          province: newDistrictProvince,
          region: newDistrictRegion, // Added region
          status: newDistrictStatus, // Added status
          description: newDistrictDescription,
        }),
      });

      if (response.ok) {
        showSuccess('เพิ่มเขตสำเร็จ!');
        setNewDistrictName('');
        setNewDistrictProvince('');
        setNewDistrictRegion(''); // Clear region state
        setNewDistrictStatus('active'); // Reset status state
        setNewDistrictDescription('');
        setShowAddModal(false);
        fetchDistricts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เกิดข้อผิดพลาดในการเพิ่มเขต');
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing an existing district
  const handleEditDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        setIsLoading(false);
        return;
      }

      const updateData: { [key: string]: any } = {
        name: editDistrictName, // Changed from 'district_name' to 'name'
        province: editDistrictProvince,
        region: editDistrictRegion, // Added region to update data
        status: editDistrictStatus, // Added status to update data
        description: editDistrictDescription,
      };

      // เพิ่ม metrics fields เข้าไปใน updateData
      if (editWaterQuality !== undefined) updateData.water_quality = editWaterQuality;
      if (editWaterVolume !== undefined) updateData.water_volume = editWaterVolume;
      if (editPressure !== undefined) updateData.pressure = editPressure;
      if (editEfficiency !== undefined) updateData.efficiency = editEfficiency;
      if (editQualityTrend !== undefined) updateData.quality_trend = editQualityTrend;
      if (editVolumeTrend !== undefined) updateData.volume_trend = editVolumeTrend;
      if (editPressureTrend !== undefined) updateData.pressure_trend = editPressureTrend;
      if (editEfficiencyTrend !== undefined) updateData.efficiency_trend = editEfficiencyTrend;

      const response = await fetch(`/api/admin/districts/${editDistrictId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showSuccess('อัปเดตเขตและข้อมูล Metrics สำเร็จ!');
        setShowEditModal(false);
        fetchDistricts(); // Refresh the list for real-time update
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เกิดข้อผิดพลาดในการอัปเดตเขตและข้อมูล Metrics');
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a district
  const handleDeleteDistrict = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('ไม่พบ Token การเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/districts/${deleteDistrictId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSuccess('ลบเขตสำเร็จ!');
        setShowDeleteConfirm(false);
        fetchDistricts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เกิดข้อผิดพลาดในการลบเขต');
      }
    } catch (err) {
      console.error('Network or server error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setNewDistrictName('');
    setNewDistrictProvince('');
    setNewDistrictRegion(''); // Reset region state
    setNewDistrictStatus('active'); // Reset status state
    setNewDistrictDescription('');
    setError(null);
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (district: District) => {
    setCurrentDistrict(district);
    setEditDistrictId(district.id);
    setEditDistrictName(district.name); // Use district.name
    setEditDistrictProvince(district.province || '');
    setEditDistrictRegion(district.region || ''); // Set region
    setEditDistrictStatus(district.status || 'active'); // Set status
    setEditDistrictDescription(district.description || '');
    // ตั้งค่า states สำหรับ metrics
    setEditWaterQuality(district.water_quality);
    setEditWaterVolume(district.water_volume);
    setEditPressure(district.pressure);
    setEditEfficiency(district.efficiency);
    setEditQualityTrend(district.quality_trend);
    setEditVolumeTrend(district.volume_trend);
    setEditPressureTrend(district.pressure_trend);
    setEditEfficiencyTrend(district.efficiency_trend);
    setError(null);
    setShowEditModal(true);
  };

  // Open Delete Confirmation Modal
  const openDeleteConfirm = (district: District) => {
    setDeleteDistrictId(district.id);
    setDeleteDistrictName(district.name); // Use district.name
    setError(null);
    setShowDeleteConfirm(true);
  };

  // ฟังก์ชันสำหรับปุ่ม "ย้อนกลับ"
  const handleGoBack = () => {
    window.history.back(); // ใช้ API ของ Browser เพื่อย้อนกลับไปยังหน้าก่อนหน้าในประวัติ
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-cyan-400 flex items-center">
            <MapPin className="w-8 h-8 mr-3" />
            การจัดการเขต
          </h1>
          <button
            onClick={openAddModal}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            เพิ่มเขตใหม่
          </button>
        </div>

        {successMessage && (
          <div className="flex items-center bg-green-900/30 border border-green-500/50 rounded-lg p-3 mb-4 text-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin w-10 h-10 text-cyan-400" />
            <span className="ml-3 text-lg text-slate-400">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700/50 shadow-md">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    รหัสเขต
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ชื่อเขต
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    จังหวัด
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {districts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-center text-slate-400">
                      ไม่พบข้อมูลเขต
                    </td>
                  </tr>
                ) : (
                  districts.map((district) => (
                    <tr key={district.id} className="hover:bg-gray-700/70 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {district.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {district.name} {/* Use district.name */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {district.province} {/* Display province */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(district)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-300 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          title="แก้ไข"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(district)}
                          className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-300 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                          title="ลบ"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add District Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-cyan-400 mb-5">เพิ่มเขตใหม่</h3>
            <form onSubmit={handleAddDistrict} className="space-y-4">
              <div>
                <label htmlFor="newDistrictName" className="block text-slate-300 text-sm font-medium mb-1">ชื่อเขต</label>
                <input
                  type="text"
                  id="newDistrictName"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="newDistrictProvince" className="block text-slate-300 text-sm font-medium mb-1">จังหวัด</label>
                <input
                  type="text"
                  id="newDistrictProvince"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newDistrictProvince}
                  onChange={(e) => setNewDistrictProvince(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="newDistrictRegion" className="block text-slate-300 text-sm font-medium mb-1">ภูมิภาค</label>
                <input
                  type="text"
                  id="newDistrictRegion"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newDistrictRegion}
                  onChange={(e) => setNewDistrictRegion(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="newDistrictStatus" className="block text-slate-300 text-sm font-medium mb-1">สถานะ</label>
                <select
                  id="newDistrictStatus"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newDistrictStatus}
                  onChange={(e) => setNewDistrictStatus(e.target.value)}
                  required
                  disabled={isLoading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label htmlFor="newDistrictDescription" className="block text-slate-300 text-sm font-medium mb-1">รายละเอียดเขต (ไม่บังคับ)</label>
                <textarea
                  id="newDistrictDescription"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="ใส่รายละเอียดเกี่ยวกับเขตนี้"
                  value={newDistrictDescription}
                  onChange={(e) => setNewDistrictDescription(e.target.value)}
                  disabled={isLoading}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                  disabled={isLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                  {isLoading ? 'กำลังเพิ่ม...' : 'เพิ่มเขต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit District Modal */}
      {showEditModal && currentDistrict && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-lg p-6 my-8">
            <h3 className="text-2xl font-bold text-cyan-400 mb-5">แก้ไขเขต: {currentDistrict.name}</h3> {/* Use district.name */}
            <form onSubmit={handleEditDistrict} className="space-y-6">
              {/* Section for District General Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editDistrictId" className="block text-slate-300 text-sm font-medium mb-1">รหัสเขต (ไม่สามารถแก้ไขได้)</label>
                    <input
                      type="text"
                      id="editDistrictId"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
                      value={editDistrictId}
                      disabled
                    />
                  </div>
                  <div>
                    <label htmlFor="editDistrictName" className="block text-slate-300 text-sm font-medium mb-1">ชื่อเขต</label>
                    <input
                      type="text"
                      id="editDistrictName"
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      value={editDistrictName}
                      onChange={(e) => setEditDistrictName(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="editDistrictProvince" className="block text-slate-300 text-sm font-medium mb-1">จังหวัด</label>
                  <input
                    type="text"
                    id="editDistrictProvince"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editDistrictProvince}
                    onChange={(e) => setEditDistrictProvince(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editDistrictRegion" className="block text-slate-300 text-sm font-medium mb-1">ภูมิภาค</label>
                  <input
                    type="text"
                    id="editDistrictRegion"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editDistrictRegion}
                    onChange={(e) => setEditDistrictRegion(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editDistrictStatus" className="block text-slate-300 text-sm font-medium mb-1">สถานะ</label>
                  <select
                    id="editDistrictStatus"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editDistrictStatus}
                    onChange={(e) => setEditDistrictStatus(e.target.value)}
                    required
                    disabled={isLoading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editDistrictDescription" className="block text-slate-300 text-sm font-medium mb-1">รายละเอียดเขต</label>
                  <textarea
                    id="editDistrictDescription"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="ใส่รายละเอียดเกี่ยวกับเขตนี้"
                    value={editDistrictDescription}
                    onChange={(e) => setEditDistrictDescription(e.target.value)}
                    disabled={isLoading}
                  ></textarea>
                </div>
              </div>

              {/* Section for Metrics Data */}
              <h4 className="text-xl font-bold text-cyan-300 mt-6 mb-3 border-b border-gray-700 pb-2">ข้อมูล Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editWaterQuality" className="block text-slate-300 text-sm font-medium mb-1">คุณภาพน้ำ</label>
                  <input
                    type="number"
                    id="editWaterQuality"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editWaterQuality ?? ''}
                    onChange={(e) => setEditWaterQuality(parseFloat(e.target.value) || undefined)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editWaterVolume" className="block text-slate-300 text-sm font-medium mb-1">ปริมาณน้ำ</label>
                  <input
                    type="number"
                    id="editWaterVolume"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editWaterVolume ?? ''}
                    onChange={(e) => setEditWaterVolume(parseFloat(e.target.value) || undefined)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editPressure" className="block text-slate-300 text-sm font-medium mb-1">แรงดัน</label>
                  <input
                    type="number"
                    id="editPressure"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editPressure ?? ''}
                    onChange={(e) => setEditPressure(parseFloat(e.target.value) || undefined)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editEfficiency" className="block text-slate-300 text-sm font-medium mb-1">ประสิทธิภาพ</label>
                  <input
                    type="number"
                    id="editEfficiency"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editEfficiency ?? ''}
                    onChange={(e) => setEditEfficiency(parseFloat(e.target.value) || undefined)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editQualityTrend" className="block text-slate-300 text-sm font-medium mb-1">แนวโน้มคุณภาพ</label>
                  <input
                    type="text"
                    id="editQualityTrend"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editQualityTrend ?? ''}
                    onChange={(e) => setEditQualityTrend(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editVolumeTrend" className="block text-slate-300 text-sm font-medium mb-1">แนวโน้มปริมาณน้ำ</label>
                  <input
                    type="text"
                    id="editVolumeTrend"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editVolumeTrend ?? ''}
                    onChange={(e) => setEditVolumeTrend(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editPressureTrend" className="block text-slate-300 text-sm font-medium mb-1">แนวโน้มแรงดัน</label>
                  <input
                    type="text"
                    id="editPressureTrend"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editPressureTrend ?? ''}
                    onChange={(e) => setEditPressureTrend(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="editEfficiencyTrend" className="block text-slate-300 text-sm font-medium mb-1">แนวโน้มประสิทธิภาพ</label>
                  <input
                    type="text"
                    id="editEfficiencyTrend"
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={editEfficiencyTrend ?? ''}
                    onChange={(e) => setEditEfficiencyTrend(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                  disabled={isLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                  {isLoading ? 'กำลังอัปเดต...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-5">ยืนยันการลบเขต</h3>
            <p className="text-slate-300 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบเขต <span className="font-semibold text-white">"{deleteDistrictName}" (รหัส: {deleteDistrictId})</span>?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteDistrict}
                className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : null}
                {isLoading ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictManagementPage;
