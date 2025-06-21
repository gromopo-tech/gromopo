'use client'

import { RoleProvider } from '@/components/business/role-provider'
import { BusinessIdProvider } from '@/components/business/business-id-provider'
import { BusinessNameProvider } from '@/components/business/business-name-provider'
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
