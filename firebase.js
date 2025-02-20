// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8l1MSX0_mjZcjbFyhpcu1MLPafFLk0OM",
  authDomain: "taskmanager-caab5.firebaseapp.com",
  projectId: "taskmanager-caab5",
  storageBucket: "taskmanager-caab5.firebasestorage.app",
  messagingSenderId: "299848474236",
  appId: "1:299848474236:web:fe0ef542633f56d75af3f9",
  measurementId: "G-NLVJF8QJBP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
