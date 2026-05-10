
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'
import React from 'react'

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
    redirect('/dashboard')
  }

  if (decoded?.role !== 'owner' || !decoded?.businessId) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
