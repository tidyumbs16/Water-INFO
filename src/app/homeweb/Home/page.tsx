"use client"

import React from 'react';
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import Footer from '../../../../components/footer';
import WaterDashboard from '../../../../components/waterdashboard/Waterdashboard';
import NavbarComponent from '@/components/navbar';


// Mock data has been removed from here.
// initialDistricts, initialMetrics, monitoringPointsData, recentAlertsData
// are no longer defined directly in this component.

const Home: React.FC = () => {
  return (
    <HeroUIProvider>
      <ToastProvider />
      <div className="min-h-screen bg-gradient-to-br  from-blue-100 to-indigo-200 text-white relative overflow-hidden p-8">
        {/* Animated background elements for visual appeal */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-indigo-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-sky-200/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='7' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3Ccircle cx='7' cy='53' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}>
          </div>
        </div>
<NavbarComponent />
        {/* Main content area, layered above background */}
        <main className="flex-grow relative z-10">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header section with branding */}
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent">
                    Water Management Dashboard
                  </h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                  ระบบติดตามและจัดการคุณภาพน้ำแบบเรียลไทม์สำหรับการบริหารจัดการที่มีประสิทธิภาพ
                </p>
              </div>

              <div className="space-y-8">
                {/* Main Water Dashboard component. 
                    It must now handle its own data fetching for initialDistricts and initialMetrics. */}
                <div className="backdrop-blur-sm bg-white/70 rounded-3xl shadow-xl border border-white/20 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:bg-white/80">
                  <WaterDashboard />
                </div>

               
              </div>

              {/* System status indicator */}
              <div className="flex justify-center py-4">
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">ระบบทำงานปกติ</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer component */}
        <div className="relative z-20">
       
        </div>
      </div>
        <Footer />
    </HeroUIProvider>
    
  );
};

export default Home;
