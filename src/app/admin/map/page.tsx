"use client";

import React from "react";
import dynamic from "next/dynamic";

// ✅ import แบบ dynamic ไม่ใช้ SSR ป้องกัน window is not defined
const ThailandRegionsMap = dynamic(
  () => import("../components/LeafletMap"),
  { ssr: false }
);

const MapPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🗺️ แผนที่ประเทศไทย</h1>
      <ThailandRegionsMap />
    </div>
  );
};

export default MapPage;
