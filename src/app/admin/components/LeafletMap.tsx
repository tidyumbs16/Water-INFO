"use client";
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ Mapping ชื่อภาคจากภาษาอังกฤษเป็นภาษาไทย
const regionNameTH: Record<string, string> = {
  UpperNorth: "ภาคเหนือตอนบน",
  LowerNorth: "ภาคเหนือตอนล่าง",
  Northeast: "ภาคตะวันออกเฉียงเหนือ",
  Central: "ภาคกลาง",
  East: "ภาคตะวันออก",
  West: "ภาคตะวันตก",
  South: "ภาคใต้",
};

// ✅ ฟังก์ชันสำหรับกำหนดสีของแต่ละภาค
const getRegionColor = (region: string) => {
  switch (region) {
    case "UpperNorth":
    case "LowerNorth":
      return "#3b82f6"; // ฟ้า
    case "Northeast":
      return "#a16207"; // น้ำตาล
    case "Central":
      return "#16a34a"; // เขียว
    case "East":
      return "#d97706"; // ส้ม
    case "West":
      return "#6366f1"; // ม่วง
    case "South":
      return "#dc2626"; // แดง
    default:
      return "#9ca3af"; // เทา (fallback)
  }
};

const ThailandRegionsPage: React.FC = () => {
  // สร้าง state เพื่อเก็บ instance ของแผนที่
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    // ✅ สร้างแผนที่และเพิ่ม Tile Layer
    // การสร้างแผนที่ควรเกิดขึ้นเพียงครั้งเดียวเมื่อคอมโพเนนต์ถูก mount
    const map = L.map("map").setView([13.7563, 100.5018], 6);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // เมื่อแผนที่ถูกสร้างเสร็จแล้ว ให้บันทึก instance ลงใน state
    setMapInstance(map);

    // ฟังก์ชัน cleanup เพื่อลบแผนที่เมื่อคอมโพเนนต์ถูก unmount
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []); // [] เพื่อให้ useEffect ทำงานครั้งเดียว

  useEffect(() => {
    // ✅ โหลด GeoJSON และเพิ่ม Legend เมื่อ mapInstance พร้อมใช้งาน
    if (!mapInstance) return;

    fetch("/geo/reg_nesdb.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch GeoJSON data.");
        }
        return res.json();
      })
      .then((data) => {
        L.geoJSON(data, {
          style: (feature: any) => ({
            fillColor: getRegionColor(feature?.properties?.reg_nesdb),
            weight: 1,
            color: "black",
            fillOpacity: 0.5,
          }),
          onEachFeature: (feature, layer) => {
            const regionEn = feature?.properties?.reg_nesdb;
            const regionTh = regionNameTH[regionEn] || regionEn;
            layer.bindPopup(`<b>ภูมิภาค:</b> ${regionTh}`);
          },
        }).addTo(mapInstance);

        // ✅ สร้าง Legend และเพิ่มลงในแผนที่ที่นี่
        // โค้ดส่วนนี้จะทำงานก็ต่อเมื่อ GeoJSON ถูกโหลดและเพิ่มลงในแผนที่แล้วเท่านั้น
        const legend = (L.control as any)({ position: "bottomright" });
        legend.onAdd = function (): HTMLElement {
          const div = L.DomUtil.create("div", "info legend bg-white p-2 rounded shadow");
          div.innerHTML = "<h4>ภูมิภาค</h4>";
          Object.entries(regionNameTH).forEach(([en, th]) => {
            div.innerHTML += `
              <i style="background:${getRegionColor(en)};
                        width:12px;height:12px;display:inline-block;margin-right:5px;"></i>
              ${th}<br/>`;
          });
          return div;
        };
        legend.addTo(mapInstance);

        // ฟังก์ชัน cleanup สำหรับการลบ Legend เมื่อ mapInstance เปลี่ยนแปลงหรือคอมโพเนนต์ถูก unmount
        return () => {
          if (mapInstance && mapInstance.addControl(legend)) {
            mapInstance.removeControl(legend);
          }
        };
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, [mapInstance]); // กำหนดให้ useEffect นี้ทำงานเมื่อ mapInstance เปลี่ยนแปลง

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">
        แผนที่ภูมิภาคของประเทศไทย
      </h1>
      {/* Container สำหรับแผนที่ */}
      <div id="map" style={{ height: "600px", width: "100%" }}></div>
    </div>
  );
};

export default ThailandRegionsPage;
