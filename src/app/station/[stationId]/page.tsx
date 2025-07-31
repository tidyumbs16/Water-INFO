// app/stations/[stationId]/page.tsx
// นี่คือ Server Component สำหรับแสดงรายละเอียดของจุดสถานี (เขตประปา) แต่ละแห่ง

import { notFound } from 'next/navigation'; // สำหรับจัดการกรณีไม่พบข้อมูล
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link'; // สำหรับปุ่มกลับไปหน้าเลือกสถานี

// Interface สำหรับข้อมูลเมตริกปัจจุบัน (ล่าสุด) ที่ API ส่งกลับมา
interface CurrentMetrics {
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number | null;
  volume_trend: number | null;
  pressure_trend: number | null;
  efficiency_trend: number | null;
  last_updated: string; // created_at จากฐานข้อมูล
}

// Interface สำหรับข้อมูลเมตริกย้อนหลังที่ API ส่งกลับมา
interface HistoricalMetric {
  date: string; // วันที่ของข้อมูล (จาก created_at หรือ date ใน DB)
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
}

// Interface สำหรับโครงสร้างข้อมูลทั้งหมดที่ API นี้จะส่งกลับไป
interface StationData {
  id: string; // district_id
  name: string; // district_name
  region: string; // เพิ่ม: ภาค
  province: string; // เพิ่ม: จังหวัด
  currentMetrics: CurrentMetrics | null;
  historicalData: HistoricalMetric[];
}

// Props สำหรับ Page Component
interface StationPageProps {
  params: {
    stationId: string; // ID ของสถานีที่มาจาก URL
  };
}

/**
 * @function StationPointPage
 * @description Server Component สำหรับแสดงรายละเอียดของจุดสถานี (เขตประปา)
 * ดึงข้อมูลจาก API Route และแสดงผลข้อมูลปัจจุบันพร้อมกราฟแนวโน้มย้อนหลัง
 *
 * @param {StationPageProps} props - Props ที่มี params.stationId
 * @returns {Promise<JSX.Element>} JSX Element สำหรับหน้าจุดสถานี
 */
