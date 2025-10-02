import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ClientProfiles() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load(params = {}) {
    try {
      setError("");
      const res = await api.listProfiles({ limit: 50, ...params });
      setItems(res.data || res);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Search by name, PAN, company..." value={q} onChange={(e)=>setQ(e.target.value)} />
        <button onClick={()=>load({ q })} className="bg-primary text-primary-foreground px-4 py-2 rounded">Search</button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Shareholder</th>
              <th className="p-2 text-left">PAN</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p)=> (
              <tr key={p._id} className="border-t">
                <td className="p-2">{p.shareholderName?.name1}</td>
                <td className="p-2">{p.panNumber}</td>
                <td className="p-2">{p.status}</td>
                <td className="p-2 text-center">
                  <Link className="text-primary hover:underline" to={`/client-profiles/${p._id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
