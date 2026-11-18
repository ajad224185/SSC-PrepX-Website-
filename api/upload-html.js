const { admin, db, fail, authUser, body } = require("./_lib");

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(payload));
}

function cleanSegment(value, fallback) {
  const s = String(value || "").trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  return s || fallback;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const user = await authUser(req);
    const me = await db.collection("users").doc(user.uid).get();
    if (!me.exists || me.data().role !== "admin") throw fail(403, "Admin access required");

    const b = body(req);
    const courseId = cleanSegment(b.courseId, "course");
    const fileName = String(b.fileName || "index.html");
    const contentBase64 = String(b.contentBase64 || "");

    if (!/^.+\.html?$/i.test(fileName)) throw fail(400, "Sirf HTML file upload karein");
    if (!contentBase64) throw fail(400, "HTML content missing");
    if (contentBase64.length > 4_000_000) throw fail(413, "HTML file request limit se badi hai");

    const owner = process.env.GITHUB_OWNER || "ajad224185";
    const repo = process.env.GITHUB_REPO || "SSC-PrepX-Website";
    const branch = process.env.GITHUB_BRANCH || "main";
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw fail(500, "GITHUB_TOKEN Vercel Environment Variables me set nahi hai");

    const path = `course-html/${courseId}/index.html`;
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`;
    const headers = {
      "Authorization": `Bearer ${githubToken}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "SSC-PrepX"
    };

    let sha;
    const old = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers });
    if (old.ok) {
      const oldData = await old.json();
      sha = oldData.sha;
    } else if (old.status !== 404) {
      const t = await old.text();
      throw fail(old.status, `GitHub read failed: ${t.slice(0, 300)}`);
    }

    const putBody = {
      message: `${sha ? "Update" : "Add"} course HTML: ${courseId}`,
      content: contentBase64,
      branch
    };
    if (sha) putBody.sha = sha;

    const put = await fetch(base, {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(putBody)
    });
    const result = await put.json().catch(() => ({}));
    if (!put.ok) {
      throw fail(put.status, result.message || "GitHub upload failed");
    }

    const host = req.headers.host;
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = `${proto}://${host}/${path}`;

    return json(res, 200, {
      ok: true,
      url,
      path,
      commit: result.commit?.sha || ""
    });
  } catch (e) {
    const status = Number(e.status) || 500;
    console.error("upload-html", e);
    return json(res, status, { error: e.message || "Upload failed" });
  }
};
