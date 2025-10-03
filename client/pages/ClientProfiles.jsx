import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const reviewStatusOptions = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_attention", label: "Needs Attention" },
];

export default function ClientProfiles() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(null); // number | null

  const emptyHolding = () => ({
    companyName: "",
    isinNumber: "",
    folioNumber: "",
    certificateNumber: "",
    distinctiveNumber: { from: "", to: "" },
    quantity: 0,
    faceValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    review: { status: "pending", notes: "", reviewedAt: "", reviewedBy: "" },
  });

  const initialForm = () => ({
    shareholderName: { name1: "", name2: "", name3: "" },
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    bankDetails: {
      bankNumber: "",
      branch: "",
      bankName: "",
      ifscCode: "",
      micrCode: "",
    },
    dematAccountNumber: "",
    dematCreatedWith: "",
    dematCreatedWithPerson: "",
    dematCreatedWithPersonNumber: "",
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
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const addShareHolding = () =>
    setForm((f) => ({
      ...f,
      shareHoldings: [...f.shareHoldings, emptyHolding()],
    }));
  const removeShareHolding = (index) =>
    setForm((f) => ({
      ...f,
      shareHoldings: f.shareHoldings.filter((_, i) => i !== index),
    }));
  const updateShareHolding = (index, key, value) =>
    setForm((f) => ({
      ...f,
      shareHoldings: f.shareHoldings.map((h, i) =>
        i === index ? { ...h, [key]: value } : h,
      ),
    }));

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
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this profile?")) return;
    try {
      await api.deleteProfile(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onOpenEdit(profile) {
    try {
      const full = await api.getProfile(profile._id);
      const shareHoldings =
        full.companies && Array.isArray(full.companies)
          ? full.companies
          : full.shareHoldings || [];
      setEditing({
        ...full,
        shareHoldings: shareHoldings.map((h) => ({
          companyName: h.companyName || "",
          isinNumber: h.isinNumber || "",
          folioNumber: h.folioNumber || "",
          certificateNumber: h.certificateNumber || "",
          distinctiveNumber: h.distinctiveNumber || { from: "", to: "" },
          quantity: h.quantity || 0,
          faceValue: h.faceValue || 0,
          purchaseDate: h.purchaseDate
            ? String(h.purchaseDate).slice(0, 10)
            : "",
          review: h.review || {
            status: "pending",
            notes: "",
            reviewedAt: "",
            reviewedBy: "",
          },
        })),
      });
    } catch (e) {
      setError(e.message);
    }
  }

  function addEditingShareHolding() {
    setEditing((e) => ({
      ...e,
      shareHoldings: [...(e?.shareHoldings || []), emptyHolding()],
    }));
  }
  function removeEditingShareHolding(index) {
    setEditing((e) => ({
      ...e,
      shareHoldings: e.shareHoldings.filter((_, i) => i !== index),
    }));
  }
  function updateEditingShareHolding(index, field, value) {
    setEditing((e) => ({
      ...e,
      shareHoldings: e.shareHoldings.map((h, i) =>
        i === index ? { ...h, [field]: value } : h,
      ),
    }));
  }

  async function onSaveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setError("");
    try {
      const payload = { ...editing, companies: editing.shareHoldings };
      await api.updateProfile(editing._id, payload);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingEdit(false);
    }
  }

  function saveReviewFor(index, status, notes) {
    setEditing((e) => ({
      ...e,
      shareHoldings: e.shareHoldings.map((h, i) =>
        i === index
          ? {
              ...h,
              review: {
                status,
                notes,
                reviewedAt: new Date().toISOString(),
                reviewedBy: "Current User",
              },
            }
          : h,
      ),
    }));
    setShowReviewDialog(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input
            className="border rounded p-2 w-64"
            placeholder="Search by name, PAN, company..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => load({ q })}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Search
          </button>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Add Client
        </button>
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
            {items.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-2">{p.shareholderName?.name1}</td>
                <td className="p-2">{p.panNumber}</td>
                <td className="p-2">{p.status}</td>
                <td className="p-2 text-center space-x-3">
                  <Link
                    className="text-primary hover:underline"
                    to={`/client-profiles/${p._id}`}
                  >
                    View
                  </Link>
                  <button
                    onClick={() => onOpenEdit(p)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p._id)}
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

      {/* Create Modal */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !saving && setOpen(false)}
          />
          <div className="absolute inset-0 p-4 overflow-y-auto">
            <div className="mx-auto max-w-5xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Client Profile</h2>
                <button
                  onClick={() => !saving && setOpen(false)}
                  className="text-sm px-2 py-1 rounded border"
                >
                  Close
                </button>
              </div>
              <form onSubmit={onCreate} className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Client Information
                  </h3>
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm">Name 1 *</label>
                      <input
                        className="w-full border rounded p-2"
                        value={form.shareholderName.name1}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shareholderName: {
                              ...f.shareholderName,
                              name1: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 2</label>
                      <input
                        className="w-full border rounded p-2"
                        value={form.shareholderName.name2}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shareholderName: {
                              ...f.shareholderName,
                              name2: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 3</label>
                      <input
                        className="w-full border rounded p-2"
                        value={form.shareholderName.name3}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            shareholderName: {
                              ...f.shareholderName,
                              name3: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">PAN *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.panNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          panNumber: e.target.value.toUpperCase(),
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Aadhaar Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.aadhaarNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          aadhaarNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 12),
                        }))
                      }
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Demat Account Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.dematAccountNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dematAccountNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">
                      Demat Account Created With
                    </label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.dematCreatedWith}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dematCreatedWith: e.target.value,
                        }))
                      }
                      placeholder="e.g., NSDL, CDSL, Bank Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">
                      DMAT Account Created By (Person)
                    </label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.dematCreatedWithPerson}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dematCreatedWithPerson: e.target.value,
                        }))
                      }
                      placeholder="Person who created DMAT"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Creator Contact Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.dematCreatedWithPersonNumber || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dematCreatedWithPersonNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 15),
                        }))
                      }
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Bank Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.bankNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            bankNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Branch</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.branch}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            branch: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.bankName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            bankName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">IFSC Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.ifscCode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            ifscCode: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">MICR Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.micrCode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            micrCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Share Holdings</h3>
                    <button
                      type="button"
                      onClick={addShareHolding}
                      className="px-3 py-1 rounded border"
                    >
                      Add Company
                    </button>
                  </div>

                  {form.shareHoldings.map((h, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeShareHolding(idx)}
                        disabled={form.shareHoldings.length === 1}
                        className="absolute top-2 right-2 text-sm px-2 py-1 rounded border"
                      >
                        Remove
                      </button>
                      <div className="col-span-2 font-medium text-sm text-muted-foreground">
                        Company #{idx + 1}
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Company Name *</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.companyName}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "companyName",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">ISIN Number *</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.isinNumber}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "isinNumber",
                              e.target.value.toUpperCase(),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Folio Number</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.folioNumber}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "folioNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Certificate Number</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.certificateNumber}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "certificateNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Quantity *</label>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          value={h.quantity}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Face Value *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded p-2"
                          value={h.faceValue}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "faceValue",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Distinctive From</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.distinctiveNumber.from}
                          onChange={(e) =>
                            updateShareHolding(idx, "distinctiveNumber", {
                              ...h.distinctiveNumber,
                              from: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Distinctive To</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.distinctiveNumber.to}
                          onChange={(e) =>
                            updateShareHolding(idx, "distinctiveNumber", {
                              ...h.distinctiveNumber,
                              to: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Purchase Date</label>
                        <input
                          type="date"
                          className="w-full border rounded p-2"
                          value={h.purchaseDate}
                          onChange={(e) =>
                            updateShareHolding(
                              idx,
                              "purchaseDate",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Total Value</label>
                        <input
                          disabled
                          className="w-full border rounded p-2 font-semibold"
                          value={(
                            (h.quantity || 0) * (h.faceValue || 0)
                          ).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Additional Information
                  </h3>
                  <div className="space-y-1">
                    <label className="text-sm">Current Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={form.currentDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currentDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value }))
                      }
                    >
                      {["Active", "Closed", "Pending", "Suspended"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Remarks</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, remarks: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Amount</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={form.dividend.amount}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dividend: {
                            ...f.dividend,
                            amount: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={form.dividend.date}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dividend: { ...f.dividend, date: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      saving || !form.shareholderName.name1 || !form.panNumber
                    }
                    className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Client Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !savingEdit && setEditing(null)}
          />
          <div className="absolute inset-0 p-4 overflow-y-auto">
            <div className="mx-auto max-w-5xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Client Profile</h2>
                <button
                  onClick={() => !savingEdit && setEditing(null)}
                  className="text-sm px-2 py-1 rounded border"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Client Information
                  </h3>
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm">Name 1 *</label>
                      <input
                        className="w-full border rounded p-2"
                        value={editing.shareholderName?.name1 || ""}
                        onChange={(e) =>
                          setEditing((ed) => ({
                            ...ed,
                            shareholderName: {
                              ...(ed.shareholderName || {}),
                              name1: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 2</label>
                      <input
                        className="w-full border rounded p-2"
                        value={editing.shareholderName?.name2 || ""}
                        onChange={(e) =>
                          setEditing((ed) => ({
                            ...ed,
                            shareholderName: {
                              ...(ed.shareholderName || {}),
                              name2: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm">Name 3</label>
                      <input
                        className="w-full border rounded p-2"
                        value={editing.shareholderName?.name3 || ""}
                        onChange={(e) =>
                          setEditing((ed) => ({
                            ...ed,
                            shareholderName: {
                              ...(ed.shareholderName || {}),
                              name3: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">PAN *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.panNumber || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          panNumber: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Aadhaar Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.aadhaarNumber || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          aadhaarNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 12),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Demat Account Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.dematAccountNumber || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dematAccountNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">
                      Demat Account Created With
                    </label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.dematCreatedWith || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dematCreatedWith: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">
                      DMAT Account Created By (Person)
                    </label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.dematCreatedWithPerson || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dematCreatedWithPerson: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Creator Contact Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.dematCreatedWithPersonNumber || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dematCreatedWithPersonNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 15),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({ ...ed, address: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Bank Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankNumber || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          bankDetails: {
                            ...(ed.bankDetails || {}),
                            bankNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Branch</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.branch || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          bankDetails: {
                            ...(ed.bankDetails || {}),
                            branch: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankName || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          bankDetails: {
                            ...(ed.bankDetails || {}),
                            bankName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">IFSC Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.ifscCode || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          bankDetails: {
                            ...(ed.bankDetails || {}),
                            ifscCode: e.target.value.toUpperCase(),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">MICR Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.micrCode || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          bankDetails: {
                            ...(ed.bankDetails || {}),
                            micrCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Share Holdings</h3>
                    <button
                      type="button"
                      onClick={addEditingShareHolding}
                      className="px-3 py-1 rounded border"
                    >
                      Add Company
                    </button>
                  </div>

                  {editing.shareHoldings?.map((h, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeEditingShareHolding(idx)}
                        disabled={editing.shareHoldings.length === 1}
                        className="absolute top-2 right-2 text-sm px-2 py-1 rounded border"
                      >
                        Remove
                      </button>
                      <div className="col-span-2 font-medium text-sm text-muted-foreground">
                        Company #{idx + 1}
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Company Name *</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.companyName}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "companyName",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">ISIN Number *</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.isinNumber}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "isinNumber",
                              e.target.value.toUpperCase(),
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Folio Number</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.folioNumber || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "folioNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Certificate Number</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.certificateNumber || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "certificateNumber",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Quantity *</label>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          value={h.quantity || 0}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "quantity",
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Face Value *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded p-2"
                          value={h.faceValue || 0}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "faceValue",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Distinctive From</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.distinctiveNumber?.from || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "distinctiveNumber",
                              {
                                ...(h.distinctiveNumber || {}),
                                from: e.target.value,
                              },
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Distinctive To</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.distinctiveNumber?.to || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "distinctiveNumber",
                              {
                                ...(h.distinctiveNumber || {}),
                                to: e.target.value,
                              },
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Purchase Date</label>
                        <input
                          type="date"
                          className="w-full border rounded p-2"
                          value={h.purchaseDate || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(
                              idx,
                              "purchaseDate",
                              e.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Review</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded border">
                            {h.review?.status || "pending"}
                          </span>
                          <button
                            type="button"
                            className="px-2 py-1 text-sm rounded border"
                            onClick={() => setShowReviewDialog(idx)}
                          >
                            Review
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm">Total Value</label>
                        <input
                          disabled
                          className="w-full border rounded p-2 font-semibold"
                          value={(
                            (h.quantity || 0) * (h.faceValue || 0)
                          ).toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Additional Information
                  </h3>
                  <div className="space-y-1">
                    <label className="text-sm">Current Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={
                        editing.currentDate
                          ? String(editing.currentDate).slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          currentDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.status || "Active"}
                      onChange={(e) =>
                        setEditing((ed) => ({ ...ed, status: e.target.value }))
                      }
                    >
                      {["Active", "Closed", "Pending", "Suspended"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Remarks</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.remarks || ""}
                      onChange={(e) =>
                        setEditing((ed) => ({ ...ed, remarks: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Amount</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={editing.dividend?.amount ?? 0}
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dividend: {
                            ...(ed.dividend || {}),
                            amount: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Dividend Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={
                        editing.dividend?.date
                          ? String(editing.dividend.date).slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setEditing((ed) => ({
                          ...ed,
                          dividend: {
                            ...(ed.dividend || {}),
                            date: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 rounded border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSaveEdit}
                    disabled={
                      savingEdit ||
                      !editing.shareholderName?.name1 ||
                      !editing.panNumber
                    }
                    className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Review Dialog (inside edit modal) */}
          {showReviewDialog !== null && editing && (
            <div className="fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowReviewDialog(null)}
              />
              <div className="absolute inset-0 grid place-items-center p-4">
                <div className="w-full max-w-md bg-card text-foreground rounded-lg border shadow-md">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Review Company</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {(() => {
                      const idx = showReviewDialog;
                      const holding = editing.shareHoldings[idx];
                      return (
                        <>
                          <div>
                            <h4 className="font-semibold">
                              {holding.companyName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {holding.isinNumber}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm">Review Status</label>
                            <select
                              className="w-full border rounded p-2"
                              value={holding.review?.status || "pending"}
                              onChange={(e) =>
                                updateEditingShareHolding(idx, "review", {
                                  ...(holding.review || {}),
                                  status: e.target.value,
                                })
                              }
                            >
                              {reviewStatusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm">Review Notes</label>
                            <textarea
                              className="w-full h-24 p-2 border rounded resize-none"
                              value={holding.review?.notes || ""}
                              onChange={(e) =>
                                updateEditingShareHolding(idx, "review", {
                                  ...(holding.review || {}),
                                  notes: e.target.value,
                                })
                              }
                            />
                          </div>
                          {holding.review?.reviewedAt && (
                            <div className="text-xs text-muted-foreground">
                              Last reviewed:{" "}
                              {new Date(
                                holding.review.reviewedAt,
                              ).toLocaleString()}{" "}
                              by {holding.review.reviewedBy}
                            </div>
                          )}
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              className="px-4 py-2 rounded border"
                              onClick={() => setShowReviewDialog(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded bg-primary text-primary-foreground"
                              onClick={() =>
                                saveReviewFor(
                                  idx,
                                  editing.shareHoldings[idx].review?.status ||
                                    "pending",
                                  editing.shareHoldings[idx].review?.notes ||
                                    "",
                                )
                              }
                            >
                              Save Review
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
