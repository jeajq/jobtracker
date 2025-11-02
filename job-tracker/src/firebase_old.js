import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcxOEU7inruhKrIO4apZItBHCdJl_UAAU",
  authDomain: "job-tracker-60dc9.firebaseapp.com",
  projectId: "job-tracker-60dc9",
  storageBucket: "job-tracker-60dc9.appspot.com",
  messagingSenderId: "1095370749972",
  appId: "1:1095370749972:web:83f8a42731ae45d7634f01"
};

console.log("[FB] Initialized firebase.js");
// ✅ Prevent duplicate app initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

