import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Clock, CheckCircle, XCircle, CreditCard, Loader2, AlertTriangle, Wallet } from "lucide-react";

type PayoutRequest = {
  id: string;
  escrowId: string;
  amount: string;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  paymentMethod?: string;
  notes?: string;
  adminNote?: string;
  paidAt?: string;
  txHash?: string;
  createdAt: string;
  escrow?: any;
  wallet?: any;
  bankAccount?: any;
  payeeType?: "seller" | "agent";
  agentId?: string;
  seller?: any;
  agent?: any;
};

const STATUS_STYLE: Record<string, { color: string; icon: any; label: string }> = {
  PENDING:  { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock,        label: "Pending Review" },
  APPROVED: { color: "bg-blue-100 text-blue-800 border-blue-200",       icon: CheckCircle,  label: "Approved" },
  REJECTED: { color: "bg-red-100 text-red-800 border-red-200",          icon: XCircle,      label: "Rejected" },
  PAID:     { color: "bg-green-100 text-green-800 border-green-200",     icon: CreditCard,   label: "Paid" },
};

// ── Seller view ───────────────────────────────────────────────────────────────

type SellerPayoutManagerProps = {
  escrows: any[]; // released/delivered escrows
};

export function SellerPayoutManager({ escrows }: SellerPayoutManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ escrowId: "", paymentMethod: "bank", walletId: "", bankAccountId: "", notes: "" });

  const { data: requests = [], isLoading } = useQuery<PayoutRequest[]>({ queryKey: ["/api/payout-requests"] });
  const { data: wallets = [] } = useQuery<any[]>({ queryKey: ["/api/wallets"] });
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/payout-requests", data),
    onSuccess: () => {
      toast({ title: "Payout request submitted!", description: "Admin will review and process it shortly." });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Failed to submit request", description: e.message, variant: "destructive" }),
  });

  // Escrows eligible for payout (RELEASED or DELIVERED, no existing pending/approved request)
  const requestedEscrowIds = new Set(requests.filter(r => ["PENDING", "APPROVED"].includes(r.status)).map(r => r.escrowId));
  const eligibleEscrows = escrows.filter(e => ["RELEASED", "DELIVERED"].includes(e.status) && !requestedEscrowIds.has(e.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.escrowId) { toast({ title: "Please select a transaction", variant: "destructive" }); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Payout Requests</h3>
          <p className="text-sm text-slate-500">Request your earnings for completed transactions</p>
        </div>
        {eligibleEscrows.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Select Transaction</label>
                  <Select onValueChange={v => setForm(f => ({ ...f, escrowId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a completed transaction" /></SelectTrigger>
                    <SelectContent>
                      {eligibleEscrows.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.listing?.title ?? e.id.slice(0, 8)} — {e.sellerNetAmount ?? e.amount} {e.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Crypto Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.paymentMethod === "bank" && (
                  <div>
                    <label className="text-sm font-medium">Bank Account</label>
                    <Select onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bankAccounts.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Add a bank account in Account Settings first.</p>}
                  </div>
                )}
                {form.paymentMethod === "crypto" && (
                  <div>
                    <label className="text-sm font-medium">Crypto Wallet</label>
                    <Select onValueChange={v => setForm(f => ({ ...f, walletId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                      <SelectContent>
                        {wallets.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>{w.type} — {w.address.slice(0, 16)}…</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {wallets.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Add a crypto wallet in Account Settings first.</p>}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea className="mt-1 text-sm" rows={2} placeholder="Any special instructions..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No payout requests yet</p>
            {eligibleEscrows.length > 0
              ? <p className="text-slate-400 text-sm mt-1">You have {eligibleEscrows.length} completed transaction(s) ready for payout.</p>
              : <p className="text-slate-400 text-sm mt-1">Payouts become available after transactions are delivered and released.</p>
            }
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.PENDING;
            const Icon = s.icon;
            return (
              <Card key={req.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900">{Number(req.amount).toLocaleString()} {req.currency}</span>
                        <Badge className={`text-xs border ${s.color}`}>
                          <Icon className="w-3 h-3 mr-1" />{s.label}
                        </Badge>
                        {req.paymentMethod && <Badge variant="outline" className="text-xs capitalize">{req.paymentMethod}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">Transaction: {req.escrow?.listing?.title ?? req.escrowId.slice(0, 12)}</p>
                      {req.bankAccount && <p className="text-xs text-slate-500">{req.bankAccount.bankName} · {req.bankAccount.accountNumber}</p>}
                      {req.wallet && <p className="text-xs text-slate-500">{req.wallet.type} · {req.wallet.address.slice(0, 16)}…</p>}
                      {req.adminNote && (
                        <p className={`text-xs mt-1.5 px-2 py-1 rounded ${req.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                          Admin: {req.adminNote}
                        </p>
                      )}
                      {req.txHash && <p className="text-xs text-green-700 mt-1">TX: <span className="font-mono">{req.txHash}</span></p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Admin view ────────────────────────────────────────────────────────────────

export function AdminPayoutManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "", adminNote: "", txHash: "" });

  const { data: requests = [], isLoading, refetch } = useQuery<PayoutRequest[]>({ queryKey: ["/api/admin/payout-requests"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/admin/payout-requests/${id}`, data),
    onSuccess: () => {
      toast({ title: "Payout request updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      setReviewingId(null);
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const filtered = statusFilter === "ALL" ? requests : requests.filter(r => r.status === statusFilter);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            Payout Requests
            {pendingCount > 0 && <Badge className="bg-red-500 text-white">{pendingCount} pending</Badge>}
          </h3>
          <p className="text-sm text-slate-500">Review, approve, and process seller and shipping agent payouts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              {s}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={() => refetch()}><Loader2 className="w-4 h-4" /></Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No payout requests {statusFilter !== "ALL" ? `with status ${statusFilter}` : "yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.PENDING;
            const Icon = s.icon;
            const isReviewing = reviewingId === req.id;
            return (
              <Card key={req.id} className={`border ${req.status === "PENDING" ? "border-amber-200" : "border-slate-200"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-lg">{Number(req.amount).toLocaleString()} {req.currency}</span>
                        <Badge className={`text-xs border ${s.color}`}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                        {req.paymentMethod && <Badge variant="outline" className="text-xs capitalize">{req.paymentMethod}</Badge>}
                      </div>
                      <p className="text-sm text-slate-700">
                        {req.payeeType === "agent" ? (
                          <>
                            <Badge variant="outline" className="text-xs mr-1.5 align-middle">Shipping Agent</Badge>
                            <span className="font-medium">{req.agent?.username ?? req.agent?.email ?? "Unknown"}</span>
                          </>
                        ) : (
                          <>
                            Seller: <span className="font-medium">{req.seller?.username ?? req.seller?.email ?? "Unknown"}</span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-slate-600">Transaction: {(req as any).escrow?.listing?.title ?? req.escrowId.slice(0, 12)}</p>
                      {req.bankAccount && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 inline-block">
                          🏦 {req.bankAccount.bankName} · {req.bankAccount.accountName} · {req.bankAccount.accountNumber}
                          {req.bankAccount.swiftCode && ` · SWIFT: ${req.bankAccount.swiftCode}`}
                        </div>
                      )}
                      {req.wallet && (
                        <div className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 inline-block">
                          💎 {req.wallet.type} · {req.wallet.address}
                        </div>
                      )}
                      {req.notes && <p className="text-xs text-slate-500 italic">Note: {req.notes}</p>}
                      {req.adminNote && <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">Admin note: {req.adminNote}</p>}
                      {req.txHash && <p className="text-xs text-green-700">TX: <span className="font-mono">{req.txHash}</span></p>}
                      {req.paidAt && <p className="text-xs text-slate-400">Paid: {new Date(req.paidAt).toLocaleDateString()}</p>}
                      <p className="text-xs text-slate-400">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    {req.status === "PENDING" || req.status === "APPROVED" ? (
                      <div className="flex-shrink-0">
                        {!isReviewing ? (
                          <Button size="sm" variant="outline" onClick={() => { setReviewingId(req.id); setReviewForm({ status: "", adminNote: "", txHash: "" }); }}>
                            Review
                          </Button>
                        ) : (
                          <div className="space-y-2 min-w-48">
                            <Select onValueChange={v => setReviewForm(f => ({ ...f, status: v }))}>
                              <SelectTrigger className="text-sm"><SelectValue placeholder="Set status" /></SelectTrigger>
                              <SelectContent>
                                {req.status === "PENDING" && <SelectItem value="APPROVED">✅ Approve</SelectItem>}
                                {req.status === "PENDING" && <SelectItem value="REJECTED">❌ Reject</SelectItem>}
                                {(req.status === "APPROVED" || req.status === "PENDING") && <SelectItem value="PAID">💰 Mark Paid</SelectItem>}
                              </SelectContent>
                            </Select>
                            {reviewForm.status === "PAID" && (
                              <Input className="text-xs" placeholder="TX hash / reference (optional)" value={reviewForm.txHash} onChange={e => setReviewForm(f => ({ ...f, txHash: e.target.value }))} />
                            )}
                            <Input className="text-xs" placeholder="Admin note (optional)" value={reviewForm.adminNote} onChange={e => setReviewForm(f => ({ ...f, adminNote: e.target.value }))} />
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setReviewingId(null)}>Cancel</Button>
                              <Button
                                size="sm"
                                className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                                disabled={!reviewForm.status || updateMutation.isPending}
                                onClick={() => updateMutation.mutate({ id: req.id, data: reviewForm })}
                              >
                                {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Shipping agent view ──────────────────────────────────────────────────────

type AgentPayoutManagerProps = {
  shipments: any[]; // agent's shipments, each enriched with .escrow
};

export function AgentPayoutManager({ shipments }: AgentPayoutManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ escrowId: "", paymentMethod: "bank", walletId: "", bankAccountId: "", notes: "" });

  const { data: requests = [], isLoading } = useQuery<PayoutRequest[]>({ queryKey: ["/api/payout-requests"] });
  const { data: wallets = [] } = useQuery<any[]>({ queryKey: ["/api/wallets"] });
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/payout-requests", data),
    onSuccess: () => {
      toast({ title: "Payout request submitted!", description: "Admin will review and process it shortly." });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Failed to submit request", description: e.message, variant: "destructive" }),
  });

  // Shipments whose escrow is DELIVERED/RELEASED, has a positive shipping-agent fee, and no existing pending/approved request
  const requestedEscrowIds = new Set(requests.filter(r => ["PENDING", "APPROVED"].includes(r.status)).map(r => r.escrowId));
  const eligibleEscrows = shipments
    .map(s => s.escrow)
    .filter((e: any) => e && ["DELIVERED", "RELEASED"].includes(e.status))
    .filter((e: any) => Number(e.shippingAgentFeeAmount) > 0)
    .filter((e: any) => !requestedEscrowIds.has(e.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.escrowId) { toast({ title: "Please select a delivery", variant: "destructive" }); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Earnings & Payouts</h3>
          <p className="text-sm text-slate-500">Request your 75% share of the shipping fee for completed deliveries</p>
        </div>
        {eligibleEscrows.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-1" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Request Payout</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Select Delivery</label>
                  <Select onValueChange={v => setForm(f => ({ ...f, escrowId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a completed delivery" /></SelectTrigger>
                    <SelectContent>
                      {eligibleEscrows.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.id.slice(0, 8)} — {e.shippingAgentFeeAmount} {e.shippingFeeCurrency || e.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="crypto">Crypto Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.paymentMethod === "bank" && (
                  <div>
                    <label className="text-sm font-medium">Bank Account</label>
                    <Select onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bankAccounts.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Add a bank account in Account Settings first.</p>}
                  </div>
                )}
                {form.paymentMethod === "crypto" && (
                  <div>
                    <label className="text-sm font-medium">Crypto Wallet</label>
                    <Select onValueChange={v => setForm(f => ({ ...f, walletId: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select wallet" /></SelectTrigger>
                      <SelectContent>
                        {wallets.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>{w.type} — {w.address.slice(0, 16)}…</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {wallets.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ Add a crypto wallet in Account Settings first.</p>}
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Textarea className="mt-1 text-sm" rows={2} placeholder="Any special instructions..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Submit Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">No payout requests yet</p>
            {eligibleEscrows.length > 0
              ? <p className="text-slate-400 text-sm mt-1">You have {eligibleEscrows.length} completed delivery(ies) ready for payout.</p>
              : <p className="text-slate-400 text-sm mt-1">Payouts become available once a delivery is marked delivered.</p>
            }
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const s = STATUS_STYLE[req.status] ?? STATUS_STYLE.PENDING;
            const Icon = s.icon;
            return (
              <Card key={req.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900">{Number(req.amount).toLocaleString()} {req.currency}</span>
                        <Badge className={`text-xs border ${s.color}`}>
                          <Icon className="w-3 h-3 mr-1" />{s.label}
                        </Badge>
                        {req.paymentMethod && <Badge variant="outline" className="text-xs capitalize">{req.paymentMethod}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">Delivery: {req.escrowId.slice(0, 12)}</p>
                      {req.bankAccount && <p className="text-xs text-slate-500">{req.bankAccount.bankName} · {req.bankAccount.accountNumber}</p>}
                      {req.wallet && <p className="text-xs text-slate-500">{req.wallet.type} · {req.wallet.address.slice(0, 16)}…</p>}
                      {req.adminNote && (
                        <p className={`text-xs mt-1.5 px-2 py-1 rounded ${req.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                          Admin: {req.adminNote}
                        </p>
                      )}
                      {req.txHash && <p className="text-xs text-green-700 mt-1">TX: <span className="font-mono">{req.txHash}</span></p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
