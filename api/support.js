// Vercel Serverless Function: /api/support
// Configure SUPPORT_BOT_TOKEN and SUPPORT_CHAT_ID in Vercel Project Settings > Environment Variables.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.SUPPORT_BOT_TOKEN;
    const chatId = process.env.SUPPORT_CHAT_ID;
    if (!token || !chatId) {
      return res.status(500).json({ error: "Support system abhi configure nahi hua hai." });
    }

    const body = req.body || {};
    const name = clean(body.name, 80);
    const telegram = clean(body.telegram, 64);
    const email = clean(body.email, 120);
    const telegramUserId = clean(body.telegramUserId, 40);
    const firebaseUid = clean(body.firebaseUid, 128);
    const category = clean(body.category, 80);
    const message = clean(body.message, 3000);

    if (!message) return res.status(400).json({ error: "Problem description required." });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Gmail ID sahi format mein likhein." });
    }
    if (body.screenshot) {
      if (typeof body.screenshot !== "string" || body.screenshot.length > 4_300_000) {
        return res.status(400).json({ error: "Screenshot 3 MB se chhota hona chahiye." });
      }
      if (!String(body.screenshotType || "").startsWith("image/")) {
        return res.status(400).json({ error: "Only image screenshots are allowed." });
      }
    }

    const text = [
      "🎧 SSC PrepX — New Support Request",
      "",
      `👤 Name: ${name || "Not provided"}`,
      `🆔 Telegram User ID: ${telegramUserId || "Not linked / unavailable"}`,
      `📨 Telegram Username: ${telegram || "Not provided"}`,
      `📧 Email: ${email || "Not available (login required)"}`,
      `🔐 Firebase UID: ${firebaseUid || "Not logged in"}` ,
      `📂 Category: ${category || "Other"}`,
      "",
      "📝 Problem:",
      message
    ].join("\n");

    const base = `https://api.telegram.org/bot${token}`;
    let tgResponse;
    if (body.screenshot) {
      const bytes = Buffer.from(body.screenshot, "base64");
      if (bytes.length > 3 * 1024 * 1024) {
        return res.status(400).json({ error: "Screenshot 3 MB se chhota hona chahiye." });
      }
      const form = new FormData();
      form.append("chat_id", chatId);
      form.append("caption", text.slice(0, 1024));
      form.append("photo", new Blob([bytes], { type: body.screenshotType }), clean(body.screenshotName, 100) || "screenshot.jpg");
      tgResponse = await fetch(`${base}/sendPhoto`, { method: "POST", body: form });
    } else {
      tgResponse = await fetch(`${base}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text })
      });
    }

    const result = await tgResponse.json();
    if (!tgResponse.ok || !result.ok) {
      console.error("Telegram API error:", result);
      return res.status(502).json({ error: "Telegram par message nahi pahunch saka. Baad mein try karein." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Support API error:", error);
    return res.status(500).json({ error: "Server error. Baad mein dobara try karein." });
  }
}

function clean(value, max) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, max);
}
