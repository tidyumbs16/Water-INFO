"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, MapPin, XCircle, CheckCircle, ChevronLeft } from 'lucide-react';

// Define the District type for better type safety
interface District {
  id: string; // Ensure id is always a string
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

const [newWaterQuality, setNewWaterQuality] = useState<number | undefined>(undefined);
const [newWaterVolume, setNewWaterVolume] = useState<number | undefined>(undefined);
const [newPressure, setNewPressure] = useState<number | undefined>(undefined);
const [newEfficiency, setNewEfficiency] = useState<number | undefined>(undefined);
const [newQualityTrend, setNewQualityTrend] = useState<string>('');
const [newVolumeTrend, setNewVolumeTrend] = useState<string>('');
const [newPressureTrend, setNewPressureTrend] = useState<string>('');
const [newEfficiencyTrend, setNewEfficiencyTrend] = useState<string>('');

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
const bodyPayload = {
      name: newDistrictName,
      province: newDistrictProvince,
      region: newDistrictRegion,
      status: newDistrictStatus,
      description: newDistrictDescription,
      water_quality: newWaterQuality,
      water_volume: newWaterVolume,
      pressure: newPressure,
      efficiency: newEfficiency,
      quality_trend: newQualityTrend,
      volume_trend: newVolumeTrend,
      pressure_trend: newPressureTrend,
      efficiency_trend: newEfficiencyTrend,
    };
      const response = await fetch('/api/admin/districts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
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
        updated_at: new Date().toISOString(), // เพิ่ม timestamp สำหรับการอัปเดต
      };

      // เพิ่ม metrics fields เข้าไปใน updateData
      // ตรวจสอบค่าที่เป็น undefined ก่อนส่ง เพื่อให้ backend ไม่ได้รับค่าที่ไม่จำเป็น
      if (editWaterQuality !== undefined) updateData.water_quality = editWaterQuality;
      if (editWaterVolume !== undefined) updateData.water_volume = editWaterVolume;
      if (editPressure !== undefined) updateData.pressure = editPressure;
      if (editEfficiency !== undefined) updateData.efficiency = editEfficiency;
      if (editQualityTrend !== undefined) updateData.quality_trend = editQualityTrend;
      if (editVolumeTrend !== undefined) updateData.volume_trend = editVolumeTrend;
      if (editPressureTrend !== undefined) updateData.pressure_trend = editPressureTrend;
      if (editEfficiencyTrend !== undefined) updateData.efficiency_trend = editEfficiencyTrend;

