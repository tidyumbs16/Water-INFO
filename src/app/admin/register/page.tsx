"use client";

import React, { useState } from 'react';
import { UserPlus, User, Lock, Mail, Briefcase, Loader2, AlertCircle, CheckCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AdminRegisterPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<string>('admin'); // Default role
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/admin/register', { // URL ของ Backend API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email, role }),
      });

      const data = await response.json();

      if (response.ok) { // Status Code 2xx
        setSuccessMessage('ลงทะเบียนผู้ดูแลระบบสำเร็จ! คุณสามารถเข้าสู่ระบบได้แล้ว');
        setUsername('');
        setPassword('');
        setEmail('');
        setRole('admin');
        // อาจจะรอสักครู่แล้ว redirect ไปหน้า Login
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (err) {
      console.error('Register error:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-lg p-8 md:p-10">
        <div className="text-center mb-8">
          <UserPlus className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
          <h2 className="text-4xl font-bold text-white mb-2">Admin Register</h2>
          <p className="text-slate-400">สร้างบัญชีผู้ดูแลระบบ AquaFlow</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-slate-300 text-sm font-medium mb-2">ชื่อผู้ใช้</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="username"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                id="password"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">อีเมล (ไม่บังคับ)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                id="email"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-slate-300 text-sm font-medium mb-2">บทบาท</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                id="role"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                {/* สามารถเพิ่มบทบาทอื่นๆ ได้ที่นี่ */}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center text-emerald-400 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-sm animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            มีบัญชีอยู่แล้ว?{' '}
            <a href="/admin/login" className="text-cyan-400 hover:underline transition-colors duration-200 flex items-center justify-center mt-2">
              <LogIn className="w-4 h-4 mr-1" /> เข้าสู่ระบบที่นี่
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
