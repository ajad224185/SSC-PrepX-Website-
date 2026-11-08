// Setup check: browser mein /api/health kholein. Koi secret nahi dikhata, sirf ok / missing.
// Setup ho jane ke baad is file ko delete kar dein.
module.exports = async (req, res) => {
  const env = {
    RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT
  };
  const out = { env, razorpayMode: /^rzp_live_/.test(process.env.RAZORPAY_KEY_ID || "") ? "live" : (/^rzp_test_/.test(process.env.RAZORPAY_KEY_ID || "") ? "test" : "unknown") };

  try {
    const { db } = require("./_lib");
    await db.collection("config").doc("admin").get();
    out.firebase = "ok";
  } catch (e) {
    out.firebase = e instanceof SyntaxError
      ? "FIREBASE_SERVICE_ACCOUNT ka JSON galat hai (poori JSON file ka text paste karein)"
      : "error: " + (e.code || "init failed");
  }

  try {
    const auth = "Basic " + Buffer.from((process.env.RAZORPAY_KEY_ID || "") + ":" + (process.env.RAZORPAY_KEY_SECRET || "")).toString("base64");
    const r = await fetch("https://api.razorpay.com/v1/orders?count=1", { headers: { Authorization: auth } });
    out.razorpay = r.ok ? "ok" : "error " + r.status + " (Key ID / Secret galat hain)";
  } catch (e) {
    out.razorpay = "network error";
  }

  res.status(200).json(out);
};
