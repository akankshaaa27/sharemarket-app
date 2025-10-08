import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { toast } from "react-toastify";
import { exportClientProfileToExcel } from "../lib/export.js";

// Review status options
const reviewStatusOptions = [
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_attention", label: "Needs Attention" },
];

const emptyShareHolding = () => ({
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

function getShareHoldingsFrom(item) {
  if (!item) return [];
  let holdings = [];
  if (Array.isArray(item.shareHoldings)) holdings = item.shareHoldings;
  else if (Array.isArray(item.companies)) holdings = item.companies;
  return holdings.map((h) => ({
    ...h,
    review: {
      status: h?.review?.status || "pending",
      notes: h?.review?.notes || "",
      reviewedAt: h?.review?.reviewedAt || "",
      reviewedBy: h?.review?.reviewedBy || "",
    },
  }));
}

// Review Dialog Component
function ReviewDialog({
  showReviewDialog,
  setShowReviewDialog,
  filteredHoldings,
  saveReviewFor,
  updating,
  formatDateTime
}) {
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [reviewNotes, setReviewNotes] = useState("");

  // Reset state when dialog opens/closes or when the holding changes
  useEffect(() => {
    if (showReviewDialog !== null) {
      const holding = filteredHoldings[showReviewDialog];
      setReviewStatus(holding.review?.status || "pending");
      setReviewNotes(holding.review?.notes || "");
    }
  }, [showReviewDialog, filteredHoldings]);

  if (showReviewDialog === null) return null;

  const holding = filteredHoldings[showReviewDialog];

  const handleSave = () => {
    saveReviewFor(showReviewDialog, reviewStatus, reviewNotes);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowReviewDialog(null)}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg border shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-lg">Review Company</h3>
            <button
              onClick={() => setShowReviewDialog(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">{holding.companyName}</h4>
              <p className="text-sm text-gray-600">
                ISIN: {holding.isinNumber}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Review Status</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
              >
                {reviewStatusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Review Notes</label>
              <textarea
                className="w-full h-32 p-2 border rounded resize-none text-sm"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add your review notes here..."
              />
            </div>

            {holding.review?.reviewedAt && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Last reviewed: {formatDateTime(holding.review.reviewedAt)} by {holding.review.reviewedBy}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => setShowReviewDialog(null)}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                onClick={handleSave}
                disabled={updating}
              >
                {updating ? "Saving..." : "Save Review"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // UI state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState(emptyShareHolding());
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedHolding, setEditedHolding] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(null);
  const [showNotesTooltip, setShowNotesTooltip] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .getProfile(id)
      .then((data) => {
        if (!mounted) return;
        setClient(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  const shareHoldings = useMemo(() => getShareHoldingsFrom(client), [client]);

  const filteredHoldings = useMemo(() => {
    if (reviewFilter === "all") return shareHoldings;
    return shareHoldings.filter(
      (h) => (h.review?.status || "pending") === reviewFilter,
    );
  }, [shareHoldings, reviewFilter]);

  const reviewStats = useMemo(
    () => ({
      total: shareHoldings.length,
      pending: shareHoldings.filter((h) => h.review?.status === "pending")
        .length,
      approved: shareHoldings.filter((h) => h.review?.status === "approved")
        .length,
      rejected: shareHoldings.filter((h) => h.review?.status === "rejected")
        .length,
      needs_attention: shareHoldings.filter(
        (h) => h.review?.status === "needs_attention",
      ).length,
    }),
    [shareHoldings],
  );

  const totalShares = useMemo(
    () => shareHoldings.reduce((s, h) => s + (h.quantity || 0), 0),
    [shareHoldings],
  );
  const totalInvestment = useMemo(
    () =>
      shareHoldings.reduce(
        (s, h) => s + (h.quantity || 0) * (h.faceValue || 0),
        0,
      ),
    [shareHoldings],
  );

  function formatCurrency(v) {
    if (v === undefined || v === null) return "—";
    return Number(v).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  }
  function formatNumber(v) {
    if (v === undefined || v === null) return "—";
    return Number(v).toLocaleString();
  }
  function formatDate(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  }
  function formatDateTime(d) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "—";
    }
  }
  function val(v, def = "—") {
    return v !== undefined && v !== null && v !== "" ? v : def;
  }

  async function updateServer(updated) {
    try {
      setUpdating(true);
      const payload = { ...updated, companies: getShareHoldingsFrom(updated) };
      const saved = await api.updateProfile(updated._id || client._id, payload);
      setClient(saved);
      toast.success("Client profile updated successfully!");
      return saved;
    } catch (e) {
      toast.error(e.message || "Update failed");
      throw e;
    } finally {
      setUpdating(false);
    }
  }

  function beginEdit(index) {
    setEditingIndex(index);
    setEditedHolding({ ...filteredHoldings[index] });
  }
  function cancelEdit() {
    setEditingIndex(null);
    setEditedHolding(null);
  }
  async function saveEdit() {
    if (editingIndex === null || !editedHolding) return;
    if (!editedHolding.companyName || !editedHolding.isinNumber) {
      toast.error("Company Name and ISIN Number are required");
      return;
    }
    const originalIndex = shareHoldings.findIndex(
      (h) =>
        h.companyName === filteredHoldings[editingIndex].companyName &&
        h.isinNumber === filteredHoldings[editingIndex].isinNumber,
    );
    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }
    const next = { ...client };
    const nextHoldings = [...shareHoldings];
    nextHoldings[originalIndex] = editedHolding;
    next.shareHoldings = nextHoldings;
    await updateServer(next);
    cancelEdit();
  }

  async function deleteCompany(index) {
    if (!confirm("Are you sure you want to delete this company?")) return;
    const originalIndex = shareHoldings.findIndex(
      (h) =>
        h.companyName === filteredHoldings[index].companyName &&
        h.isinNumber === filteredHoldings[index].isinNumber,
    );
    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }
    const next = { ...client };
    next.shareHoldings = shareHoldings.filter((_, i) => i !== originalIndex);
    await updateServer(next);
  }

  async function addCompany() {
    if (!newCompany.companyName || !newCompany.isinNumber) {
      toast.error("Company Name and ISIN Number are required");
      return;
    }
    const next = { ...client };
    next.shareHoldings = [...shareHoldings, newCompany];
    await updateServer(next);
    setNewCompany(emptyShareHolding());
    setShowAddCompany(false);
  }

  async function saveReviewFor(index, status, notes) {
    const originalIndex = shareHoldings.findIndex(
      (h) =>
        h.companyName === filteredHoldings[index].companyName &&
        h.isinNumber === filteredHoldings[index].isinNumber,
    );
    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }
    const next = { ...client };
    const nextHoldings = [...shareHoldings];
    nextHoldings[originalIndex] = {
      ...nextHoldings[originalIndex],
      review: {
        status,
        notes,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Current User",
      },
    };
    next.shareHoldings = nextHoldings;
    await updateServer(next);
    setShowReviewDialog(null);
  }

  async function onDeleteProfile() {
    if (!confirm("Delete this profile?")) return;
    await api.deleteProfile(client._id);
    navigate("/profiles");
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!client) return <p>Not found</p>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profiles")}
            className="px-3 py-1.5 border rounded"
          >
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">Client Profile Details</h1>
            <p className="text-sm text-muted-foreground">
              Client ID: {client.clientId || client._id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 rounded border ${reviewMode ? "bg-primary text-primary-foreground" : "bg-background"}`}
            onClick={() => setReviewMode((v) => !v)}
          >
            {reviewMode ? "Exit Review" : "Review Mode"}
          </button>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={() => window.print()}
          >
            Print
          </button>
          <button
            className="px-3 py-1.5 rounded border bg-green-50 text-green-700 hover:bg-green-100"
            onClick={() => {
              exportClientProfileToExcel(client);
              toast.success("Profile exported to Excel");
            }}
          >
            Export
          </button>
          <button
            className="px-3 py-1.5 rounded border text-red-600"
            onClick={onDeleteProfile}
          >
            Delete
          </button>
        </div>
      </div>

      {updating && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-blue-800">
          Updating client profile...
        </div>
      )}

      {reviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-800 font-semibold">
            Review Mode Active • Manage company reviews and status
          </div>
          <div className="flex gap-4 text-sm">
            {Object.entries(reviewStats).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="font-semibold">{v}</div>
                <div className="text-xs capitalize text-muted-foreground">
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic Client Information */}
      <div className="rounded border p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Basic Client Information</h2>
          <span className="px-2 py-0.5 rounded text-xs border">
            {client.status}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Client ID</div>
            <div className="font-semibold font-mono">{val(client.clientId)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Short Name</div>
            <div className="font-semibold">{val(client.shortName)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Client Type</div>
            <div>{val(client.clientType)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Account Category</div>
            <div>{val(client.accountCategory)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sub Type</div>
            <div>{val(client.subType)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Standing Instruction</div>
            <div>{val(client.standingInstruction)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Account Activation Date</div>
            <div>{formatDate(client.accountActivationDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status Change Reason</div>
            <div>{val(client.statusChangeReason)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status Change Date</div>
            <div>{formatDate(client.statusChangeDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">DP ID</div>
            <div className="font-mono">{val(client.dpId)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">DP Name</div>
            <div>{val(client.dpName)}</div>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-xs text-muted-foreground">Full Name</div>
            <div className="font-semibold">
              {val(client.shareholderName?.name1)}
              {client.shareholderName?.name2 && `, ${client.shareholderName.name2}`}
              {client.shareholderName?.name3 && `, ${client.shareholderName.name3}`}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Father/Spouse Name</div>
            <div className="font-semibold">
              {val(client.shareholderName?.fatherOrSpouseName)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Occupation</div>
            <div>{val(client.occupation)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">PAN Number</div>
            <div className="font-mono font-semibold">{val(client.panNumber)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Aadhaar Number</div>
            <div className="font-mono font-semibold">{val(client.aadhaarNumber)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Mobile Number</div>
            <div className="font-semibold">{val(client.mobileNumber)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email ID</div>
            <div>{val(client.emailId)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">e-DIS Flag</div>
            <div>{val(client.eDisFlag)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">One Time Declaration Flag</div>
            <div>{val(client.oneTimeDeclarationFlag)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">SMS Facility</div>
            <div>{val(client.smsFacility)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">PAN Flag</div>
            <div>{val(client.panFlag)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">ATM Flag</div>
            <div>{val(client.atmFlag)}</div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-xs text-muted-foreground">Address</div>
            <div>
              {client.address?.line1 && <div>{client.address.line1}</div>}
              {client.address?.line2 && <div>{client.address.line2}</div>}
              {client.address?.city && <div>{client.address.city}</div>}
              {client.address?.state && <div>{client.address.state}</div>}
              {client.address?.pincode && <div>{client.address.pincode}</div>}
              {client.address?.country && <div>{client.address.country}</div>}
              {!client.address?.line1 && val(client.address)}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Details */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Financial Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Bank Account Number</div>
            <div className="font-mono font-semibold">
              {val(client.bankDetails?.bankAccountNumber)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bank Account Type</div>
            <div>{val(client.bankDetails?.bankAccountType)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bank Name</div>
            <div className="font-semibold">{val(client.bankDetails?.bankName)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Branch Code</div>
            <div className="font-mono">{val(client.bankDetails?.branchCode)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">IFSC Code</div>
            <div className="font-mono font-semibold">{val(client.bankDetails?.ifscCode)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">MICR Code</div>
            <div className="font-mono">{val(client.bankDetails?.micrCode)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">LEI Number</div>
            <div>{val(client.bankDetails?.leiNumber)}</div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-xs text-muted-foreground">Bank Address</div>
            <div>{val(client.bankDetails?.bankAddress)}</div>
          </div>
        </div>
      </div>

      {/* Income & Net Worth */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Income & Net Worth</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Gross Annual Income Range</div>
            <div className="font-semibold">{val(client.grossAnnualIncomeRange)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net Worth (₹)</div>
            <div className="font-semibold">{formatCurrency(client.netWorth)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net Worth As On Date</div>
            <div>{formatDate(client.netWorthAsOnDate)}</div>
          </div>
        </div>
      </div>

      {/* Additional Flags */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Additional Flags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Family Flag (Mobile)</div>
            <div>{val(client.familyFlagMobile)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Family Flag (Email)</div>
            <div>{val(client.familyFlagEmail)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Receive Physical Communications</div>
            <div>{val(client.receivePhysicalCommunicationsFlag)}</div>
          </div>
        </div>
      </div>

      {/* Nominee Details */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Nominee Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Nominee Name</div>
            <div className="font-semibold">{val(client.nominee?.name)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nominee PAN</div>
            <div className="font-mono">{val(client.nominee?.pan)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nominee Aadhaar</div>
            <div>{val(client.nominee?.aadhaar)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nominee Email ID</div>
            <div>{val(client.nominee?.emailId)}</div>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <div className="text-xs text-muted-foreground">Nominee Address</div>
            <div>{val(client.nominee?.address)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nominee Pincode</div>
            <div>{val(client.nominee?.pincode)}</div>
          </div>
        </div>
      </div>

      {/* Demat Account Details */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Demat Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Demat Account Number</div>
            <div className="font-semibold font-mono">{val(client.dematAccountNumber)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Demat Created With</div>
            <div>{val(client.dematCreatedWith)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created By (Person)</div>
            <div>{val(client.dematCreatedWithPerson)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Creator Contact Number</div>
            <div>{val(client.dematCreatedWithPersonNumber)}</div>
          </div>
        </div>
      </div>

      {/* Share Holdings Summary */}
      <div className="rounded border p-4 bg-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Share Holdings Summary</h2>
          <button
            className="px-3 py-1.5 rounded border"
            onClick={() => setShowAddCompany(true)}
            disabled={updating}
          >
            Add Company
          </button>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Companies: {shareHoldings.length}</span>
          <span>Total Shares: {formatNumber(totalShares)}</span>
          <span className="font-semibold">
            Total Investment: {formatCurrency(totalInvestment)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <label className="text-sm">Filter by Review:</label>
          <select
            className="border rounded px-2 py-1"
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value)}
          >
            <option value="all">All Companies</option>
            {reviewStatusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="px-2 py-0.5 rounded border text-xs">
            Showing {filteredHoldings.length} of {shareHoldings.length}
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm border">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Company Name</th>
                <th className="p-2 text-left">ISIN Number</th>
                <th className="p-2 text-left">Review Status</th>
                <th className="p-2 text-left">Folio Number</th>
                <th className="p-2 text-left">Certificate No.</th>
                <th className="p-2 text-right">Quantity</th>
                <th className="p-2 text-right">Face Value</th>
                <th className="p-2 text-right">Total Value</th>
                <th className="p-2 text-left">Purchase Date</th>
                <th className="p-2 text-left">Distinctive Numbers</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHoldings.map((h, index) => {
                const quantity = h.quantity || 0;
                const faceValue = h.faceValue || 0;
                const totalValue = quantity * faceValue;
                const isEditing = editingIndex === index;
                return (
                  <tr key={`${h.companyName}-${index}`} className="border-t">
                    <td className="p-2 align-top">{index + 1}</td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full border rounded p-1"
                          value={editedHolding?.companyName || ""}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              companyName: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="font-semibold">
                          {val(h.companyName)}
                        </span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full border rounded p-1"
                          value={editedHolding?.isinNumber || ""}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              isinNumber: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <span className="font-mono">{val(h.isinNumber)}</span>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <select
                          className="w-full border rounded p-1"
                          value={editedHolding?.review?.status || "pending"}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              review: {
                                ...((p && p.review) || {}),
                                status: e.target.value,
                              },
                            }))
                          }
                        >
                          {reviewStatusOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded border font-medium capitalize
        ${h.review?.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : ''}
        ${h.review?.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
        ${h.review?.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : ''}
        ${h.review?.status === 'needs_attention' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
      `}>
                            {h.review?.status || "pending"}
                          </span>
                          {h.review?.notes && (
                            <button
                              className="text-blue-600 text-xs underline hover:text-blue-800"
                              onClick={() => setShowReviewDialog(index)}
                            >
                              Notes
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full border rounded p-1"
                          value={editedHolding?.folioNumber || ""}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              folioNumber: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        val(h.folioNumber)
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full border rounded p-1"
                          value={editedHolding?.certificateNumber || ""}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              certificateNumber: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        val(h.certificateNumber)
                      )}
                    </td>
                    <td className="p-2 align-top text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          className="w-full border rounded p-1 text-right"
                          value={editedHolding?.quantity ?? 0}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              quantity: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        formatNumber(quantity)
                      )}
                    </td>
                    <td className="p-2 align-top text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded p-1 text-right"
                          value={editedHolding?.faceValue ?? 0}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              faceValue: Number(e.target.value) || 0,
                            }))
                          }
                        />
                      ) : (
                        formatCurrency(faceValue)
                      )}
                    </td>
                    <td className="p-2 align-top text-right font-semibold">
                      {formatCurrency(totalValue)}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <input
                          type="date"
                          className="w-full border rounded p-1"
                          value={editedHolding?.purchaseDate || ""}
                          onChange={(e) =>
                            setEditedHolding((p) => ({
                              ...(p || {}),
                              purchaseDate: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        formatDate(h.purchaseDate)
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            className="w-full border rounded p-1"
                            value={editedHolding?.distinctiveNumber?.from || ""}
                            onChange={(e) =>
                              setEditedHolding((p) => ({
                                ...(p || {}),
                                distinctiveNumber: {
                                  ...((p && p.distinctiveNumber) || {}),
                                  from: e.target.value,
                                },
                              }))
                            }
                            placeholder="From"
                          />
                          <input
                            className="w-full border rounded p-1"
                            value={editedHolding?.distinctiveNumber?.to || ""}
                            onChange={(e) =>
                              setEditedHolding((p) => ({
                                ...(p || {}),
                                distinctiveNumber: {
                                  ...((p && p.distinctiveNumber) || {}),
                                  to: e.target.value,
                                },
                              }))
                            }
                            placeholder="To"
                          />
                        </div>
                      ) : h.distinctiveNumber?.from ||
                        h.distinctiveNumber?.to ? (
                        <span className="font-mono">
                          {val(h.distinctiveNumber?.from, "—")} to{" "}
                          {val(h.distinctiveNumber?.to, "—")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 align-top">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded border"
                            onClick={saveEdit}
                            disabled={updating}
                          >
                            Save
                          </button>
                          <button
                            className="px-2 py-1 rounded border"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            className="px-2 py-1 rounded border"
                            title="Review"
                            onClick={() => setShowReviewDialog(index)}
                          >
                            Review
                          </button>
                          <button
                            className="px-2 py-1 rounded border"
                            onClick={() => beginEdit(index)}
                            disabled={updating}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 rounded border text-red-600"
                            onClick={() => deleteCompany(index)}
                            disabled={updating || shareHoldings.length === 1}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredHoldings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {shareHoldings.length === 0
                ? "No share holdings found for this client. Click 'Add Company' to get started."
                : "No companies match the current filter criteria."}
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="rounded border p-4 bg-card">
        <h2 className="font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Remarks</div>
            <div className="p-3 border rounded bg-muted/20 min-h-[80px]">
              {val(client.remarks, "No remarks provided")}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              Dividend Information
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="font-semibold">
                  {formatCurrency(client.dividend?.amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div>{formatDate(client.dividend?.date)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() => navigate("/profiles")}
        >
          Back to List
        </button>
        <button
          className="px-3 py-1.5 rounded border"
          onClick={() =>
            navigate("/profiles", { state: { editClient: client } })
          }
        >
          Edit Profile
        </button>
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !updating && setShowAddCompany(false)}
          />
          <div className="absolute inset-0 p-4 overflow-y-auto">
            <div className="mx-auto max-w-2xl bg-card text-foreground rounded-lg border shadow-lg">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add New Company</h2>
                <button
                  onClick={() => !updating && setShowAddCompany(false)}
                  className="text-sm px-2 py-1 rounded border"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm">Company Name *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.companyName}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">ISIN Number *</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.isinNumber}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          isinNumber: e.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Folio Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.folioNumber}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          folioNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Certificate Number</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.certificateNumber}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          certificateNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Quantity *</label>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={newCompany.quantity}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          quantity: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Face Value *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded p-2"
                      value={newCompany.faceValue}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          faceValue: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Distinctive From</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.distinctiveNumber.from}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          distinctiveNumber: {
                            ...c.distinctiveNumber,
                            from: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Distinctive To</label>
                    <input
                      className="w-full border rounded p-2"
                      value={newCompany.distinctiveNumber.to}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          distinctiveNumber: {
                            ...c.distinctiveNumber,
                            to: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm">Purchase Date</label>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={newCompany.purchaseDate}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          purchaseDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm">Initial Review Status</label>
                    <select
                      className="w-full border rounded p-2"
                      value={newCompany.review?.status || "pending"}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          review: {
                            ...(c.review || {}),
                            status: e.target.value,
                          },
                        }))
                      }
                    >
                      {reviewStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-sm">Initial Review Notes</label>
                    <textarea
                      className="w-full h-20 p-2 border rounded resize-none"
                      value={newCompany.review?.notes || ""}
                      onChange={(e) =>
                        setNewCompany((c) => ({
                          ...c,
                          review: {
                            ...(c.review || {}),
                            notes: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    className="px-3 py-1.5 rounded border"
                    onClick={() => setShowAddCompany(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 py-1.5 rounded border"
                    onClick={addCompany}
                    disabled={
                      updating ||
                      !newCompany.companyName ||
                      !newCompany.isinNumber
                    }
                  >
                    {updating ? "Adding..." : "Add Company"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        showReviewDialog={showReviewDialog}
        setShowReviewDialog={setShowReviewDialog}
        filteredHoldings={filteredHoldings}
        saveReviewFor={saveReviewFor}
        updating={updating}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}