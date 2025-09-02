"use client";
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const regionNameTH: Record<string, string> = {
  UpperNorth: "ภาคเหนือ",
  LowerNorth: "ภาคเหนือ", // รวมกับตอนบน
  Northeast: "ภาคตะวันออกเฉียงเหนือ",
  Central: "ภาคกลาง",
  East: "ภาคตะวันออก",
  West: "ภาคตะวันตก",
  South: "ภาคใต้",
};

const getRegionColor = (region: string) => {
  switch (region) {
    case "UpperNorth":
    case "LowerNorth":
      return "#3b82f6";
    case "Northeast":
      return "#a16207";
    case "Central":
      return "#16a34a";
    case "East":
      return "#d97706";
    case "West":
      return "#6366f1";
    case "South":
      return "#dc2626";
    default:
      return "#9ca3af";
  }
};

interface District {
  id: string;
  name: string;
  province: string;
  region: string;
  status: string;
  description: string;
}

interface Metric {
  water_quality: string;
  water_volume: string;
  pressure: string;
  efficiency: string;
}

interface Sensor {
  id: string;
  district_id: string;
  sensor_type: string;
  value: string | null;
  unit: string;
  status: string;
  last_update: string;
  description?: string;
}

const ThailandRegionsPage: React.FC = () => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown states
  const [statusFilter, setStatusFilter] = useState<string>("ทั้งหมด");
  const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>(null);
  const [districtMetrics, setDistrictMetrics] = useState<Record<string, Metric>>({});
  const [districtSensors, setDistrictSensors] = useState<Record<string, Sensor[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Init map
  useEffect(() => {
    const map = L.map("map").setView([13.7563, 100.5018], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    setMapInstance(map);

    return () => {
      map.remove();
    };
  }, []);

  // Load GeoJSON
  useEffect(() => {
    if (!mapInstance) return;

    fetch("/geo/reg_nesdb.geojson")
      .then((res) => res.json())
      .then((data) => {
        const regionLayers: L.Layer[] = [];

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

            regionLayers.push(layer);

            layer.on("mouseover", () => {
              (layer as any).setStyle({
                weight: 3,
                color: "#ff0000",
                fillOpacity: 0.7,
              });
            });
            layer.on("mouseout", () => {
              (layer as any).setStyle({
                weight: 1,
                color: "black",
                fillOpacity: 0.5,
              });
            });

            layer.on("click", () => {
              setSelectedRegion(regionTh);
              setError(null);

              regionLayers.forEach((l: any) =>
                l.setStyle({ weight: 1, color: "black", fillOpacity: 0.5 })
              );
              (layer as any).setStyle({
                weight: 3,
                color: "#ffb300",
                fillOpacity: 0.8,
              });

              setLoading(true);
              fetch(`/api/admin/district-map?region=${regionEn}`)
                .then((res) => {
                  if (!res.ok) throw new Error("โหลดข้อมูลเขตไม่สำเร็จ");
                  return res.json();
                })
                .then((data: District[]) => {
                  setDistricts(Array.isArray(data) ? data : []);
                })
                .catch((err) => {
                  console.error("Error fetching districts:", err.message);
                  setError(err.message);
                  setDistricts([]);
                })
                .finally(() => setLoading(false));
            });

            layer.bindTooltip(`${regionTh}`, {
              permanent: false,
              direction: "center",
              className: "custom-tooltip",
            });
          },
        }).addTo(mapInstance);
      });
  }, [mapInstance]);

  // Refetch metrics & sensors
  const fetchDistrictData = (districtId: string, date: string) => {
    // metrics
    fetch(`/api/admin/district-metrics-daily?districtId=${districtId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setDistrictMetrics((prev) => ({ ...prev, [districtId]: data }));
      })
      .catch((err) => console.error("Error fetching metrics:", err));

    // sensors
    fetch(`/api/admin/sensors-map?districtId=${districtId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setDistrictSensors((prev) => ({ ...prev, [districtId]: data }));
      })
      .catch((err) => console.error("Error fetching sensors:", err));
  };

  const toggleDistrict = (district: District) => {
    setExpandedDistrictId((prev) => (prev === district.id ? null : district.id));
    if (expandedDistrictId !== district.id) {
      fetchDistrictData(district.id, selectedDate);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Map */}
      <div className="flex-1 border">
        <div id="map" style={{ height: "100%", width: "100%" }}></div>
      </div>

      {/* Sidebar */}
      <div className="w-96 border-l bg-gray-50 p-4 flex flex-col h-full">
        <h2 className="text-lg font-bold mb-2">📌 รายชื่อเขต</h2>

        {selectedRegion ? (
          <>
            <h3 className="font-semibold text-blue-600 mb-3">{selectedRegion}</h3>

            {/* Date Picker */}
            <div className="mb-3">
              <label className="text-sm font-medium mr-2">เลือกวันที่:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["ดี", "ปกติ", "เตือน", "วิกฤติ"].map((status) => {
                const count = districts.filter((d) => d.status === status).length;
                return (
                  <div
                    key={status}
                    className="p-3 bg-white rounded-md shadow text-center border"
                  >
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-gray-600 text-sm">{status}</p>
                  </div>
                );
              })}
            </div>

            {/* Filter */}
            <div className="mb-4">
              <label className="text-sm font-medium mr-2">แสดงสถานะ:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="ดี">ดี</option>
                <option value="ปกติ">ปกติ</option>
                <option value="เตือน">เตือน</option>
                <option value="วิกฤติ">วิกฤติ</option>
              </select>
            </div>

            {/* District List */}
            <ul className="space-y-2 mt-2 flex-1 overflow-y-auto">
              {districts
                .filter((d) =>
                  statusFilter === "ทั้งหมด" ? true : d.status === statusFilter
                )
                .map((d) => {
                  const statusColor =
                    d.status === "ดี"
                      ? "bg-green-600"
                      : d.status === "ปกติ"
                      ? "bg-blue-600"
                      : d.status === "เตือน"
                      ? "bg-orange-500"
                      : "bg-red-600";

                  return (
                    <li key={d.id} className="border rounded-md bg-white shadow-sm">
                      {/* District header */}
                      <div
                        className="flex justify-between items-center p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleDistrict(d)}
                      >
                        <span className="font-medium">{d.name}</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full text-white ${statusColor}`}
                        >
                          {d.status}
                        </span>
                      </div>

                      {/* Dropdown */}
                      {expandedDistrictId === d.id && (
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-t animate-slideDown rounded-b-lg">
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">จังหวัด:</span>{" "}
                              {d.province}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">รายละเอียด:</span>{" "}
                              {d.description || "-"}
                            </p>
                          </div>

                          {/* Refetch button */}
                          <div className="flex justify-end mb-3">
                            <button
                              onClick={() => fetchDistrictData(d.id, selectedDate)}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 hover:scale-105 transition-all duration-200"
                            >
                              🔄 โหลดใหม่
                            </button>
                          </div>

                          {/* Metrics */}
                          <div className="p-3 bg-white rounded-lg border shadow-sm mb-3">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
                              📊 ข้อมูล Metrics
                            </h4>
                            {districtMetrics[d.id] ? (
                              <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                                <div className="p-2 rounded bg-gray-50 border">
                                  <b>คุณภาพน้ำ:</b>{" "}
                                  {districtMetrics[d.id]?.water_quality ?? "-"}
                                </div>
                                <div className="p-2 rounded bg-gray-50 border">
                                  <b>ปริมาณน้ำ:</b>{" "}
                                  {districtMetrics[d.id]?.water_volume ?? "-"}
                                </div>
                                <div className="p-2 rounded bg-gray-50 border">
                                  <b>แรงดัน:</b>{" "}
                                  {districtMetrics[d.id]?.pressure ?? "-"}
                                </div>
                                <div className="p-2 rounded bg-gray-50 border">
                                  <b>ประสิทธิภาพ:</b>{" "}
                                  {districtMetrics[d.id]?.efficiency ?? "-"}
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-400 italic text-sm">
                                ไม่มีข้อมูล
                              </p>
                            )}
                          </div>

                          {/* Sensors */}
                          <div className="p-3 bg-white rounded-lg border shadow-sm">
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                              🔧 รายการ Sensors
                            </h4>
                            {districtSensors[d.id]?.length > 0 ? (
                              <ul className="space-y-2">
                                {districtSensors[d.id].map((s) => (
                                  <li
                                    key={s.id}
                                    className="p-3 border rounded-lg bg-gray-50 shadow-sm hover:bg-gray-100 transition"
                                  >
                                    <p className="font-medium text-gray-800">
                                      {s.sensor_type}{" "}
                                      <span className="text-xs text-gray-500">
                                        ({s.unit})
                                      </span>
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      ค่า: {s.value ?? "-"}
                                    </p>
                                    <p
                                      className={`text-sm font-semibold ${
                                        s.status === "normal"
                                          ? "text-green-600"
                                          : s.status === "warning"
                                          ? "text-orange-500"
                                          : "text-red-600"
                                      }`}
                                    >
                                      สถานะ: {s.status}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      อัปเดตล่าสุด:{" "}
                                      {s.last_update
                                        ? new Date(
                                            s.last_update
                                          ).toLocaleString()
                                        : "-"}
                                    </p>
                                    {s.description && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        {s.description}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-gray-400 italic text-sm">
                                ไม่มีข้อมูลเซนเซอร์
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </>
        ) : (
          <p className="text-gray-400 italic">
            ← คลิกภูมิภาคบนแผนที่เพื่อดูรายชื่อเขต
          </p>
        )}
      </div>
    </div>
  );
};

export default ThailandRegionsPage;
