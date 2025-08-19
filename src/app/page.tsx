'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const ModernAquaFlow: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleMouseMove = (e: { clientX: number; clientY: number; }) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 100);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  const [floatingStyles, setFloatingStyles] = useState<
  { left: string; top: string; animationDelay: string; animationDuration: string }[]
>([]);
useEffect(() => {
  const styles = [...Array(20)].map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 5}s`
  }));
  setFloatingStyles(styles);
}, []);
const router = useRouter()
const handleEnterWebsite = () => {

   router.push('/homeweb/Home');
  };


  const handleGoToAdmin = () => {
     router.push("/admin/login");
  };

  const features = [
    {
      icon: "💧",
      title: "Smart Monitoring",
      desc: "Real-time water quality tracking with IoT sensors",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: "📊",
      title: "Data Analytics",
      desc: "Advanced AI-powered analytics and predictions",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: "🌱",
      title: "Sustainability",
      desc: "Eco-friendly solutions for water conservation",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: "⚡",
      title: "Automation",
      desc: "Automated control systems and smart responses",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const stats = [
    { label: "Active Sensors", value: "2,847", suffix: "+" },
    { label: "Water Saved", value: "1.2M", suffix: "L" },
    { label: "Efficiency", value: "99.8", suffix: "%" },
    { label: "Users", value: "15K", suffix: "+" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden relative">
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)`
        }}
      />
      
      {/* Animated Background Patterns */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
  {floatingStyles.map((style, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float`}
      style={{
        left: style.left,
        top: style.top,
        animationDelay: style.animationDelay,
        animationDuration: style.animationDuration
      }}
    />
  ))}
</div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold">AquaFlow</span>
        </div>
        
       </header>
          

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        
        {/* Hero Section */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              AquaFlow
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Next-Generation Water Management System
            <br />
            <span className="text-blue-400">Powered by AI • Built for Sustainability</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        
            <button
          
              onClick={handleEnterWebsite}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <span>เข้าสู่ระบบ</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>

            <button
              onClick={handleGoToAdmin}
              className="group relative px-8 py-4 bg-slate-800/50 text-slate-300 font-semibold rounded-2xl border-2 border-slate-600 hover:border-slate-500 backdrop-blur-sm transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >

              <div className="absolute inset-0 bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Admin Panel</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Section */}
        

        {/* Features Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {features.map((feature, index) => (
            <div key={index} className="group p-8 rounded-3xl backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-slate-400 text-sm">
        <div className="flex justify-center items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>All Systems Operational</span>
          </div>
          <span>•</span>
          <span>© 2024 AquaFlow Technologies</span>
          <span>•</span>
          <span>Version 3.0.1</span>
        </div>
      </footer>

    
    </div>
  );
};

export default ModernAquaFlow;