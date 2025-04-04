// Import the functions you need from the SDKs you need
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = isSupported().then((isSupported) => {
  if (isSupported) {
    return getAnalytics(app);
  }
}
);
