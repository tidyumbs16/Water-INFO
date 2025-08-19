"use client";
import React, { useState } from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import Footer from "../../../../components/footer";
import WaterDashboard from "../../../../components/waterdashboard/Waterdashboard";
import NavbarComponent from "@/components/navbar";
import DailyMetricsViewer from "../../../../components/DailyMetricsViewer";

const Home: React.FC = () => {
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  return (
    <HeroUIProvider>
      <ToastProvider />
      {/* ทำให้ layout เป็น flex-column เต็มจอ */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 text-white relative overflow-hidden">
        
        {/* Navbar */}
        <NavbarComponent />

        {/* Main content */}
        <main className="flex-grow relative z-10 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center py-8">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-800 bg-clip-text text-transparent">
                Water Management Dashboard
              </h1>
            </div>

            <div className="backdrop-blur-sm bg-white/70 rounded-3xl shadow-xl border border-white/20 p-6 md:p-8">
              {/* ส่ง setSelectedDistrictId ลงไปใน WaterDashboard */}
              <WaterDashboard onDistrictSelect={setSelectedDistrictId} />
          
            </div>
          </div>
        </main>

        {/* Footer ติดล่าง */}
        <Footer />
      </div>
    </HeroUIProvider>
  );
};

export default Home;
