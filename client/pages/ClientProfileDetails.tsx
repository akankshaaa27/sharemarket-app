// ClientProfileDetails.tsx
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ClientProfile, ShareHolding } from "./ClientProfiles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  Printer,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Empty share holding template
const emptyShareHolding: ShareHolding = {
  companyName: "",
  isinNumber: "",
  folioNumber: "",
  certificateNumber: "",
  distinctiveNumber: { from: "", to: "" },
  quantity: 0,
  faceValue: 0,
  purchaseDate: new Date().toISOString().slice(0, 10),
};

export default function ClientProfileDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientProfile | null>(
    location.state?.client || null
  );
  const [loading, setLoading] = useState<boolean>(!location.state?.client);
  const [error, setError] = useState<string | null>(null);

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] =
    useState<ShareHolding>(emptyShareHolding);
  const [reviewMode, setReviewMode] = useState(false);

  // Fetch client from backend if not passed in location.state
  useEffect(() => {
    if (!client && id) {
      setLoading(true);
      fetch(`http://localhost:8080/api/client-profiles/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch client profile");
          return res.json();
        })
        .then((data) => {
          setClient(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id, client]);

  // Add new company
  const handleAddCompany = () => {
    if (!newCompany.companyName || !newCompany.isinNumber) {
      alert("Company Name and ISIN Number are required");
      return;
    }

    const updatedClient = {
      ...client!,
      shareHoldings: [...client!.shareHoldings, newCompany],
    };

    // In a real app, save to backend
    console.log("Adding new company:", newCompany);
    alert("Company added successfully! (In real app, save to DB)");

    setClient(updatedClient);
    setNewCompany(emptyShareHolding);
    setShowAddCompany(false);
  };

  // Utils
  const totalShares = client?.shareHoldings.reduce(
    (sum, holding) => sum + (holding.quantity || 0),
    0
  ) || 0;

  const totalInvestment = client?.shareHoldings.reduce(
    (sum, holding) =>
      sum + (holding.quantity || 0) * (holding.faceValue || 0),
    0
  ) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Suspended":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (value: number | undefined) =>
    value != null
      ? value.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        })
      : "—";

  const formatNumber = (value: number | undefined) =>
    value != null ? value.toLocaleString() : "—";

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-IN");
    } catch {
      return "—";
    }
  };

  const getSafeValue = (value: any, defaultValue: any = "—") =>
    value !== undefined && value !== null && value !== "" ? value : defaultValue;

  const getReviewStatus = (holding: ShareHolding) => {
    const hasRequired = holding.companyName && holding.isinNumber && holding.quantity > 0;
    const hasComplete = holding.folioNumber && holding.certificateNumber;

    if (hasRequired && hasComplete) return "approved";
    if (hasRequired) return "pending";
    return "rejected";
  };

  const getReviewBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Needs Info
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Render states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading client profile...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error || "Client not found"}</p>
          <Button onClick={() => navigate("/profiles")} className="mt-4">
            Back to Client List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/profiles")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Client Profile Details</h1>
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

      {/* Review banner */}
      {reviewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                Review Mode Active
              </span>
              <span className="text-blue-600">
                • Viewing all holdings with review status
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {client.shareHoldings.length} Companies
            </Badge>
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
          <div>
            <label className="text-sm text-muted-foreground">Shareholder</label>
            <div className="text-lg font-semibold">
              {getSafeValue(client.shareholderName.name1)}
              {client.shareholderName.name2 &&
                `, ${client.shareholderName.name2}`}
              {client.shareholderName.name3 &&
                `, ${client.shareholderName.name3}`}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">PAN</label>
            <div className="text-lg font-mono font-semibold">
              {getSafeValue(client.panNumber)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Demat</label>
            <div className="text-lg font-semibold">
              {getSafeValue(client.dematAccountNumber)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Date</label>
            <div className="text-lg">{formatDate(client.currentDate)}</div>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-muted-foreground">Address</label>
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
          <div>
            <label className="text-sm text-muted-foreground">Bank</label>
            <div className="text-lg font-semibold">
              {getSafeValue(client.bankDetails?.bankName)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Account</label>
            <div className="text-lg font-mono">
              {getSafeValue(client.bankDetails?.bankNumber)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Branch</label>
            <div className="text-lg">
              {getSafeValue(client.bankDetails?.branch)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">IFSC</label>
            <div className="text-lg font-mono font-semibold">
              {getSafeValue(client.bankDetails?.ifscCode)}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">MICR</label>
            <div className="text-lg font-mono">
              {getSafeValue(client.bankDetails?.micrCode)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Holdings */}
      <Card>
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <CardTitle>Share Holdings Summary</CardTitle>
            <Dialog open={showAddCompany} onOpenChange={setShowAddCompany}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <Label>Company Name *</Label>
                    <Input
                      value={newCompany.companyName}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, companyName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>ISIN Number *</Label>
                    <Input
                      value={newCompany.isinNumber}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          isinNumber: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Folio Number</Label>
                    <Input
                      value={newCompany.folioNumber}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          folioNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Certificate No</Label>
                    <Input
                      value={newCompany.certificateNumber}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          certificateNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      value={newCompany.quantity}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Face Value *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newCompany.faceValue}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          faceValue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Distinctive From</Label>
                    <Input
                      value={newCompany.distinctiveNumber.from}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          distinctiveNumber: {
                            ...newCompany.distinctiveNumber,
                            from: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Distinctive To</Label>
                    <Input
                      value={newCompany.distinctiveNumber.to}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          distinctiveNumber: {
                            ...newCompany.distinctiveNumber,
                            to: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Purchase Date</Label>
                    <Input
                      type="date"
                      value={newCompany.purchaseDate}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          purchaseDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddCompany(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCompany}>Add Company</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex space-x-4 text-sm text-muted-foreground">
            <span>Total Companies: {client.shareHoldings.length}</span>
            <span>Total Shares: {formatNumber(totalShares)}</span>
            <span className="font-semibold">
              Total Investment: {formatCurrency(totalInvestment)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 border">#</th>
                  <th className="px-4 py-3 border">Company</th>
                  <th className="px-4 py-3 border">ISIN</th>
                  {reviewMode && <th className="px-4 py-3 border">Status</th>}
                  <th className="px-4 py-3 border">Folio</th>
                  <th className="px-4 py-3 border">Cert No</th>
                  <th className="px-4 py-3 border text-right">Qty</th>
                  <th className="px-4 py-3 border text-right">Face Value</th>
                  <th className="px-4 py-3 border text-right">Total Value</th>
                  <th className="px-4 py-3 border">Purchase</th>
                  <th className="px-4 py-3 border">Distinctive</th>
                </tr>
              </thead>
              <tbody>
                {client.shareHoldings.map((h, i) => {
                  const totalVal = (h.quantity || 0) * (h.faceValue || 0);
                  const status = getReviewStatus(h);
                  return (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 border">{i + 1}</td>
                      <td className="px-4 py-3 border font-medium">
                        {getSafeValue(h.companyName)}
                      </td>
                      <td className="px-4 py-3 border font-mono">
                        {getSafeValue(h.isinNumber)}
                      </td>
                      {reviewMode && (
                        <td className="px-4 py-3 border">
                          {getReviewBadge(status)}
                        </td>
                      )}
                      <td className="px-4 py-3 border">
                        {getSafeValue(h.folioNumber)}
                      </td>
                      <td className="px-4 py-3 border">
                        {getSafeValue(h.certificateNumber)}
                      </td>
                      <td className="px-4 py-3 border text-right">
                        {formatNumber(h.quantity)}
                      </td>
                      <td className="px-4 py-3 border text-right">
                        {formatCurrency(h.faceValue)}
                      </td>
                      <td className="px-4 py-3 border text-right font-semibold">
                        {formatCurrency(totalVal)}
                      </td>
                      <td className="px-4 py-3 border">
                        {formatDate(h.purchaseDate)}
                      </td>
                      <td className="px-4 py-3 border">
                        {h.distinctiveNumber.from || h.distinctiveNumber.to
                          ? `${h.distinctiveNumber.from} - ${h.distinctiveNumber.to}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
                {client.shareHoldings.length === 0 && (
                  <tr>
                    <td
                      colSpan={reviewMode ? 11 : 10}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No share holdings found. Add a company to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
