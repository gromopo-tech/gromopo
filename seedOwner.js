// Seed a local emulator owner account for 'sandys-sandies' (matches seed-data business).
//
// Prerequisites:
//   1. Firebase emulators running: `firebase emulators:start`
//   2. Business data seeded:       `curl -X POST -H "Content-Type: application/json" http://localhost:5002/api/seed-data`
//
// Usage:
//   node seedOwner.js
//
// Optionally override defaults:
//   OWNER_EMAIL=me@test.com OWNER_PASSWORD=secret123 node seedOwner.js

// Must be set before firebase-admin initialises
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID  = 'production-455812';
const BUSINESS_ID = 'sandys-sandies';
const EMAIL       = process.env.OWNER_EMAIL    ?? 'owner@sandys-sandies.test';
const PASSWORD    = process.env.OWNER_PASSWORD ?? 'localtest123';

if (!getApps().length) {
  // No credentials needed — emulator accepts any project ID
  initializeApp({ projectId: PROJECT_ID });
}

const adminAuth = getAuth();

async function seedOwner() {
  let uid;

  try {
    const existing = await adminAuth.getUserByEmail(EMAIL);
    uid = existing.uid;
    await adminAuth.updateUser(uid, { emailVerified: true });
    console.log(`ℹ️  User already exists (${EMAIL}) — uid: ${uid}`);
  } catch {
    const created = await adminAuth.createUser({ email: EMAIL, password: PASSWORD, emailVerified: true });
    uid = created.uid;
    console.log(`✅ Created user: ${EMAIL} — uid: ${uid}`);
  }

  await adminAuth.setCustomUserClaims(uid, { role: 'owner', businessId: BUSINESS_ID });
  console.log(`✅ Custom claims set:`, { role: 'owner', businessId: BUSINESS_ID });

  console.log('\n--- Local login credentials ---');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Business: ${BUSINESS_ID}`);
  console.log('--------------------------------\n');
}

seedOwner().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
