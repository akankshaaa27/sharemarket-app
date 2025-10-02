import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ClientProfiles() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyHolding = () => ({
    companyName: "",
    isinNumber: "",
    folioNumber: "",
    certificateNumber: "",
    distinctiveNumber: { from: "", to: "" },
    quantity: 0,
    faceValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
  });

  const initialForm = () => ({
    shareholderName: { name1: "", name2: "", name3: "" },
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    bankDetails: { bankNumber: "", branch: "", bankName: "", ifscCode: "", micrCode: "" },
    dematAccountNumber: "",
    dematCreatedWith: "",
    dematCreatedWithPerson: "",
    shareHoldings: [emptyHolding()],
    currentDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    remarks: "",
    dividend: { amount: 0, date: new Date().toISOString().slice(0, 10) },
  });

  const [form, setForm] = useState(initialForm());

  async function load(params = {}) {
    try {
      setError("");
      const res = await api.listProfiles({ limit: 50, ...params });
      setItems(res.data || res);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(); }, []);

  const addShareHolding = () => setForm(f => ({ ...f, shareHoldings: [...f.shareHoldings, emptyHolding()] }));
  const removeShareHolding = (index) => setForm(f => ({ ...f, shareHoldings: f.shareHoldings.filter((_, i) => i !== index) }));
  const updateShareHolding = (index, key, value) => setForm(f => ({ ...f, shareHoldings: f.shareHoldings.map((h, i) => i === index ? { ...h, [key]: value } : h) }));

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, companies: form.shareHoldings };
      await api.createProfile(payload);
      setOpen(false);
      setForm(initialForm());
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function onDelete(id) {
    if (!confirm("Delete this profile?")) return;
    try { await api.deleteProfile(id); await load(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input className="border rounded p-2 w-64" placeholder="Search by name, PAN, company..." value={q} onChange={(e)=>setQ(e.target.value)} />
          <button onClick={()=>load({ q })} className="bg-primary text-primary-foreground px-4 py-2 rounded">Search</button>
        </div>
        <button onClick={()=>setOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded">Add Client</button>
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
                <td className="p-2 text-center space-x-3">
                  <Link className="text-primary hover:underline" to={`/client-profiles/${p._id}`}>View</Link>
                  <button onClick={()=>onDelete(p._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={()=>!saving && setOpen(false)} />
          <div className="absolute inset-0 p-4 overflow-y-auto">
            <div className="mx-auto max-w-5xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Client Profile</h2>
                <button onClick={()=>!saving && setOpen(false)} className="text-sm px-2 py-1 rounded border">Close</button>
              </div>
              <form onSubmit={onCreate} className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Client Information</h3>
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm">Name 1 *</label>
                      <input className="w-full border rounded p-2" value={form.shareholderName.name1} onChange={(e)=>setForm(f=>({...f, shareholderName:{...f.shareholderName, name1:e.target.value}}))} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 2</label>
                      <input className="w-full border rounded p-2" value={form.shareholderName.name2} onChange={(e)=>setForm(f=>({...f, shareholderName:{...f.shareholderName, name2:e.target.value}}))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 3</label>
                      <input className="w-full border rounded p-2" value={form.shareholderName.name3} onChange={(e)=>setForm(f=>({...f, shareholderName:{...f.shareholderName, name3:e.target.value}}))} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">PAN *</label>
                    <input className="w-full border rounded p-2" value={form.panNumber} onChange={(e)=>setForm(f=>({...f, panNumber:e.target.value.toUpperCase()}))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Aadhaar Number</label>
                    <input className="w-full border rounded p-2" value={form.aadhaarNumber} onChange={(e)=>setForm(f=>({...f, aadhaarNumber:e.target.value.replace(/\D/g,'').slice(0,12)}))} placeholder="12-digit Aadhaar number" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Demat Account Number</label>
                    <input className="w-full border rounded p-2" value={form.dematAccountNumber} onChange={(e)=>setForm(f=>({...f, dematAccountNumber:e.target.value}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Demat Account Created With</label>
                    <input className="w-full border rounded p-2" value={form.dematCreatedWith} onChange={(e)=>setForm(f=>({...f, dematCreatedWith:e.target.value}))} placeholder="e.g., NSDL, CDSL, Bank Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">DMAT Account Created By (Person)</label>
                    <input className="w-full border rounded p-2" value={form.dematCreatedWithPerson} onChange={(e)=>setForm(f=>({...f, dematCreatedWithPerson:e.target.value}))} placeholder="Person who created DMAT" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address</label>
                    <input className="w-full border rounded p-2" value={form.address} onChange={(e)=>setForm(f=>({...f, address:e.target.value}))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Bank Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Number</label>
                    <input className="w-full border rounded p-2" value={form.bankDetails.bankNumber} onChange={(e)=>setForm(f=>({...f, bankDetails:{...f.bankDetails, bankNumber:e.target.value}}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Branch</label>
                    <input className="w-full border rounded p-2" value={form.bankDetails.branch} onChange={(e)=>setForm(f=>({...f, bankDetails:{...f.bankDetails, branch:e.target.value}}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Name</label>
                    <input className="w-full border rounded p-2" value={form.bankDetails.bankName} onChange={(e)=>setForm(f=>({...f, bankDetails:{...f.bankDetails, bankName:e.target.value}}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">IFSC Code</label>
                    <input className="w-full border rounded p-2" value={form.bankDetails.ifscCode} onChange={(e)=>setForm(f=>({...f, bankDetails:{...f.bankDetails, ifscCode:e.target.value.toUpperCase()}}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">MICR Code</label>
                    <input className="w-full border rounded p-2" value={form.bankDetails.micrCode} onChange={(e)=>setForm(f=>({...f, bankDetails:{...f.bankDetails, micrCode:e.target.value}}))} />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Share Holdings</h3>
                    <button type="button" onClick={addShareHolding} className="px-3 py-1 rounded border">Add Company</button>
                  </div>

                  {form.shareHoldings.map((h, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg relative">
                      <button type="button" onClick={()=>removeShareHolding(idx)} disabled={form.shareHoldings.length===1} className="absolute top-2 right-2 text-sm px-2 py-1 rounded border">Remove</button>
                      <div className="col-span-2 font-medium text-sm text-muted-foreground">Company #{idx+1}</div>
                      <div className="space-y-1">
                        <label className="text-sm">Company Name *</label>
                        <input className="w-full border rounded p-2" value={h.companyName} onChange={(e)=>updateShareHolding(idx,'companyName',e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">ISIN Number *</label>
                        <input className="w-full border rounded p-2" value={h.isinNumber} onChange={(e)=>updateShareHolding(idx,'isinNumber',e.target.value.toUpperCase())} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Folio Number</label>
                        <input className="w-full border rounded p-2" value={h.folioNumber} onChange={(e)=>updateShareHolding(idx,'folioNumber',e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Certificate Number</label>
                        <input className="w-full border rounded p-2" value={h.certificateNumber} onChange={(e)=>updateShareHolding(idx,'certificateNumber',e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Quantity *</label>
                        <input type="number" className="w-full border rounded p-2" value={h.quantity} onChange={(e)=>updateShareHolding(idx,'quantity',parseInt(e.target.value)||0)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Face Value *</label>
                        <input type="number" step="0.01" className="w-full border rounded p-2" value={h.faceValue} onChange={(e)=>updateShareHolding(idx,'faceValue',parseFloat(e.target.value)||0)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Distinctive From</label>
                        <input className="w-full border rounded p-2" value={h.distinctiveNumber.from} onChange={(e)=>updateShareHolding(idx,'distinctiveNumber',{...h.distinctiveNumber, from:e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Distinctive To</label>
                        <input className="w-full border rounded p-2" value={h.distinctiveNumber.to} onChange={(e)=>updateShareHolding(idx,'distinctiveNumber',{...h.distinctiveNumber, to:e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Purchase Date</label>
                        <input type="date" className="w-full border rounded p-2" value={h.purchaseDate} onChange={(e)=>updateShareHolding(idx,'purchaseDate',e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Total Value</label>
                        <input disabled className="w-full border rounded p-2 font-semibold" value={((h.quantity||0)*(h.faceValue||0)).toLocaleString('en-IN',{style:'currency',currency:'INR'})} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Additional Information</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Current Date</label>
                    <input type="date" className="w-full border rounded p-2" value={form.currentDate} onChange={(e)=>setForm(f=>({...f, currentDate:e.target.value}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select className="w-full border rounded p-2" value={form.status} onChange={(e)=>setForm(f=>({...f, status:e.target.value}))}>
                      {['Active','Closed','Pending','Suspended'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Remarks</label>
                    <input className="w-full border rounded p-2" value={form.remarks} onChange={(e)=>setForm(f=>({...f, remarks:e.target.value}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Amount</label>
                    <input type="number" className="w-full border rounded p-2" value={form.dividend.amount} onChange={(e)=>setForm(f=>({...f, dividend:{...f.dividend, amount:Number(e.target.value)}}))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Date</label>
                    <input type="date" className="w-full border rounded p-2" value={form.dividend.date} onChange={(e)=>setForm(f=>({...f, dividend:{...f.dividend, date:e.target.value}}))} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={()=>setOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
                  <button disabled={saving || !form.shareholderName.name1 || !form.panNumber} className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50">{saving?"Creating...":"Create Client Profile"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
