import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  transpilePackages: ["@heroui/dom-animation"],
  images: {
    domains: ["placehold.co"],
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ ไม่ block build เวลาเจอ ESLint error
  },
  webpack: (config) => {
    // ให้ webpack เข้าใจ alias ตาม tsconfig.json
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.alias["@scripts"] = path.resolve(__dirname, "scripts");
    config.resolve.alias["@lib"] = path.resolve(__dirname, "lib");
    return config;
  },
};

export default nextConfig;