export default async function StationPointPage({ params }: StationPageProps) {
  const { stationId } = params;

  let stationData: StationData | null = null;
  let errorFetchingData: string | null = null;

  try {
    // ดึงข้อมูลจาก API Route ที่เราสร้างขึ้น
    // ใช้ NEXT_PUBLIC_BASE_URL เพื่อให้สามารถทำงานได้ทั้งใน Development และ Production
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stations/${stationId}`, {
      // revalidate every 60 seconds (or 0 for no cache, or 'force-cache' for static)
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound(); // ถ้าไม่พบข้อมูล ให้แสดงหน้า 404 ของ Next.js
      }
      let errorDetails = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorDetails = errorBody.message || errorDetails;
      } catch (jsonError) {
        console.error("Failed to parse error response JSON:", jsonError);
        errorDetails += " (ไม่สามารถ Parse การตอบกลับ Error ได้)";
      }
      throw new Error(errorDetails);
    }

    stationData = await response.json();
    console.log("Fetched Station Data:", stationData); // สำหรับ Debug ใน Server Terminal

    if (!stationData || !stationData.currentMetrics) {
        errorFetchingData = "ไม่พบข้อมูลเมตริกสำหรับจุดสถานีนี้";
    }

  } catch (error: any) {
    console.error(`Error fetching station data for ${stationId}:`, error);
    errorFetchingData = `ไม่สามารถโหลดข้อมูลจุดสถานีได้: ${error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`;
  }

  if (errorFetchingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-red-200 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            ⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล
          </h2>
          <p className="text-gray-700">{errorFetchingData}</p>
          <p className="text-sm text-gray-500 mt-2">โปรดตรวจสอบ ID สถานี หรือการเชื่อมต่อฐานข้อมูล</p>
        </div>
      </div>
    );
  }

  // หากข้อมูลโหลดสำเร็จและไม่มี error
  const { name, region, province, currentMetrics, historicalData } = stationData!; // ใช้ ! เพื่อบอกว่ารับประกันว่าไม่เป็น null

  // Helper function to format numbers for display
  const formatNumber = (num: number | null | undefined, unit: string = '') => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + unit;
  };

  // Helper function to format trend values with an arrow
  const formatTrend = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const indicator = value > 0 ? '▲' : value < 0 ? '▼' : '▬';
    const color = value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500';
    return <span className={`${color} font-bold`}>{indicator} {Math.abs(value).toFixed(1)}%</span>;
  };

  return (
    <div className="p-6 md:p-10 lg:p-12 space-y-8 max-w-7xl mx-auto bg-gradient-to-br from-indigo-50 via-blue-50 to-teal-50 min-h-screen font-inter rounded-2xl shadow-2xl">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-8 drop-shadow-sm leading-tight">
        📊 ข้อมูลจุดสถานี: {name} 📍
      </h1>
      <p className="text-center text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
        ข้อมูลเชิงลึกแบบเรียลไทม์และแนวโน้มย้อนหลังของจุดตรวจวัดน้ำ {name}
      </p>

      {/* Display Region and Province */}
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex justify-around items-center text-center text-gray-700 font-medium text-lg">
        <span>ภาค: <span className="font-bold text-blue-700">{region}</span></span>
        <span>จังหวัด: <span className="font-bold text-green-700">{province}</span></span>
      </div>

      {/* Current Metrics Section */}
      {currentMetrics && (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-blue-100 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-blue-500"></i> ข้อมูลปัจจุบัน
            <span className="ml-auto text-sm text-gray-500">อัปเดตล่าสุด: {currentMetrics.last_updated}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Water Quality Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-200">
              <h3 className="text-xl font-bold text-blue-700 mb-2">คุณภาพน้ำ</h3>
              <p className="text-4xl font-extrabold text-blue-600">{formatNumber(currentMetrics.water_quality)} <span className="text-2xl font-semibold">pH</span></p>
              <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.quality_trend)}</p>
            </div>

            {/* Water Volume Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-green-200">
              <h3 className="text-xl font-bold text-green-700 mb-2">ปริมาณน้ำ</h3>
              <p className="text-4xl font-extrabold text-green-600">{formatNumber(currentMetrics.water_volume)} <span className="text-2xl font-semibold">ลบ.ม.</span></p>
              <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.volume_trend)}</p>
            </div>

            {/* Water Pressure Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-200">
              <h3 className="text-xl font-bold text-purple-700 mb-2">แรงดันน้ำ</h3>
              <p className="text-4xl font-extrabold text-purple-600">{formatNumber(currentMetrics.pressure)} <span className="text-2xl font-semibold">PSI</span></p>
              <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.pressure_trend)}</p>
            </div>

            {/* Efficiency Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-200">
              <h3 className="text-xl font-bold text-orange-700 mb-2">ประสิทธิภาพ</h3>
              <p className="text-4xl font-extrabold text-orange-600">{formatNumber(currentMetrics.efficiency)}<span className="text-2xl font-semibold">%</span></p>
              <p className="text-sm text-gray-600 mt-1">แนวโน้ม: {formatTrend(currentMetrics.efficiency_trend)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Data Chart Section */}
      {historicalData.length > 0 ? (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-area text-gray-600"></i> แนวโน้มย้อนหลัง 30 วัน
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={historicalData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="water_quality" stroke="#3b82f6" name="คุณภาพน้ำ (pH)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="water_volume" stroke="#10b981" name="ปริมาณน้ำ (ลบ.ม.)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="pressure" stroke="#8b5cf6" name="แรงดันน้ำ (PSI)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="efficiency" stroke="#f97316" name="ประสิทธิภาพ (%)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-500 mt-4 text-center">
            กราฟแสดงแนวโน้มของเมตริกสำคัญต่างๆ ในช่วง 30 วันที่ผ่านมา
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 mt-8 text-center text-gray-500 text-lg italic">
          ไม่พบข้อมูลย้อนหลังสำหรับกราฟ
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8 text-center">
        <Link href="/stations" passHref> {/* เปลี่ยนกลับไปหน้าเลือกสถานี */}
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
            <i className="fas fa-arrow-left mr-2"></i> กลับสู่หน้าเลือกสถานี
          </button>
        </Link>
      </div>
    </div>
  );
}
