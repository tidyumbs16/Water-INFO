import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  transpilePackages: ['@heroui/dom-animation'],
   images: {
    domains: ['placehold.co'],
  },
  
};

module.exports = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};


