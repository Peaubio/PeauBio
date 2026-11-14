// Compteur de visiteurs en direct (fonction Vercel).
// Chaque visiteur de la page produit envoie un signal toutes les 25 secondes.
// On compte les visiteurs distincts actifs dans les 60 dernières secondes.
// Stockage : Upstash Redis (gratuit), ajouté depuis Vercel > Storage / Marketplace.
// Sans base reliée, la fonction renvoie count: null et le badge reste caché.

// La boutique Shopify (peaubio.com) appelle aussi cette fonction : on l'autorise (CORS).

const WINDOW_MS = 60 * 1000;
const PAGES = new Set(["le-kit"]);
const ALLOWED_ORIGINS = new Set([
  "https://peaubio.com",
  "https://www.peaubio.com",
  "https://iqk726-ap.myshopify.com",
]);

function allowOrigin(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+\.shopifypreview\.com$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  allowOrigin(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    res.status(200).json({ count: null });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const id = String((body && body.id) || "");
  const page = String((body && body.page) || "");
  if (!/^[a-z0-9]{6,64}$/i.test(id) || !PAGES.has(page)) {
    res.status(400).json({ error: "bad_request" });
    return;
  }

  const key = `peaubio:viewers:${page}`;
  const now = Date.now();
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["ZADD", key, String(now), id],
        ["ZREMRANGEBYSCORE", key, "0", String(now - WINDOW_MS)],
        ["ZCARD", key],
        ["EXPIRE", key, "300"],
      ]),
    });
    if (!r.ok) throw new Error(`upstash ${r.status}`);
    const out = await r.json();
    const count = Number(out[2] && out[2].result) || 0;
    res.status(200).json({ count });
  } catch (e) {
    res.status(200).json({ count: null });
  }
};
