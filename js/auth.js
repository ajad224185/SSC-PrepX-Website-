// ==========================================
// SSC PrepX 2.0 - AUTHENTICATION SYSTEM
// FIRESTORE SIGNUP RACE FIX + ANDROID FCM
// ==========================================

import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ==========================================
// AUTH INITIALIZATION
// ==========================================

export const authReady = setPersistence(
  auth,
  browserLocalPersistence
);

// Registration ke waqt auth listener ko duplicate
// user document create karne se rokta hai.
let registrationInProgress = false;

// Google / Phone login ke concurrent requests ko serialize karta hai.
const userDocumentPromises = new Map();

// ==========================================
// CREATE USER DOCUMENT IF MISSING
// ==========================================

function ensureUserDocument(user, profile = {}) {
  if (!user) return Promise.resolve();

  const uid = user.uid;

  if (userDocumentPromises.has(uid)) {
    return userDocumentPromises.get(uid);
  }

  const task = (async () => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    // Existing student/admin document ko overwrite nahi karna.
    if (userSnap.exists()) return;

    await setDoc(userRef, {
      uid: uid,
      name: profile.name || user.displayName || "",
      username: profile.username || "",
      email: user.email || "",
      phone: profile.phone || user.phoneNumber || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      role: "student",
      isActive: true
    });
  })();

  userDocumentPromises.set(uid, task);

  return task.finally(() => {
    if (userDocumentPromises.get(uid) === task) {
      userDocumentPromises.delete(uid);
    }
  });
}

// ==========================================
// ANDROID FCM TOKEN SAVE
// ==========================================

async function saveAndroidFCMToken(user) {
  try {
    if (!user) return;

    if (
      !window.AndroidFcm ||
      typeof window.AndroidFcm.getToken !== "function"
    ) {
      return;
    }

    const token = window.AndroidFcm.getToken();

    if (!token || typeof token !== "string") return;

    const tokenRef = doc(
      db,
      "users",
      user.uid,
      "deviceTokens",
      "android"
    );

    await setDoc(tokenRef, {
      token: token,
      platform: "android",
      updatedAt: serverTimestamp()
    });

    console.log("Android FCM token saved successfully.");

  } catch (error) {
    console.error("FCM Token Save Error:", error);
  }
}

// ==========================================
// EMAIL LOGIN
// ==========================================

