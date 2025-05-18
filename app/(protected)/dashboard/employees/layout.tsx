'use client'

import { getUserData } from '@/lib/getUserData'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userData, loadingUserData } = getUserData()
  const router = useRouter()
  
  useEffect(() => {
    if (!loadingUserData) {
      if (!user || !userData || !['owner', 'admin'].includes(userData.role)) {
        router.replace('/dashboard')
      }
    }
  }, [loadingUserData, user, userData, router])

  if (loadingUserData || !user || !userData) {
    return <div className="p-4">Loading...</div>
  }

  return <>{children}</>
}
