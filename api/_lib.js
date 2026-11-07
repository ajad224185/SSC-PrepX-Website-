// Shared helpers for Razorpay + Firebase Admin (Vercel serverless)
const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}
const db = admin.firestore();

const DAYS = { m3: 90, m6: 180, life: null };   // validity in days

function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

async function authUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) throw fail(401, "Login required");
  try { return await admin.auth().verifyIdToken(token); }
  catch (e) { throw fail(401, "Session invalid, dobara login karein"); }
}

function body(req) {
  const b = req.body;
  if (typeof b === "string") { try { return JSON.parse(b || "{}"); } catch (e) { return {}; } }
  return b || {};
}

function rzpAuthHeader() {
  return "Basic " + Buffer.from(
    process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_KEY_SECRET
  ).toString("base64");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Creates / extends the enrollment ONLY for an existing payments/{orderId} doc.
// Safe to call twice (idempotent) - verify-payment and webhook both use it.
async function grantAccess(orderId, paymentId) {
  const pRef = db.collection("payments").doc(orderId);
  return db.runTransaction(async (tx) => {
    const pSnap = await tx.get(pRef);
    if (!pSnap.exists) throw fail(404, "Order not found");
    const p = pSnap.data();
    if (p.status === "success") return p;

    const eRef = db.collection("enrollments").doc(p.uid + "_" + p.courseId);
    const eSnap = await tx.get(eRef);

    const now = Date.now();
    const days = DAYS[p.plan];
    let expiresAt = null;
    if (days != null) {
      const old = eSnap.exists ? eSnap.data().expiresAt : 0;
      const base = old && old > now ? old : now;       // renew = remaining time + new plan
      expiresAt = base + days * 86400000;
    }
    if (eSnap.exists && eSnap.data().expiresAt == null) expiresAt = null; // already lifetime

    tx.set(eRef, {
      uid: p.uid, courseId: p.courseId, courseTitle: p.courseTitle || "",
      plan: p.plan, startAt: now, expiresAt, orderId
    });
    tx.update(pRef, { status: "success", paidAt: now, razorpayPaymentId: paymentId });
    return p;
  });
}

module.exports = { admin, db, crypto, DAYS, fail, authUser, body, rzpAuthHeader, safeEqual, grantAccess };
