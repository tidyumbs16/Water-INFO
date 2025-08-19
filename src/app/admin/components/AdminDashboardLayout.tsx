// src/app/admin/components/AdminDashboardLayout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
    Menu, X, LayoutDashboard, Users, MapPin, Bell, Activity, Settings, LogOut, Database, Home, AlertCircle, BarChart3, FileText, Shield, ChevronLeft, ChevronRight, Search, RefreshCw, Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Auth } from 'firebase/auth'; // Import Auth type from Firebase
import Image from 'next/image';
import { jwtDecode } from "jwt-decode"; // For decoding JWT tokens

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

// A placeholder for the admin's profile picture or logo.
// You should replace this with a real image URL or component.
const adminAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoaWVsZC11c2VyLWljb24gbHVjaWRlLXNoaWVsZC11c2VyIj48cGF0aCBkPSJNMjAgMTNjMCA1LTMuNSA3LjUtNy42NiA4Ljk1YTEgMSAwIDAgMS0uNjctLjAxQzcuNSAyMC41IDQgMTggNCAxM1Y2YTEgMSAwIDAgMSAxLTFjMiAwIDQuNS0xLjIgNi4yNC0yLjcyYTEuMTcgMS4xNyAwIDAgMSAxLjUyIDBDMTQuNTEgMy44MSAxNyA1IDE5IDVhMSAxIDAgMCAxIDEgMXoiLz48cGF0aCBkPSJNNi4zNzYgMTguOTFhNiA2IDAgMCAxIDExLjI0OS4wMDMiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjExIiByPSI0Ii8+PC9zdmc+';


const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ auth, userId }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState<string>('dashboard'); // Default active page
    const [adminUsername, setAdminUsername] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Fetch username from a stored token after login
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                // Correct way to decode the token without .default
                const decodedToken: { username: string } = jwtDecode(token);
                setAdminUsername(decodedToken.username);
            } catch (error) {
                console.error('Failed to decode token:', error);
                // Optionally, clear the invalid token
                localStorage.removeItem('authToken');
            }
        }
    }, []);

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
      <div className="flex min-h-screen bg-gray-100 text-gray-800 font-inter">
        {/* Mobile Menu Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}
        >
          <div className="p-6 flex flex-col h-full">
            {/* Logo/Title */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-sky-600">
                AquaFlow Admin
              </h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
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
                      ${
                        activePage === item.id
                          ? "bg-sky-100 text-sky-600 font-semibold border-l-4 border-sky-500"
                          : "text-gray-500 hover:bg-gray-200 hover:text-gray-800 transform hover:translate-x-1"
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
              <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-500 break-words">
                เข้าสู่ระบบในฐานะ:{" "}
                <span className="font-semibold text-sky-600">{userId}</span>
              </div>
            )}

            {/* Logout Button */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center w-full p-3 rounded-xl text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 mr-3" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 lg:ml-64 flex flex-col">
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 mr-4"
                title="เปิดเมนู"
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-sky-600">ยินดีต้อนรับ</h1>
            </div>
            {/* Updated Welcome Section with Avatar and Username, now aligned to the right */}
            {adminUsername && (
              <div className="flex items-center space-x-3">
                <Image
                  src={adminAvatar}
                  alt="Admin Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <p className="text-lg font-semibold text-gray-600 ">
                  {adminUsername}
                </p>
              </div>
            )}
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {renderPageContent()}
          </main>
        </div>
      </div>
    );
};

export default AdminDashboardLayout;
