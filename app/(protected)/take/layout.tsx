'use client'

import { getUserData } from '@/lib/getUserData'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userData, loading } = getUserData()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user || !userData || !['owner', 'admin', 'taker'].includes(userData.role)) {
        toast.error('Access denied.');
        router.replace('/make')
      }
    }
  }, [loading, user, userData, router])

  if (loading || !user || !userData) {
    return <div className="p-4">Loading...</div>
  }

  return <>{children}</>
}
