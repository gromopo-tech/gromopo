import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig'

export async function POST(req: Request) {
  const { email, password, username, role, businessId } = await req.json()

  if (!['admin', 'taker', 'maker'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  try {
    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: username,
    })

    const uid = userRecord.uid

    // Save user info in Firestore
    await adminDb.doc(`users/${uid}`).set({
      email,
      username,
      role,
      businessId,
      createdAt: Date.now(),
    })

    // Optional: Add custom claims (useful for role-based backend access)
    await adminAuth.setCustomUserClaims(uid, { role, businessId })

    return NextResponse.json({ success: true, uid })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
