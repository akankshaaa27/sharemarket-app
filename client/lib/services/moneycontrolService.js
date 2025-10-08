const API_BASE = "/api/external";

export async function getHistorical({ symbol, resolution = "1D", from, to }) {
  const qs = new URLSearchParams({ symbol, resolution, from: String(from), to: String(to) });
  const res = await fetch(`${API_BASE}/mc/historical?${qs.toString()}`);
  const data = await res.json().catch(()=>({ error: "Invalid response" }));
  if (!res.ok || data?.error) throw new Error(data?.error || `MC historical failed: ${res.status}`);
  return data;
}
