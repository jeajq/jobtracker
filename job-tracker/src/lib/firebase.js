// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcxOEU7inruhKrIO4apZItBHCdJl_UAAU",
  authDomain: "job-tracker-60dc9.firebaseapp.com",
  projectId: "job-tracker-60dc9",
  storageBucket: "job-tracker-60dc9.firebasestorage.app",
  messagingSenderId: "1095370749972",
  appId: "1:1095370749972:web:83f8a42731ae45d7634f01"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);