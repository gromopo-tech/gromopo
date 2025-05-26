// run `node setClaims.js` to create custom claims manually for first user of a business
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize the Firebase Admin SDK
if (!getApps().length) {
  initializeApp() // export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
}

const adminAuth = getAuth();

async function setClaims() {
  const uid = ''; // Replace with the user's UID
  const businessId = ''; // Replace with the businessId
  const role = 'owner'; // first user of a business should be an owner

  await adminAuth.setCustomUserClaims(uid, { role, businessId });
  console.log(`Custom claims set for user ${uid}:`, { businessId, role });
}

setClaims().catch(console.error);