import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { api, Paginated } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Eye } from "lucide-react";
import Table from "@/components/Table";

interface BankDetails { bankNumber?: string; branch?: string; bankName?: string; ifscCode?: string; micrCode?: string }
interface Distinctive { from?: string; to?: string }
interface Dividend { amount?: number; date?: string }
interface ShareholderName { name1: string; name2?: string; name3?: string }

interface ShareHolding {
  companyName: string;
  isinNumber: string;
  folioNumber: string;
  certificateNumber: string;
  distinctiveNumber: Distinctive;
  quantity: number;
  faceValue: number;
  purchaseDate?: string;
}

export interface ClientProfile {
  _id: string;
  shareholderName: ShareholderName;
  panNumber: string;
  aadhaarNumber?: string;
  address?: string;
  bankDetails?: BankDetails;
  dematAccountNumber?: string;
  dematCreatedWith?: string;
  dematCreatedWithPerson?: string; // New field
  shareHoldings: ShareHolding[];
  currentDate?: string;
  status: "Active" | "Closed" | "Pending" | "Suspended";
  remarks?: string;
  dividend?: Dividend;
}

type Payload = Omit<ClientProfile, "_id">;

export default function ClientProfiles() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const emptyShareHolding: ShareHolding = {
    companyName: "",
    isinNumber: "",
    folioNumber: "",
    certificateNumber: "",
    distinctiveNumber: { from: "", to: "" },
    quantity: 0,
    faceValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10)
  };

  const empty: Payload = {
    shareholderName: { name1: "", name2: "", name3: "" },
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    bankDetails: { bankNumber: "", branch: "", bankName: "", ifscCode: "", micrCode: "" },
    dematAccountNumber: "",
    dematCreatedWith: "",
    dematCreatedWithPerson: "", // New field
    shareHoldings: [emptyShareHolding],
    currentDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    remarks: "",
    dividend: { amount: 0, date: new Date().toISOString().slice(0, 10) },
  };

  const [form, setForm] = useState<Payload>(empty);
  const [editing, setEditing] = useState<ClientProfile | null>(null);

  const { data, isFetching } = useQuery<Paginated<ClientProfile>>({
    queryKey: ["client-profiles", page, q],
    queryFn: async () => {
      const response = await api.get<any>("/client-profiles", {
        params: { page, limit: 10, q }
      });

      const mappedData = {
        ...response.data,
        data: response.data.data.map((item: any) => ({
          ...item,
          shareHoldings: item.companies || []
        }))
      };

      return mappedData;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Payload) => {
      const backendPayload = {
        ...payload,
        companies: payload.shareHoldings
      };
      return (await api.post<ClientProfile>("/client-profiles", backendPayload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-profiles"] });
      setOpen(false);
      setForm(empty);
      toast.success("Client profile created successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to create client profile: ${error.response?.data?.message || error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: ClientProfile) => {
      const backendPayload = {
        ...payload,
        companies: payload.shareHoldings
      };
      return (await api.put<ClientProfile>(`/client-profiles/${payload._id}`, backendPayload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-profiles"] });
      setEditing(null);
      toast.success("Client profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update client profile: ${error.response?.data?.message || error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/client-profiles/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-profiles"] });
      toast.success("Client profile deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete client profile: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleViewDetails = (client: ClientProfile) => {
    navigate(`/client-profiles/${client._id}`, { state: { client } });
  };

  const addShareHolding = () => {
    setForm(f => ({
      ...f,
      shareHoldings: [...f.shareHoldings, { ...emptyShareHolding }]
    }));
  };

  const removeShareHolding = (index: number) => {
    setForm(f => ({
      ...f,
      shareHoldings: f.shareHoldings.filter((_, i) => i !== index)
    }));
  };

  const updateShareHolding = (index: number, field: keyof ShareHolding, value: any) => {
    setForm(f => ({
      ...f,
      shareHoldings: f.shareHoldings.map((holding, i) =>
        i === index ? { ...holding, [field]: value } : holding
      )
    }));
  };

  const updateEditingShareHolding = (index: number, field: keyof ShareHolding, value: any) => {
    if (!editing) return;

    setEditing({
      ...editing,
      shareHoldings: editing.shareHoldings.map((holding, i) =>
        i === index ? { ...holding, [field]: value } : holding
      )
    });
  };

  const addEditingShareHolding = () => {
    if (!editing) return;

    setEditing({
      ...editing,
      shareHoldings: [...editing.shareHoldings, { ...emptyShareHolding }]
    });
  };

  const removeEditingShareHolding = (index: number) => {
    if (!editing) return;

    setEditing({
      ...editing,
      shareHoldings: editing.shareHoldings.filter((_, i) => i !== index)
    });
  };

  const totalInvestment = useMemo(() =>
    form.shareHoldings.reduce((sum, holding) => sum + (holding.quantity * holding.faceValue), 0)
    , [form.shareHoldings]);

  const columns = useMemo(() => [
    {
      key: "name",
      header: "Shareholder Name",
      render: (r: ClientProfile) => (
        editing?._id === r._id ? (
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={editing.shareholderName.name1}
              onChange={(e) => setEditing({
                ...editing,
                shareholderName: { ...editing.shareholderName, name1: e.target.value }
              })}
            />
            <Input
              value={editing.shareholderName.name2 || ""}
              onChange={(e) => setEditing({
                ...editing,
                shareholderName: { ...editing.shareholderName, name2: e.target.value }
              })}
            />
            <Input
              value={editing.shareholderName.name3 || ""}
              onChange={(e) => setEditing({
                ...editing,
                shareholderName: { ...editing.shareholderName, name3: e.target.value }
              })}
            />
          </div>
        ) : (
          <div>
            {r.shareholderName.name1}
            {r.shareholderName.name2 ? `, ${r.shareholderName.name2}` : ""}
            {r.shareholderName.name3 ? `, ${r.shareholderName.name3}` : ""}
          </div>
        )
      )
    },
    {
      key: "panNumber",
      header: "PAN",
      render: (r: ClientProfile) => editing?._id === r._id ?
        <Input
          value={editing.panNumber}
          onChange={(e) => setEditing({ ...editing, panNumber: e.target.value.toUpperCase() })}
        /> :
        r.panNumber
    },
    {
      key: "aadhaarNumber",
      header: "Aadhaar",
      render: (r: ClientProfile) => editing?._id === r._id ?
        <Input
          value={editing.aadhaarNumber || ""}
          onChange={(e) => setEditing({ 
            ...editing, 
            aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12)
          })}
        /> :
        (r.aadhaarNumber || "—")
    },
    {
      key: "dematAccountNumber",
      header: "Demat Account",
      render: (r: ClientProfile) => editing?._id === r._id ?
        <Input
          value={editing.dematAccountNumber || ""}
          onChange={(e) => setEditing({ ...editing, dematAccountNumber: e.target.value })}
        /> :
        (r.dematAccountNumber || "—")
    },
    {
      key: "dematCreatedWithPerson",
      header: "DMAT Created By",
      render: (r: ClientProfile) => editing?._id === r._id ?
        <Input
          value={editing.dematCreatedWithPerson || ""}
          onChange={(e) => setEditing({ ...editing, dematCreatedWithPerson: e.target.value })}
        /> :
        (r.dematCreatedWithPerson || "—")
    },
    {
      key: "companies",
      header: "Companies",
      render: (r: ClientProfile) => (
        <div className="text-sm">
          {r.shareHoldings.slice(0, 2).map((holding, idx) => (
            <div key={idx} className="truncate">
              {holding.companyName || "—"}
            </div>
          ))}
          {r.shareHoldings.length > 2 && (
            <div className="text-muted-foreground">
              +{r.shareHoldings.length - 2} more
            </div>
          )}
        </div>
      )
    },
    {
      key: "totalShares",
      header: "Total Shares",
      render: (r: ClientProfile) => (
        <div>
          {r.shareHoldings.reduce((sum, holding) => sum + holding.quantity, 0).toLocaleString()}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (r: ClientProfile) => editing?._id === r._id ? (
        <Select
          value={editing.status}
          onValueChange={(v) => setEditing({ ...editing, status: v as ClientProfile["status"] })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      ) : r.status
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: ClientProfile) => editing?._id === r._id ? (
        <div className="space-x-2">
          <Button size="sm" onClick={() => updateMutation.mutate(editing)} disabled={updateMutation.isPending}>
            Save
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDetails(r)}
            className="flex items-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(r._id)} disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </div>
      ),
      className: "w-[200px]"
    },
  ], [editing, updateMutation.isPending, deleteMutation.isPending, handleViewDetails]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Client Profiles</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name/PAN/Aadhaar/company"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-64"
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Client Profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Client Information */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Client Information</h3>

                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Name 1 *</Label>
                      <Input
                        value={form.shareholderName.name1}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          shareholderName: { ...f.shareholderName, name1: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Name 2</Label>
                      <Input
                        value={form.shareholderName.name2}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          shareholderName: { ...f.shareholderName, name2: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Name 3</Label>
                      <Input
                        value={form.shareholderName.name3}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          shareholderName: { ...f.shareholderName, name3: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>PAN *</Label>
                    <Input
                      value={form.panNumber}
                      onChange={(e) => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Aadhaar Number</Label>
                    <Input
                      value={form.aadhaarNumber}
                      onChange={(e) => setForm(f => ({ 
                        ...f, 
                        aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12)
                      }))}
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Demat Account Number</Label>
                    <Input
                      value={form.dematAccountNumber}
                      onChange={(e) => setForm(f => ({ ...f, dematAccountNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Demat Account Created With</Label>
                    <Input
                      value={form.dematCreatedWith}
                      onChange={(e) => setForm(f => ({ ...f, dematCreatedWith: e.target.value }))}
                      placeholder="e.g., NSDL, CDSL, Bank Name"
                    />
                  </div>

                  {/* New DMAT Created With Person Field */}
                  <div className="space-y-1">
                    <Label>DMAT Account Created By (Person)</Label>
                    <Input
                      value={form.dematCreatedWithPerson}
                      onChange={(e) => setForm(f => ({ ...f, dematCreatedWithPerson: e.target.value }))}
                      placeholder="Name of the person who created DMAT"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Address</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Bank Details */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Bank Details</h3>

                  <div className="space-y-1">
                    <Label>Bank Number</Label>
                    <Input
                      value={form.bankDetails?.bankNumber}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        bankDetails: { ...(f.bankDetails || {}), bankNumber: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Branch</Label>
                    <Input
                      value={form.bankDetails?.branch}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        bankDetails: { ...(f.bankDetails || {}), branch: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Bank Name</Label>
                    <Input
                      value={form.bankDetails?.bankName}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        bankDetails: { ...(f.bankDetails || {}), bankName: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>IFSC Code</Label>
                    <Input
                      value={form.bankDetails?.ifscCode}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        bankDetails: { ...(f.bankDetails || {}), ifscCode: e.target.value.toUpperCase() }
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>MICR Code</Label>
                    <Input
                      value={form.bankDetails?.micrCode}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        bankDetails: { ...(f.bankDetails || {}), micrCode: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                {/* Share Holdings Section */}
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Share Holdings</h3>
                    <Button type="button" size="sm" onClick={addShareHolding}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Company
                    </Button>
                  </div>

                  {form.shareHoldings.map((holding, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 w-6 h-6 p-0"
                        onClick={() => removeShareHolding(index)}
                        disabled={form.shareHoldings.length === 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>

                      <div className="col-span-2 font-medium text-sm text-muted-foreground">
                        Company #{index + 1}
                      </div>

                      <div className="space-y-1">
                        <Label>Company Name *</Label>
                        <Input
                          value={holding.companyName}
                          onChange={(e) => updateShareHolding(index, 'companyName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>ISIN Number *</Label>
                        <Input
                          value={holding.isinNumber}
                          onChange={(e) => updateShareHolding(index, 'isinNumber', e.target.value.toUpperCase())}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Folio Number</Label>
                        <Input
                          value={holding.folioNumber}
                          onChange={(e) => updateShareHolding(index, 'folioNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Certificate Number</Label>
                        <Input
                          value={holding.certificateNumber}
                          onChange={(e) => updateShareHolding(index, 'certificateNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={holding.quantity}
                          onChange={(e) => updateShareHolding(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Face Value *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={holding.faceValue}
                          onChange={(e) => updateShareHolding(index, 'faceValue', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Distinctive From</Label>
                        <Input
                          value={holding.distinctiveNumber.from}
                          onChange={(e) => updateShareHolding(index, 'distinctiveNumber', {
                            ...holding.distinctiveNumber,
                            from: e.target.value
                          })}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Distinctive To</Label>
                        <Input
                          value={holding.distinctiveNumber.to}
                          onChange={(e) => updateShareHolding(index, 'distinctiveNumber', {
                            ...holding.distinctiveNumber,
                            to: e.target.value
                          })}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Purchase Date</Label>
                        <Input
                          type="date"
                          value={holding.purchaseDate}
                          onChange={(e) => updateShareHolding(index, 'purchaseDate', e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label>Total Value</Label>
                        <Input
                          value={(holding.quantity * holding.faceValue).toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                          disabled
                          className="font-semibold"
                        />
                      </div>
                    </div>
                  ))}

                  {form.shareHoldings.length > 0 && (
                    <div className="p-4 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Investment:</span>
                        <span>
                          {totalInvestment.toLocaleString('en-IN', {
                            style: 'currency',
                            currency: 'INR'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <h3 className="col-span-2 font-semibold">Additional Information</h3>

                  <div className="space-y-1">
                    <Label>Current Date</Label>
                    <Input
                      type="date"
                      value={form.currentDate as string}
                      onChange={(e) => setForm(f => ({ ...f, currentDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm(f => ({ ...f, status: v as ClientProfile["status"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label>Remarks</Label>
                    <Input
                      value={form.remarks}
                      onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Dividend Amount</Label>
                    <Input
                      type="number"
                      value={form.dividend?.amount ?? 0}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        dividend: { ...(f.dividend || {}), amount: Number(e.target.value) }
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Dividend Date</Label>
                    <Input
                      type="date"
                      value={form.dividend?.date as string}
                      onChange={(e) => setForm(f => ({
                        ...f,
                        dividend: { ...(f.dividend || {}), date: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createMutation.mutate(form)}
                    disabled={createMutation.isPending || !form.shareholderName.name1 || !form.panNumber}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Client Profile"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Client Profiles</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table
            columns={columns as any}
            data={(data?.data ?? [])}
            empty={isFetching ? "Loading..." : "No profiles found"}
          />
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>
              Page {data?.page ?? page} of {data ? Math.ceil((data.total ?? 0) / (data.limit || 10)) : 1}
              {data && ` (${data.total} total clients)`}
            </div>
            <div className="space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!!data && page >= Math.ceil((data.total ?? 0) / (data.limit || 10)) || isFetching}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal for Client Profile */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Edit Client Profile</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Client Information */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <h3 className="col-span-2 font-semibold">Client Information</h3>

                <div className="col-span-2 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Name 1 *</Label>
                    <Input
                      value={editing.shareholderName.name1}
                      onChange={(e) => setEditing({
                        ...editing,
                        shareholderName: { ...editing.shareholderName, name1: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Name 2</Label>
                    <Input
                      value={editing.shareholderName.name2 || ""}
                      onChange={(e) => setEditing({
                        ...editing,
                        shareholderName: { ...editing.shareholderName, name2: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Name 3</Label>
                    <Input
                      value={editing.shareholderName.name3 || ""}
                      onChange={(e) => setEditing({
                        ...editing,
                        shareholderName: { ...editing.shareholderName, name3: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>PAN *</Label>
                  <Input
                    value={editing.panNumber}
                    onChange={(e) => setEditing({ ...editing, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Aadhaar Number</Label>
                  <Input
                    value={editing.aadhaarNumber || ""}
                    onChange={(e) => setEditing({ 
                      ...editing, 
                      aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12)
                    })}
                    placeholder="12-digit Aadhaar number"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Demat Account Number</Label>
                  <Input
                    value={editing.dematAccountNumber || ""}
                    onChange={(e) => setEditing({ ...editing, dematAccountNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Demat Account Created With</Label>
                  <Input
                    value={editing.dematCreatedWith || ""}
                    onChange={(e) => setEditing({ ...editing, dematCreatedWith: e.target.value })}
                    placeholder="e.g., NSDL, CDSL, Bank Name"
                  />
                </div>

                {/* New DMAT Created With Person Field in Edit */}
                <div className="space-y-1">
                  <Label>DMAT Account Created By (Person)</Label>
                  <Input
                    value={editing.dematCreatedWithPerson || ""}
                    onChange={(e) => setEditing({ ...editing, dematCreatedWithPerson: e.target.value })}
                    placeholder="Name of the person who created DMAT"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>Address</Label>
                  <Input
                    value={editing.address || ""}
                    onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <h3 className="col-span-2 font-semibold">Bank Details</h3>

                <div className="space-y-1">
                  <Label>Bank Number</Label>
                  <Input
                    value={editing.bankDetails?.bankNumber || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      bankDetails: { ...(editing.bankDetails || {}), bankNumber: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Branch</Label>
                  <Input
                    value={editing.bankDetails?.branch || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      bankDetails: { ...(editing.bankDetails || {}), branch: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Bank Name</Label>
                  <Input
                    value={editing.bankDetails?.bankName || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      bankDetails: { ...(editing.bankDetails || {}), bankName: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>IFSC Code</Label>
                  <Input
                    value={editing.bankDetails?.ifscCode || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      bankDetails: { ...(editing.bankDetails || {}), ifscCode: e.target.value.toUpperCase() }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>MICR Code</Label>
                  <Input
                    value={editing.bankDetails?.micrCode || ""}
                    onChange={(e) => setEditing({
                      ...editing,
                      bankDetails: { ...(editing.bankDetails || {}), micrCode: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Share Holdings Edit Section */}
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Share Holdings</h3>
                  <Button type="button" size="sm" onClick={addEditingShareHolding}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Company
                  </Button>
                </div>

                {editing.shareHoldings.map((holding, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4 p-4 mb-4 border rounded-lg relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 w-6 h-6 p-0"
                      onClick={() => removeEditingShareHolding(index)}
                      disabled={editing.shareHoldings.length === 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>

                    <div className="col-span-2 font-medium text-sm text-muted-foreground">
                      Company #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <Label>Company Name</Label>
                      <Input
                        value={holding.companyName}
                        onChange={(e) => updateEditingShareHolding(index, 'companyName', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>ISIN Number</Label>
                      <Input
                        value={holding.isinNumber}
                        onChange={(e) => updateEditingShareHolding(index, 'isinNumber', e.target.value.toUpperCase())}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Folio Number</Label>
                      <Input
                        value={holding.folioNumber}
                        onChange={(e) => updateEditingShareHolding(index, 'folioNumber', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Certificate Number</Label>
                      <Input
                        value={holding.certificateNumber}
                        onChange={(e) => updateEditingShareHolding(index, 'certificateNumber', e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={holding.quantity}
                        onChange={(e) => updateEditingShareHolding(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Face Value</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={holding.faceValue}
                        onChange={(e) => updateEditingShareHolding(index, 'faceValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Distinctive From</Label>
                      <Input
                        value={holding.distinctiveNumber.from || ""}
                        onChange={(e) => updateEditingShareHolding(index, 'distinctiveNumber', {
                          ...holding.distinctiveNumber,
                          from: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Distinctive To</Label>
                      <Input
                        value={holding.distinctiveNumber.to || ""}
                        onChange={(e) => updateEditingShareHolding(index, 'distinctiveNumber', {
                          ...holding.distinctiveNumber,
                          to: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Purchase Date</Label>
                      <Input
                        type="date"
                        value={holding.purchaseDate || ""}
                        onChange={(e) => updateEditingShareHolding(index, 'purchaseDate', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <h3 className="col-span-2 font-semibold">Additional Information</h3>

                <div className="space-y-1">
                  <Label>Current Date</Label>
                  <Input
                    type="date"
                    value={editing.currentDate as string}
                    onChange={(e) => setEditing({ ...editing, currentDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={editing.status}
                    onValueChange={(v) => setEditing({ ...editing, status: v as ClientProfile["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>Remarks</Label>
                  <Input
                    value={editing.remarks || ""}
                    onChange={(e) => setEditing({ ...editing, remarks: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Dividend Amount</Label>
                  <Input
                    type="number"
                    value={editing.dividend?.amount ?? 0}
                    onChange={(e) => setEditing({
                      ...editing,
                      dividend: { ...(editing.dividend || {}), amount: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Dividend Date</Label>
                  <Input
                    type="date"
                    value={editing.dividend?.date as string}
                    onChange={(e) => setEditing({
                      ...editing,
                      dividend: { ...(editing.dividend || {}), date: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => updateMutation.mutate(editing)}
                  disabled={updateMutation.isPending || !editing.shareholderName.name1 || !editing.panNumber}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}