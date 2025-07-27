// Import the functions you need from the SDKs you need
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: "AIzaSyAYzzAHf2HgjR827q6a1cKh5l7tfQYfI6M",
    authDomain: "production-455812.firebaseapp.com",
    projectId: "production-455812",
    storageBucket: "production-455812.firebasestorage.app",
    messagingSenderId: "185581376798",
    appId: "1:185581376798:web:f65e87677e56cbf985250f",
    measurementId: "G-TEXSH85SF8"
  };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099");
  connectFirestoreEmulator(
    db,
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.NEXT_PUBLIC_FIREBASE_DB_EMULATOR_PORT) || 8081
  );
  connectStorageEmulator(
    storage,
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT) || 9199
  );
  console.log("Connected to emulators");
} else {
  console.log("Connected to production");
}

export { auth, db, storage };
export const analytics = isSupported().then((isSupported) => {
  if (isSupported) {
    return getAnalytics(app);
  }
});