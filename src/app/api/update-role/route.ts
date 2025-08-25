import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig';

export async function POST(req: Request) {
  try {
    const { uid, role, businessId } = await req.json();
    if (!uid || !role || !businessId) {
      return NextResponse.json({ error: 'Missing uid, role, or businessId' }, { status: 400 });
    }

    // Get current claims to preserve businessId
    const user = await adminAuth.getUser(uid);
    const currentClaims = user.customClaims || {};
    await adminAuth.setCustomUserClaims(uid, { ...currentClaims, role, businessId });

    // Optionally update Firestore user doc for display
    await adminDb.collection(`businesses/${businessId}/employees`).doc(uid).update({ role });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating user role:', err);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
