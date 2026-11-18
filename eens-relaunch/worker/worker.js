// EENS ONE – Relaunch-Worker.
// Liefert Startseite, CSS/JS und Medien aus KV (Binding MEDIA). Alles andere
// (Impressum, Datenschutz, Fonts, Inner-Circle-API, Sitemap …) geht unverändert
// an den bestehenden Live-Worker (Service-Binding LEGACY → eens-next).
// PREVIEW = "1" setzt noindex auf alle Antworten.

const TYPES = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8",
  webp: "image/webp", avif: "image/avif", png: "image/png", jpg: "image/jpeg",
  mp4: "video/mp4", webm: "video/webm", txt: "text/plain; charset=utf-8",
};
const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "style-src 'self'",
  "script-src 'self'",
  "frame-src https://open.spotify.com",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");
const BASE = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};
const CAMPAIGN = /^\/c\/(tiktok|instagram|youtube|spotify|kooperation|qr)\/[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?\/?$/;

function headers(env, extra) {
  const h = new Headers({ ...BASE, ...extra });
  if (env.PREVIEW === "1") h.set("x-robots-tag", "noindex, nofollow");
  return h;
}

async function upload(req, env, key) {
  // Schreibzugang nur mit Token (Worker-Secret UPLOAD_TOKEN). Ohne Secret ist der Endpunkt aus.
  if (!env.UPLOAD_TOKEN || req.headers.get("x-upload-token") !== env.UPLOAD_TOKEN) return new Response("forbidden", { status: 403 });
  if (!/^(site|media)\/[a-z0-9._-]+$/.test(key)) return new Response("bad key", { status: 400 });
  const body = await req.arrayBuffer();
  await env.MEDIA.put(key, body, { metadata: { size: body.byteLength } });
  return new Response(JSON.stringify({ key, size: body.byteLength }), { headers: { "content-type": "application/json" } });
}

async function serveFile(req, env, key, cacheControl) {
  const ext = key.split(".").pop();
  const { value, metadata } = await env.MEDIA.getWithMetadata(key, { type: "arrayBuffer", cacheTtl: 300 });
  if (!value) return null;
  const size = value.byteLength;
  const h = headers(env, { "content-type": TYPES[ext] || "application/octet-stream", "cache-control": cacheControl, "accept-ranges": "bytes" });
  const range = req.headers.get("range");
  const m = range && /^bytes=(\d*)-(\d*)$/.exec(range);
  if (m) {
    let start = m[1] === "" ? size - Number(m[2]) : Number(m[1]);
    let end = m[1] !== "" && m[2] !== "" ? Number(m[2]) : size - 1;
    if (isNaN(start) || start < 0 || start >= size || end < start) {
      h.set("content-range", `bytes */${size}`);
      return new Response(null, { status: 416, headers: h });
    }
    end = Math.min(end, size - 1);
    h.set("content-range", `bytes ${start}-${end}/${size}`);
    h.set("content-length", String(end - start + 1));
    return new Response(req.method === "HEAD" ? null : value.slice(start, end + 1), { status: 206, headers: h });
  }
  h.set("content-length", String(size));
  return new Response(req.method === "HEAD" ? null : value, { status: 200, headers: h });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;

    if (req.method === "PUT" && p.startsWith("/__upload/")) return upload(req, env, p.slice(10));

    if (req.method === "GET" || req.method === "HEAD") {
      if (env.PREVIEW === "1" && p === "/robots.txt")
        return new Response("User-agent: *\nDisallow: /\n", { headers: headers(env, { "content-type": TYPES.txt }) });

      const campaign = CAMPAIGN.test(p);
      if (p === "/" || campaign) {
        const html = await env.MEDIA.get("site/index.html", { cacheTtl: 60 });
        if (!html) return new Response("deploy error", { status: 503 });
        const out = campaign ? html.replace("<head>", '<head><base href="/">') : html;
        const h = headers(env, { "content-type": TYPES.html, "cache-control": "no-cache", "content-security-policy": CSP });
        if (campaign) h.set("x-robots-tag", "noindex, follow");
        return new Response(req.method === "HEAD" ? null : out, { headers: h });
      }
      if (p === "/assets/site.css" || p === "/assets/site.js") {
        const r = await serveFile(req, env, "site/" + p.slice(8), "public, max-age=31536000, immutable");
        if (r) return r;
      }
      if (p.startsWith("/media/") && /^[a-z0-9._-]+$/.test(p.slice(7))) {
        const r = await serveFile(req, env, "media/" + p.slice(7), "public, max-age=31536000, immutable");
        return r || new Response("not found", { status: 404, headers: headers(env, {}) });
      }
    }

    // Alles andere: bestehender Live-Worker (Impressum, Datenschutz, Fonts, API, Sitemap …)
    const res = await env.LEGACY.fetch(req);
    if (env.PREVIEW !== "1") return res;
    const h = new Headers(res.headers);
    h.set("x-robots-tag", "noindex, nofollow");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  },
};
