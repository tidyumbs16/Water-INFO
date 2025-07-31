// app/admin/sensors/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
// นำเข้าไอคอนจาก lucide-react
import { Loader2, PlusCircle, Edit, Trash2, AlertCircle, CheckCircle, X, Database } from 'lucide-react';
// *** สำคัญมาก: ตรวจสอบ Path ของ types/index ให้ถูกต้องตามโครงสร้างโปรเจกต์ของคุณ ***
import { Sensor, District } from '@/src/types/index'; // ตรวจสอบ path ให้ถูกต้อง

// กำหนด URL ของ Backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// ฟังก์ชันสำหรับดึง Token จาก Local Storage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

const AdminSensorsPage: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true); // สำหรับการโหลดข้อมูลหน้าหลัก
  const [error, setError] = useState<string | null>(null); // สำหรับ Error ทั่วไปของหน้าหลัก
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [isRefetching, setIsRefetching] = useState(false); // สถานะสำหรับการรีเฟรชข้อมูลหลังจาก CRUD

  // States สำหรับ Modal ฟอร์ม (เพิ่ม/แก้ไข)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSensorId, setCurrentSensorId] = useState<string | null>(null);
  const [newSensor, setNewSensor] = useState<Partial<Sensor>>({
    name: '',
    district_id: '',
    sensor_type: '',
    serial_number: '',
    location_description: '',
    status: 'active',
    value: null,
    unit: '',
    description: '',
    last_calibration_date: null,
    next_calibration_date: null,
    maintenance_notes: null,
    manufacturer: null,
    model: null,
  });
  const [formLoading, setFormLoading] = useState(false); // สำหรับสถานะ loading ของฟอร์ม
  const [formError, setFormError] = useState<string | null>(null); // สำหรับ Error ของฟอร์ม
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // สำหรับข้อความสำเร็จของฟอร์ม

  // States สำหรับ Modal ยืนยันการลบ
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sensorToDeleteId, setSensorToDeleteId] = useState<string | null>(null);

  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = useCallback(() => {
    setNewSensor({
      name: '',
      district_id: '',
      sensor_type: '',
      serial_number: '',
      location_description: '',
      status: 'active',
      value: null,
      unit: '',
      description: '',
      last_calibration_date: null,
      next_calibration_date: null,
      maintenance_notes: null,
      manufacturer: null,
      model: null,
    });
    setIsEditing(false);
    setCurrentSensorId(null);
    setFormError(null); // Clear form error on reset
    setSuccessMessage(null); // Clear success message on reset
  }, []);

  // ฟังก์ชันเปิด Modal สำหรับเพิ่ม/แก้ไข
  const openModal = (sensor?: Sensor) => {
    if (sensor) {
      setIsEditing(true);
      setCurrentSensorId(sensor.id);
      // แปลง date object/string ให้เป็น format ที่ input type="date" ต้องการ (YYYY-MM-DD)
      setNewSensor({
        ...sensor,
        last_calibration_date: sensor.last_calibration_date ? new Date(sensor.last_calibration_date).toISOString().split('T')[0] : null,
        next_calibration_date: sensor.next_calibration_date ? new Date(sensor.next_calibration_date).toISOString().split('T')[0] : null,
      });
    } else {
      resetForm(); // รีเซ็ตฟอร์มเมื่อเพิ่มใหม่
    }
    setIsModalOpen(true);
  };

  // ฟังก์ชันปิด Modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm(); // รีเซ็ตฟอร์มเมื่อปิด Modal
    console.log('ปิด Modal แล้ว กำลังเรียก fetchSensors เพื่อรีเฟรชข้อมูล...');
    // เรียก fetchSensors โดยใช้ selectedDistrictId ปัจจุบัน
    fetchSensors(selectedDistrictId);
  };

  // ฟังก์ชันเปิด Modal ยืนยันการลบ
  const openDeleteConfirmModal = (id: string) => {
    setSensorToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  // ฟังก์ชันปิด Modal ยืนยันการลบ
  const closeDeleteConfirmModal = () => {
    setSensorToDeleteId(null);
    setIsDeleteConfirmOpen(false);
  };

  // ฟังก์ชันดึงข้อมูลเซนเซอร์
  const fetchSensors = useCallback(async (districtId?: string) => {
    // ใช้ setIsLoading สำหรับการโหลดครั้งแรก และ setIsRefetching สำหรับการรีเฟรช
    // ตรวจสอบว่า `sensors` ว่างเปล่า และไม่ได้อยู่ในสถานะกำลังรีเฟรช เพื่อให้แสดง Loader เต็มหน้าจอ
    if (sensors.length === 0 && !isRefetching) {
        setIsLoading(true);
    } else {
        setIsRefetching(true); // แสดง Loader ขนาดเล็กสำหรับการดึงข้อมูลครั้งถัดไป
    }
    setError(null);
    const token = getToken();
    if (!token) {
      setError('ไม่พบ Token การยืนยันตัวตน กรุณาเข้าสู่ระบบ');
      setIsLoading(false);
      setIsRefetching(false);
      // router.push('/admin/login'); // สามารถ Redirect ไปหน้า Login ได้หากต้องการ
      return;
    }

    try {
      const url = districtId
        ? `${BACKEND_URL}/api/admin/sensors?districtId=${districtId}`
        : `${BACKEND_URL}/api/admin/sensors`;

      console.log('กำลังดึงข้อมูลเซนเซอร์จาก:', url);

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        // กรณีที่ Backend ไม่ได้ส่ง JSON กลับมา (เช่น 500 Internal Server Error ที่ส่ง HTML)
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error(`เซิร์ฟเวอร์ส่งการตอบกลับที่ไม่ใช่ JSON: ${res.status} ${res.statusText}`);
      }

      console.log('ข้อมูลเซนเซอร์ที่ได้รับจาก Backend (raw):', data);

      if (res.ok) {
        let fetchedSensors: Sensor[] = [];
        if (data && Array.isArray(data.data)) {
          fetchedSensors = data.data;
        } else if (data && Array.isArray(data)) {
          fetchedSensors = data;
        } else {
          console.warn('รูปแบบข้อมูลเซนเซอร์ที่ได้รับไม่ถูกต้อง หรือเป็น Object ที่ไม่มี Array data:', data);
          // หากข้อมูลไม่ใช่ Array หรือ data.data ให้ถือว่าเป็น Array ว่าง
          fetchedSensors = [];
        }
        setSensors(fetchedSensors);
        console.log('ตั้งค่า sensors ใน State แล้ว (จำนวน):', fetchedSensors.length);
        console.log('sensors array ใน State ปัจจุบัน:', fetchedSensors); // แสดงข้อมูลใน State
      } else {
        // จัดการ Error Response จาก Backend
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('authToken');
          throw new Error(data.message || 'ไม่ได้รับอนุญาต หรือ Token หมดอายุ');
        }
        throw new Error(data.message || `ไม่สามารถดึงข้อมูลเซนเซอร์ได้: ${res.status}`);
      }
    } catch (err: any) {
      console.error("Error fetching sensors:", err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [isRefetching, sensors.length]); // เพิ่ม dependencies

  // ฟังก์ชันดึงข้อมูลเขตประปา
  const fetchDistricts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      console.error('ไม่พบ Token การยืนยันตัวตนสำหรับเขตประปา กรุณาเข้าสู่ระบบ');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/districts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const responseData = await res.json();

      if (res.ok) {
        // ตรวจสอบว่าข้อมูลเขตประปาอยู่ใน property 'data' หรือเป็น Array โดยตรง
        if (responseData && Array.isArray(responseData.data)) {
          setDistricts(responseData.data);
        } else if (responseData && Array.isArray(responseData)) {
          setDistricts(responseData);
        } else {
          console.error('รูปแบบข้อมูลเขตประปาที่ได้รับไม่ถูกต้อง:', responseData);
          setError('ได้รับรูปแบบข้อมูลที่ไม่ถูกต้องสำหรับเขตประปา');
        }
      } else {
        // Handle specific error codes for fetching districts
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('authToken');
          throw new Error(responseData.message || 'ไม่ได้รับอนุญาต หรือ Token หมดอายุ');
        }
        throw new Error(responseData.message || `ไม่สามารถดึงข้อมูลเขตประปาได้: ${res.status}`);
      }
    } catch (err: any) {
      console.error("ข้อผิดพลาดในการดึงข้อมูลเขตประปา:", err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  }, []);

  // useEffect สำหรับโหลดข้อมูลเมื่อคอมโพเนนต์โหลดครั้งแรกและเมื่อ selectedDistrictId เปลี่ยน
  useEffect(() => {
    fetchDistricts();
    fetchSensors(selectedDistrictId);
  }, [selectedDistrictId, fetchDistricts, fetchSensors]);

  // ฟังก์ชันจัดการการเปลี่ยนแปลงค่าในฟอร์ม
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSensor((prev: any) => ({
      ...prev,
      [name]: name === 'value' ? (value === '' ? null : parseFloat(value)) : value
    }));
  };

  // ฟังก์ชันจัดการการ Submit ฟอร์ม (เพิ่ม/แก้ไข)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null); // Clear previous form errors
    setSuccessMessage(null); // Clear previous success messages

    const token = getToken();
    if (!token) {
      setFormError('ไม่พบ Token การยืนยันตัวตน กรุณาเข้าสู่ระบบ');
      setFormLoading(false);
      return;
    }

    // *** Client-side validation: ตรวจสอบ Serial Number และข้อมูลที่จำเป็นอื่นๆ ***
    if (!newSensor.serial_number || newSensor.serial_number.trim() === '') {
      setFormError('Serial Number ห้ามว่างเปล่า');
      setFormLoading(false);
      return;
    }
    if (!newSensor.name || !newSensor.district_id || !newSensor.sensor_type || !newSensor.status) {
      setFormError('โปรดกรอกข้อมูลที่จำเป็น (ชื่อ, เขตประปา, ประเภทเซนเซอร์, สถานะ)');
      setFormLoading(false);
      return;
    }

    try {
      let res: Response;
      const payload = {
        ...newSensor,
        // แปลงวันที่ให้อยู่ในรูปแบบ ISO string สำหรับฐานข้อมูล
        last_calibration_date: newSensor.last_calibration_date ? new Date(newSensor.last_calibration_date).toISOString() : null,
        next_calibration_date: newSensor.next_calibration_date ? new Date(newSensor.next_calibration_date).toISOString() : null,
        // ใช้ nullish coalescing เพื่อให้เป็น null ถ้า undefined/empty string
        maintenance_notes: newSensor.maintenance_notes ?? null,
        manufacturer: newSensor.manufacturer ?? null,
        model: newSensor.model ?? null,
        // ตรวจสอบค่า value ให้เป็น number หรือ null
        value: typeof newSensor.value === 'string' && newSensor.value !== '' ? parseFloat(newSensor.value) : (newSensor.value === null ? null : newSensor.value)
      };

      console.log('Payload ที่ส่งจาก Frontend:', payload); // Debug: ดูข้อมูลที่ส่งไป

      if (isEditing && currentSensorId) {
        res = await fetch(`${BACKEND_URL}/api/admin/sensors/${currentSensorId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND_URL}/api/admin/sensors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(data.message || `บันทึกเซนเซอร์สำเร็จ!`);
        // ปิด Modal หลังจากแสดงข้อความสำเร็จชั่วครู่
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // *** จัดการ Error Response จาก Backend อย่างละเอียด ***
        if (res.status === 400) {
          setFormError(data.message || 'ข้อมูลที่ส่งไม่ถูกต้อง');
        } else if (res.status === 409) {
          setFormError(data.message || `Serial Number '${newSensor.serial_number}' มีอยู่ในระบบแล้ว`);
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('authToken');
          setFormError(data.message || 'ไม่ได้รับอนุญาต หรือ Token หมดอายุ');
        } else {
          setFormError(data.message || `เกิดข้อผิดพลาดในการ ${isEditing ? 'อัปเดต' : 'เพิ่ม'} เซนเซอร์`);
        }
      }
    } catch (err: any) {
      console.error("Error submitting sensor:", err);
      setFormError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดลองอีกครั้ง');
    } finally {
      setFormLoading(false);
    }
  };

  // ฟังก์ชันยืนยันการลบและทำการลบ
  const confirmDelete = async () => {
    if (!sensorToDeleteId) return;

    setIsLoading(true); // ใช้ loading หลักของหน้า
    setError(null); // Clear main page error
    closeDeleteConfirmModal(); // ปิด modal ยืนยัน

    const token = getToken();
    if (!token) {
      setError('ไม่พบ Token การยืนยันตัวตน กรุณาเข้าสู่ระบบ');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/sensors/${sensorToDeleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('ลบเซนเซอร์สำเร็จ'); // แสดงข้อความสำเร็จที่หน้าหลัก
        setTimeout(() => setSuccessMessage(null), 3000); // ซ่อนข้อความหลังจาก 3 วินาที
        fetchSensors(selectedDistrictId); // รีเฟรชรายการเซนเซอร์
      } else {
        setError(data.message || 'ไม่สามารถลบเซนเซอร์ได้');
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('authToken');
        }
      }
    } catch (err: any) {
      console.error("Error deleting sensor:", err);
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function เพื่อหาชื่อเขตประปาจาก ID
  const getDistrictName = (districtId: string | undefined) => {
    const district = Array.isArray(districts) ? districts.find(d => d.id === districtId) : undefined;
    return district ? `${district.district_name} (${district.province})` : 'N/A';
  };

  // แสดงสถานะการโหลดข้อมูลหน้าหลัก
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="animate-spin w-10 h-10 text-cyan-400" />
        <p className="ml-3 text-lg text-slate-400">กำลังโหลดข้อมูลเซนเซอร์...</p>
      </div>
    );
  }

  // แสดงข้อผิดพลาดในการโหลดข้อมูลหน้าหลัก
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-slate-400 text-center">{error}</p>
        <button
          onClick={() => {
            setError(null); // Clear error before retrying
            fetchSensors(selectedDistrictId); // ลองโหลดใหม่
          }}
          className="mt-6 px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition"
        >
          ลองโหลดใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-extrabold text-white flex items-center">
          <Database className="mr-3 w-10 h-10 text-cyan-400" /> จัดการข้อมูล Sensors
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg"
        >
          <PlusCircle className="w-5 h-5" />
          <span>เพิ่ม Sensor ใหม่</span>
        </button>
      </header>

      {successMessage && (
        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 rounded-xl p-4 mb-6 flex items-center space-x-3 animate-fade-in">
          <CheckCircle className="w-6 h-6" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Section */}
      <section className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-4">ค้นหา/กรอง Sensor</h2>
        <label htmlFor="filterDistrict" className="block text-slate-300 text-sm font-medium mb-2">กรองตามเขตประปา:</label>
        <select
          id="filterDistrict"
          value={selectedDistrictId}
          onChange={(e) => setSelectedDistrictId(e.target.value)}
          className="mt-1 block w-full md:w-1/2 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
        >
          <option value="">-- แสดงทั้งหมด --</option>
          {Array.isArray(districts) && districts.map(district => (
            <option key={district.id} value={district.id}>{district.district_name} ({district.province})</option>
          ))}
        </select>
      </section>

      {/* Sensor List Table */}
      <section>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          {isRefetching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <Loader2 className="animate-spin w-8 h-8 text-cyan-400" />
              <p className="ml-2 text-slate-300">กำลังรีเฟรชข้อมูล...</p>
            </div>
          )}
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Serial Number
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  ชื่อ Sensor
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  เขตประปา
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  ประเภท Sensor
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  สถานะ
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  ค่าวัดล่าสุด
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  อัปเดตล่าสุด
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  การจัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sensors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    ไม่พบข้อมูลเซนเซอร์
                  </td>
                </tr>
              ) : (
                sensors.map((sensor) => (
                  <tr key={sensor.id} className="hover:bg-slate-700/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {sensor.serial_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {sensor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {getDistrictName(sensor.district_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 capitalize">
                      {/* แก้ไขตรงนี้: เพิ่มการตรวจสอบ null/undefined ก่อนเรียก replace */}
                      {(sensor.sensor_type || '').replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sensor.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        sensor.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        sensor.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                        sensor.status === 'calibrating' ? 'bg-purple-100 text-purple-800' :
                        sensor.status === 'offline' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800' // For 'error' or unknown
                      }`}>
                        {sensor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {typeof sensor.value === 'number' ? sensor.value.toFixed(2) : 'N/A'} {sensor.unit || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(sensor.last_update).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(sensor)}
                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-200"
                        title="แก้ไข"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirmModal(sensor.id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-200"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal for Add/Edit Sensor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              {isEditing ? 'แก้ไข Sensor' : 'เพิ่ม Sensor ใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="serial_number" className="block text-slate-300 text-sm font-medium mb-2">Serial Number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  id="serial_number"
                  name="serial_number"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="กรอก Serial Number (เช่น SENS-001)"
                  value={newSensor.serial_number || ''}
                  onChange={handleInputChange}
                  required
                  disabled={isEditing || formLoading} // Disable if editing or form is loading
                />
                {isEditing && <p className="text-sm text-slate-400 mt-1">ไม่สามารถแก้ไข Serial Number ได้</p>}
              </div>

              <div>
                <label htmlFor="name" className="block text-slate-300 text-sm font-medium mb-2">ชื่อ Sensor <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="ชื่อที่เข้าใจง่าย (เช่น เซนเซอร์ pH เขต 1)"
                  value={newSensor.name || ''}
                  onChange={handleInputChange}
                  required
                  disabled={formLoading}
                />
              </div>

              <div>
                <label htmlFor="district_id" className="block text-slate-300 text-sm font-medium mb-2">เขตประปา <span className="text-red-400">*</span></label>
                <select
                  id="district_id"
                  name="district_id"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newSensor.district_id || ''}
                  onChange={handleInputChange}
                  required
                  disabled={formLoading}
                >
                  <option value="">เลือกเขตประปา</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.district_name} ({district.province})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sensor_type" className="block text-slate-300 text-sm font-medium mb-2">ประเภท Sensor <span className="text-red-400">*</span></label>
                <select
                  id="sensor_type"
                  name="sensor_type"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newSensor.sensor_type || ''}
                  onChange={handleInputChange}
                  required
                  disabled={formLoading}
                >
                  <option value="">เลือกประเภท Sensor</option>
                  <option value="water_quality">คุณภาพน้ำ</option>
                  <option value="water_volume">ปริมาณน้ำ</option>
                  <option value="pressure">แรงดันน้ำ</option>
                  <option value="flow_rate">อัตราการไหล</option>
                  <option value="temperature">อุณหภูมิ</option>
                  <option value="ph">pH</option>
                  <option value="chlorine">คลอรีน</option>
                  <option value="turbidity">ความขุ่น</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-slate-300 text-sm font-medium mb-2">สถานะ <span className="text-red-400">*</span></label>
                <select
                  id="status"
                  name="status"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  value={newSensor.status || 'active'}
                  onChange={handleInputChange}
                  required
                  disabled={formLoading}
                >
                  <option value="active">ทำงาน</option>
                  <option value="inactive">ไม่ทำงาน</option>
                  <option value="maintenance">บำรุงรักษา</option>
                  <option value="error">ข้อผิดพลาด</option>
                  <option value="calibrating">กำลังสอบเทียบ</option>
                  <option value="offline">ออฟไลน์</option>
                </select>
              </div>

              <div>
                <label htmlFor="location_description" className="block text-slate-300 text-sm font-medium mb-2">คำอธิบายตำแหน่ง</label>
                <textarea
                  id="location_description"
                  name="location_description"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="รายละเอียดตำแหน่งติดตั้ง (เช่น ใต้สะพาน, ใกล้ปั๊ม)"
                  value={newSensor.location_description || ''}
                  onChange={handleInputChange}
                  disabled={formLoading}
                ></textarea>
              </div>

              <div>
                <label htmlFor="description" className="block text-slate-300 text-sm font-medium mb-2">คำอธิบาย Sensor</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับ Sensor"
                  value={newSensor.description || ''}
                  onChange={handleInputChange}
                  disabled={formLoading}
                ></textarea>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="value" className="block text-slate-300 text-sm font-medium mb-2">ค่าวัดปัจจุบัน (ถ้ามี)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="value"
                    name="value"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="เช่น 7.2 (pH)"
                    value={newSensor.value !== null && newSensor.value !== undefined ? String(newSensor.value) : ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label htmlFor="unit" className="block text-slate-300 text-sm font-medium mb-2">หน่วยวัด (ถ้ามี)</label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="เช่น pH, PSI, liters"
                    value={newSensor.unit || ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="last_calibration_date" className="block text-slate-300 text-sm font-medium mb-2">วันที่สอบเทียบครั้งล่าสุด</label>
                  <input
                    type="date"
                    id="last_calibration_date"
                    name="last_calibration_date"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={newSensor.last_calibration_date || ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label htmlFor="next_calibration_date" className="block text-slate-300 text-sm font-medium mb-2">วันที่สอบเทียบครั้งถัดไป</label>
                  <input
                    type="date"
                    id="next_calibration_date"
                    name="next_calibration_date"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    value={newSensor.next_calibration_date || ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maintenance_notes" className="block text-slate-300 text-sm font-medium mb-2">บันทึกการบำรุงรักษา</label>
                <textarea
                  id="maintenance_notes"
                  name="maintenance_notes"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="บันทึกเกี่ยวกับการบำรุงรักษาหรือซ่อมแซม"
                  value={newSensor.maintenance_notes || ''}
                  onChange={handleInputChange}
                  disabled={formLoading}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manufacturer" className="block text-slate-300 text-sm font-medium mb-2">ผู้ผลิต</label>
                  <input
                    type="text"
                    id="manufacturer"
                    name="manufacturer"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="ชื่อผู้ผลิต"
                    value={newSensor.manufacturer || ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-slate-300 text-sm font-medium mb-2">รุ่น</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="รุ่นของ Sensor"
                    value={newSensor.model || ''}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center text-red-400 bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm animate-fade-in">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center text-emerald-400 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-sm animate-fade-in">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-cyan-700 hover:to-blue-800 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formLoading}
              >
                {formLoading ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                <span>{isEditing ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่ม Sensor'}</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="w-full mt-3 bg-slate-700/50 text-slate-300 font-semibold py-3 rounded-xl hover:bg-slate-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={formLoading}
              >
                ยกเลิก
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl w-full max-w-sm p-8 relative text-center">
            <h3 className="text-2xl font-bold text-white mb-4">ยืนยันการลบ</h3>
            <p className="text-slate-300 mb-6">คุณแน่ใจหรือไม่ที่ต้องการลบเซนเซอร์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition duration-200"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSensorsPage;
