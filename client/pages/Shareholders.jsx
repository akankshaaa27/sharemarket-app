import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Plus, Edit, Trash2, X } from "lucide-react";

export default function Shareholders() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    pan: "",
    email: "",
    mobile: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState(null);

  async function load() {
    try {
      const res = await api.listShareholders({ limit: 100 });
      setItems(res.data || res);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editingShareholder) {
        // Update existing shareholder
        await api.updateShareholder(editingShareholder._id, form);
      } else {
        // Create new shareholder
        await api.createShareholder(form);
      }
      setForm({ name: "", pan: "", email: "", mobile: "", address: "" });
      setModalOpen(false);
      setEditingShareholder(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Are you sure you want to delete this shareholder?")) return;
    try {
      await api.deleteShareholder(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(shareholder) {
    setForm({
      name: shareholder.name || shareholder.shareholderName?.name1 || "",
      pan: shareholder.pan || "",
      email: shareholder.email || "",
      mobile: shareholder.mobile || "",
      address: shareholder.address || ""
    });
    setEditingShareholder(shareholder);
    setModalOpen(true);
  }

  function handleAddNew() {
    setForm({ name: "", pan: "", email: "", mobile: "", address: "" });
    setEditingShareholder(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingShareholder(null);
    setForm({ name: "", pan: "", email: "", mobile: "", address: "" });
  }

  const isEditMode = !!editingShareholder;
  const modalTitle = isEditMode ? "Edit Shareholder" : "Add New Shareholder";
  const saveButtonText = loading 
    ? (isEditMode ? "Saving..." : "Adding...") 
    : (isEditMode ? "Save Changes" : "Add Shareholder");

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shareholders</h1>
          <p className="text-gray-600">Manage shareholder information</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Shareholder
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">{items.length}</h3>
          <p className="text-gray-600">Total Shareholders</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {items.filter(s => s.pan).length}
          </h3>
          <p className="text-gray-600">With PAN</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">
            {new Set(items.map(s => s.pan)).size}
          </h3>
          <p className="text-gray-600">Unique PANs</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Shareholders Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-900">Name</th>
                <th className="p-4 text-left font-semibold text-gray-900">PAN</th>
                <th className="p-4 text-left font-semibold text-gray-900">Email</th>
                <th className="p-4 text-left font-semibold text-gray-900">Mobile</th>
                <th className="p-4 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">
                      {s.name || s.shareholderName?.name1 || "N/A"}
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {s.pan || "Not provided"}
                    </code>
                  </td>
                  <td className="p-4 text-gray-600">
                    {s.email || "N/A"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {s.mobile || "N/A"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit shareholder"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(s._id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete shareholder"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No shareholders found</div>
            <button
              onClick={handleAddNew}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add your first shareholder
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalTitle}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono uppercase"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="shareholder@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !form.name.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saveButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}