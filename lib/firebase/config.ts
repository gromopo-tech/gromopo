// Import the functions you need from the SDKs you need
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
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

let localAuth;
let localDb;

if (process.env.NODE_ENV === "development") {
  // connect SDKs to emulators
  localAuth = getAuth();
  connectAuthEmulator(
    localAuth, 
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099");

  localDb = getFirestore();
  connectFirestoreEmulator(
    localDb, 
    process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.NEXT_PUBLIC_FIREBASE_DB_EMULATOR_PORT) || 8080
  );

  console.log("Connected to emulators");
} else {
  // Use production config
  localAuth = getAuth(app);
  localDb = getFirestore(app);
  console.log("Connected to production");
}

export const auth = localAuth;
export const db = localDb;
export const analytics = isSupported().then((isSupported) => {
  if (isSupported) {
    return getAnalytics(app);
  }
});