export async function loginWithEmail(email, password) {
  try {
    await authReady;

    const result = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error("Email Login Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

// ==========================================
// EMAIL REGISTER
// ==========================================

export async function registerWithEmail(
  name,
  email,
  password,
  profile = {}
) {
  let createdUser = null;

  try {
    await authReady;

    registrationInProgress = true;

    const result = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    createdUser = result.user;

    if (name && name.trim()) {
      await updateProfile(createdUser, {
        displayName: name.trim()
      });
    }

    // Sirf registration function user document create karega.
    // Auth listener registration ke dauran creation skip karega.
    await ensureUserDocument(createdUser, {
      name: name ? name.trim() : "",
      username: profile.username
        ? profile.username.trim().toLowerCase()
        : "",
      phone: profile.phone ? profile.phone.trim() : ""
    });

    registrationInProgress = false;

    // Document banne ke baad FCM token save karo.
    await saveAndroidFCMToken(createdUser);

    return {
      success: true,
      user: createdUser
    };

  } catch (error) {
    registrationInProgress = false;

    console.error("Registration Error:", error);

    // Auth account ko automatically delete nahi karna.
    // Isse original Firestore error bhi preserve rahega.

    return {
      success: false,
      error: error.code,
      accountCreated: !!createdUser,
      message: createdUser
        ? "Account ban gaya hai, lekin profile save nahi hui. Dobara login karke try karein. Error: " + getAuthErrorMessage(error.code)
        : getAuthErrorMessage(error.code)
    };

  } finally {
    registrationInProgress = false;
  }
}

// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function resetPassword(email) {
  try {
    await authReady;

    await sendPasswordResetEmail(auth, email.trim());

    return {
      success: true,
      message: "Password reset email भेज दिया गया है।"
    };

  } catch (error) {
    console.error("Password Reset Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

// ==========================================
// GOOGLE LOGIN
// ==========================================

export async function loginWithGoogle() {
  try {
    await authReady;

    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    // Missing user document auth listener create karega.
    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error("Google Login Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

// ==========================================
// RECAPTCHA
// ==========================================

export function setupRecaptcha(containerId) {
  try {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}

      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: "invisible",

        callback: () => {
          console.log("reCAPTCHA verified");
        },

        "expired-callback": () => {
          console.log("reCAPTCHA expired");
        }
      }
    );

    return window.recaptchaVerifier;

  } catch (error) {
    console.error("reCAPTCHA Setup Error:", error);
    window.lastRecaptchaError = error;
    return null;
  }
}

// ==========================================
// SEND MOBILE OTP
// ==========================================

export async function sendMobileOTP(
  phoneNumber,
  containerId
) {
  try {
    await authReady;

    const appVerifier = setupRecaptcha(containerId);

    if (!appVerifier) {
      const error = window.lastRecaptchaError;

      return {
        success: false,
        error: error?.code || "recaptcha-setup-failed",
        message:
          "reCAPTCHA setup नहीं हो पाया। [" +
          (error?.code || error?.message || "unknown") +
          "]"
      };
    }

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      appVerifier
    );

    window.confirmationResult = confirmationResult;

    return {
      success: true,
      message: "OTP successfully भेज दिया गया है।"
    };

  } catch (error) {
    console.error("Mobile OTP Error:", error);

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}

      window.recaptchaVerifier = null;
    }

    return {
      success: false,
      error: error.code,
      message:
        getAuthErrorMessage(error.code) +
        " [" + (error.code || error.message) + "]"
    };
  }
}

// ==========================================
// VERIFY MOBILE OTP
// ==========================================

export async function verifyMobileOTP(otp) {
  try {
    await authReady;

    if (!window.confirmationResult) {
      return {
        success: false,
        message: "पहले OTP भेजें।"
      };
    }

    const result = await window.confirmationResult.confirm(
      otp.trim()
    );

    return {
      success: true,
      user: result.user
    };

  } catch (error) {
    console.error("OTP Verification Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

// ==========================================
// LOGOUT
// ==========================================

export async function logoutUser() {
  try {
    await authReady;

    const user = auth.currentUser;

    if (user) {
      try {
        const tokenRef = doc(
          db,
          "users",
          user.uid,
          "deviceTokens",
          "android"
        );

        await deleteDoc(tokenRef);

      } catch (tokenError) {
        console.error(
          "FCM Token Delete Error:",
          tokenError
        );
      }
    }

    await signOut(auth);

    return {
      success: true
    };

  } catch (error) {
    console.error("Logout Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

// ==========================================
// AUTH STATE
// ==========================================

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await authReady;

        // Email registration ke dauran duplicate create nahi hoga.
        if (!registrationInProgress) {
          await ensureUserDocument(user);
          await saveAndroidFCMToken(user);
        }

      } catch (error) {
        console.error(
          "Auth Setup / FCM Error:",
          error
        );
      }
    }

    callback(user);
  });
}

// ==========================================
// ANDROID FCM TOKEN READY EVENT
// ==========================================

window.addEventListener("ssc-fcm-token-ready", async () => {
  try {
    await authReady;

    if (registrationInProgress) return;

    const user = auth.currentUser;

    if (user) {
      await ensureUserDocument(user);
      await saveAndroidFCMToken(user);
    }

  } catch (error) {
    console.error("FCM Token Ready Event Error:", error);
  }
});

// ==========================================
// CURRENT USER
// ==========================================

export function getCurrentUser() {
  return auth.currentUser;
}

// ==========================================
// FIREBASE ERROR MESSAGES
// ==========================================

function getAuthErrorMessage(code) {
  switch (code) {

    case "auth/invalid-email":
      return "Email address सही नहीं है।";

    case "auth/user-not-found":
      return "इस Email से कोई account नहीं मिला।";

    case "auth/wrong-password":
      return "Password गलत है।";

    case "auth/invalid-credential":
      return "Email या Password गलत है।";

    case "auth/email-already-in-use":
      return "यह Email पहले से registered है।";

    case "auth/weak-password":
      return "Password कम से कम 6 characters का रखें।";

    case "auth/too-many-requests":
      return "बहुत ज्यादा attempts हो गए हैं। थोड़ी देर बाद try करें।";

    case "auth/invalid-phone-number":
      return "Mobile number सही format में डालें।";

    case "auth/missing-phone-number":
      return "Mobile number डालें।";

    case "auth/invalid-verification-code":
      return "OTP गलत है।";

    case "auth/code-expired":
      return "OTP expire हो गया है। नया OTP लें।";

    case "auth/quota-exceeded":
      return "OTP quota समाप्त हो गया है।";

    case "auth/captcha-check-failed":
      return "reCAPTCHA check fail हो गया। Page refresh करके try करें।";

    case "auth/invalid-app-credential":
      return "App verification fail हुआ।";

    case "auth/unauthorized-domain":
      return "यह domain Firebase में authorized नहीं है।";

    case "auth/billing-not-enabled":
      return "Phone login के लिए Firebase billing enable करनी होगी।";

    case "auth/internal-error":
      return "Firebase में internal error आया।";

    case "auth/popup-closed-by-user":
      return "Google Login popup बंद कर दिया गया।";

    case "auth/popup-blocked":
      return "Google Login popup browser ने block कर दिया।";

    case "auth/operation-not-allowed":
      return "यह Login method Firebase में अभी enabled नहीं है।";

    case "auth/network-request-failed":
      return "Internet connection check करें।";

    case "permission-denied":
    case "firestore/permission-denied":
      return "Firestore permission नहीं मिली।";

    case "unavailable":
      return "Firebase service अभी उपलब्ध नहीं है।";

    default:
      return "Login में समस्या हुई। कृपया दोबारा try करें।";
  }
      }
