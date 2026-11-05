// SSC PrepX 2.0 - New Firebase Project

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCjnqZup4NYP9s50vajEl8WLAFk3Oa7iL8",
  authDomain: "sscprepx.firebaseapp.com",
  projectId: "sscprepx",
  storageBucket: "sscprepx.firebasestorage.app",
  messagingSenderId: "411821799211",
  appId: "1:411821799211:web:66c94ab10b72dea09d776e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
