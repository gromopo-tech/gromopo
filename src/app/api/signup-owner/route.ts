import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/adminConfig';

export async function POST(req: Request) {
  const { uid, businessId } = await req.json();

  if (!uid || !businessId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Set custom claims for owner
    await adminAuth.setCustomUserClaims(uid, { role: 'owner', businessId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to sign up owner' }, { status: 500 });
  }
}
