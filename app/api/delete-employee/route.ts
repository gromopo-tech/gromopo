// app/api/delete-employee/route.ts
import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig'

export async function POST(req: Request) {
  try {
    const { uid } = await req.json()

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
    }

    await adminAuth.deleteUser(uid)
    await adminDb.doc(`users/${uid}`).delete()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error deleting user:', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
