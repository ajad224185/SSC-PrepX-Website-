// ==========================================
// SSC PrepX 2.0 - NEW AUTHENTICATION SYSTEM
// ==========================================

import {
  auth,
  db
} from "./firebase.js";

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
  deleteUser
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// ==========================================
// EMAIL LOGIN
// ==========================================

export async function loginWithEmail(email, password) {

  try {

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
// EMAIL REGISTER + SAVE STUDENT PROFILE
// ==========================================

export async function registerWithEmail(
  name,
  email,
  password,
  profile = {}
) {

  let createdUser = null;

  try {

    // --------------------------------------
    // CREATE FIREBASE AUTH ACCOUNT
    // --------------------------------------

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

    createdUser = result.user;


    // --------------------------------------
    // SAVE NAME IN FIREBASE AUTH PROFILE
    // --------------------------------------

    if (name && name.trim()) {

      await updateProfile(
        createdUser,
        {
          displayName: name.trim()
        }
      );
    }


    // --------------------------------------
    // SAVE STUDENT DATA IN FIRESTORE
    // --------------------------------------

    await setDoc(
      doc(db, "users", createdUser.uid),
      {

        uid: createdUser.uid,

        name: name ? name.trim() : "",

        username:
          profile.username
            ? profile.username.trim().toLowerCase()
            : "",

        email:
          email
            ? email.trim().toLowerCase()
            : "",

        phone:
          profile.phone
            ? profile.phone.trim()
            : "",

        createdAt: serverTimestamp(),

        updatedAt: serverTimestamp(),

        role: "student",

        isActive: true

      },
      {
        merge: true
      }
    );


    // --------------------------------------
    // SUCCESS
    // --------------------------------------

    return {
      success: true,
      user: createdUser
    };


  } catch (error) {

    console.error(
      "Registration / Firestore Error:",
      error
    );


    // --------------------------------------
    // ROLLBACK AUTH USER IF FIRESTORE FAILS
    // --------------------------------------

    if (createdUser) {

      try {

        await deleteUser(createdUser);

        console.log(
          "Auth account rollback successful."
        );

      } catch (deleteError) {

        console.error(
          "Rollback Error:",
          deleteError
        );
      }
    }


    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// FORGOT PASSWORD
// ==========================================

export async function resetPassword(email) {

  try {

    await sendPasswordResetEmail(
      auth,
      email.trim()
    );

    return {
      success: true,
      message: "Password reset email भेज दिया गया है।"
    };

  } catch (error) {

    console.error(
      "Password Reset Error:",
      error
    );

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

    const provider =
      new GoogleAuthProvider();

    const result =
      await signInWithPopup(
        auth,
        provider
      );

    return {
      success: true,
      user: result.user
    };

  } catch (error) {

    console.error(
      "Google Login Error:",
      error
    );

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// reCAPTCHA
// ==========================================

export function setupRecaptcha(containerId) {

  try {

    if (window.recaptchaVerifier) {

      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}

      window.recaptchaVerifier = null;
    }


    window.recaptchaVerifier =
      new RecaptchaVerifier(
        auth,
        containerId,
        {
          size: "invisible",

          callback: () => {
            console.log(
              "reCAPTCHA verified"
            );
          },

          "expired-callback": () => {
            console.log(
              "reCAPTCHA expired"
            );
          }
        }
      );


    return window.recaptchaVerifier;


  } catch (error) {

    console.error(
      "reCAPTCHA Setup Error:",
      error
    );

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

    const appVerifier =
      setupRecaptcha(containerId);


    if (!appVerifier) {

      return {
        success: false,
        message:
          "reCAPTCHA setup नहीं हो पाया।"
      };
    }


    const confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );


    window.confirmationResult =
      confirmationResult;


    return {
      success: true,
      message:
        "OTP successfully भेज दिया गया है।"
    };


  } catch (error) {

    console.error(
      "Mobile OTP Error:",
      error
    );


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
        getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// VERIFY MOBILE OTP
// ==========================================

export async function verifyMobileOTP(otp) {

  try {

    if (!window.confirmationResult) {

      return {
        success: false,
        message:
          "पहले OTP भेजें।"
      };
    }


    const result =
      await window.confirmationResult.confirm(
        otp.trim()
      );


    return {
      success: true,
      user: result.user
    };


  } catch (error) {

    console.error(
      "OTP Verification Error:",
      error
    );


    return {
      success: false,
      error: error.code,
      message:
        getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// LOGOUT
// ==========================================

export async function logoutUser() {

  try {

    await signOut(auth);

    return {
      success: true
    };

  } catch (error) {

    console.error(
      "Logout Error:",
      error
    );

    return {
      success: false,
      error: error.code,
      message:
        getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// AUTH STATE
// ==========================================

export function watchAuthState(callback) {

  return onAuthStateChanged(
    auth,
    (user) => {
      callback(user);
    }
  );
}


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

    case "auth/invalid-verification-code":
      return "OTP गलत है।";

    case "auth/code-expired":
      return "OTP expire हो गया है। नया OTP लें।";

    case "auth/quota-exceeded":
      return "OTP quota समाप्त हो गया है।";

    case "auth/popup-closed-by-user":
      return "Google Login popup बंद कर दिया गया।";

    case "auth/popup-blocked":
      return "Google Login popup browser ने block कर दिया।";

    case "auth/operation-not-allowed":
      return "यह Login method Firebase में अभी enabled नहीं है।";

    case "auth/network-request-failed":
      return "Internet connection check करें।";

    case "permission-denied":
      return "Firestore permission नहीं मिली।";

    case "unavailable":
      return "Firebase service अभी उपलब्ध नहीं है।";

    default:
      return "Login में समस्या हुई। कृपया दोबारा try करें।";
  }
      }
