const API_BASE = "/api/external";

export async function getQuote(symbol) {
  const res = await fetch(`${API_BASE}/nse/quote?symbol=${encodeURIComponent(symbol)}`);
  const data = await res.json().catch(()=>({ error: "Invalid response" }));
  if (!res.ok || data?.error) throw new Error(data?.error || `NSE quote failed: ${res.status}`);
  return data;
}

export async function getCorporateActions({ symbol, from, to }) {
  const qs = new URLSearchParams({ symbol, from, to });
  const res = await fetch(`${API_BASE}/nse/corporate-actions?${qs.toString()}`);
  const data = await res.json().catch(()=>({ error: "Invalid response" }));
  if (!res.ok || data?.error) throw new Error(data?.error || `NSE corporate actions failed: ${res.status}`);
  return data;
}
