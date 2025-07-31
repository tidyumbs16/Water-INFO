// src/types/index.ts

export interface Province {
  id: string;
  name: string;
}

export interface District {
  district_name: any;
  province: any;
  id: string;
  name: string;
  province_id?: string; // จะมีค่าถ้าคุณเพิ่ม province_id ใน districts
  lat: number; // ✅ ตอนนี้ควรจะมีค่า
  lng: number; // ✅ ตอนนี้ควรจะมีค่า
    description?: string;
    status?: string;
}


export interface WaterData {
  id: string;
  district_id: string;
  water_quality: number;
  water_volume: number;
  pressure: number;
  efficiency: number;
  quality_trend: number;
  volume_trend: number;
  pressure_trend: number;
  efficiency_trend: number;
  temperature?: number; // ✅ มีค่าถ้าคุณเพิ่มใน DB
  temperature_trend?: number; // ✅ มีค่าถ้าคุณเพิ่มใน DB
  created_at: string;
  date: string;
}

export interface HistoricalDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface DistrictSummaryMetrics {
  totalDistricts: number;
  activeSensors: number;
  criticalAlerts: number;
  avgEfficiency: number;
}

export interface GlobalWaterMetrics {
  totalWaterVolume: number;
  overallPH: number;
  averagePressure: number;
  systemUptime: string;
}

export interface Sensor {
    id: string; // หรือ number ถ้าเป็น serial
    name: string;
    district_id: string; // ID ของเขตประปาที่ Sensor นี้สังกัด
    sensor_type: string;
    serial_number: string;
    location_description?: string;
    status: string;
    value: number | null; // สามารถเป็นตัวเลขหรือ null
    unit?: string;
    description?: string;
    last_calibration_date?: string | null; // ควรเป็น string สำหรับวันที่ (ISO format)
    next_calibration_date?: string | null;
    maintenance_notes?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    created_at: string;
    last_update: string;
}


export interface OverviewData {
    total_sensors: number;
    total_data_readings: number;
    total_users: number;
    active_sensors: number;
    new_sensors_last_30_days: number;
    revenue: number;
    conversion_rate: number;
    growth_percentage: number;
}

// Type สำหรับข้อมูล Chart จาก /api/analytics/charts
export interface MonthlyChartData {
    month: string;
    users: number; // ในที่นี้คือ Total Readings/Users ในเดือนนั้น
    revenue: number; // ในที่นี้คือ Total Value/Revenue ในเดือนนั้น
}

// Type สำหรับกิจกรรมล่าสุดจาก /api/analytics/activity
export interface RecentActivity {
    time: string; // ISO string format
    description: string;
    type: string;
}