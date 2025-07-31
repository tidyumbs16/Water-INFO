import React, { useState, useEffect, useCallback } from 'react';

// กำหนด Interface สำหรับข้อมูลกิจกรรมที่มาจากฐานข้อมูล
// ตรวจสอบให้แน่ใจว่าชื่อฟิลด์ตรงกับชื่อคอลัมน์ในตาราง 'activity_log' ของคุณ
interface Activity {
  id: string; // หรือ number ถ้า id เป็นประเภท number ใน DB
  action: string;
  details: string | null; // อาจจะเป็น null ได้ถ้าไม่มีข้อมูล
  timestamp: string; // หรือ Date ถ้าคุณต้องการแปลงเป็น Date object
  // เพิ่มคอลัมน์อื่นๆ ที่คุณดึงมาจาก SELECT *
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // ฟังก์ชันสำหรับดึงข้อมูลกิจกรรมจาก API
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // เรียก API Route ที่เราสร้างไว้
      const response = await fetch('/api/activity-logs');
      if (!response.ok) {
        // จัดการข้อผิดพลาด HTTP (เช่น 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // ข้อมูลที่ได้มาคือ { logs: [...] } ดังนั้นเราต้องเข้าถึง .logs
      const data: { logs: Activity[] } = await response.json();
      setActivities(data.logs); // กำหนด state ด้วย array ของ logs
      setLastUpdated(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e: any) {
      console.error("Failed to fetch activities:", e);
      setError(`Failed to load activities: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // useEffect สำหรับการโหลดข้อมูลครั้งแรกและตั้งค่า Polling
  useEffect(() => {
    // โหลดข้อมูลครั้งแรกทันทีที่คอมโพเนนต์ Mount
    fetchActivities();

    // ตั้งค่า Polling ทุกๆ 5 วินาที (5000 มิลลิวินาที)
    // คุณสามารถปรับความถี่นี้ได้ตามความเหมาะสมกับการใช้งานและปริมาณข้อมูล
    const intervalId = setInterval(fetchActivities, 5000);

    // Cleanup function: ล้าง Interval เมื่อคอมโพเนนต์ Unmount
    return () => clearInterval(intervalId);
  }, [fetchActivities]); // fetchActivities เป็น dependency เพื่อให้ useCallback ทำงานได้ถูกต้อง

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 font-inter">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-400">บันทึกกิจกรรม & เหตุการณ์ระบบ</h1>
          <div className="text-sm text-gray-400">
            อัปเดตล่าสุด: {lastUpdated}
            <button
              onClick={fetchActivities}
              className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors duration-200"
            >
              รีเฟรชทันที
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4 text-gray-200">กิจกรรมล่าสุด</h2>

        {loading && <p className="text-blue-300">กำลังโหลดกิจกรรม...</p>}
        {error && <p className="text-red-400">ข้อผิดพลาด: {error}</p>}

        {!loading && !error && activities.length === 0 && (
          <p className="text-gray-400">ไม่พบกิจกรรมใดๆ</p>
        )}

        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id} // ใช้ activity.id เป็น key
              className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-md"
            >
              {/* แสดง action และ details ของกิจกรรม */}
              <div className="flex-1">
                <div className="text-lg text-gray-100 font-medium">{activity.action}</div>
                {activity.details && (
                  <div className="text-sm text-gray-300 mt-1">{activity.details}</div>
                )}
              </div>
              {/* แสดง timestamp ของกิจกรรม */}
              <div className="text-sm text-gray-400 ml-4 flex-shrink-0">
                {activity.timestamp ? new Date(activity.timestamp).toLocaleString('th-TH') : 'ไม่มีเวลา'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
