import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function DmatAccounts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    accountNumber: "",
    holderName: "",
    expiryDate: "",
    renewalStatus: "Active",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await api.listDmat({ limit: 100 });
    setItems(res.data || res);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.createDmat({
        ...form,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      });
      setForm({
        accountNumber: "",
        holderName: "",
        expiryDate: "",
        renewalStatus: "Active",
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this account?")) return;
    await api.deleteDmat(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="grid gap-2 max-w-xl grid-cols-2">
        <div className="col-span-2">
          <label className="block text-sm">Account Number</label>
          <input
            className="w-full border rounded p-2"
            value={form.accountNumber}
            onChange={(e) =>
              setForm({ ...form, accountNumber: e.target.value })
            }
            required
          />
        </div>
        <div>
          <label className="block text-sm">Holder Name</label>
          <input
            className="w-full border rounded p-2"
            value={form.holderName}
            onChange={(e) => setForm({ ...form, holderName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm">Expiry Date</label>
          <input
            type="date"
            className="w-full border rounded p-2"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm">Status</label>
          <select
            className="w-full border rounded p-2"
            value={form.renewalStatus}
            onChange={(e) =>
              setForm({ ...form, renewalStatus: e.target.value })
            }
          >
            {["Active", "Expired", "Pending", "Expiring"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {error && <p className="text-red-600 text-sm col-span-2">{error}</p>}
        <div className="col-span-2">
          <button
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Account</th>
              <th className="p-2 text-left">Holder</th>
              <th className="p-2 text-left">Expiry</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id} className="border-t">
                <td className="p-2">{a.accountNumber}</td>
                <td className="p-2">{a.holderName}</td>
                <td className="p-2">
                  {a.expiryDate && new Date(a.expiryDate).toLocaleDateString()}
                </td>
                <td className="p-2">{a.renewalStatus}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => onDelete(a._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
