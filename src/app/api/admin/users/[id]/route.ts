// app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { authenticateRequest } from '@/lib/auth'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง
import { logActivity } from '@/lib/activityLogger'; // ตรวจสอบเส้นทางนี้ให้ถูกต้อง

// Global variables from Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase app and Firestore once
let appInstance;
let dbInstance;

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
 * @function GET
 * @description Handles GET requests to fetch a single user by ID.
 * @returns {NextResponse} A JSON response containing the user data.
 */
export async function GET(
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

  const { id } = params; // params.id is available here
  if (!id) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, `artifacts/${appId}/users/${authResult.userId}/data/users`, id); // Adjust path
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ id: userDoc.id, ...userDoc.data() }, { status: 200 });
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @function PUT
 * @description Handles PUT requests to update an existing user by ID.
 * @returns {NextResponse} A JSON response with the updated user.
 */
export async function PUT(
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
    return NextResponse.json({ message: 'User ID is required for update' }, { status: 400 });
  }

  try {
    const updates = await request.json();
    const userDocRef = doc(db, `artifacts/${appId}/users/${authResult.userId}/data/users`, id); // Adjust path

    // Optional: Fetch old data for logging purposes
    const oldDoc = await getDoc(userDocRef);
    const oldData = oldDoc.exists() ? oldDoc.data() : {};

    await updateDoc(userDocRef, {
      ...updates,
      updated_at: new Date(), // Update timestamp
    });

    await logActivity({
      userId: callingUserId || 'N/A',
      eventType: 'USER_UPDATED',
      description: `แก้ไขข้อมูลผู้ใช้: ${oldData.name || id}`,
      relatedId: id,
      severity: 'INFO',
      details: {
        oldData: oldData, // Log old data
        newData: updates, // Log new data
      }
    });

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

/**
 * @function DELETE
 * @description Handles DELETE requests to delete a user by ID.
 * @returns {NextResponse} A JSON response indicating success or failure.
 */
export async function DELETE(
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
    return NextResponse.json({ message: 'User ID is required for deletion' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, `artifacts/${appId}/users/${authResult.userId}/data/users`, id); // Adjust path

    // Optional: Fetch user data before deleting for logging
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : { name: 'Unknown User' };

    await deleteDoc(userDocRef);

    await logActivity({
      userId: callingUserId || 'N/A',
      eventType: 'USER_DELETED',
      description: `ลบผู้ใช้: ${userData.name} (ID: ${id})`,
      relatedId: id,
      severity: 'WARNING',
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
