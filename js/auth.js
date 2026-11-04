// ==========================================
// SSC PrepX 2.0 - Authentication
// ==========================================

import {
  auth
} from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";


// ==========================================
// EMAIL LOGIN
// ==========================================

export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(
      auth,
      email,
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
// REGISTER WITH EMAIL
// ==========================================

export async function registerWithEmail(email, password) {
  try {

    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    return {
      success: true,
      user: result.user
    };

  } catch (error) {

    console.error("Registration Error:", error);

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// MOBILE OTP
// ==========================================

export function setupRecaptcha(buttonId) {

  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    buttonId,
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
}


// ==========================================
// SEND OTP
// ==========================================

export async function sendMobileOTP(phoneNumber, buttonId) {

  try {

    const appVerifier = setupRecaptcha(buttonId);

    const confirmationResult =
      await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

    window.confirmationResult = confirmationResult;

    return {
      success: true,
      message: "OTP sent successfully"
    };

  } catch (error) {

    console.error("OTP Error:", error);

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }

    return {
      success: false,
      error: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}


// ==========================================
// VERIFY OTP
// ==========================================

export async function verifyMobileOTP(otp) {

  try {

    if (!window.confirmationResult) {
      return {
        success: false,
        message: "Please request OTP first."
      };
    }

    const result =
      await window.confirmationResult.confirm(otp);

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

    await signOut(auth);

    return {
      success: true
    };

  } catch (error) {

    console.error("Logout Error:", error);

    return {
      success: false,
      error: error.code
    };
  }
}


// ==========================================
// CURRENT USER LISTENER
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
// GET CURRENT USER
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
      return "OTP quota समाप्त हो गया है। बाद में try करें।";

    default:
      return "Login में समस्या हुई। कृपया दोबारा try करें।";
  }
    }
