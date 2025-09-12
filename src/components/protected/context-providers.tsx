'use client'

import { RoleProvider } from '@/components/protected/role-provider'
import { BusinessIdProvider } from '@/components/protected/business-id-provider'
import { BusinessNameProvider } from '@/components/protected/business-name-provider'
import EmailVerificationGuard from '@/components/protected/email-verification-guard'
import React from 'react'

export function ContextProviders({ children, role, businessId }: Readonly<{ children: React.ReactNode, role: string | null, businessId: string | null }>) {
  return (
    <EmailVerificationGuard>
      <RoleProvider role={role}>
        <BusinessIdProvider businessId={businessId}>
          <BusinessNameProvider businessId={businessId}>
            {children}
          </BusinessNameProvider>
        </BusinessIdProvider>
      </RoleProvider>
    </EmailVerificationGuard>
  )
}
