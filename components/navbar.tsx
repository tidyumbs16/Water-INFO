"use client"
import Link from 'next/link';
import { GiWaterfall } from "react-icons/gi";
import { useState } from 'react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Backdrop blur effect */}
      <div className="fixed top-0 left-0 right-0 z-40  bg-gradient-to-b from-black/8 to-transparent backdrop-blur-sm h-24"></div>
      
      {/* Main Navbar */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50  max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-center p-4 text-white bg-gradient-to-r from-cyan-400/85 to-blue-500/85 backdrop-blur-xl rounded-2xl shadow-xl border border-white/15 hover:shadow-cyan-500/20 transition-all duration-500 hover:scale-[1.015]">
          
          {/* Brand/Logo Section with Animation */}
          <div className="flex items-center gap-3 group cursor-pointer ">
            <div className="relative">
              <div className="absolute inset-0 bg-white/15 rounded-full blur-xl group-hover:bg-cyan-300/30 transition-all duration-300"></div>
              <i className="relative text-4xl text-white flex-shrink-0 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 drop-shadow-lg ">
                <GiWaterfall title="Waterfall Icon" />
              </i>
            </div>
            <div className="flex  text-xl font-bold tracking-wider bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent group-hover:from-cyan-100 group-hover:to-white transition-all duration-300">
              WATER INFO
            </div>
          </div>

      
            
          </div>
      </nav>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}