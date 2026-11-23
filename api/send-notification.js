
const admin = require("firebase-admin");

function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Firebase service account missing");

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(raw))
  });

  return admin;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false });
  }

  try {
    const firebase = getFirebaseAdmin();

    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({ success: false });
    }

    const decoded = await firebase.auth().verifyIdToken(match[1]);

    const userDoc = await firebase.firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (
      !userDoc.exists ||
      userDoc.data().role !== "admin" ||
      userDoc.data().isActive === false
    ) {
      return res.status(403).json({ success: false });
    }

    const title = String(req.body?.title || "").trim();
    const body = String(req.body?.body || "").trim();

    if (!title || !body || title.length > 100 || body.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Invalid title or body"
      });
    }

    const snapshot = await firebase.firestore()
      .collectionGroup("deviceTokens")
      .where("platform", "==", "android")
      .get();

    const docs = snapshot.docs.filter(d =>
      typeof d.data().token === "string" && d.data().token.length > 0
    );

    let sent = 0;
    let failed = 0;
    const invalidRefs = [];

    for (let i = 0; i < docs.length; i += 500) {
      const batch = docs.slice(i, i + 500);

      const result = await firebase.messaging().sendEachForMulticast({
        tokens: batch.map(d => d.data().token),
        notification: { title, body },
        data: { title, body },
        android: {
          priority: "high",
          notification: {
            channelId: "ssc_prepx_notifications"
          }
        }
      });

      sent += result.successCount;
      failed += result.failureCount;

      result.responses.forEach((r, index) => {
        const code = r.error?.code || "";
        if (!r.success && (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        )) {
          invalidRefs.push(batch[index].ref);
        }
      });
    }

    const db = firebase.firestore();

    for (let i = 0; i < invalidRefs.length; i += 450) {
      const writeBatch = db.batch();
      invalidRefs.slice(i, i + 450).forEach(ref => writeBatch.delete(ref));
      await writeBatch.commit();
    }

    return res.status(200).json({
      success: true,
      sent,
      failed,
      removedInvalidTokens: invalidRefs.length
    });

  } catch (error) {
    console.error("Push API error:", error);

    return res.status(500).json({
      success: false,
      message: "Notification sending failed"
    });
  }
};
        
