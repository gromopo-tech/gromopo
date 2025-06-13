'use client'

import { RoleProvider } from '@/components/private/role-provider'
import { BusinessIdProvider } from '@/components/private/business-id-provider'
import { BusinessNameProvider } from '@/components/private/business-name-provider'
import React from 'react'

export function ContextProviders({ children, role, businessId }: Readonly<{ children: React.ReactNode, role: string | null, businessId: string | null }>) {
  return (
    <RoleProvider role={role}>
      <BusinessIdProvider businessId={businessId}>
        <BusinessNameProvider businessId={businessId}>
          {children}
        </BusinessNameProvider>
      </BusinessIdProvider>
    </RoleProvider>
  )
}
