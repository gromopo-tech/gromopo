import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig'

export async function POST(req: Request) {
  try {
    const { uid: targetUid } = await req.json()

    if (!targetUid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
    }
    // Fetch the target user's document
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const targetData = targetDoc.data();
    if (!targetData) {
      return NextResponse.json({ error: 'Target user data not found' }, { status: 404 });
    }

    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '');
    let requesterRole: string | null = null;
    let requesterBusinessId: string | null = null;
    let requesterUid: string | null = null;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      requesterRole = decoded.role || null;
      requesterBusinessId = decoded.businessId || null;
      requesterUid = decoded.uid || null;
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or missing ID token' }, { status: 401 });
    }

    const isOwner = requesterRole === 'owner';
    const isAdmin = requesterRole === 'admin';
    const targetIsLimited = ['maker', 'taker'].includes(targetData.role);

    if (!(isOwner || (isAdmin && targetIsLimited))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the requester is in the same business as the target user
    if (requesterBusinessId !== targetData.businessId) {
      return NextResponse.json({ error: 'Unauthorized: Different business' }, { status: 403 });
    }

    // Check if the requester is not deleting themselves
    if (requesterUid === targetUid) {
      return NextResponse.json({ error: 'Unauthorized: Cannot delete yourself' }, { status: 403 });
    }

    // Check if the requester has the appropriate role
    if (!['admin', 'owner'].includes(requesterRole ?? '')) {
      return NextResponse.json({ error: 'Unauthorized: Insufficient role' }, { status: 403 });
    }

    await adminAuth.deleteUser(targetUid);
    await adminDb.doc(`users/${targetUid}`).delete();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
