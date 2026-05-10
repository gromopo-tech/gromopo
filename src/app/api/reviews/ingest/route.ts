import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/adminConfig'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    const idToken = authHeader.replace('Bearer ', '')
    console.log('[ingest] FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST)
    let businessId: string | null = null
    let role: string | null = null
    try {
      const decoded = await adminAuth.verifyIdToken(idToken)
      businessId = decoded.businessId || null
      role = decoded.role || null
      console.log('[ingest] token verified, uid:', decoded.uid, 'role:', role, 'businessId:', businessId)
    } catch (err) {
      console.error('[ingest] verifyIdToken failed:', err)
      return NextResponse.json({ error: 'Invalid or expired ID token' }, { status: 401 })
    }

    if (role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can upload reviews' }, { status: 403 })
    }
    if (!businessId) {
      return NextResponse.json({ error: 'No businessId on account' }, { status: 403 })
    }

    const { reviews } = await req.json()
    if (!Array.isArray(reviews)) {
      return NextResponse.json({ error: 'reviews must be an array' }, { status: 400 })
    }

    const ingestUrl = process.env.RAG_INGEST_URL
    const sharedSecret = process.env.INGEST_SHARED_SECRET
    if (!ingestUrl || !sharedSecret) {
      return NextResponse.json({ error: 'Ingest service not configured' }, { status: 500 })
    }

    const upstream = await fetch(`${ingestUrl.replace(/\/+$/, '')}/ingest/google_takeout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sharedSecret}`,
      },
      body: JSON.stringify({ business_id: businessId, reviews }),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (error) {
    console.error('Error in /api/reviews/ingest:', error)
    return NextResponse.json({ error: 'Ingest failed' }, { status: 500 })
  }
}
