import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Only initialize once (Next.js hot reload compatibility)
if (!getApps().length) {
  initializeApp()
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
