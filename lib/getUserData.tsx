import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import type { Employee } from '@/types/employee'
import { auth, db } from './firebase/config'
import { doc, getDoc, DocumentData } from 'firebase/firestore'

export function getUserData() {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<DocumentData | null>(null)
  const [loadingUserData, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      setUser(firebaseUser)
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data() as Employee)
        } else {
          setUserData(null)
        }
      } else {
        setUserData(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { user, userData, loadingUserData }
}
