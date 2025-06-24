import { GiWaterfall } from "react-icons/gi";
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaHeart } from "react-icons/fa";
import { MdEmail, MdPhone, MdLocationOn } from "react-icons/md";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white w-400 h-76 mt-50">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"></div>
      
      {/* Main footer content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-lg group-hover:bg-cyan-400/40 transition-all duration-300"></div>
                <i className="relative text-3xl text-cyan-400 transform group-hover:scale-110 transition-all duration-300">
                  <GiWaterfall />
                </i>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                WATER INFO
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted source for comprehensive water information, conservation tips, and environmental awareness.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: FaTwitter, color: "hover:text-blue-400", href: "https://twitter.com" },
                { icon: FaFacebook, color: "hover:text-blue-600", href: "https://facebook.com" },
                { icon: FaInstagram, color: "hover:text-pink-500", href: "https://instagram.com" },
                { icon: FaLinkedin, color: "hover:text-blue-500", href: "https://linkedin.com" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className={`text-gray-400 ${social.color} transition-all duration-300 transform hover:scale-125 hover:-translate-y-1`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Water Conservation", href: "/conservation" },
                { name: "Blog", href: "/blog" },
                { name: "Resources", href: "/resources" }
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 text-sm hover:translate-x-1 transform inline-block"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Services</h4>
            <ul className="space-y-2">
              {[
                "Water Quality Testing",
                "Conservation Consulting",
                "Environmental Reports",
                "Education Programs",
                "Research & Analysis"
              ].map((service, index) => (
                <li key={index}>
                  <span className="text-gray-400 text-sm hover:text-cyan-400 transition-colors duration-300 cursor-pointer hover:translate-x-1 transform inline-block">
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <MdEmail className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" size={16} />
                <a href="mailto:info@waterinfo.com" className="hover:text-cyan-400 transition-colors duration-300">
                  info@waterinfo.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm group">
                <MdPhone className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" size={16} />
                <a href="tel:+1234567890" className="hover:text-cyan-400 transition-colors duration-300">
                  +1 (234) 567-890
                </a>
              </div>
              <div className="flex items-start gap-3 text-gray-400 text-sm group">
                <MdLocationOn className="text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300 mt-0.5" size={16} />
                <span className="leading-relaxed">
                  123 Water Street<br />
                  Bangkok, Thailand 10110
                </span>
              </div>
            </div>
          </div>
        </div>

</div>
        

    

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-indigo-500 rounded-full blur-2xl"></div>
      </div>
    </footer>
  );
}