      console.log("Sending PUT request to:", `/api/admin/districts/${editDistrictId}`);
      console.log("Payload:", updateData);

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
        console.error("Error response from API:", errorData);
        setError(errorData.message || 'เกิดข้อผิดพลาดในการอัปเดตเขตและข้อมูล Metrics');
      }
    } catch (err: any) { // Catch any type of error
      console.error('Network or server error:', err);
      setError(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ: ${err.message || ''}`);
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

      // --- CRITICAL CHECK AND LOGGING ---
      // ตรวจสอบว่า deleteDistrictId มีค่าหรือไม่ก่อนส่งคำขอ
      if (!deleteDistrictId) {
        console.error('ERROR: deleteDistrictId is empty when attempting to delete.');
        setError('ไม่สามารถลบเขตได้: ไม่พบรหัสเขตที่จะลบ');
        setIsLoading(false);
        setShowDeleteConfirm(false); // ปิด modal ถ้า ID หายไป
        return;
      }
      console.log('Attempting to delete district with ID:', deleteDistrictId);
      // --- END CRITICAL CHECK AND LOGGING ---

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
        console.error("Error response from DELETE API:", errorData); // Added for more detailed error
        setError(errorData.message || 'เกิดข้อผิดพลาดในการลบเขต');
      }
    } catch (err) {
      console.error('Network or server error during DELETE:', err); // More specific error message
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
    // --- DEBUGGING LOG ADDED HERE ---
    console.log('Opening delete confirm for district:', district);
    console.log('District ID to be set for deletion:', district.id);
    // --- END DEBUGGING LOG ---
    setDeleteDistrictId(district.id);
    setDeleteDistrictName(district.name); // Use district.name
    setError(null);
    setShowDeleteConfirm(true);
  };

    
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-extrabold text-cyan-400">
          <MapPin className="inline-block w-9 h-9 mr-3 text-blue-400" />
          จัดการข้อมูลเขต
        </h1>
        <button
          onClick={openAddModal}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          เพิ่มเขตใหม่
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-700/50 rounded-lg flex items-center text-green-200 shadow-md">
          <CheckCircle className="w-6 h-6 mr-3" />
          <p>{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 rounded-lg flex items-center text-red-300 shadow-md">
          <XCircle className="w-6 h-6 mr-3" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-300">
          <Loader2 className="w-10 h-10 animate-spin mr-3" />
          <span className="text-xl">กำลังโหลดข้อมูลเขต...</span>
        </div>
      ) : (
        /* Districts Table/List */
        <div className="bg-gray-800/70 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          {districts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-lg">
              ไม่พบข้อมูลเขตใดๆ ในระบบ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ชื่อเขต
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      จังหวัด
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      ภูมิภาค
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      อัปเดตล่าสุด
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {districts.map((district) => (
                    <tr key={district.id} className="hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {district.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {district.province}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {district.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          district.status === 'active' ? 'bg-green-100 text-green-800' :
                          district.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {district.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {district.updated_at ? new Date(district.updated_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(district)}
                          className="text-blue-400 hover:text-blue-600 mr-3 transition-colors duration-200"
                          title="แก้ไข"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(district)}
                          className="text-red-400 hover:text-red-600 transition-colors duration-200"
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
        </div>
      )}

      {/* Add District Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg border border-gray-700">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">เพิ่มเขตใหม่</h3>
            <form onSubmit={handleAddDistrict} className="space-y-4">
              <div>
                <label htmlFor="newDistrictName" className="block text-gray-300 text-sm font-medium mb-2">
                  ชื่อเขต
                </label>
                <input
                  type="text"
                  id="newDistrictName"
                  value={newDistrictName}
                  onChange={(e) => setNewDistrictName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newDistrictProvince" className="block text-gray-300 text-sm font-medium mb-2">
                  จังหวัด
                </label>
                <input
                  type="text"
                  id="newDistrictProvince"
                  value={newDistrictProvince}
                  onChange={(e) => setNewDistrictProvince(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newDistrictRegion" className="block text-gray-300 text-sm font-medium mb-2">
                  ภูมิภาค
                </label>
                <input
                  type="text"
                  id="newDistrictRegion"
                  value={newDistrictRegion}
                  onChange={(e) => setNewDistrictRegion(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="newDistrictStatus" className="block text-gray-300 text-sm font-medium mb-2">
                  สถานะ
                </label>
                <select
                  id="newDistrictStatus"
                  value={newDistrictStatus}
                  onChange={(e) => setNewDistrictStatus(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label htmlFor="newDistrictDescription" className="block text-gray-300 text-sm font-medium mb-2">
                  รายละเอียด
                </label>
                <textarea
                  id="newDistrictDescription"
                  value={newDistrictDescription}
                  onChange={(e) => setNewDistrictDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  เพิ่มเขต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit District Modal */}
      {showEditModal && currentDistrict && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">แก้ไขเขต: {currentDistrict.name}</h3>
            <form onSubmit={handleEditDistrict} className="space-y-4">
              {/* Basic Info */}
              <div>
                <label htmlFor="editDistrictId" className="block text-gray-300 text-sm font-medium mb-2">
                  รหัสเขต (ไม่สามารถแก้ไขได้)
                </label>
                <input
                  type="text"
                  id="editDistrictId"
                  value={editDistrictId}
                  readOnly
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="editDistrictName" className="block text-gray-300 text-sm font-medium mb-2">
                  ชื่อเขต
                </label>
                <input
                  type="text"
                  id="editDistrictName"
                  value={editDistrictName}
                  onChange={(e) => setEditDistrictName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editDistrictProvince" className="block text-gray-300 text-sm font-medium mb-2">
                  จังหวัด
                </label>
                <input
                  type="text"
                  id="editDistrictProvince"
                  value={editDistrictProvince}
                  onChange={(e) => setEditDistrictProvince(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editDistrictRegion" className="block text-gray-300 text-sm font-medium mb-2">
                  ภูมิภาค
                </label>
                <input
                  type="text"
                  id="editDistrictRegion"
                  value={editDistrictRegion}
                  onChange={(e) => setEditDistrictRegion(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="editDistrictStatus" className="block text-gray-300 text-sm font-medium mb-2">
                  สถานะ
                </label>
                <select
                  id="editDistrictStatus"
                  value={editDistrictStatus}
                  onChange={(e) => setEditDistrictStatus(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label htmlFor="editDistrictDescription" className="block text-gray-300 text-sm font-medium mb-2">
                  รายละเอียด
                </label>
                <textarea
                  id="editDistrictDescription"
                  value={editDistrictDescription}
                  onChange={(e) => setEditDistrictDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Metrics Section */}
              <div className="pt-6 border-t border-gray-700">
                <h4 className="text-xl font-bold text-gray-200 mb-4">ข้อมูล Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="editWaterQuality" className="block text-gray-300 text-sm font-medium mb-2">
                      คุณภาพน้ำ
                    </label>
                    <input
                      type="number" // Use type="number" for numerical inputs
                      id="editWaterQuality"
                      value={editWaterQuality === undefined ? '' : editWaterQuality}
                      onChange={(e) => setEditWaterQuality(e.target.value === '' ? undefined : Number(e.target.value))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editWaterVolume" className="block text-gray-300 text-sm font-medium mb-2">
                      ปริมาณน้ำ
                    </label>
                    <input
                      type="number"
                      id="editWaterVolume"
                      value={editWaterVolume === undefined ? '' : editWaterVolume}
                      onChange={(e) => setEditWaterVolume(e.target.value === '' ? undefined : Number(e.target.value))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPressure" className="block text-gray-300 text-sm font-medium mb-2">
                      แรงดัน
                    </label>
                    <input
                      type="number"
                      id="editPressure"
                      value={editPressure === undefined ? '' : editPressure}
                      onChange={(e) => setEditPressure(e.target.value === '' ? undefined : Number(e.target.value))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editEfficiency" className="block text-gray-300 text-sm font-medium mb-2">
                      ประสิทธิภาพ
                    </label>
                    <input
                      type="number"
                      id="editEfficiency"
                      value={editEfficiency === undefined ? '' : editEfficiency}
                      onChange={(e) => setEditEfficiency(e.target.value === '' ? undefined : Number(e.target.value))}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editQualityTrend" className="block text-gray-300 text-sm font-medium mb-2">
                      แนวโน้มคุณภาพ
                    </label>
                    <input
                      type="text"
                      id="editQualityTrend"
                      value={editQualityTrend || ''}
                      onChange={(e) => setEditQualityTrend(e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editVolumeTrend" className="block text-gray-300 text-sm font-medium mb-2">
                      แนวโน้มปริมาณน้ำ
                    </label>
                    <input
                      type="text"
                      id="editVolumeTrend"
                      value={editVolumeTrend || ''}
                      onChange={(e) => setEditVolumeTrend(e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPressureTrend" className="block text-gray-300 text-sm font-medium mb-2">
                      แนวโน้มแรงดัน
                    </label>
                    <input
                      type="text"
                      id="editPressureTrend"
                      value={editPressureTrend || ''}
                      onChange={(e) => setEditPressureTrend(e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editEfficiencyTrend" className="block text-gray-300 text-sm font-medium mb-2">
                      แนวโน้มประสิทธิภาพ
                    </label>
                    <input
                      type="text"
                      id="editEfficiencyTrend"
                      value={editEfficiencyTrend || ''}
                      onChange={(e) => setEditEfficiencyTrend(e.target.value)}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div> {/* End of grid grid-cols-1 md:grid-cols-2 gap-4 */}
              </div> {/* End of Metrics Section */}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-400 mb-4">ยืนยันการลบเขต?</h3>
            <p className="text-gray-300 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบเขต "<span className="font-semibold text-white">{deleteDistrictName}</span>" นี้?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteDistrict}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

     
    </div>
  );
};

export default DistrictManagementPage;
