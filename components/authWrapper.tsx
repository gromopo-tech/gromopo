'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push('/login')
          return
        }

        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          // First login – create business and user
          const businessId = user.uid
          await setDoc(doc(db, 'businesses', businessId), {
            name: user.displayName ?? 'New Business',
            ownerUid: user.uid,
            createdAt: Date.now(),
          })

          await setDoc(userRef, {
            email: user.email,
            username: user.displayName ?? '',
            role: 'admin',
            businessId,
          })
        }

        setLoading(false)
      })

      return () => unsubscribe()
    }

    checkUser()
  }, [router])

  if (loading) return <p>Loading...</p>

  return <>{children}</>
}
