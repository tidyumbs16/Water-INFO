// app/admin/login/page.tsx
'use client';

import React, { useState } from 'react';
import { LogIn, User, Lock, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError(null);

    console.log('Attempting login for username:', username);

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Backend response for login:', data); // Debug 2: ดูว่า Backend ส่งอะไรกลับมา

      if (response.ok) { // Status Code 2xx
        if (data.token) {
          console.log('Login successful! Token received.');
          localStorage.setItem('authToken', data.token); // เก็บ JWT Token
          console.log('Token stored in localStorage:', localStorage.getItem('authToken')); // ตรวจสอบว่าเก็บได้จริงไหม
          
          router.push('/admin'); // Redirect ไปหน้า Sensors
        } else {
          setError('เข้าสู่ระบบสำเร็จ แต่ไม่ได้รับ Token จากเซิร์ฟเวอร์');
          console.warn('Login successful, but no token received:', data);
        }
      } else {
        // Handle API errors (e.g., 401 Unauthorized)
        setError(data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        console.warn('Login failed:', data.message);
      }
    } catch (err: any) {
      console.error('Network or server error during login:', err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
      console.log('Login process finished.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-lg p-8 md:p-10">
        <div className="text-center mb-8">
          <LogIn className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-4xl font-bold text-white mb-2">Admin Login</h2>
          <p className="text-slate-400">เข้าสู่ระบบเพื่อจัดการระบบ AquaFlow</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-slate-300 text-sm font-medium mb-2">ชื่อผู้ใช้</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="username"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-200"
                placeholder="admin"
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
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all duration-200"
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2 w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
            ยังไม่มีบัญชี?{' '}
            <a href="/admin/register" className="text-emerald-400 hover:underline transition-colors duration-200 flex items-center justify-center mt-2">
              <UserPlus className="w-4 h-4 mr-1" /> ลงทะเบียนที่นี่
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;