const { db, DAYS, fail, authUser, body, rzpAuthHeader } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const user = await authUser(req);
    const { courseId, plan } = body(req);
    if (!courseId || !Object.prototype.hasOwnProperty.call(DAYS, plan)) throw fail(400, "Invalid request");

    // Price ALWAYS comes from Firestore, never from the browser
    const cSnap = await db.collection("courses").doc(String(courseId)).get();
    if (!cSnap.exists) throw fail(404, "Course nahi mila");
    const course = cSnap.data();
    const price = Number(course.plans && course.plans[plan] && course.plans[plan].price);
    if (!(price > 0)) throw fail(400, "Ye plan available nahi hai");

    const r = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: rzpAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(price * 100), currency: "INR",
        receipt: ("c" + Date.now()).slice(0, 40),
        notes: { uid: user.uid, courseId: String(courseId), plan }
      })
    });
    const order = await r.json();
    if (!r.ok) throw fail(502, (order.error && order.error.description) || "Razorpay order error");

    const uSnap = await db.collection("users").doc(user.uid).get();
    await db.collection("payments").doc(order.id).set({
      uid: user.uid, studentName: uSnap.exists ? (uSnap.data().name || "") : "",
      email: user.email || "", courseId: String(courseId), courseTitle: course.title || "",
      plan, amount: price, status: "pending", method: "Razorpay", createdAt: Date.now()
    });

    res.status(200).json({ orderId: order.id, amount: order.amount, keyId: process.env.RAZORPAY_KEY_ID, email: user.email || "" });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
