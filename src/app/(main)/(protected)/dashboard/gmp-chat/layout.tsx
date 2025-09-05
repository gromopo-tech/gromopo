
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'
import React from 'react'
import { adminDb } from '@/lib/firebase/adminConfig'

export const dynamic = 'force-dynamic'

export default async function GMPChatLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('__session')?.value
  if (!token) {
    redirect('/dashboard')
  }

  let decoded: { role?: string; businessId?: string } | null = null
  try {
    decoded = jwt.decode(token as string) as { role?: string; businessId?: string } | null
  } catch {
    console.warn('Invalid session token for GMPchat layout')
    redirect('/dashboard')
  }

  const role = decoded?.role || null
  const businessId = decoded?.businessId || null

  if (role !== 'owner' || !businessId) {
    redirect('/dashboard')
  }

  try {
    const snap = await adminDb.doc(`businesses/${businessId}`).get()
    if (!snap.exists) {
      redirect('/dashboard')
    }
    // Since businessId is now the subdomain, we can use it directly
    const subdomain = businessId
    if (!subdomain) {
      redirect('/dashboard')
    }
  } catch (err) {
    console.error('Error checking business subdomain in GMPchat layout', err)
    redirect('/dashboard')
  }

  return <>{children}</>
}
