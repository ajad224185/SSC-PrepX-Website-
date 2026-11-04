// SSC PrepX 2.0 - Firebase Configuration
// Existing Firebase Project: ssc-library

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// IMPORTANT:
// Apne Firebase Console se existing Web App ka Config yahan paste karein.

const firebaseConfig = {
  apiKey: "AIzaSyC-wBjoD1mPq5RRTknOICq4bOpCBRx-FGc",
  authDomain: "ssc-library.firebaseapp.com",
  projectId: "ssc-library",
  storageBucket: "ssc-library.firebasestorage.app",
  messagingSenderId: "1062574277938",
  appId: "1:1062574277938:web:0e9427e75888816c07c32b",
  measurementId: "G-D4MSV4P5P1"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services
export {
  app,
  auth,
  db,
  storage
};
