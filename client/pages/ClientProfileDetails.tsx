// ClientProfileDetails.tsx
import { useLocation, useParams } from "react-router-dom";
import { ClientProfile, ShareHolding } from "./ClientProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Printer, Plus, Eye, CheckCircle, XCircle, Edit, Trash2, Save, X, Star, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

// Review status type
type ReviewStatus = "pending" | "approved" | "rejected" | "needs_attention";
// Extended ShareHolding interface with nested review
interface ShareHoldingWithReview extends ShareHolding {
  review?: {
    status: ReviewStatus;
    notes?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  };
}

// Empty share holding template with nested review
const emptyShareHolding: ShareHoldingWithReview = {
  companyName: "",
  isinNumber: "",
  folioNumber: "",
  certificateNumber: "",
  distinctiveNumber: { from: "", to: "" },
  quantity: 0,
  faceValue: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
  review: {
    status: "pending",
    notes: "",
    reviewedAt: "",
    reviewedBy: ""
  }
};

// Helper function to safely get share holdings with nested review
const getShareHoldings = (client: ClientProfile | null): ShareHoldingWithReview[] => {
  if (!client) return [];

  let holdings: ShareHoldingWithReview[] = [];

  if (client.shareHoldings && Array.isArray(client.shareHoldings)) {
    holdings = client.shareHoldings as ShareHoldingWithReview[];
  } else if ((client as any).companies && Array.isArray((client as any).companies)) {
    holdings = (client as any).companies as ShareHoldingWithReview[];
  }

  // Ensure each holding has nested review object with defaults
  return holdings.map(holding => ({
    ...holding,
    review: {
      status: holding.review?.status || "pending",
      notes: holding.review?.notes || "",
      reviewedAt: holding.review?.reviewedAt || "",
      reviewedBy: holding.review?.reviewedBy || "",
    }
  }));
};

