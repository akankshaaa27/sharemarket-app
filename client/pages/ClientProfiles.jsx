import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { toast } from "react-toastify";
import { exportAllClientProfilesToExcel } from "../lib/export.js";
import { Download } from "lucide-react";

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
  const [showReviewDialog, setShowReviewDialog] = useState(null);

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
    // Basic Client Information
    clientId: "",
    shortName: "",
    clientType: "Resident",
    accountCategory: "Beneficiary",
    subType: "Ordinary",
    status: "Active",
    accountActivationDate: new Date().toISOString().slice(0, 10),
    statusChangeReason: "",
    statusChangeDate: "",

    // Personal Details
    shareholderName: {
      name1: "",
      name2: "",
      name3: "",
      fatherOrSpouseName: ""
    },
    panNumber: "",
    aadhaarNumber: "",
    occupation: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India"
    },
    mobileNumber: "",
    emailId: "",
    eDisFlag: "N",
    oneTimeDeclarationFlag: "Not Submitted",

    // Financial Details
    bankDetails: {
      bankAccountNumber: "",
      bankAccountType: "Savings",
      bankName: "",
      branchCode: "",
      ifscCode: "",
      micrCode: "",
      bankAddress: "",
      leiNumber: ""
    },

    // Income & Net Worth
    grossAnnualIncomeRange: "",
    netWorth: "",
    netWorthAsOnDate: "",

    // Additional Flags
    familyFlagMobile: "",
    familyFlagEmail: "",
    smsFacility: "Available",
    panFlag: "Not Verified",
    atmFlag: "Not Assigned",
    receivePhysicalCommunicationsFlag: "Not Available",

    // Demat Account Details
    dematAccountNumber: "",
    dpId: "IN300095",
    dpName: "ILAFS SECURITIES SERVICES LIMITED",
    standingInstruction: "N",

    // Nominee Details
    nominee: {
      name: "",
      pan: "",
      address: "",
      pincode: "",
      aadhaar: "",
      emailId: "",
      relationship: ""
    },

    shareHoldings: [emptyHolding()],
    currentDate: new Date().toISOString().slice(0, 10),
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
            placeholder="Search by name, PAN, client ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            onClick={() => load({ q })}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportAllClientProfilesToExcel(items);
              toast.success(`Exported ${items.length} client profiles to Excel`);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            disabled={items.length === 0}
          >
            <Download size={18} />
            Export All ({items.length})
          </button>
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Client
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Client ID</th>
              <th className="p-2 text-left">Shareholder</th>
              <th className="p-2 text-left">PAN</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-2">{p.clientId}</td>
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
            <div className="mx-auto max-w-6xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Client Profile</h2>
                <button
                  onClick={() => !saving && setOpen(false)}
                  className="text-sm px-2 py-1 rounded border"
                >
                  Close
                </button>
              </div>
              <form onSubmit={onCreate} className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Basic Client Information */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Basic Client Information
                  </h3>
                  <div className="space-y-1">
                    <label className="text-sm">Client ID *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.clientId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          clientId: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Short Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.shortName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shortName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Client Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.clientType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          clientType: e.target.value,
                        }))
                      }
                    >
                      <option value="Resident">Resident</option>
                      <option value="Non-Resident">Non-Resident</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Account Category</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.accountCategory}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          accountCategory: e.target.value,
                        }))
                      }
                    >
                      <option value="Beneficiary">Beneficiary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Sub Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.subType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          subType: e.target.value,
                        }))
                      }
                    >
                      <option value="Ordinary">Ordinary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          status: e.target.value,
                        }))
                      }
                    >
                      {["Active", "Closed", "Pending", "Suspended"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Account Activation Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={form.accountActivationDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          accountActivationDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Standing Instruction</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.standingInstruction}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          standingInstruction: e.target.value,
                        }))
                      }
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Personal Details
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
                    <label className="text-sm">Father/Spouse Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.shareholderName.fatherOrSpouseName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          shareholderName: {
                            ...f.shareholderName,
                            fatherOrSpouseName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Occupation</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.occupation}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          occupation: e.target.value,
                        }))
                      }
                    />
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
                    <label className="text-sm">Mobile Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.mobileNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          mobileNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Email ID</label>
                    <input
                      type="email"
                      className="w-full border rounded p-2"
                      value={form.emailId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          emailId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address Line 1</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.line1}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, line1: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address Line 2</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.line2}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, line2: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">City</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.city}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, city: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">State</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.state}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, state: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Pincode</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.pincode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, pincode: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Country</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.address.country}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          address: { ...f.address, country: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">e-DIS Flag</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.eDisFlag}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          eDisFlag: e.target.value,
                        }))
                      }
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">SMS Facility</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.smsFacility}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          smsFacility: e.target.value,
                        }))
                      }
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Financial Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Account Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.bankAccountNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            bankAccountNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Account Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.bankDetails.bankAccountType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            bankAccountType: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Other">Other</option>
                    </select>
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
                    <label className="text-sm">Branch Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.branchCode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            branchCode: e.target.value,
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
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Bank Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.bankAddress}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            bankAddress: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">LEI Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.bankDetails.leiNumber}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          bankDetails: {
                            ...f.bankDetails,
                            leiNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Income & Net Worth */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Income & Net Worth</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Gross Annual Income Range</label>
                    <select
                      className="w-full border rounded p-2"
                      value={form.grossAnnualIncomeRange}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          grossAnnualIncomeRange: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Range</option>
                      <option value="0-2 Lacs">0-2 Lacs</option>
                      <option value="2-5 Lacs">2-5 Lacs</option>
                      <option value="5-10 Lacs">5-10 Lacs</option>
                      <option value="10-25 Lacs">10-25 Lacs</option>
                      <option value="25+ Lacs">25+ Lacs</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Net Worth (₹)</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={form.netWorth}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          netWorth: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Net Worth As On Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={form.netWorthAsOnDate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          netWorthAsOnDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Nominee Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Nominee Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.nominee.name}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee PAN</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.nominee.pan}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, pan: e.target.value.toUpperCase() },
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Nominee Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.nominee.address}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, address: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Pincode</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.nominee.pincode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, pincode: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Aadhaar</label>
                    <input
                      className="w-full border rounded p-2"
                      value={form.nominee.aadhaar}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, aadhaar: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Email ID</label>
                    <input
                      type="email"
                      className="w-full border rounded p-2"
                      value={form.nominee.emailId}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nominee: { ...f.nominee, emailId: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Share Holdings Section */}
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
                      saving || !form.shareholderName.name1 || !form.panNumber || !form.clientId
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

      {/* Edit Modal - Similar structure but for editing */}
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !savingEdit && setEditing(null)}
          />
          <div className="absolute inset-0 p-4 overflow-y-auto">
            <div className="mx-auto max-w-6xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Edit Client Profile</h2>
                <button
                  onClick={() => !savingEdit && setEditing(null)}
                  className="text-sm px-2 py-1 rounded border"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Basic Client Information */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Basic Client Information
                  </h3>
                  <div className="space-y-1">
                    <label className="text-sm">Client ID *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.clientId || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          clientId: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Short Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.shortName || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          shortName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Client Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.clientType || "Resident"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          clientType: e.target.value,
                        }))
                      }
                    >
                      <option value="Resident">Resident</option>
                      <option value="Non-Resident">Non-Resident</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Account Category</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.accountCategory || "Beneficiary"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          accountCategory: e.target.value,
                        }))
                      }
                    >
                      <option value="Beneficiary">Beneficiary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Sub Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.subType || "Ordinary"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          subType: e.target.value,
                        }))
                      }
                    >
                      <option value="Ordinary">Ordinary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Status</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.status || "Active"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          status: e.target.value,
                        }))
                      }
                    >
                      {["Active", "Closed", "Pending", "Suspended"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Account Activation Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={editing.accountActivationDate ? String(editing.accountActivationDate).slice(0, 10) : ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          accountActivationDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Standing Instruction</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.standingInstruction || "N"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          standingInstruction: e.target.value,
                        }))
                      }
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">
                    Personal Details
                  </h3>
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm">Name 1 *</label>
                      <input
                        className="w-full border rounded p-2"
                        value={editing.shareholderName?.name1 || ""}
                        onChange={(e) =>
                          setEditing((f) => ({
                            ...f,
                            shareholderName: {
                              ...(f.shareholderName || {}),
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
                        value={editing.shareholderName?.name2 || ""}
                        onChange={(e) =>
                          setEditing((f) => ({
                            ...f,
                            shareholderName: {
                              ...(f.shareholderName || {}),
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
                          setEditing((f) => ({
                            ...f,
                            shareholderName: {
                              ...(f.shareholderName || {}),
                              name3: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Father/Spouse Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.shareholderName?.fatherOrSpouseName || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          shareholderName: {
                            ...(f.shareholderName || {}),
                            fatherOrSpouseName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Occupation</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.occupation || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          occupation: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">PAN *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.panNumber || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
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
                      value={editing.aadhaarNumber || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
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
                    <label className="text-sm">Mobile Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.mobileNumber || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          mobileNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Email ID</label>
                    <input
                      type="email"
                      className="w-full border rounded p-2"
                      value={editing.emailId || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          emailId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address Line 1</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.line1 || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), line1: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Address Line 2</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.line2 || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), line2: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">City</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.city || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), city: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">State</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.state || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), state: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Pincode</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.pincode || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), pincode: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Country</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.address?.country || "India"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          address: { ...(f.address || {}), country: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">e-DIS Flag</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.eDisFlag || "N"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          eDisFlag: e.target.value,
                        }))
                      }
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">SMS Facility</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.smsFacility || "Available"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          smsFacility: e.target.value,
                        }))
                      }
                    >
                      <option value="Available">Available</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Financial Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Account Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankAccountNumber || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            bankAccountNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Account Type</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankAccountType || "Savings"}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            bankAccountType: e.target.value,
                          },
                        }))
                      }
                    >
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Bank Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankName || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            bankName: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Branch Code</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.branchCode || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            branchCode: e.target.value,
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
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
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
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            micrCode: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Bank Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.bankAddress || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            bankAddress: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">LEI Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.bankDetails?.leiNumber || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          bankDetails: {
                            ...(f.bankDetails || {}),
                            leiNumber: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Income & Net Worth */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Income & Net Worth</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Gross Annual Income Range</label>
                    <select
                      className="w-full border rounded p-2"
                      value={editing.grossAnnualIncomeRange || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          grossAnnualIncomeRange: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select Range</option>
                      <option value="0-2 Lacs">0-2 Lacs</option>
                      <option value="2-5 Lacs">2-5 Lacs</option>
                      <option value="5-10 Lacs">5-10 Lacs</option>
                      <option value="10-25 Lacs">10-25 Lacs</option>
                      <option value="25+ Lacs">25+ Lacs</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Net Worth (₹)</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={editing.netWorth || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          netWorth: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Net Worth As On Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={editing.netWorthAsOnDate ? String(editing.netWorthAsOnDate).slice(0, 10) : ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          netWorthAsOnDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Nominee Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Nominee Details</h3>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Name</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.nominee?.name || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee PAN</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.nominee?.pan || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), pan: e.target.value.toUpperCase() },
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-sm">Nominee Address</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.nominee?.address || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), address: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Pincode</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.nominee?.pincode || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), pincode: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Aadhaar</label>
                    <input
                      className="w-full border rounded p-2"
                      value={editing.nominee?.aadhaar || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), aadhaar: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Nominee Email ID</label>
                    <input
                      type="email"
                      className="w-full border rounded p-2"
                      value={editing.nominee?.emailId || ""}
                      onChange={(e) =>
                        setEditing((f) => ({
                          ...f,
                          nominee: { ...(f.nominee || {}), emailId: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Share Holdings Section */}
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
                          value={h.companyName || ""}
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
                          value={h.isinNumber || ""}
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
                            updateEditingShareHolding(idx, "distinctiveNumber", {
                              ...(h.distinctiveNumber || {}),
                              from: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm">Distinctive To</label>
                        <input
                          className="w-full border rounded p-2"
                          value={h.distinctiveNumber?.to || ""}
                          onChange={(e) =>
                            updateEditingShareHolding(idx, "distinctiveNumber", {
                              ...(h.distinctiveNumber || {}),
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
                          value={h.purchaseDate ? String(h.purchaseDate).slice(0, 10) : ""}
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
                      savingEdit || !editing.shareholderName?.name1 || !editing.panNumber || !editing.clientId
                    }
                    className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}