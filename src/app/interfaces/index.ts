import { ReactNode } from "react";

// frontend/interfaces/index.ts
export interface District {
  [x: string]: ReactNode;
  id: string;
  district_name: string;
  province: string;
region: string;
  status?: string;
   description?: string | null;
  created_at?: string;
  updated_at?: string;
  // เพิ่ม fields อื่นๆ ที่เกี่ยวข้องกับ metrics ถ้ามี
  water_quality?: number;
  water_volume?: number;
  pressure?: number;
  efficiency?: number;
  quality_trend?: string;
  volume_trend?: string;
  pressure_trend?: string;
  efficiency_trend?: string;
}

export interface WaterData {
  district_id: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number;
  volume_trend: number;
  pressure_trend: number;
  efficiency_trend: number;
  created_at: string;
  date: string;
}

export interface AdminUser {
  id: number; // PostgreSQL SERIAL primary key จะเป็น number
  username: string;
  email: string | null;
  role: string;
  created_at: string; // ISO string date
}

export interface AlertSetting {
  id: number;
  metric_name: string;
  min_good: number | null;
  max_good: number | null;
  min_warning: number | null;
  max_warning: number | null;
  min_critical: number | null;
  max_critical: number | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertLog {
    id: number;
    district_id: string;
    district_name?: string; // Optional, populated by join
    metric_name: string;
    alert_type: 'warning' | 'critical';
    current_value: number | null; // เพิ่ม | null
   threshold_value: string | null; 
    message: string;
    is_resolved: boolean;
    resolved_by_username: string | null;
    resolved_at: string | null;
    created_at: string;
}

export interface AlertSetting {
    id: number;
    metric_name: string;
    min_good: number | null;
    max_good: number | null;
    min_warning: number | null;
    max_warning: number | null;
    min_critical: number | null;
    max_critical: number | null;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
}
// types/data.ts

export interface Sensor {
  id: string;
  name: string;
  district_id?: string;
  // *** แก้ไขตรงนี้: เพิ่ม | null เพื่อให้รองรับค่า null ได้ ***
  value: number | null | undefined; 
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'offline' | 'calibrating' | 'maintenance' | 'active' | 'inactive' | string;
  last_update: string; // หรือ Date
  description: string;
  created_at: string; // หรือ Date
  sensor_type?: string;
  serial_number?: string;
  location_description?: string;
  
  last_calibration_date?: string | null; 
  next_calibration_date?: string | null;
  maintenance_notes?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  updated_at?: string; // หรือ Date
}



export interface ProblemReport {
  id: string; // UUID จาก Database
  phone: string | null;
  issue_type: string;
  subject: string;
  details: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attachment_url: string | null; // Path ไปยังไฟล์แนบ
  is_resolved: boolean; // สถานะว่าแก้ไขแล้วหรือยัง
  resolved_by_username: string | null; // ผู้ที่แก้ไข
  resolved_at: string | null; // เวลาที่แก้ไข
  created_at: string; // เวลาที่รายงานถูกสร้าง
}
export interface DistrictMetric {
    id: string;
    district_id: string;
    district_name?: string;
    water_quality: number;
    water_volume: number;
    pressure: number;
    efficiency: number;
    quality_trend: number | null;
    volume_trend: number | null;
    pressure_trend: number | null;
    efficiency_trend: number | null;
    created_at: string;
}

export interface ActivityItem {
    id: string;
    event_type: string;
    description: string;
    timestamp: string;
    user_id: string | null;
    related_id: string | null;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | null;
}