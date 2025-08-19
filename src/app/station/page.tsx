'use client'; // กำหนดให้เป็น Client Component

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, Globe, Building } from 'lucide-react';
import NavbarComponent from '@/components/navbar';

// Interfaces สำหรับโครงสร้างข้อมูลที่คาดว่าจะได้รับจาก API
interface DistrictDisplay {
  id: string; // ID ที่ไม่ซ้ำกันสำหรับแต่ละเขตประปา (สำคัญสำหรับ key prop)
  name: string;
  provinceId: string;
  provinceName: string;
  regionId: string;
  regionName: string;
  address: string;
  contact: string;
  capacity: string;
  status: string;
}

interface Province {
  id: string;
  name: string;
  regionId: string;
}

interface Region {
  id: string;
  name: string;
}

// React component หลัก
export default function StationsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districtsToDisplay, setDistrictsToDisplay] = useState<DistrictDisplay[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ฟังก์ชันสำหรับเรียกข้อมูลภาค (Regions)
  const fetchRegions = useCallback(async () => {
    try {
      setLoadingRegions(true);
      setError(null);
      // นี่คือการเรียก API จริงที่คุณต้องการใช้
      const regionsRes = await fetch('/api/regions');
      if (!regionsRes.ok) {
        const errorText = await regionsRes.text();
        throw new Error(`HTTP error! status: ${regionsRes.status}, body: ${errorText}`);
      }
      const regionsData: Region[] = await regionsRes.json();
      setRegions(regionsData);
      if (regionsData.length > 0 && selectedRegionId === null) {
        setSelectedRegionId(regionsData[0].id);
      }
    } catch (e: any) {
      console.error("Failed to fetch regions:", e);
      setError(`ไม่สามารถโหลดข้อมูลภาคได้: ${e.message}`);
    } finally {
      setLoadingRegions(false);
    }
  }, [selectedRegionId]);

  // ฟังก์ชันสำหรับเรียกข้อมูลจังหวัด (Provinces)
  const fetchProvinces = useCallback(async () => {
    // จะเรียก API ก็ต่อเมื่อมีการเลือกภาคแล้วเท่านั้น
    if (!selectedRegionId) {
      setProvinces([]);
      setSelectedProvinceId(null);
      setDistrictsToDisplay([]);
      return;
    }
    try {
      setLoadingProvinces(true);
      setError(null);
      // เรียก API โดยส่ง regionId เข้าไปเพื่อกรองข้อมูล
      const provincesRes = await fetch(`/api/provinces?regionId=${selectedRegionId}`);
      if (!provincesRes.ok) {
        const errorText = await provincesRes.text();
        throw new Error(`HTTP error! status: ${provincesRes.status}, body: ${errorText}`);
      }
      const provincesData: Province[] = await provincesRes.json();
      setProvinces(provincesData);
      const currentProvinceExists = provincesData.some(p => p.id === selectedProvinceId);
      if (provincesData.length > 0 && (!selectedProvinceId || !currentProvinceExists)) {
        setSelectedProvinceId(provincesData[0].id);
      } else if (provincesData.length === 0) {
        setSelectedProvinceId(null);
      }
    } catch (e: any) {
      console.error("Failed to fetch provinces:", e);
      setError(`ไม่สามารถโหลดข้อมูลจังหวัดได้: ${e.message}`);
    } finally {
      setLoadingProvinces(false);
    }
  }, [selectedRegionId, selectedProvinceId]);

  // ฟังก์ชันสำหรับเรียกข้อมูลเขตประปา (Districts)
  const fetchDistricts = useCallback(async () => {
    // จะเรียก API ก็ต่อเมื่อมีการเลือกจังหวัดแล้วเท่านั้น
    if (!selectedProvinceId) {
      setDistrictsToDisplay([]);
      return;
    }
    try {
      setLoadingDistricts(true);
      setError(null);
      // เรียก API โดยส่ง provinceId เข้าไปเพื่อกรองข้อมูลเขตประปา
      const districtsRes = await fetch(`/api/districts?provinceId=${selectedProvinceId}`);
      if (!districtsRes.ok) {
        const errorText = await districtsRes.text();
        throw new Error(`HTTP error! status: ${districtsRes.status}, body: ${errorText}`);
      }
      const rawDistrictsData: any[] = await districtsRes.json();
      const formattedDistricts: DistrictDisplay[] = rawDistrictsData.map(d => ({
        id: d['district_id'], // ใช้ ID ที่ไม่ซ้ำกัน
        name: d['name'] || 'Unnamed District',
        provinceId: d['จังหวัด'],
        provinceName: d['จังหวัด'],
        regionId: d['ภูมิภาค'],
        regionName: d['ชื่อภูมิภาค'],
        address: d['ที่อยู่'] || 'ยังไม่มีข้อมูลที่อยู่',
        contact: d['contact'] || 'ยังไม่มีข้อมูลติดต่อ',
        capacity: d['capacity'] || 'ยังไม่มีข้อมูลความจุ',
        status: d['status'] || 'ปกติ',
      }));
      setDistrictsToDisplay(formattedDistricts);
    } catch (e: any) {
      console.error("Failed to fetch districts:", e);
      setError(`ไม่สามารถโหลดข้อมูลเขตประปาได้: ${e.message}`);
    } finally {
      setLoadingDistricts(false);
    }
  }, [selectedProvinceId]);

  // --- useEffects ที่เรียกใช้ฟังก์ชันการดึงข้อมูล ---
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  useEffect(() => {
    fetchProvinces();
  }, [fetchProvinces, selectedRegionId]);

  useEffect(() => {
    fetchDistricts();
  }, [fetchDistricts, selectedProvinceId]);

  const handleRegionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegionId(event.target.value);
    setSelectedProvinceId(null);
    setDistrictsToDisplay([]);
  };

  const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvinceId(event.target.value);
    setDistrictsToDisplay([]);
  };

  const overallLoading = loadingRegions || loadingProvinces || loadingDistricts;

  return (
   
  
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 sm:p-6 lg:p-8 font-inter">
       <NavbarComponent />
      <div className="max-w-7.5xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-blue-800 mb-8 flex items-center justify-center gap-3">
          <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          ค้นหาเขตประปา
        </h1>

        {overallLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
            <p className="ml-4 text-blue-700 text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6"
            role="alert"
          >
            <strong className="font-bold">ข้อผิดพลาด!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label
              htmlFor="region-select"
              className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2"
            >
              <Globe className="w-5 h-5 text-blue-500" />
              เลือกภาค:
            </label>
            <div className="relative">
              <select
                id="region-select"
                className="block w-full px-4 py-3 pr-8 rounded-xl border-2 border-blue-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition duration-200 ease-in-out shadow-sm"
                value={selectedRegionId || ""}
                onChange={handleRegionChange}
                disabled={loadingRegions}
              >
                <option value="">-- เลือกภาค --</option>
                {/* การแก้ไข: กำหนด key ที่ไม่ซ้ำกันสำหรับแต่ละ option */}
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="province-select"
              className="block text-gray-700 text-lg font-semibold mb-2 flex items-center gap-2"
            >
              <MapPin className="w-5 h-5 text-blue-500" />
              เลือกจังหวัด:
            </label>
            <div className="relative">
              <select
                id="province-select"
                className="block w-full px-4 py-3 pr-8 rounded-xl border-2 border-blue-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition duration-200 ease-in-out shadow-sm"
                value={selectedProvinceId || ""}
                onChange={handleProvinceChange}
                disabled={!selectedRegionId || loadingProvinces}
              >
                <option value="">-- เลือกจังหวัด --</option>
                {/* การแก้ไข: กำหนด key ที่ไม่ซ้ำกันสำหรับแต่ละ option */}
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {selectedProvinceId && selectedRegionId && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
              <Building className="w-6 h-6 text-blue-600" />
              เขตประปาในจังหวัดที่เลือก:
            </h2>
            {districtsToDisplay.length > 0 ? (
              <ul className="space-y-4">
                {/* การแก้ไข: กำหนด key ที่ไม่ซ้ำกันสำหรับแต่ละ li */}
        
            {districtsToDisplay.map((district) => (
  <li
    key={`${district.id}-${district.name}-${district.provinceId}`} // ใช้ค่าที่ไม่ซ้ำ
    className="bg-blue-50 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out border border-blue-200"
  >
    <Link
      href={`/districts/${district.id}`}
      className="block text-blue-800 hover:text-blue-600"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold mb-1">
          {district.name}
        </h3>
        <ChevronRight className="w-6 h-6 text-blue-500" />
      </div>
      <p className="text-gray-600 text-sm">
        <span className="font-medium">ที่อยู่:</span>{" "}
        {district.address}
      </p>
     
    
      <p className="text-gray-600 text-sm">
        <span className="font-medium">สถานะ:</span>{" "}
        {district.status}
      </p>
      <p className="text-gray-600 text-sm">
        <span className="font-medium">โทรศัพท์:</span>{" "}
        {district.contact || 'ยังไม่มีข้อมูลติดต่อ'}
      </p>
    </Link>
  </li>
))}
              </ul>
            ) : !loadingDistricts ? (
              <div className="text-center py-8 text-gray-600 text-lg">
                ไม่พบเขตประปาในจังหวัดนี้
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
