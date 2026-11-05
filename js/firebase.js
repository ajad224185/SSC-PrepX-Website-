
// SSC PrepX 2.0 - Firebase Configuration

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

// New SSC PrepX 2.0 Web App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-wBjoD1mPq5RRTknOICq4bOpCBRx-FGc",
  authDomain: "ssc-library.firebaseapp.com",
  projectId: "ssc-library",
  storageBucket: "ssc-library.firebasestorage.app",
  messagingSenderId: "1062574277938",
  appId: "1:1062574277938:web:ae9b628a0841600907c32b",
  measurementId: "G-C6YX49ZQFK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export Services
export {
  app,
  auth,
  db,
  storage
};
