// Backup: access milega chahe student payment ke baad page band kar de.
const { crypto, safeEqual, grantAccess } = require("./_lib");

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const raw = await rawBody(req);          // read before touching req.body
    const sig = req.headers["x-razorpay-signature"] || "";
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");
    if (!safeEqual(expected, sig)) return res.status(400).json({ error: "bad signature" });

    const ev = JSON.parse(raw.toString("utf8"));
    if (ev.event === "payment.captured" || ev.event === "order.paid") {
      const pay = ev.payload && ev.payload.payment && ev.payload.payment.entity;
      if (pay && pay.order_id) {
        try { await grantAccess(pay.order_id, pay.id); }
        catch (e) { if (e.status !== 404) throw e; }   // unknown order: ignore
      }
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
