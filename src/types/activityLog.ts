export interface ActivityLog {
  id: string; // ID ของบันทึกกิจกรรม (UUID)
  user_id: string; // ID ของผู้ใช้งานที่ทำกิจกรรม
  action: string; // ประเภทของกิจกรรม (เช่น 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
  entity_type: string; // ประเภทของเอนทิตีที่ถูกกระทำ (เช่น 'District', 'User', 'Product')
  entity_id?: string; // ID ของเอนทิตีที่ถูกกระทำ (สามารถเป็น NULL ได้)
  details?: Record<string, any>; // รายละเอียดเพิ่มเติมของกิจกรรมในรูปแบบ JSON (สามารถเป็น NULL ได้)
  timestamp: string; // เวลาที่บันทึกกิจกรรม (ISO string)
}
