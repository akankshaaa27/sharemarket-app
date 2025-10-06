import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Plus, Edit, Trash2, X, Calendar, User, CreditCard, AlertTriangle } from "lucide-react";

export default function DmatAccounts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    accountNumber: "",
    holderName: "",
    expiryDate: "",
    renewalStatus: "Active",
    dpId: "",
    dpName: "",
    clientId: "",
    branch: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  async function load() {
    try {
      const res = await api.listDmat({ limit: 100 });
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
      const payload = {
        ...form,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      };

      if (editingAccount) {
        await api.updateDmat(editingAccount._id, payload);
      } else {
        await api.createDmat(payload);
      }
      
      setForm({
        accountNumber: "",
        holderName: "",
        expiryDate: "",
        renewalStatus: "Active",
        dpId: "",
        dpName: "",
        clientId: "",
        branch: ""
      });
      setModalOpen(false);
      setEditingAccount(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Are you sure you want to delete this Demat account?")) return;
    try {
      await api.deleteDmat(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  function handleEdit(account) {
    setForm({
      accountNumber: account.accountNumber || "",
      holderName: account.holderName || "",
      expiryDate: account.expiryDate ? new Date(account.expiryDate).toISOString().split('T')[0] : "",
      renewalStatus: account.renewalStatus || "Active",
      dpId: account.dpId || "",
      dpName: account.dpName || "",
      clientId: account.clientId || "",
      branch: account.branch || ""
    });
    setEditingAccount(account);
    setModalOpen(true);
  }

  function handleAddNew() {
    setForm({
      accountNumber: "",
      holderName: "",
      expiryDate: "",
      renewalStatus: "Active",
      dpId: "",
      dpName: "",
      clientId: "",
      branch: ""
    });
    setEditingAccount(null);
    setModalOpen(true);
  }

  function handleCloseModal() {
    setModalOpen(false);
    setEditingAccount(null);
    setForm({
      accountNumber: "",
      holderName: "",
      expiryDate: "",
      renewalStatus: "Active",
      dpId: "",
      dpName: "",
      clientId: "",
      branch: ""
    });
  }

  function getStatusColor(status) {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Expired": return "bg-red-100 text-red-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Expiring": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function isExpiringSoon(expiryDate) {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  }

  function isExpired(expiryDate) {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  }

  const isEditMode = !!editingAccount;
  const modalTitle = isEditMode ? "Edit Demat Account" : "Add New Demat Account";
  const saveButtonText = loading 
    ? (isEditMode ? "Saving..." : "Adding...") 
    : (isEditMode ? "Save Changes" : "Add Account");

  const activeAccounts = items.filter(a => a.renewalStatus === "Active").length;
  const expiringAccounts = items.filter(a => isExpiringSoon(a.expiryDate)).length;
  const expiredAccounts = items.filter(a => isExpired(a.expiryDate)).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demat Accounts</h1>
          <p className="text-gray-600">Manage demat account information and renewals</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{items.length}</h3>
              <p className="text-gray-600">Total Accounts</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="text-green-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{activeAccounts}</h3>
              <p className="text-gray-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="text-orange-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{expiringAccounts}</h3>
              <p className="text-gray-600">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{expiredAccounts}</h3>
              <p className="text-gray-600">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-900">Account Number</th>
                <th className="p-4 text-left font-semibold text-gray-900">Holder Name</th>
                <th className="p-4 text-left font-semibold text-gray-900">Client ID</th>
                <th className="p-4 text-left font-semibold text-gray-900">DP Details</th>
                <th className="p-4 text-left font-semibold text-gray-900">Expiry Date</th>
                <th className="p-4 text-left font-semibold text-gray-900">Status</th>
                <th className="p-4 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((account) => {
                const isExpiring = isExpiringSoon(account.expiryDate);
                const isExpiredAccount = isExpired(account.expiryDate);
                
                return (
                  <tr key={account._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-medium text-gray-900">
                        {account.accountNumber}
                      </div>
                      {account.branch && (
                        <div className="text-sm text-gray-500">{account.branch}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">
                        {account.holderName}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {account.clientId || "N/A"}
                      </code>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="font-medium">{account.dpName || "N/A"}</div>
                        {account.dpId && (
                          <div className="text-gray-500">ID: {account.dpId}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className={`${isExpiring ? 'text-orange-600' : isExpiredAccount ? 'text-red-600' : 'text-gray-600'}`}>
                          {account.expiryDate ? new Date(account.expiryDate).toLocaleDateString() : "N/A"}
                        </span>
                        {isExpiring && (
                          <AlertTriangle size={14} className="text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.renewalStatus)}`}>
                        {account.renewalStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit account"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(account._id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {items.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
            <div className="text-gray-400 mb-2">No demat accounts found</div>
            <button
              onClick={handleAddNew}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add your first demat account
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
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holder Name *
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.holderName}
                    onChange={(e) => setForm({ ...form, holderName: e.target.value })}
                    placeholder="Enter holder name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    placeholder="Enter client ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    placeholder="Enter branch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DP ID
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.dpId}
                    onChange={(e) => setForm({ ...form, dpId: e.target.value })}
                    placeholder="Enter DP ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DP Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.dpName}
                    onChange={(e) => setForm({ ...form, dpName: e.target.value })}
                    placeholder="Enter DP name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={form.renewalStatus}
                    onChange={(e) => setForm({ ...form, renewalStatus: e.target.value })}
                    required
                  >
                    {["Active", "Expired", "Pending", "Expiring"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={loading || !form.accountNumber.trim() || !form.holderName.trim() || !form.expiryDate}
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