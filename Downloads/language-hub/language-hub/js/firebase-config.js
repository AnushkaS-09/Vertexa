import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1. Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA6PeCdpZW_l7iSHSnWRLpLX12_SuCwLH4",
  authDomain: "language-hub-74e7c.firebaseapp.com",
  projectId: "language-hub-74e7c",
  storageBucket: "language-hub-74e7c.firebasestorage.app",
  messagingSenderId: "952073339934",
  appId: "1:952073339934:web:8b11079df3c213862c1a0f",
  measurementId: "G-KF9K2V905K"
};

// 2. Configuration check
export const isConfigured = !Object.values(firebaseConfig).some((v) => String(v).includes("YOUR_"));

// 3. Initialize Firebase Services
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 4. Cloudinary Free Upload Credentials
