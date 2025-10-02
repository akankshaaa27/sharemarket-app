import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ClientProfiles() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    shareholderName: { name1: "", name2: "", name3: "" },
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    dematAccountNumber: "",
    dematCreatedWith: "",
    dematCreatedWithPerson: "",
    status: "Active",
  });

  async function load(params = {}) {
    try {
      setError("");
      const res = await api.listProfiles({ limit: 50, ...params });
      setItems(res.data || res);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  async function onCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form };
      await api.createProfile(payload);
      setForm({
        shareholderName: { name1: "", name2: "", name3: "" },
        panNumber: "",
        aadhaarNumber: "",
        address: "",
        dematAccountNumber: "",
        dematCreatedWith: "",
        dematCreatedWithPerson: "",
        status: "Active",
      });
      await load();
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  }

  async function onDelete(id) {
    if (!confirm("Delete this profile?")) return;
    try { await api.deleteProfile(id); await load(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm mb-1">Search</label>
          <input className="border rounded p-2 w-full" placeholder="Search by name, PAN, company..." value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <button onClick={()=>load({ q })} className="bg-primary text-primary-foreground px-4 py-2 rounded h-10">Search</button>
      </div>

      <form onSubmit={onCreate} className="grid gap-2 md:grid-cols-3 border rounded p-4 bg-card">
        <div className="md:col-span-3 font-medium text-sm text-muted-foreground">Create New Client</div>
        <div>
          <label className="block text-sm">Name 1 *</label>
          <input className="w-full border rounded p-2" value={form.shareholderName.name1} onChange={e=>setForm(f=>({ ...f, shareholderName: { ...f.shareholderName, name1: e.target.value } }))} required />
        </div>
        <div>
          <label className="block text-sm">Name 2</label>
          <input className="w-full border rounded p-2" value={form.shareholderName.name2} onChange={e=>setForm(f=>({ ...f, shareholderName: { ...f.shareholderName, name2: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm">Name 3</label>
          <input className="w-full border rounded p-2" value={form.shareholderName.name3} onChange={e=>setForm(f=>({ ...f, shareholderName: { ...f.shareholderName, name3: e.target.value } }))} />
        </div>
        <div>
          <label className="block text-sm">PAN *</label>
          <input className="w-full border rounded p-2" value={form.panNumber} onChange={e=>setForm(f=>({ ...f, panNumber: e.target.value.toUpperCase() }))} required />
        </div>
        <div>
          <label className="block text-sm">Aadhaar</label>
          <input className="w-full border rounded p-2" value={form.aadhaarNumber} onChange={e=>setForm(f=>({ ...f, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }))} />
        </div>
        <div>
          <label className="block text-sm">Demat Number</label>
          <input className="w-full border rounded p-2" value={form.dematAccountNumber} onChange={e=>setForm(f=>({ ...f, dematAccountNumber: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm">Demat Created With</label>
          <input className="w-full border rounded p-2" value={form.dematCreatedWith} onChange={e=>setForm(f=>({ ...f, dematCreatedWith: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm">DMAT Created By (Person)</label>
          <input className="w-full border rounded p-2" value={form.dematCreatedWithPerson} onChange={e=>setForm(f=>({ ...f, dematCreatedWithPerson: e.target.value }))} />
        </div>
        <div className="md:col-span-3">
          <label className="block text-sm">Address</label>
          <input className="w-full border rounded p-2" value={form.address} onChange={e=>setForm(f=>({ ...f, address: e.target.value }))} />
        </div>
        <div className="md:col-span-3 text-right mt-2">
          <button disabled={creating || !form.shareholderName.name1 || !form.panNumber} className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50">{creating?"Creating...":"Create Client"}</button>
        </div>
      </form>

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
                <td className="p-2 text-center space-x-3">
                  <Link className="text-primary hover:underline" to={`/client-profiles/${p._id}`}>View</Link>
                  <button onClick={()=>onDelete(p._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
