import { adminAuth, adminDb } from './firebase/adminConfig'

export async function getRequesterDataFromToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const idToken = authHeader.split('Bearer ')[1]
  const user = await adminAuth.verifyIdToken(idToken)

  const userDoc = await adminDb.collection('users').doc(user.uid).get()
  if (!userDoc.exists) {
    throw new Error('User record not found')
  }

  const userData = userDoc.data()
  return {user, userData}
}
