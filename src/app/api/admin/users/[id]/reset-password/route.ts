// app/api/admin/users/[id]/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, updateDoc, Firestore } from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { authenticateRequest } from '@/lib/auth'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง
import { logActivity } from '@/lib/activityLogger'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง

// Global variables from Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase app and Firestore once
let appInstance: FirebaseApp;
let dbInstance: Firestore;

function getFirebaseDb() {
  if (!appInstance) {
    appInstance = initializeApp(firebaseConfig);
  }
  if (!dbInstance) {
    dbInstance = getFirestore(appInstance);
  }
  return dbInstance;
}

// Helper function to get user ID from request (for logging)
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authResult = authenticateRequest(req);
  if (authResult instanceof NextResponse) {
    return null;
  }
  return authResult.userId || 'unknown_admin';
}

/**
 * @function POST
 * @description Handles POST requests to reset a user's password by ID.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const db = getFirebaseDb();
  if (!db) {
    return NextResponse.json({ message: 'Firestore not initialized.' }, { status: 500 });
  }

  const callingUserId = await getUserIdFromRequest(request);
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'User ID is required for password reset' }, { status: 400 });
  }

  try {
    const { newPassword } = await request.json();
    if (!newPassword) {
      return NextResponse.json({ message: 'New password is required' }, { status: 400 });
    }

    const userDocRef = doc(db, `artifacts/${appId}/users/${authResult.userId}/data/users`, id); // Adjust path

    // In a real application, you would hash the newPassword before storing it.
    // For demonstration, we'll store it as plain text (NOT RECOMMENDED FOR PRODUCTION).
    await updateDoc(userDocRef, {
      password: "hashed_" + newPassword, // Simulate hashing
      updated_at: new Date(),
    });

    await logActivity({
      userId: callingUserId || 'N/A',
      eventType: 'PASSWORD_RESET',
      description: `รีเซ็ตรหัสผ่านผู้ใช้ ID: ${id}`,
      relatedId: id,
      severity: 'WARNING', // Password reset is a sensitive action
    });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error resetting password for user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to reset password', error: (error as Error).message }, { status: 500 });
  }
}
