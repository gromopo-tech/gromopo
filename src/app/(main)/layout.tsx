import React from 'react'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AppHeaderMain } from '@/components/app-header-main'
import { RoleProvider } from '@/components/protected/role-provider'
import { BusinessIdProvider } from '@/components/protected/business-id-provider'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: string | null = null
  let businessId: string | null = null
  let isAuthenticated = false

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')
    const token = sessionCookie?.value
    if (token) {
      const decoded = jwt.decode(token) as { role?: string; businessId?: string } | null
      role = decoded?.role || null
      businessId = decoded?.businessId || null
      isAuthenticated = true
    }
  } catch (err) {
    console.warn('Failed to read session cookie in main layout:', err)
  }

  return (
    <RoleProvider role={role}>
      <BusinessIdProvider businessId={businessId}>
        <AppHeaderMain isAuthenticated={isAuthenticated} />
        {children}
      </BusinessIdProvider>
    </RoleProvider>
  )
}
