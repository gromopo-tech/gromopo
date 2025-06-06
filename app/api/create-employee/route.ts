import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  const { lastName, firstName, email, role, businessId } = await req.json()
  const tempPassword = randomBytes(12).toString('base64')

  if (!email || !role || !firstName || !lastName || !businessId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!['admin', 'taker', 'maker'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Get the ID token from the Authorization header
  const authHeader = req.headers.get('authorization') || ''
  const idToken = authHeader.replace('Bearer ', '')
  let requesterRole: string | null = null
  let requesterBusinessId: string | null = null
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    requesterRole = decoded.role || null
    requesterBusinessId = decoded.businessId || null
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or missing ID token' }, { status: 401 })
  }

  const isOwner = requesterRole === 'owner'
  const isAdmin = requesterRole === 'admin'
  const targetIsLimited = ['maker', 'taker'].includes(role)

  if (!(isOwner || (isAdmin && targetIsLimited))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password: tempPassword,
      displayName: firstName + ' ' + lastName,
      emailVerified: false
    })

    const uid = userRecord.uid

    // Save user info in Firestore
    await adminDb.doc(`users/${uid}`).set({
      lastName,
      firstName,
      email,
      role,
      businessId,
      createdAt: Date.now(),
    })

    // Add custom claims (role and businessId)
    await adminAuth.setCustomUserClaims(uid, { role, businessId })

    // Send reset email (user will set their real password)
    const resetLink = await adminAuth.generatePasswordResetLink(email)

    return NextResponse.json({ success: true, uid: uid, resetLink })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
