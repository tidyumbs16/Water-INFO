"use client";
import React from "react";
import { Link, Divider } from "@heroui/react";
import dynamic from "next/dynamic";

// ใช้ dynamic import สำหรับ Iconify
const Icon = dynamic(() => import("@iconify/react").then(m => m.Icon), {
  ssr: false,
});

const Footer: React.FC = () => {
  return (
    <footer className="relative mt-16 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden pt-12 pb-8 animate-[fadeInUp_0.8s_ease-in-out]">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-20 w-32 h-32 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-16 w-24 h-24 bg-purple-400 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-cyan-400 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 p-7">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                <Icon icon="material-symbols:water-drop" className="text-white text-lg" />
              </div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                AQUA FLOW
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-300 max-w-sm mx-auto md:mx-0">
              แพลตฟอร์มที่ขับเคลื่อนด้วยข้อมูล เพื่อการบริหารจัดการน้ำที่ชาญฉลาดและยั่งยืนสำหรับทุกคน
            </p>
            <div className="flex justify-center md:justify-start space-x-3 pt-2">
              {[
                { icon: "logos:facebook", label: "Facebook", color: "hover:text-blue-400" },
                { icon: "logos:twitter", label: "Twitter", color: "hover:text-sky-400" },
                { icon: "logos:instagram-icon", label: "Instagram", color: "hover:text-pink-400" },
                { icon: "logos:linkedin-icon", label: "LinkedIn", color: "hover:text-blue-500" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href="#"
                  aria-label={item.label}
                  className={`transform hover:scale-110 transition-all duration-300 ${item.color} p-2 rounded-lg hover:bg-white/10`}
                >
                  <Icon icon={item.icon} className="text-2xl" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-300 flex items-center justify-center md:justify-start">
              <Icon icon="material-symbols:link" className="mr-2" />
              ลิงก์ด่วน
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { name: "Dashboard", icon: "material-symbols:dashboard" },
                { name: "เกี่ยวกับเรา", icon: "material-symbols:info" },
                { name: "บริการของเรา", icon: "material-symbols:room-service" },
                { name: "นโยบายความเป็นส่วนตัว", icon: "material-symbols:privacy-tip" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href="#"
                    className="flex items-center justify-center md:justify-start space-x-2 text-gray-300 hover:text-cyan-300 transition-all duration-300 hover:translate-x-1 p-2 rounded-md hover:bg-white/5"
                  >
                    <Icon icon={link.icon} className="text-sm" />
                    <span>{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-cyan-300 flex items-center justify-center md:justify-start">
              <Icon icon="material-symbols:contact-mail" className="mr-2" />
              ติดต่อเรา
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start justify-center md:justify-start space-x-2 p-3 rounded-lg bg-white/5 backdrop-blur-sm">
                <Icon icon="material-symbols:location-on" className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="leading-relaxed">
                    สำนักงานใหญ่: 123 ถนนแห่งน้ำ<br />
                    แขวงประปา, เขตน้ำใส<br />
                    กรุงเทพมหานคร 10100
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Icon icon="material-symbols:mail" className="text-cyan-400" />
                  <span>info@aquaflow.com</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Icon icon="material-symbols:phone" className="text-cyan-400" />
                  <span>+66 81 234 5678</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider className="my-8 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Copyright */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-gray-400 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
            <Icon icon="material-symbols:copyright" className="text-cyan-400" />
            <span>&copy; {new Date().getFullYear()} AQUA FLOW. สงวนลิขสิทธิ์ทั้งหมด</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
