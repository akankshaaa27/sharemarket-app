import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Shareholders() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", pan: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await api.listShareholders({ limit: 100 });
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
      await api.createShareholder({ name: form.name, pan: form.pan });
      setForm({ name: "", pan: "" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this shareholder?")) return;
    await api.deleteShareholder(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="grid gap-2 max-w-md">
        <div>
          <label className="block text-sm">Name</label>
          <input
            className="w-full border rounded p-2"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm">PAN</label>
          <input
            className="w-full border rounded p-2"
            value={form.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value })}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">PAN</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.name || s.shareholderName?.name1}</td>
                <td className="p-2">{s.pan}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => onDelete(s._id)}
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
