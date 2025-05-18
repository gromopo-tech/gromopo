import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, db } from './firebase/config'
import { doc, getDoc, DocumentData } from 'firebase/firestore'

export function getUserData() {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<DocumentData | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data())
        } else {
          setUserData(null)
        }
      } else {
        setUserData(null)
      }
    })

    return unsubscribe
  }, [])

  return { user, userData }
}
