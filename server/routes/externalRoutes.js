import express from "express";

const router = express.Router();

// Simple in-memory cookie jar for NSE
let nseCookie = "";
let nseCookieFetchedAt = 0;
const NSE_BASE = "https://www.nseindia.com";

async function ensureNSECookie() {
  const now = Date.now();
  if (nseCookie && now - nseCookieFetchedAt < 10 * 60 * 1000) return nseCookie; // 10 min cache
  try {
    const res = await fetch(NSE_BASE, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: NSE_BASE,
      },
    });
    const setCookie = res.headers.get("set-cookie") || "";
    nseCookie = setCookie
      .split(/,(?=[^;]+=?[^;]*;)/)
      .map((c) => c.split(";")[0].trim())
      .filter(Boolean)
      .join("; ");
    nseCookieFetchedAt = Date.now();
    return nseCookie;
  } catch (err) {
    console.error("[externalRoutes] ensureNSECookie error", err);
    nseCookie = "";
    return "";
  }
}

async function nseGet(path) {
  await ensureNSECookie();
  const url = `${NSE_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `${NSE_BASE}/` ,
      Cookie: nseCookie,
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`NSE fetch failed ${res.status}: ${text?.slice(0,200)}`);
  }
  try { return await res.json(); } catch { return {}; }
}

// GET /api/external/nse/quote?symbol=INFY
router.get("/nse/quote", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "").toUpperCase();
    if (!symbol) return res.json({ error: "symbol is required" });
    const data = await nseGet(`/api/quote-equity?symbol=${encodeURIComponent(symbol)}`);
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

// Also support path param style: /api/external/nse/quote/INFY
router.get("/nse/quote/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").toUpperCase();
    if (!symbol) return res.json({ error: "symbol is required" });
    const data = await nseGet(`/api/quote-equity?symbol=${encodeURIComponent(symbol)}`);
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

// GET /api/external/nse/corporate-actions?symbol=INFY&from=dd-mm-yyyy&to=dd-mm-yyyy
router.get("/nse/corporate-actions", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "").toUpperCase();
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    if (!symbol) return res.json({ error: "symbol is required" });
    const qs = new URLSearchParams({ index: "equities", symbol, from_date: from, to_date: to });
    const data = await nseGet(`/api/corporate-announcements?${qs.toString()}`);
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

// Moneycontrol historical (server-side proxy)
// GET /api/external/mc/historical?symbol=INFY&resolution=1D&from=unix&to=unix
router.get("/mc/historical", async (req, res) => {
  try {
    const symbol = String(req.query.symbol || "").toUpperCase();
    const resolution = String(req.query.resolution || "1D");
    const from = String(req.query.from || "");
    const to = String(req.query.to || "");
    if (!symbol || !from || !to) return res.status(400).json({ error: "symbol, from, to required" });
    const url = `https://priceapi.moneycontrol.com/techCharts/indianMarket/stock/history?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(resolution)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const mcRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.moneycontrol.com/",
      },
    });
    if (!mcRes.ok) {
      const text = await mcRes.text();
      return res.json({ error: `Moneycontrol fetch failed: ${mcRes.status}` });
    }
    const data = await mcRes.json();
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

// Moneycontrol pricefeed (path param variant for simple live data)
// GET /api/external/mc/pricefeed/RELIANCE
router.get("/mc/pricefeed/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").toUpperCase();
    const url = `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${encodeURIComponent(symbol)}`;
    const mcRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!mcRes.ok) {
      const text = await mcRes.text();
      return res.json({ error: `Moneycontrol fetch failed: ${mcRes.status}` });
    }
    const data = await mcRes.json();
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

// Convenience mapping: /moneycontrol/history/:symbol -> pricefeed
router.get("/moneycontrol/history/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").toUpperCase();
    const url = `https://priceapi.moneycontrol.com/pricefeed/nse/equitycash/${encodeURIComponent(symbol)}`;
    const mcRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!mcRes.ok) {
      const text = await mcRes.text();
      return res.json({ error: `Moneycontrol fetch failed: ${mcRes.status}` });
    }
    const data = await mcRes.json();
    res.json(data);
  } catch (e) {
    console.error("[externalRoutes] error:", e);
    return res.json({ error: e.message });
  }
});

export default router;
