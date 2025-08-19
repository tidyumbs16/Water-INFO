"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Cog, Droplets, Menu, Sparkles, X } from 'lucide-react';

const NavbarComponent: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '/', hasDropdown: false },
    { name: 'Another', href: '#', hasDropdown: true },
    { name: 'Contact', href: '#', hasDropdown: false },
  ];

  const serviceItems = [
    { name: 'Station point', href: '/station' },
    { name: 'Quality overview', href: '/overview' }
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl shadow-slate-900/20' 
          : 'bg-gradient-to-r from-slate-950/80 to-slate-900/80 backdrop-blur-xl'
      }`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-emerald-500/5 opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Brand */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0   rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
                <div className="relative p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-400/30 group-hover:border-cyan-400/50 transition-all duration-300">
                  <Droplets className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-emerald-300 transition-all duration-300">
                  AquaFlow
                </span>
                <span className="text-xs text-slate-400 font-medium tracking-wider opacity-80">
                  SMART SYSTEMS
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  {item.hasDropdown ? (
                    <div
                      className="relative"
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      <button className="flex items-center space-x-1 px-4 py-2 text-slate-300 hover:text-cyan-400 font-medium text-base transition-all duration-300 group-hover:bg-slate-800/50 rounded-xl">
                        <span>{item.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className={`absolute top-full left-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/50 transition-all duration-300 ${
                        isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                      }`}>
                        <div className="p-3 space-y-1">
                          {serviceItems.map((service, index) => (
                            <Link
                              key={service.name}
                              href={service.href}
                              className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all duration-200 group"
                            >
                              <div className="w-2 h-2 bg-cyan-400/50 rounded-full group-hover:bg-cyan-400 transition-colors duration-200"></div>
                              <span className="font-medium">{service.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      className="relative px-4 py-2 text-slate-300 hover:text-cyan-400 font-medium text-base transition-all duration-300 group"
                    >
                      <span className="relative z-10">{item.name}</span>
                      <div className="absolute inset-0 bg-slate-800/0 group-hover:bg-slate-800/50 rounded-xl transition-all duration-300"></div>
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Button & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Desktop CTA */}
             

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-xl transition-all duration-300"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
        isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}>
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setIsMobileMenuOpen(false)}></div>
        
        <div className={`absolute top-20 left-4 right-4 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-900/50 transition-all duration-500 ${
          isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
        }`}>
          <div className="p-6 space-y-4">
            {navItems.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-4 px-6 py-4 text-slate-300 hover:text-cyan-400 hover:bg-slate-700/50 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="w-2 h-2 bg-cyan-400/50 rounded-full"></div>
                <span className="font-medium text-lg">{item.name}</span>
              </a>
            ))}
            
            {/* Mobile CTA */}
            <div className="pt-4 border-t border-slate-700/50">
              <button className={`w-full relative group transition-all duration-500 ${
                isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`} style={{ transitionDelay: '400ms' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-30 group-hover:opacity-50"></div>
                <div className="relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-2xl hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-cyan-500/25">
                  <span className="flex items-center justify-center space-x-2">
                    <span>Get Started</span>
                    <Sparkles className="w-5 h-5" />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-20"></div>
    </>
  );
};

export default NavbarComponent;
