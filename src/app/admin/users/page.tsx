"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Loader2, X, CheckCircle, AlertCircle, Users, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminUser } from '../../interfaces/index'; // อิมพอร์ต AdminUser interface

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null); // สำหรับ Edit/Reset Password
UserManagementPage  
  // Form states for Add/Edit User
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('admin');
  const [formPassword, setFormPassword] = useState<string>(''); // สำหรับ Add User
  
  // Form states for Reset Password
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  const API_BASE_URL = 'http://localhost:3001/api/admin'; // URL ของ Backend Admin API

  useEffect(() => {
    fetchUsers();
  }, []);

 const fetchUsers = async () => {
  setIsLoading(true);
  setError(null);
  const token = localStorage.getItem('authToken');
  if (!token) {
    router.push('/admin/login');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    if (response.ok) {
      // *** แก้ไขตรงนี้: เข้าถึง data.data เพื่อให้ได้ Array ผู้ใช้
      if (data.success && Array.isArray(data.data)) { // ตรวจสอบอีกครั้งให้แน่ใจว่าเป็น Array
        setUsers(data.data);
      } else {
        // กรณีที่ API ตอบว่าสำเร็จ แต่ข้อมูลที่ได้มาไม่ใช่ Array หรือโครงสร้างผิดพลาด
        console.error("API returned success, but data.data is not an array or is missing:", data);
        setError("รูปแบบข้อมูลผู้ใช้ที่ได้รับไม่ถูกต้อง");
        setUsers([]); // ตั้งค่าเป็น Array ว่างเพื่อป้องกัน error .map
      }
    } else {
      // ส่วนนี้จัดการ Error Response จาก Backend
      setError(data.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('authToken');
        router.push('/admin/login');
      }
      setUsers([]); // ตั้งค่าเป็น Array ว่างในกรณีเกิด Error เพื่อให้แสดง "ไม่พบข้อมูลผู้ใช้"
    }
  } catch (err: any) { // เพิ่ม : any เพื่อให้ TypeScript จัดการกับ error ได้ง่ายขึ้น
    console.error('Error fetching users:', err);
    setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    setUsers([]); // ตั้งค่าเป็น Array ว่างในกรณี Network Error
  } finally {
    setIsLoading(false);
  }
};

  const openAddEditModal = (user: AdminUser | null = null) => {
    setCurrentUser(user);
    setFormUsername(user ? user.username : '');
    setFormEmail(user ? (user.email || '') : '');
    setFormRole(user ? user.role : 'admin');
    setFormPassword(''); // Clear password field for security
    setFormError(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const closeAddEditModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormRole('admin');
    setFormPassword('');
    setFormError(null);
    setSuccessMessage(null);
    fetchUsers(); // รีเฟรชข้อมูลหลังจากปิด Modal
  };

  const handleAddEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    let url: string;
    let method: string;
    let body: any;

    if (currentUser) { // Edit existing user
      url = `${API_BASE_URL}/users/${currentUser.id}`;
      method = 'PUT';
      body = { email: formEmail, role: formRole };
    } else { // Add new user
      url = `${API_BASE_URL}/users`;
      method = 'POST';
      body = { username: formUsername, password: formPassword, email: formEmail, role: formRole };
      if (!formPassword) {
        setFormError('ต้องระบุรหัสผ่านสำหรับผู้ใช้ใหม่');
        setFormLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
        // fetchUsers() will be called on modal close
      } else {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้');
      }
    } catch (err) {
      console.error('Error submitting user form:', err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
    }
  };

  const openResetPasswordModal = (user: AdminUser) => {
    setCurrentUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setFormError(null);
    setSuccessMessage(null);
    setIsResetPasswordModalOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setCurrentUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setFormError(null);
    setSuccessMessage(null);
    fetchUsers(); // รีเฟรชข้อมูลหลังจากปิด Modal
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmNewPassword) {
      setFormError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 6) { // กำหนดขั้นต่ำของรหัสผ่าน
        setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
    }

    setFormLoading(true);
    setFormError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
      } else {
        setFormError(data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบผู้ใช้ ID: ${userId}? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    setIsLoading(true); // แสดงโหลดรวม
    setError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('ลบผู้ใช้สำเร็จ');
        setTimeout(() => setSuccessMessage(null), 3000); // ซ่อนข้อความสำเร็จ
        fetchUsers(); // รีเฟรชรายการ
      } else {
        setError(data.message || 'ไม่สามารถลบผู้ใช้ได้');
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            router.push('/admin/login');
        }
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-cyan-400" />
        <p className="ml-3 text-lg text-slate-400">กำลังโหลดข้อมูลผู้ใช้...</p>
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
          onClick={fetchUsers}
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
          <Users className="mr-3 w-10 h-10 text-cyan-400" /> จัดการผู้ใช้
        </h1>
        <button
          onClick={() => openAddEditModal()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          <span>เพิ่มผู้ใช้ใหม่</span>
        </button>
      </header>

      {successMessage && (
        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 rounded-xl p-4 mb-6 flex items-center space-x-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <span>{successMessage}</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center p-10 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
          <p className="text-slate-400 text-lg">ยังไม่มีข้อมูลผู้ใช้ในระบบ</p>
          <button
            onClick={() => openAddEditModal()}
            className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg mx-auto"
          >
            <PlusCircle className="w-5 h-5" />
            <span>เพิ่มผู้ใช้คนแรกของคุณ</span>
          </button>
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
                  ชื่อผู้ใช้
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  อีเมล
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  บทบาท
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  สร้างเมื่อ
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {user.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    {new Date(user.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openAddEditModal(user)}
                      className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-200"
                      title="แก้ไข"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openResetPasswordModal(user)}
                      className="text-amber-400 hover:text-amber-300 mr-4 transition-colors duration-200"
                      title="รีเซ็ตรหัสผ่าน"
                    >
                      <KeyRound className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
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

      {/* Modal for Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={closeAddEditModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              {currentUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </h2>

            <form onSubmit={handleAddEditSubmit} className="space-y-6">
              <div>
                <label htmlFor="formUsername" className="block text-slate-300 text-sm font-medium mb-2">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  id="formUsername"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  disabled={!!currentUser || formLoading} // Username แก้ไขไม่ได้ ถ้าเป็นโหมดแก้ไข
                  required
                />
                {currentUser && <p className="text-sm text-slate-400 mt-1">ไม่สามารถแก้ไขชื่อผู้ใช้ได้</p>}
              </div>
              {!currentUser && ( // แสดงช่องรหัสผ่านเฉพาะตอนเพิ่มผู้ใช้ใหม่
                <div>
                  <label htmlFor="formPassword" className="block text-slate-300 text-sm font-medium mb-2">รหัสผ่าน</label>
                  <input
                    type="password"
                    id="formPassword"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    disabled={formLoading}
                    required={!currentUser} // Required only for new user
                  />
                </div>
              )}
              <div>
                <label htmlFor="formEmail" className="block text-slate-300 text-sm font-medium mb-2">อีเมล (ไม่บังคับ)</label>
                <input
                  type="email"
                  id="formEmail"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={formLoading}
                />
              </div>
              <div>
                <label htmlFor="formRole" className="block text-slate-300 text-sm font-medium mb-2">บทบาท</label>
                <select
                  id="formRole"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 appearance-none"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  disabled={formLoading}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  {/* เพิ่มบทบาทอื่นๆ ได้ตามต้องการ */}
                </select>
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
                <span>{currentUser ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มผู้ใช้'}</span>
              </button>
              <button
                type="button"
                onClick={closeAddEditModal}
                className="w-full mt-3 bg-slate-700/50 text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formLoading}
              >
                ยกเลิก
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Reset Password */}
      {isResetPasswordModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={closeResetPasswordModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              รีเซ็ตรหัสผ่านสำหรับ {currentUser.username}
            </h2>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-slate-300 text-sm font-medium mb-2">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-slate-300 text-sm font-medium mb-2">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={formLoading}
                  required
                />
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
                <span>รีเซ็ตรหัสผ่าน</span>
              </button>
              <button
                type="button"
                onClick={closeResetPasswordModal}
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

export default UserManagementPage;
