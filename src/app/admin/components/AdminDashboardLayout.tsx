// src/app/admin/components/AdminDashboardLayout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  Menu, X, LayoutDashboard, Users, MapPin, Bell, Activity, Settings, LogOut, Database, Home, AlertCircle, BarChart3, FileText, Shield, ChevronLeft, ChevronRight, Search, RefreshCw, Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Auth } from 'firebase/auth'; // Import Auth type from Firebase

// Import your page components
import AquaNextDashboard from '../dashboard/page';
import DistrictManagementPage from '../districts/page';
import UserManagementPage from '../users/page';
import SensorManagementPage from '../sensors/page';
import AnalyticsPage from '../analytics/page';
import AlertsLogPage from '../alerts-log/page'; // Not used in renderPageContent, but imported
import AlertManagementPage from '../alerts/page';

// Define the type for the props that will be passed from _app.tsx (or parent)
interface AdminDashboardLayoutProps {
  auth?: Auth | null;   // Firebase Auth instance (optional, as per user's request not to interfere with DB)
  userId?: string | null; // Current user ID (optional)
  // db?: Firestore | null; // Firestore instance - explicitly not used here as per user's request
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ auth, userId }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState<string>('dashboard'); // Default active page
  const router = useRouter();

  const navItems = [
    { id: 'dashboard', label: 'ภาพรวม Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'sensors', label: 'จัดการข้อมูล Sensors', icon: <Database className="w-5 h-5" /> },
    { id: 'analytics', label: 'วิเคราะห์ข้อมูล', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'users', label: 'จัดการADMIN', icon: <Users className="w-5 h-5" /> },
    { id: 'districts', label: 'จัดการเขต', icon: <MapPin className="w-5 h-5" /> },
    { id: 'alerts', label: 'การแจ้งเตือน', icon: <Bell className="w-5 h-5" /> }
  ];

  // Function to handle navigation
  const handleNavigate = (page: string) => {
    setActivePage(page);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };

  // Function to handle user logout
  const handleLogout = async () => {
    // First, attempt Firebase signOut if auth instance is provided
    if (auth) {
      try {
        await auth.signOut();
        console.log('Firebase user signed out successfully.');
      } catch (error) {
        console.error('Error signing out from Firebase:', error);
        // Continue with local storage clear even if Firebase signOut fails
      }
    }

    // Always clear JWT token from local storage
    localStorage.removeItem('authToken');
    console.log('JWT token removed from local storage.');

    // Redirect to login page
    router.push('/admin/login');
  };

  // Dynamically render page content based on activePage state
  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <AquaNextDashboard />;
      case 'users':
        return <UserManagementPage />;
      case 'districts':
        return <DistrictManagementPage />;
      case 'sensors':
        return <SensorManagementPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'alerts':
        return <AlertManagementPage />;
      default:
        return <AquaNextDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-inter">
      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800/95 backdrop-blur-lg border-r border-gray-700/50 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo/Title */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-cyan-400">AquaFlow Admin</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow">
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200
                      ${activePage === item.id
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    <span className="ml-3 font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* User ID Display (if provided) */}
          {userId && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg text-sm text-gray-300 break-words">
              เข้าสู่ระบบในฐานะ: <span className="font-semibold text-cyan-300">{userId}</span>
            </div>
          )}

          {/* Logout Button */}
          <div className="mt-auto pt-6 border-t border-gray-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-xl text-red-300 hover:bg-red-900/30 hover:text-red-100 transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>


      <div className="flex-1 lg:ml-64 flex flex-col">

        <header className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50 p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 mr-4"
              title="เปิดเมนู"
              aria-label="Open sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-cyan-400">Welcome ADMIN</h1>
          </div>

        </header>


        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPageContent()}
        </main>
      </div>
    </div>

  );
};

export default AdminDashboardLayout;
