import { useEffect, useMemo, useState } from "react";
import { getQuote, getCorporateActions } from "../lib/services/nseService.js";
import { getHistorical } from "../lib/services/moneycontrolService.js";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
// import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const DEFAULT_SYMBOL = "INFY";
const REFRESH_MS = 2 * 60 * 1000; // 2 minutes

function formatUnix(ts) {
  const d = new Date(ts * 1000);
  return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth()+1).toString().padStart(2, "0")}`;
}

export default function ExternalAPIs() {
  const [activeTab, setActiveTab] = useState("live");
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [live, setLive] = useState(null);
  const [historical, setHistorical] = useState(null);
  const [corp, setCorp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function saveLocal(key, data) {
    localStorage.setItem(key, JSON.stringify({ data, t: Date.now() }));
  }
  function readLocal(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
  }

  async function refreshLive() {
    setError("");
    try {
      const data = await getQuote(symbol);
      setLive(data);
      setLastUpdated(new Date());
      saveLocal(`live:${symbol}`, data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function refreshHistorical(rangeDays = 30) {
    setError("");
    const to = Math.floor(Date.now() / 1000);
    const from = to - rangeDays * 24 * 60 * 60;
    try {
      const data = await getHistorical({ symbol, resolution: "1D", from, to });
      setHistorical(data);
      setLastUpdated(new Date());
      saveLocal(`hist:${symbol}:${rangeDays}`, data);
    } catch (e) {
      setError(e.message);
    }
  }

  async function refreshCorpActions(days = 365) {
    setError("");
    const toD = new Date();
    const fromD = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const fmt = (d) => `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth()+1).padStart(2, "0")}-${d.getFullYear()}`;
    try {
      const data = await getCorporateActions({ symbol, from: fmt(fromD), to: fmt(toD) });
      setCorp(data?.data || data);
      setLastUpdated(new Date());
      saveLocal(`corp:${symbol}:${days}`, data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    const cachedLive = readLocal(`live:${symbol}`);
    if (cachedLive) setLive(cachedLive.data);
    const cachedHist = readLocal(`hist:${symbol}:30`);
    if (cachedHist) setHistorical(cachedHist.data);
    const cachedCorp = readLocal(`corp:${symbol}:365`);
    if (cachedCorp) setCorp(cachedCorp.data?.data || cachedCorp.data);

    refreshLive();
    refreshHistorical(30);
    refreshCorpActions(365);

    const iv = setInterval(refreshLive, REFRESH_MS);
    // schedule midnight sync
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24,0,0,0);
    const timeout = setTimeout(() => {
      refreshLive();
      refreshHistorical(30);
      refreshCorpActions(365);
    }, nextMidnight.getTime() - now.getTime());

    return () => { clearInterval(iv); clearTimeout(timeout); };
  }, [symbol]);

  const histSeries = useMemo(() => {
    if (!historical?.t || !historical?.c) return [];
    return historical.t.map((ts, i) => ({
      date: formatUnix(ts),
      close: historical.c[i],
    }));
  }, [historical]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">External API Integrations</h1>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : "—"}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm">Symbol</label>
        <input value={symbol} onChange={(e)=>setSymbol(e.target.value.toUpperCase())} className="border rounded px-2 py-1" placeholder="e.g., INFY" />
      </div>

      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={() => {
              if (activeTab === "live") refreshLive();
              else if (activeTab === "hist") refreshHistorical(30);
              else if (activeTab === "corp") refreshCorpActions(365);
            }}
            className="px-3 py-1.5 rounded border bg-white"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { key: "live", label: "Live Prices" },
          { key: "hist", label: "Historical Data" },
          { key: "div", label: "Dividends" },
          { key: "corp", label: "Corporate Actions" },
          { key: "bonus", label: "Bonus Details" },
        ].map((t)=> (
          <button key={t.key} onClick={()=>setActiveTab(t.key)} className={`px-3 py-1.5 rounded border ${activeTab===t.key?"bg-blue-600 text-white":""}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === "live" && (
        <div className="rounded border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Live Quote</h2>
            <button onClick={refreshLive} className="px-3 py-1.5 rounded border">Refresh</button>
          </div>
          <pre className="text-xs overflow-auto max-h-80">{JSON.stringify(live, null, 2)}</pre>
        </div>
      )}

      {activeTab === "hist" && (
        <div className="rounded border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Historical (30D)</h2>
            <button onClick={()=>refreshHistorical(30)} className="px-3 py-1.5 rounded border">Refresh</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={histSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide={false} minTickGap={20} />
                <YAxis domain={["auto","auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === "corp" && (
        <div className="rounded border p-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Corporate Actions (1Y)</h2>
            <button onClick={()=>refreshCorpActions(365)} className="px-3 py-1.5 rounded border">Refresh</button>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Headline</th>
                  <th className="p-2 text-left">Category</th>
                </tr>
              </thead>
              <tbody>
                {(corp||[]).map((row, i)=> (
                  <tr key={i} className="border-t">
                    <td className="p-2">{row?.dt || row?.Date || ""}</td>
                    <td className="p-2">{row?.sm || row?.symbol || symbol}</td>
                    <td className="p-2">{row?.desc || row?.attchmntText || row?.hd || row?.headline || ""}</td>
                    <td className="p-2">{row?.cat || row?.category || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeTab === "div" || activeTab === "bonus") && (
        <div className="rounded border p-4 bg-white">
          <p className="text-sm text-gray-600">Use Corporate Actions tab to track dividends, splits, and bonus announcements (filtered from NSE corporate announcements).</p>
        </div>
      )}
    </div>
  );
}
