import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Only initialize once (Next.js hot reload compatibility)
if (!getApps().length) {
  initializeApp({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
