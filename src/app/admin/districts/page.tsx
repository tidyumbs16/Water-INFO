"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, MapPin, XCircle, CheckCircle } from 'lucide-react';

interface District {
  id: string;
  name: string;
  province: string;
  region: string;
  status: string;
  description?: string;
  updated_at?: string;
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

  // Add Modal States
  const [newDistrictName, setNewDistrictName] = useState<string>('');
  const [newDistrictProvince, setNewDistrictProvince] = useState<string>('');
  const [newDistrictRegion, setNewDistrictRegion] = useState<string>('');
  const [newDistrictStatus, setNewDistrictStatus] = useState<string>('ดี'); // default "ดี"
  const [newDistrictDescription, setNewDistrictDescription] = useState<string>('');

  // Edit Modal States
  const [editDistrictId, setEditDistrictId] = useState<string>('');
  const [editDistrictName, setEditDistrictName] = useState<string>('');
  const [editDistrictProvince, setEditDistrictProvince] = useState<string>('');
  const [editDistrictRegion, setEditDistrictRegion] = useState<string>('');
  const [editDistrictStatus, setEditDistrictStatus] = useState<string>('ดี');
  const [editDistrictDescription, setEditDistrictDescription] = useState<string>('');

  // Delete
  const [deleteDistrictId, setDeleteDistrictId] = useState<string>('');
  const [deleteDistrictName, setDeleteDistrictName] = useState<string>('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDistricts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/districts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const responseData = await response.json();
      if (response.ok && Array.isArray(responseData)) {
        setDistricts(responseData);
      } else {
        setError("ข้อมูลเขตไม่ถูกต้อง");
        setDistricts([]);
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      setDistricts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/districts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newDistrictName,
          province: newDistrictProvince,
          region: newDistrictRegion,
          status: newDistrictStatus,
          description: newDistrictDescription,
        }),
      });
      if (response.ok) {
        showSuccess('เพิ่มเขตสำเร็จ!');
        setShowAddModal(false);
        fetchDistricts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'เพิ่มเขตล้มเหลว');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/districts/${editDistrictId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editDistrictName,
          province: editDistrictProvince,
          region: editDistrictRegion,
          status: editDistrictStatus,
          description: editDistrictDescription,
          updated_at: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        showSuccess('อัปเดตเขตสำเร็จ!');
        setShowEditModal(false);
        fetchDistricts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'อัปเดตล้มเหลว');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDistrict = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/districts/${deleteDistrictId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        showSuccess('ลบเขตสำเร็จ!');
        setShowDeleteConfirm(false);
        fetchDistricts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'ลบเขตล้มเหลว');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-extrabold text-cyan-400">
          <MapPin className="inline-block w-9 h-9 mr-3 text-blue-400" />
          จัดการข้อมูลเขต
        </h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg hover:scale-105 transition">
          <PlusCircle className="w-5 h-5 mr-2" /> เพิ่มเขตใหม่
        </button>
      </div>

      {/* Messages */}
      {successMessage && <div className="mb-4 p-4 bg-green-700/50 rounded-lg flex items-center text-green-200"><CheckCircle className="w-6 h-6 mr-3" />{successMessage}</div>}
      {error && <div className="mb-4 p-4 bg-red-900/30 rounded-lg flex items-center text-red-300"><XCircle className="w-6 h-6 mr-3" />{error}</div>}

      {/* Table */}
      {!isLoading && (
        <div className="bg-gray-800/70 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">ชื่อเขต</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">จังหวัด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">ภูมิภาค</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">อัปเดตล่าสุด</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {districts.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4">{d.name}</td>
                  <td className="px-6 py-4">{d.province}</td>
                  <td className="px-6 py-4">{d.region}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      d.status === 'ดี' ? 'bg-green-100 text-green-800' :
                      d.status === 'ปกติ' ? 'bg-blue-100 text-blue-800' :
                      d.status === 'เตือน' ? 'bg-yellow-100 text-yellow-800' :
                      d.status === 'วิกฤติ' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{d.updated_at ? new Date(d.updated_at).toLocaleString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => {
                      setCurrentDistrict(d);
                      setEditDistrictId(d.id);
                      setEditDistrictName(d.name);
                      setEditDistrictProvince(d.province);
                      setEditDistrictRegion(d.region);
                      setEditDistrictStatus(d.status);
                      setEditDistrictDescription(d.description || '');
                      setShowEditModal(true);
                    }} className="text-blue-400 hover:text-blue-600 mr-3"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => {
                      setDeleteDistrictId(d.id);
                      setDeleteDistrictName(d.name);
                      setShowDeleteConfirm(true);
                    }} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">เพิ่มเขตใหม่</h3>
            <form onSubmit={handleAddDistrict} className="space-y-4">
              <input type="text" placeholder="ชื่อเขต" value={newDistrictName} onChange={(e) => setNewDistrictName(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <input type="text" placeholder="จังหวัด" value={newDistrictProvince} onChange={(e) => setNewDistrictProvince(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <input type="text" placeholder="ภูมิภาค" value={newDistrictRegion} onChange={(e) => setNewDistrictRegion(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <select value={newDistrictStatus} onChange={(e) => setNewDistrictStatus(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required>
                <option value="ดี">ดี</option>
                <option value="ปกติ">ปกติ</option>
                <option value="เตือน">เตือน</option>
                <option value="วิกฤติ">วิกฤติ</option>
              </select>
              <textarea placeholder="รายละเอียด" value={newDistrictDescription} onChange={(e) => setNewDistrictDescription(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg"></textarea>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 bg-gray-600 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 rounded-lg">เพิ่มเขต</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && currentDistrict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-lg">
            <h3 className="text-2xl font-bold text-cyan-400 mb-6 text-center">แก้ไขเขต: {currentDistrict.name}</h3>
            <form onSubmit={handleEditDistrict} className="space-y-4">
              <input type="text" value={editDistrictName} onChange={(e) => setEditDistrictName(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <input type="text" value={editDistrictProvince} onChange={(e) => setEditDistrictProvince(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <input type="text" value={editDistrictRegion} onChange={(e) => setEditDistrictRegion(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required />
              <select value={editDistrictStatus} onChange={(e) => setEditDistrictStatus(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg" required>
                <option value="ดี">ดี</option>
                <option value="ปกติ">ปกติ</option>
                <option value="เตือน">เตือน</option>
                <option value="วิกฤติ">วิกฤติ</option>
              </select>
              <textarea value={editDistrictDescription} onChange={(e) => setEditDistrictDescription(e.target.value)} className="w-full p-3 bg-gray-700 rounded-lg"></textarea>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 bg-gray-600 rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 rounded-lg">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-400 mb-4">ยืนยันการลบเขต?</h3>
            <p className="text-gray-300 mb-6">คุณต้องการลบเขต <span className="font-semibold text-white">{deleteDistrictName}</span> ใช่หรือไม่?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2 bg-gray-600 rounded-lg">ยกเลิก</button>
              <button onClick={handleDeleteDistrict} className="px-6 py-2 bg-red-600 rounded-lg">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DistrictManagementPage;