// Review status options
const reviewStatusOptions = [
  { value: "pending", label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  { value: "needs_attention", label: "Needs Attention", color: "bg-orange-100 text-orange-800" }
];

export default function ClientProfileDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const client = location.state?.client as ClientProfile;

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState<ShareHoldingWithReview>(emptyShareHolding);
  const [reviewMode, setReviewMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedHolding, setEditedHolding] = useState<ShareHoldingWithReview | null>(null);
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | "all">("all");
  const [showReviewDialog, setShowReviewDialog] = useState<number | null>(null);

  // Safely get share holdings
  const shareHoldings = getShareHoldings(client);

  // Filtered holdings based on review filter
  const filteredHoldings = reviewFilter === "all"
    ? shareHoldings
    : shareHoldings.filter(holding => holding.review?.status === reviewFilter);
  // Update mutation for client profile
  // Update mutation for client profile
  const updateMutation = useMutation({
    mutationFn: async (updatedClient: ClientProfile) => {
      // Prepare the payload for the backend with nested review structure
      const backendPayload = {
        ...updatedClient,
        companies: getShareHoldings(updatedClient).map(holding => ({
          ...holding,
          // Ensure review is properly structured for backend
          review: holding.review ? {
            status: holding.review.status,
            notes: holding.review.notes,
            reviewedAt: holding.review.reviewedAt || undefined,
            reviewedBy: holding.review.reviewedBy || undefined,
          } : undefined
        }))
      };

      return (await api.put<ClientProfile>(`/client-profiles/${updatedClient._id}`, backendPayload)).data;
    },
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ["client-profiles"] });
      toast.success("Client profile updated successfully!");
      setEditingIndex(null);
      setEditedHolding(null);
      setNewCompany(emptyShareHolding);
      setShowAddCompany(false);
      setShowReviewDialog(null);

      // Navigate to refresh the state with updated client
      navigate(`/client-profiles/${client._id}`, {
        state: {
          client: {
            ...updatedClient,
            shareHoldings: getShareHoldings(updatedClient)
          }
        },
        replace: true
      });
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      toast.error(`Failed to update: ${error.response?.data?.error || error.message}`);
    }
  });

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Client not found</h1>
          <Button onClick={() => navigate("/profiles")} className="mt-4">
            Back to Client List
          </Button>
        </div>
      </div>
    );
  }

  // Add new company function with API call
  const handleAddCompany = () => {
    if (!newCompany.companyName || !newCompany.isinNumber) {
      toast.error("Company Name and ISIN Number are required");
      return;
    }

    const updatedClient = {
      ...client,
      shareHoldings: [...shareHoldings, newCompany]
    };

    // Make API call to update the client
    updateMutation.mutate(updatedClient);
  };

  // Edit company function
  const handleEditCompany = (index: number) => {
    setEditingIndex(index);
    setEditedHolding({ ...filteredHoldings[index] });
  };

  // Save edited company function
  const handleSaveEdit = () => {
    if (editingIndex === null || !editedHolding) return;

    if (!editedHolding.companyName || !editedHolding.isinNumber) {
      toast.error("Company Name and ISIN Number are required");
      return;
    }

    // Find the original index in the full array
    const originalIndex = shareHoldings.findIndex(
      holding => holding.companyName === filteredHoldings[editingIndex].companyName &&
        holding.isinNumber === filteredHoldings[editingIndex].isinNumber
    );

    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }

    const updatedHoldings = [...shareHoldings];
    updatedHoldings[originalIndex] = editedHolding;

    const updatedClient = {
      ...client,
      shareHoldings: updatedHoldings
    };

    updateMutation.mutate(updatedClient);
  };

  // Cancel edit function
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedHolding(null);
  };

  // Delete company function
  const handleDeleteCompany = (index: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    // Find the original index in the full array
    const originalIndex = shareHoldings.findIndex(
      holding => holding.companyName === filteredHoldings[index].companyName &&
        holding.isinNumber === filteredHoldings[index].isinNumber
    );

    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }

    const updatedHoldings = shareHoldings.filter((_, i) => i !== originalIndex);

    const updatedClient = {
      ...client,
      shareHoldings: updatedHoldings
    };

    updateMutation.mutate(updatedClient);
  };

  // Update review status function
  // Update review status function with nested structure
  const handleUpdateReview = (index: number, status: ReviewStatus, notes: string = "") => {
    // Find the original index in the full array
    const originalIndex = shareHoldings.findIndex(
      holding => holding.companyName === filteredHoldings[index].companyName &&
        holding.isinNumber === filteredHoldings[index].isinNumber
    );

    if (originalIndex === -1) {
      toast.error("Company not found in the list");
      return;
    }

    const updatedHoldings = [...shareHoldings];
    updatedHoldings[originalIndex] = {
      ...updatedHoldings[originalIndex],
      review: {
        status: status,
        notes: notes,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Current User" // In real app, get from auth context
      }
    };

    const updatedClient = {
      ...client,
      shareHoldings: updatedHoldings
    };

    updateMutation.mutate(updatedClient);
  };
  // Safe calculations with default values - use the safe shareHoldings array
  const totalShares = shareHoldings.reduce((sum, holding) =>
    sum + (holding.quantity || 0), 0);

  const totalInvestment = shareHoldings.reduce((sum, holding) =>
    sum + ((holding.quantity || 0) * (holding.faceValue || 0)), 0);

  // Review statistics
  // const reviewStats = {
  //   total: shareHoldings.length,
  //   pending: shareHoldings.filter(h => h.reviewStatus === "pending").length,
  //   approved: shareHoldings.filter(h => h.reviewStatus === "approved").length,
  //   rejected: shareHoldings.filter(h => h.reviewStatus === "rejected").length,
  //   needs_attention: shareHoldings.filter(h => h.reviewStatus === "needs_attention").length
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Closed": return "bg-red-100 text-red-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Suspended": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Review badge component
  // Review badge component with nested review
  const ReviewBadge = ({ status }: { status: ReviewStatus }) => {
    const option = reviewStatusOptions.find(opt => opt.value === status) || reviewStatusOptions[0];

    return (
      <Badge className={`${option.color} flex items-center gap-1`}>
        {status === "approved" && <CheckCircle className="w-3 h-3" />}
        {status === "rejected" && <XCircle className="w-3 h-3" />}
        {status === "pending" && <Star className="w-3 h-3" />}
        {status === "needs_attention" && <XCircle className="w-3 h-3" />}
        {option.label}
      </Badge>
    );
  };

  // Review statistics with nested review
  const reviewStats = {
    total: shareHoldings.length,
    pending: shareHoldings.filter(h => h.review?.status === "pending").length,
    approved: shareHoldings.filter(h => h.review?.status === "approved").length,
    rejected: shareHoldings.filter(h => h.review?.status === "rejected").length,
    needs_attention: shareHoldings.filter(h => h.review?.status === "needs_attention").length
  };

  // Safe formatting functions
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "—";
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
  };

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return "—";
    return value.toLocaleString();
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "—";
    }
  };

  const getSafeValue = (value: any, defaultValue: any = "—") => {
    return value !== undefined && value !== null && value !== "" ? value : defaultValue;
  };

  // Render editable input field
  const renderEditableField = (
    value: any,
    onChange: (value: any) => void,
    type: "text" | "number" | "date" = "text",
    placeholder: string = ""
  ) => (
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  );

  // Review Dialog Component
  // Review Dialog Component with nested review
  const ReviewDialog = ({ index }: { index: number }) => {
    const holding = filteredHoldings[index];
    const [notes, setNotes] = useState(holding.review?.notes || "");
    const [status, setStatus] = useState<ReviewStatus>(holding.review?.status || "pending");

    const handleSaveReview = () => {
      handleUpdateReview(index, status, notes);
    };

    return (
      <Dialog open={showReviewDialog === index} onOpenChange={(open) => !open && setShowReviewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">{holding.companyName}</h4>
              <p className="text-sm text-muted-foreground">{holding.isinNumber}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewStatus">Review Status</Label>
              <Select value={status} onValueChange={(value: ReviewStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reviewStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewNotes">Review Notes</Label>
              <textarea
                id="reviewNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or comments about this company..."
                className="w-full h-24 p-2 border rounded-md resize-none"
              />
            </div>

            {holding.review?.reviewedAt && (
              <div className="text-xs text-muted-foreground">
                Last reviewed: {formatDateTime(holding.review.reviewedAt)} by {holding.review.reviewedBy}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(null)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReview}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/profiles")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Client Profile Details</h1>
            <p className="text-muted-foreground">Profile ID: {client._id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={reviewMode ? "default" : "outline"}
            size="sm"
            onClick={() => setReviewMode(!reviewMode)}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            {reviewMode ? "Exit Review" : "Review Mode"}
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {updateMutation.isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Updating client profile...</span>
          </div>
        </div>
      )}

      {/* Review Mode Banner */}
      {reviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Review Mode Active</span>
              <span className="text-blue-600">• Manage company reviews and status</span>
            </div>
            <div className="flex gap-4">
              {Object.entries(reviewStats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="font-semibold">{value}</div>
                  <div className="text-xs text-muted-foreground capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span>Basic Information</span>
            <Badge className={getStatusColor(client.status)}>
              {client.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Shareholder Name</label>
            <div className="text-lg font-semibold">
              {getSafeValue(client.shareholderName?.name1)}
              {client.shareholderName?.name2 && `, ${client.shareholderName.name2}`}
              {client.shareholderName?.name3 && `, ${client.shareholderName.name3}`}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
            <div className="text-lg font-mono font-semibold">{getSafeValue(client.panNumber)}</div>
          </div>

          {/* New Aadhaar Number Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Aadhaar Number</label>
            <div className="text-lg font-mono font-semibold">{getSafeValue(client.aadhaarNumber)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Demat Account Number</label>
            <div className="text-lg font-semibold">{getSafeValue(client.dematAccountNumber)}</div>
          </div>

          {/* New DMAT Created With Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Demat Account Created With</label>
            <div className="text-lg font-semibold">{getSafeValue(client.dematCreatedWith)}</div>
          </div>

          {/* New DMAT Created With Person Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">DMAT Account Created By (Person)</label>
            <div className="text-lg font-semibold">{getSafeValue(client.dematCreatedWithPerson)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Current Date</label>
            <div className="text-lg">{formatDate(client.currentDate)}</div>
          </div>

          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Address</label>
            <div className="text-lg">{getSafeValue(client.address)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
            <div className="text-lg font-semibold">{getSafeValue(client.bankDetails?.bankName)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Account Number</label>
            <div className="text-lg font-mono">{getSafeValue(client.bankDetails?.bankNumber)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Branch</label>
            <div className="text-lg">{getSafeValue(client.bankDetails?.branch)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">IFSC Code</label>
            <div className="text-lg font-mono font-semibold">{getSafeValue(client.bankDetails?.ifscCode)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">MICR Code</label>
            <div className="text-lg font-mono">{getSafeValue(client.bankDetails?.micrCode)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Share Holdings Summary */}
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle>Share Holdings Summary</CardTitle>
            <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={updateMutation.isPending}
                >
                  <Plus className="w-4 h-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={newCompany.companyName}
                        onChange={(e) => setNewCompany({ ...newCompany, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isinNumber">ISIN Number *</Label>
                      <Input
                        id="isinNumber"
                        value={newCompany.isinNumber}
                        onChange={(e) => setNewCompany({ ...newCompany, isinNumber: e.target.value.toUpperCase() })}
                        placeholder="Enter ISIN number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="folioNumber">Folio Number</Label>
                      <Input
                        id="folioNumber"
                        value={newCompany.folioNumber}
                        onChange={(e) => setNewCompany({ ...newCompany, folioNumber: e.target.value })}
                        placeholder="Enter folio number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificateNumber">Certificate Number</Label>
                      <Input
                        id="certificateNumber"
                        value={newCompany.certificateNumber}
                        onChange={(e) => setNewCompany({ ...newCompany, certificateNumber: e.target.value })}
                        placeholder="Enter certificate number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newCompany.quantity}
                        onChange={(e) => setNewCompany({ ...newCompany, quantity: parseInt(e.target.value) || 0 })}
                        placeholder="Enter quantity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faceValue">Face Value *</Label>
                      <Input
                        id="faceValue"
                        type="number"
                        step="0.01"
                        value={newCompany.faceValue}
                        onChange={(e) => setNewCompany({ ...newCompany, faceValue: parseFloat(e.target.value) || 0 })}
                        placeholder="Enter face value"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distinctiveFrom">Distinctive From</Label>
                      <Input
                        id="distinctiveFrom"
                        value={newCompany.distinctiveNumber.from}
                        onChange={(e) => setNewCompany({
                          ...newCompany,
                          distinctiveNumber: { ...newCompany.distinctiveNumber, from: e.target.value }
                        })}
                        placeholder="From number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distinctiveTo">Distinctive To</Label>
                      <Input
                        id="distinctiveTo"
                        value={newCompany.distinctiveNumber.to}
                        onChange={(e) => setNewCompany({
                          ...newCompany,
                          distinctiveNumber: { ...newCompany.distinctiveNumber, to: e.target.value }
                        })}
                        placeholder="To number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={newCompany.purchaseDate}
                        onChange={(e) => setNewCompany({ ...newCompany, purchaseDate: e.target.value })}
                      />
                    </div>
                    {/* Review Section for New Company */}
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="reviewStatus">Initial Review Status</Label>
                      <Select
                        value={newCompany.review?.status}
                        onValueChange={(value: ReviewStatus) => setNewCompany({
                          ...newCompany,
                          review: { ...newCompany.review, status: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {reviewStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="reviewNotes">Initial Review Notes</Label>
                      <textarea
                        id="reviewNotes"
                        value={newCompany.review?.notes || ""}
                        onChange={(e) => setNewCompany({
                          ...newCompany,
                          review: { ...newCompany.review, notes: e.target.value }
                        })}
                        placeholder="Add any initial notes or comments..."
                        className="w-full h-20 p-2 border rounded-md resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCompany(false)}
                      disabled={updateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddCompany}
                      disabled={updateMutation.isPending || !newCompany.companyName || !newCompany.isinNumber}
                    >
                      {updateMutation.isPending ? "Adding..." : "Add Company"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <span>Total Companies: {shareHoldings.length}</span>
            <span>Total Shares: {formatNumber(totalShares)}</span>
            <span className="font-semibold">
              Total Investment: {formatCurrency(totalInvestment)}
            </span>
          </div>

          {/* Review Filter */}
          <div className="flex items-center gap-3 mt-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="reviewFilter" className="text-sm">Filter by Review:</Label>
            <Select value={reviewFilter} onValueChange={(value: ReviewStatus | "all") => setReviewFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {reviewStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              Showing {filteredHoldings.length} of {shareHoldings.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Share Holdings Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Company #</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Company Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">ISIN Number</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Review Status</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Folio Number</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Certificate No.</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Quantity</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Face Value</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Total Value</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Purchase Date</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Distinctive Numbers</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((holding: ShareHoldingWithReview, index: number) => {
                  const quantity = holding.quantity || 0;
                  const faceValue = holding.faceValue || 0;
                  const totalValue = quantity * faceValue;
                  const isEditing = editingIndex === index;

                  return (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="border border-gray-300 px-4 py-3 font-medium">{index + 1}</td>

                      {/* Company Name */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.companyName,
                            (value) => setEditedHolding(prev => prev ? { ...prev, companyName: value } : null),
                            "text",
                            "Company Name"
                          )
                        ) : (
                          <span className="font-semibold">{getSafeValue(holding.companyName)}</span>
                        )}
                      </td>

                      {/* ISIN Number */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.isinNumber,
                            (value) => setEditedHolding(prev => prev ? { ...prev, isinNumber: value } : null),
                            "text",
                            "ISIN Number"
                          )
                        ) : (
                          <span className="font-mono">{getSafeValue(holding.isinNumber)}</span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          <Select
                            value={editedHolding?.review?.status}
                            onValueChange={(value: ReviewStatus) => setEditedHolding(prev => prev ? {
                              ...prev,
                              review: { ...prev.review, status: value }
                            } : null)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {reviewStatusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ReviewBadge status={holding.review?.status || "pending"} />
                            {holding.review?.notes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  toast.info(holding.review?.notes, {
                                    autoClose: 5000,
                                    position: 'top-right'
                                  });
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Folio Number */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.folioNumber,
                            (value) => setEditedHolding(prev => prev ? { ...prev, folioNumber: value } : null)
                          )
                        ) : (
                          getSafeValue(holding.folioNumber)
                        )}
                      </td>

                      {/* Certificate Number */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.certificateNumber,
                            (value) => setEditedHolding(prev => prev ? { ...prev, certificateNumber: value } : null)
                          )
                        ) : (
                          getSafeValue(holding.certificateNumber)
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.quantity,
                            (value) => setEditedHolding(prev => prev ? { ...prev, quantity: value } : null),
                            "number"
                          )
                        ) : (
                          formatNumber(quantity)
                        )}
                      </td>

                      {/* Face Value */}
                      <td className="border border-gray-300 px-4 py-3 text-right">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.faceValue,
                            (value) => setEditedHolding(prev => prev ? { ...prev, faceValue: value } : null),
                            "number"
                          )
                        ) : (
                          formatCurrency(faceValue)
                        )}
                      </td>

                      {/* Total Value */}
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                        {formatCurrency(totalValue)}
                      </td>

                      {/* Purchase Date */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          renderEditableField(
                            editedHolding?.purchaseDate,
                            (value) => setEditedHolding(prev => prev ? { ...prev, purchaseDate: value } : null),
                            "date"
                          )
                        ) : (
                          formatDate(holding.purchaseDate)
                        )}
                      </td>

                      {/* Distinctive Numbers */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={editedHolding?.distinctiveNumber?.from || ""}
                              onChange={(e) => setEditedHolding(prev => prev ? {
                                ...prev,
                                distinctiveNumber: { ...prev.distinctiveNumber, from: e.target.value }
                              } : null)}
                              placeholder="From"
                              className="w-full"
                            />
                            <Input
                              value={editedHolding?.distinctiveNumber?.to || ""}
                              onChange={(e) => setEditedHolding(prev => prev ? {
                                ...prev,
                                distinctiveNumber: { ...prev.distinctiveNumber, to: e.target.value }
                              } : null)}
                              placeholder="To"
                              className="w-full"
                            />
                          </div>
                        ) : (
                          holding.distinctiveNumber?.from || holding.distinctiveNumber?.to ? (
                            <span className="font-mono">
                              {getSafeValue(holding.distinctiveNumber?.from, "—")} to {getSafeValue(holding.distinctiveNumber?.to, "—")}
                            </span>
                          ) : (
                            "—"
                          )
                        )}
                      </td>

                      {/* Actions */}
                      <td className="border border-gray-300 px-4 py-3">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              className="h-8 px-2"
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              className="h-8 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReviewDialog(index)}
                              className="h-8 px-2"
                              title="Review Company"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCompany(index)}
                              disabled={updateMutation.isPending}
                              className="h-8 px-2"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCompany(index)}
                              disabled={updateMutation.isPending || shareHoldings.length === 1}
                              className="h-8 px-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Review Dialogs */}
            {filteredHoldings.map((_, index) => (
              <ReviewDialog key={index} index={index} />
            ))}
          </div>

          {/* Empty State */}
          {filteredHoldings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {shareHoldings.length === 0
                ? "No share holdings found for this client. Click 'Add Company' to get started."
                : "No companies match the current filter criteria."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Remarks</label>
            <div className="text-lg p-3 border rounded-md bg-muted/20 min-h-[80px]">
              {getSafeValue(client.remarks, "No remarks provided")}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Dividend Information</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Amount</label>
                  <div className="text-lg font-semibold">
                    {formatCurrency(client.dividend?.amount)}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <div className="text-lg">
                    {formatDate(client.dividend?.date)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={() => navigate("/profiles")}>
          Back to List
        </Button>
        <Button
          onClick={() => navigate("/profiles", {
            state: { editClient: client }
          })}
        >
          Edit Profile
        </Button>
      </div>
    </div>
  );
}