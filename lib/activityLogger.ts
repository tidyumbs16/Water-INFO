// src/lib/activityLogger.ts
// ไฟล์นี้มีฟังก์ชันสำหรับบันทึกกิจกรรมลงใน Activity Log

import { ActivityLog } from '../src/types/activityLog'; // สมมติว่าคุณมี Type นี้อยู่แล้ว

/**
 * บันทึกกิจกรรมลงใน Activity Log ของระบบ
 * @param logData ข้อมูลกิจกรรมที่จะบันทึก (ไม่รวม id และ timestamp เพราะจะถูกสร้างโดยอัตโนมัติ)
 */
export async function logActivity(logData: Omit<ActivityLog, 'id' | 'timestamp'>) {
  try {
    // ตรวจสอบว่า NEXT_PUBLIC_BASE_URL ถูกตั้งค่าหรือไม่
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('Environment variable NEXT_PUBLIC_BASE_URL is not set.');
      return;
    }

    // ส่ง POST request ไปยัง API route สำหรับบันทึกกิจกรรม
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/activity-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // หาก API สำหรับบันทึกกิจกรรมของคุณต้องการ Authorization Header (เช่น JWT Token)
        // คุณจะต้องส่ง Token มาที่นี่ด้วย
        // ตัวอย่าง: 'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify(logData),
    });

    // ตรวจสอบสถานะการตอบกลับ
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to log activity:', response.status, errorData);
    } else {
      console.log('Activity logged successfully.');
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
