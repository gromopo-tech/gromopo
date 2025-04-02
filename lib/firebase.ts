// Import the functions you need from the SDKs you need
import { getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDATeNL3j2rINlD5e8YtF4qQ-6OxtTQrc4",
  authDomain: "development-455012.firebaseapp.com",
  projectId: "development-455012",
  storageBucket: "development-455012.firebasestorage.app",
  messagingSenderId: "601356160427",
  appId: "1:601356160427:web:7b29a8df885d72ec8196ee",
  measurementId: "G-EC2MKMSEWC"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);