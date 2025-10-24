import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Firestore SDK
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcxOEU7inruhKrIO4apZItBHCdJl_UAAU",
  authDomain: "job-tracker-60dc9.firebaseapp.com",
  projectId: "job-tracker-60dc9",
  storageBucket: "job-tracker-60dc9.firebasestorage.app",
  messagingSenderId: "1095370749972",
  appId: "1:1095370749972:web:83f8a42731ae45d7634f01"
};

//initialize Firebase
const app = initializeApp(firebaseConfig);

//initialize Firestore
const db = getFirestore(app);
const auth = getAuth(app);

//export the Firestore db to use in other files
export { db, auth };
