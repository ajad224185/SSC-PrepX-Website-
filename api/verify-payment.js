const { db, crypto, fail, authUser, body, safeEqual, grantAccess } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const user = await authUser(req);
    const { razorpay_order_id: orderId, razorpay_payment_id: payId, razorpay_signature: sig } = body(req);
    if (!orderId || !payId || !sig) throw fail(400, "Invalid request");

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + payId).digest("hex");
    if (!safeEqual(expected, sig)) throw fail(400, "Payment signature match nahi hui");

    const pSnap = await db.collection("payments").doc(orderId).get();
    if (!pSnap.exists || pSnap.data().uid !== user.uid) throw fail(403, "Ye order aapka nahi hai");

    await grantAccess(orderId, payId);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
};
