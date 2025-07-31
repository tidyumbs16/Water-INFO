// lib/definitions.ts

/**
 * @interface District
 * @description Defines the structure for a District object.
 * This interface is used throughout the application for type checking,
 * ensuring consistency when handling district data from the database or forms.
 */
export interface District {
  id: string; // Unique identifier for the district
  name: string; // Name of the district
  // Add any other properties your District object might have, for example:
  // provinceId: string; // If districts belong to provinces
  // code: string; // A unique code for the district
  // createdAt: string; // Timestamp for creation
  // updatedAt: string; // Timestamp for last update
}

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null; // สามารถเป็น null ได้
  details: Record<string, any> | null; // ใช้ Record<string, any> สำหรับ JSONB, สามารถเป็น null ได้
  timestamp: Date;
};