// ==========================================
// SSC PrepX 2.0 - FIREBASE CONFIGURATION
// ==========================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import {
  initializeAuth,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjnqZup4NYP9s50vajEl8WLAFk3Oa7iL8",
  authDomain: "sscprepx.firebaseapp.com",
  projectId: "sscprepx",
  storageBucket: "sscprepx.firebasestorage.app",
  messagingSenderId: "411821799211",
  appId: "1:411821799211:web:66c94ab10b72dea09d776e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Export Firebase Services
export {
  app,
  auth,
  db,
  storage
};

