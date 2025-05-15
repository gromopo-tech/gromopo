// lib/getUserRole.ts
import { adminAuth, adminDb } from './firebase/adminConfig'

export async function getRequesterRoleFromToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const idToken = authHeader.split('Bearer ')[1]
  const decodedToken = await adminAuth.verifyIdToken(idToken)

  const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get()
  if (!userDoc.exists) {
    throw new Error('User record not found')
  }

  const { role } = userDoc.data() as { role: string }
  return { role, uid: decodedToken.uid }
}
