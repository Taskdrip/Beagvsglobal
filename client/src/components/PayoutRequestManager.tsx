import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Plus, Clock, CheckCircle, XCircle, CreditCard,
  Loader2, Wallet, TrendingUp, Gift, Star, ArrowRight,
  BadgeCheck, AlertTriangle, Banknote, RefreshCw, CircleDollarSign,
  PartyPopper, ChevronDown, ChevronUp, ExternalLink, Shield,
  Upload, FileText, Download, Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutRequest = {
  id: string;
  escrowId: string;
  amount: string;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | "COMPLETED";
  paymentMethod?: string;
  notes?: string;
  adminNote?: string;
  paidAt?: string;
  confirmedAt?: string;
  txHash?: string;
  receiptUrl?: string;
  createdAt: string;
  payeeType?: "seller" | "agent";
  agentId?: string;
  sellerId?: string;
  escrow?: any;
  wallet?: any;
  bankAccount?: any;
  seller?: any;
  agent?: any;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string; description: string }> = {
  PENDING:   { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock,          label: "Under Review",     description: "Admin is reviewing your request" },
  APPROVED:  { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: BadgeCheck,     label: "Approved",         description: "Payment is being processed" },
  REJECTED:  { color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: XCircle,        label: "Rejected",         description: "Request was not approved" },
  PAID:      { color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200",icon: CreditCard,    label: "Paid — Confirm?",  description: "Admin sent payment — please confirm receipt" },
  COMPLETED: { color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: CheckCircle,    label: "Completed",        description: "Payment confirmed and transaction closed" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: string | number, currency: string) {
  const n = Number(amount);
  if (isNaN(n)) return `${amount} ${currency}`;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
}

function EarningsBadge({ status, className = "" }: { status: string; className?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Congratulations Banner ───────────────────────────────────────────────────

function CongratsBanner({ escrows, role = "seller" }: { escrows: any[]; role?: "seller" | "agent" }) {
  const newSales = escrows.filter(e => ["DELIVERED", "RELEASED"].includes(e.status));
  if (newSales.length === 0) return null;

  const total = newSales.reduce((sum, e) => {
    const amt = role === "agent" ? Number(e.shippingAgentFeeAmount ?? 0) : Number(e.sellerNetAmount ?? e.amount ?? 0);
    return sum + amt;
  }, 0);
  const currency = newSales[0]?.currency ?? "NGN";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl">
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />

      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
          <PartyPopper className="w-7 h-7 text-yellow-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg leading-tight">
              {role === "agent" ? "Delivery Complete! 🚚" : "Congratulations on your sale! 🎉"}
            </h3>
          </div>
          <p className="text-white/80 text-sm mb-3">
            {role === "agent"
              ? `You've earned ${fmt(total, currency)} from ${newSales.length} completed delivery(ies). Request your payout to receive your 75% commission.`
              : `You've earned ${fmt(total, currency)} from ${newSales.length} completed sale(s). Submit your payout request to get paid.`
            }
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-green-300" />
              {fmt(total, currency)} ready to claim
            </div>
            {role === "seller" && (
              <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5 text-xs text-white/70">
                <Star className="w-3 h-3 text-yellow-300" />
                List more products to keep earning!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Earnings Summary Cards ───────────────────────────────────────────────────

function EarningsSummary({ requests, role = "seller" }: { requests: PayoutRequest[]; role?: string }) {
  const total    = requests.reduce((s, r) => s + Number(r.amount), 0);
  const paid     = requests.filter(r => ["PAID", "COMPLETED"].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);
  const pending  = requests.filter(r => ["PENDING", "APPROVED"].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0);
  const currency = requests[0]?.currency ?? "NGN";

  if (requests.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500 font-medium mb-1">Total Requested</p>
          <p className="text-lg font-bold text-slate-800">{fmt(total, currency)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{requests.length} request(s)</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
        <CardContent className="p-4">
          <p className="text-xs text-amber-600 font-medium mb-1">In Progress</p>
          <p className="text-lg font-bold text-amber-800">{fmt(pending, currency)}</p>
          <p className="text-xs text-amber-500 mt-0.5">Awaiting payment</p>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Received</p>
          <p className="text-lg font-bold text-green-800">{fmt(paid, currency)}</p>
          <p className="text-xs text-green-500 mt-0.5">Confirmed paid</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payout Request Form ──────────────────────────────────────────────────────

type PayoutFormProps = {
  eligibleEscrows: any[];
  role?: "seller" | "agent";
  onClose: () => void;
};

function PayoutForm({ eligibleEscrows, role = "seller", onClose }: PayoutFormProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({ escrowId: "", paymentMethod: "bank", walletId: "", bankAccountId: "", notes: "" });
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);

  const { data: wallets = [] } = useQuery<any[]>({ queryKey: ["/api/wallets"] });
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/payout-requests", data),
    onSuccess: () => {
      toast({
        title: "🎉 Payout request submitted!",
        description: "Admin will review and process your payment within 1–24 hours.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      onClose();
    },
    onError: (e: any) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
  });

  const handleEscrowSelect = (id: string) => {
    const e = eligibleEscrows.find(x => x.id === id);
    setSelectedEscrow(e);
    setForm(f => ({ ...f, escrowId: id }));
  };

  const earnAmount = selectedEscrow
    ? role === "agent"
      ? Number(selectedEscrow.shippingAgentFeeAmount ?? 0)
      : Number(selectedEscrow.sellerNetAmount ?? selectedEscrow.amount ?? 0)
    : 0;
  const currency = selectedEscrow?.currency ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.escrowId) { toast({ title: "Please select a transaction", variant: "destructive" }); return; }
    createMutation.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount preview */}
      {selectedEscrow && (
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-emerald-200 p-4 text-center">
          <p className="text-xs text-emerald-600 font-medium mb-1">You will receive</p>
          <p className="text-2xl font-bold text-emerald-700">{fmt(earnAmount, currency)}</p>
          <p className="text-xs text-emerald-500 mt-0.5">
            {role === "agent" ? "75% of shipping fee" : "After platform fee"}
          </p>
        </div>
      )}

      {/* Transaction selector */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
          {role === "agent" ? "Select Delivery" : "Select Sale"}
        </label>
        <Select onValueChange={handleEscrowSelect}>
          <SelectTrigger className="h-11 bg-white border-slate-200">
            <SelectValue placeholder={role === "agent" ? "Choose a completed delivery…" : "Choose a completed sale…"} />
          </SelectTrigger>
          <SelectContent>
            {eligibleEscrows.map(e => {
              const amt = role === "agent"
                ? Number(e.shippingAgentFeeAmount ?? 0)
                : Number(e.sellerNetAmount ?? e.amount ?? 0);
              return (
                <SelectItem key={e.id} value={e.id}>
                  {e.listing?.title ?? e.id.slice(0, 10)} — {fmt(amt, e.currency)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Payment method */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Payment Method</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "bank", label: "Bank Transfer", icon: Banknote },
            { value: "crypto", label: "Crypto Wallet", icon: Wallet },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(f => ({ ...f, paymentMethod: value }))}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                form.paymentMethod === value
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bank account selector */}
      {form.paymentMethod === "bank" && (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Bank Account</label>
          {bankAccounts.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Add a bank account in Account Settings first.
            </div>
          ) : (
            <Select onValueChange={v => setForm(f => ({ ...f, bankAccountId: v }))}>
              <SelectTrigger className="h-11 bg-white border-slate-200">
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber} ({b.accountName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Crypto wallet selector */}
      {form.paymentMethod === "crypto" && (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Crypto Wallet</label>
          {wallets.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Add a crypto wallet in Account Settings first.
            </div>
          ) : (
            <Select onValueChange={v => setForm(f => ({ ...f, walletId: v }))}>
              <SelectTrigger className="h-11 bg-white border-slate-200">
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w: any) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.type} — {w.address.slice(0, 20)}…
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Notes <span className="font-normal text-slate-400">(optional)</span></label>
        <Textarea
          className="bg-white border-slate-200 text-sm resize-none"
          rows={2}
          placeholder="Any special instructions for the admin…"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1 h-11" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CircleDollarSign className="w-4 h-4 mr-2" />}
          Submit Payout Request
        </Button>
      </div>
      <p className="text-center text-xs text-slate-400">Admin will process your payout within 1–24 hours.</p>
    </form>
  );
}

// ─── Confirm Payment Card ──────────────────────────────────────────────────────

function ConfirmPaymentCard({ req }: { req: PayoutRequest }) {
  const { toast } = useToast();

  const confirmMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/payout-requests/${req.id}/confirm`, {}),
    onSuccess: () => {
      toast({ title: "✅ Payment confirmed!", description: "Transaction has been marked as completed. Thank you!" });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
    },
    onError: (e: any) => toast({ title: "Confirmation failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 space-y-2.5">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-600" />
        <p className="text-sm font-semibold text-emerald-800">Admin has sent your payment!</p>
      </div>
      {req.txHash && (
        <p className="text-xs text-emerald-600 font-mono bg-white/70 rounded px-2 py-1 break-all">
          TX: {req.txHash}
        </p>
      )}
      {req.receiptUrl && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-emerald-200">
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700">Payment Receipt Attached</p>
            <p className="text-xs text-slate-400">Admin has attached a receipt for this payment</p>
          </div>
          <a
            href={req.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex-shrink-0"
          >
            <Eye className="w-3 h-3" /> View
          </a>
          <a
            href={req.receiptUrl}
            download
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex-shrink-0"
          >
            <Download className="w-3 h-3" /> Save
          </a>
        </div>
      )}
      <p className="text-xs text-emerald-700">
        Please confirm you received{" "}
        <span className="font-bold">{fmt(req.amount, req.currency)}</span>.
        This will close the transaction.
      </p>
      <Button
        size="sm"
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9"
        disabled={confirmMutation.isPending}
        onClick={() => confirmMutation.mutate()}
      >
        {confirmMutation.isPending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
          : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
        }
        Confirm Payment Received
      </Button>
    </div>
  );
}

// ─── Single Request Card ──────────────────────────────────────────────────────

function RequestCard({ req }: { req: PayoutRequest }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <Card className={`border transition-all ${req.status === "PAID" ? "border-emerald-300 shadow-emerald-100 shadow-md" : "border-slate-200"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-bold text-slate-900 text-base">{fmt(req.amount, req.currency)}</span>
              <EarningsBadge status={req.status} />
              {req.paymentMethod && (
                <Badge variant="outline" className="text-xs capitalize">{req.paymentMethod}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-0.5">
              {req.escrow?.listing?.title ?? `Transaction #${req.escrowId.slice(0, 10)}`}
            </p>
            <p className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          <button
            onClick={() => setExpanded(x => !x)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* PAID — show confirm button prominently */}
        {req.status === "PAID" && (
          <ConfirmPaymentCard req={req} />
        )}

        {/* Admin note */}
        {req.adminNote && req.status !== "PAID" && (
          <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${req.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            <span className="font-semibold">Admin: </span>{req.adminNote}
          </div>
        )}

        {/* Completed confirmation */}
        {req.status === "COMPLETED" && req.confirmedAt && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5 border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Receipt confirmed on {new Date(req.confirmedAt).toLocaleDateString()}
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
            {req.bankAccount && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                {req.bankAccount.bankName} · {req.bankAccount.accountName} · {req.bankAccount.accountNumber}
              </div>
            )}
            {req.wallet && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                {req.wallet.type} · {req.wallet.address.slice(0, 24)}…
              </div>
            )}
            {req.txHash && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 font-mono">
                <ExternalLink className="w-3.5 h-3.5" />
                TX: {req.txHash}
              </div>
            )}
            {req.receiptUrl && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-medium flex-1">Payment Receipt</span>
                <a
                  href={req.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-white hover:bg-blue-50 border border-blue-200 transition-colors"
                >
                  <Eye className="w-3 h-3" /> View
                </a>
                <a
                  href={req.receiptUrl}
                  download
                  className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <Download className="w-3 h-3" /> Save
                </a>
              </div>
            )}
            {req.notes && (
              <p className="text-xs text-slate-500 italic px-1">"{req.notes}"</p>
            )}
            {req.paidAt && (
              <p className="text-xs text-slate-400 px-1">Paid on {new Date(req.paidAt).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Seller Payout Manager ────────────────────────────────────────────────────

type SellerPayoutManagerProps = { escrows: any[] };

export function SellerPayoutManager({ escrows }: SellerPayoutManagerProps) {
  const [formOpen, setFormOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery<PayoutRequest[]>({ queryKey: ["/api/payout-requests"] });

  const requestedEscrowIds = new Set(requests.filter(r => ["PENDING", "APPROVED"].includes(r.status)).map(r => r.escrowId));
  const eligibleEscrows = escrows.filter(e => ["RELEASED", "DELIVERED"].includes(e.status) && !requestedEscrowIds.has(e.id));

  const pendingConfirm = requests.filter(r => r.status === "PAID");

  return (
    <div className="space-y-5">
      {/* Congrats banner */}
      <CongratsBanner escrows={eligibleEscrows} role="seller" />

      {/* Urgent: confirm payments */}
      {pendingConfirm.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="w-5 h-5 text-emerald-600" />
            <p className="font-semibold text-emerald-800 text-sm">Action Required: Confirm {pendingConfirm.length} payment(s)</p>
          </div>
          <p className="text-xs text-emerald-600">Admin has processed your payment. Please confirm receipt to close the transaction.</p>
        </div>
      )}

      {/* Earnings summary */}
      <EarningsSummary requests={requests} />

      {/* Header + request button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Payout Requests</h3>
          <p className="text-xs text-slate-500 mt-0.5">Request earnings for completed sales</p>
        </div>
        {eligibleEscrows.length > 0 && (
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm gap-1.5">
                <Plus className="w-4 h-4" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-violet-600" />
                  Request Your Payout
                </DialogTitle>
              </DialogHeader>
              <PayoutForm eligibleEscrows={eligibleEscrows} role="seller" onClose={() => setFormOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">No payout requests yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {eligibleEscrows.length > 0
                ? `You have ${eligibleEscrows.length} completed sale(s) ready for payout.`
                : "Payouts unlock once a buyer confirms delivery."}
            </p>
            {eligibleEscrows.length > 0 && (
              <Button
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-4 h-4" /> Request Your First Payout
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}

      {/* Motivational footer */}
      {requests.filter(r => r.status === "COMPLETED").length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 p-4 flex items-center gap-3">
          <Gift className="w-8 h-8 text-violet-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-violet-800">Keep the momentum going! 🚀</p>
            <p className="text-xs text-violet-600 mt-0.5">List more products and promote your store to earn more.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

// ─── Agent Payout Manager ─────────────────────────────────────────────────────

type AgentPayoutManagerProps = { shipments: any[] };

export function AgentPayoutManager({ shipments }: AgentPayoutManagerProps) {
  const [formOpen, setFormOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery<PayoutRequest[]>({ queryKey: ["/api/payout-requests"] });

  const requestedEscrowIds = new Set(requests.filter(r => ["PENDING", "APPROVED"].includes(r.status)).map(r => r.escrowId));
  const eligibleEscrows = shipments
    .map(s => s.escrow)
    .filter((e: any) => e && ["DELIVERED", "RELEASED"].includes(e.status))
    .filter((e: any) => Number(e.shippingAgentFeeAmount) > 0)
    .filter((e: any) => !requestedEscrowIds.has(e.id));

  const pendingConfirm = requests.filter(r => r.status === "PAID");

  return (
    <div className="space-y-5">
      {/* Congrats banner */}
      <CongratsBanner escrows={eligibleEscrows} role="agent" />

      {/* Urgent: confirm payments */}
      {pendingConfirm.length > 0 && (
        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="w-5 h-5 text-emerald-600" />
            <p className="font-semibold text-emerald-800 text-sm">Action Required: Confirm {pendingConfirm.length} payment(s)</p>
          </div>
          <p className="text-xs text-emerald-600">Admin has processed your commission. Confirm receipt to close the delivery.</p>
        </div>
      )}

      {/* Earnings summary */}
      <EarningsSummary requests={requests} role="agent" />

      {/* Header + request button */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Earnings & Payouts</h3>
          <p className="text-xs text-slate-500 mt-0.5">Your 75% commission from completed deliveries</p>
        </div>
        {eligibleEscrows.length > 0 && (
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm gap-1.5">
                <Plus className="w-4 h-4" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-blue-600" />
                  Request Commission Payout
                </DialogTitle>
              </DialogHeader>
              <PayoutForm eligibleEscrows={eligibleEscrows} role="agent" onClose={() => setFormOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Transactions list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wallet className="w-7 h-7 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">No payout requests yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {eligibleEscrows.length > 0
                ? `You have ${eligibleEscrows.length} delivery(ies) ready for commission payout.`
                : "Payouts unlock once a delivery is confirmed."}
            </p>
            {eligibleEscrows.length > 0 && (
              <Button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="w-4 h-4" /> Claim Your Commission
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map(req => <RequestCard key={req.id} req={req} />)}
        </div>
      )}
    </div>
  );
}

// ─── Receipt viewer ───────────────────────────────────────────────────────────

function ReceiptViewer({ url, label = "View Receipt" }: { url: string; label?: string }) {
  const isPdf = url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
    >
      {isPdf ? <FileText className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      {label}
      <Download className="w-3 h-3 opacity-60" />
    </a>
  );
}

// ─── Admin Payout Manager ─────────────────────────────────────────────────────

export function AdminPayoutManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const reviewingIdRef = useRef<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: "", adminNote: "", txHash: "", receiptUrl: "" });
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  function openReview(id: string) {
    reviewingIdRef.current = id;
    setReviewingId(id);
    setReviewForm({ status: "", adminNote: "", txHash: "", receiptUrl: "" });
  }

  function closeReview() {
    reviewingIdRef.current = null;
    setReviewingId(null);
  }

  async function uploadReceiptFile(file: File) {
    const targetId = reviewingIdRef.current; // capture before async
    setUploadingReceipt(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, filename: file.name }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      // Only apply if still reviewing the same request (guards against cancel/switch race)
      if (reviewingIdRef.current === targetId && targetId !== null) {
        setReviewForm(f => ({ ...f, receiptUrl: url }));
        toast({ title: "Receipt uploaded", description: "File attached and ready to send." });
      }
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  }

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/payout-requests/${id}`, data),
    onSuccess: () => {
      toast({ title: "✅ Payout request updated", description: "Seller/agent has been notified." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setReviewingId(null);
      setReviewForm({ status: "", adminNote: "", txHash: "", receiptUrl: "" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const FILTERS = ["ALL", "PENDING", "APPROVED", "PAID", "COMPLETED", "REJECTED"];
  const filtered = statusFilter === "ALL" ? requests : requests.filter(r => r.status === statusFilter);
  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  const totals = {
    pending: requests.filter(r => r.status === "PENDING").reduce((s, r) => s + Number(r.amount), 0),
    paid: requests.filter(r => ["PAID", "COMPLETED"].includes(r.status)).reduce((s, r) => s + Number(r.amount), 0),
  };
  const currency = requests[0]?.currency ?? "NGN";

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Requests", value: requests.length, color: "text-slate-700", bg: "bg-slate-50" },
            { label: "Pending", value: pendingCount, color: "text-amber-700", bg: "bg-amber-50", urgent: pendingCount > 0 },
            { label: "Awaiting Payout", value: fmt(totals.pending, currency), color: "text-orange-700", bg: "bg-orange-50" },
            { label: "Total Paid Out", value: fmt(totals.paid, currency), color: "text-green-700", bg: "bg-green-50" },
          ].map(stat => (
            <Card key={stat.label} className={`border-0 shadow-sm ${stat.bg} ${(stat as any).urgent ? "ring-2 ring-amber-400" : ""}`}>
              <CardContent className="p-3">
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            Payout Requests
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </h3>
          <p className="text-sm text-slate-500">Review, approve, and send payments to sellers and agents</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(s => {
          const count = s === "ALL" ? requests.length : requests.filter(r => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFilter === s
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s} {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-500">No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
            const isReviewing = reviewingId === req.id;

            return (
              <Card
                key={req.id}
                className={`border transition-all ${req.status === "PENDING" ? "border-amber-300 shadow-sm shadow-amber-100" : "border-slate-200"}`}
              >
                <CardContent className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Amount + status */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-xl text-slate-900">{fmt(req.amount, req.currency)}</span>
                        <EarningsBadge status={req.status} />
                        {req.paymentMethod && (
                          <Badge variant="outline" className="text-xs capitalize">{req.paymentMethod}</Badge>
                        )}
                        {req.payeeType === "agent" && (
                          <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">Shipping Agent</Badge>
                        )}
                      </div>

                      {/* Payee */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                          {(req.payeeType === "agent" ? req.agent?.username : req.seller?.username)?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {req.payeeType === "agent"
                              ? (req.agent?.username ?? req.agent?.email ?? "Shipping Agent")
                              : (req.seller?.username ?? req.seller?.email ?? "Seller")}
                          </p>
                          <p className="text-xs text-slate-400">{req.payeeType === "agent" ? "Delivery Agent" : "Seller"}</p>
                        </div>
                      </div>

                      {/* Transaction */}
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Order:</span>{" "}
                        {(req as any).escrow?.listing?.title ?? `#${req.escrowId.slice(0, 12)}`}
                      </p>

                      {/* Payment details */}
                      {req.bankAccount && (
                        <div className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <Banknote className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            <span className="font-semibold">{req.bankAccount.bankName}</span>
                            {" · "}{req.bankAccount.accountName}
                            {" · "}{req.bankAccount.accountNumber}
                            {req.bankAccount.swiftCode && <span className="text-slate-400"> · SWIFT: {req.bankAccount.swiftCode}</span>}
                          </span>
                        </div>
                      )}
                      {req.wallet && (
                        <div className="inline-flex items-center gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <Wallet className="w-3.5 h-3.5 text-slate-400" />
                          <span><span className="font-semibold">{req.wallet.type}</span>{" · "}{req.wallet.address}</span>
                        </div>
                      )}

                      {/* Notes */}
                      {req.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                          "{req.notes}"
                        </p>
                      )}

                      {/* Admin note & tx hash */}
                      {req.adminNote && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-200">
                          <span className="font-semibold">Admin note:</span> {req.adminNote}
                        </p>
                      )}
                      {req.txHash && (
                        <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5 border border-green-200 font-mono break-all">
                          TX: {req.txHash}
                        </p>
                      )}
                      {req.receiptUrl && (
                        <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                          <span className="text-slate-600 font-medium flex-1">Receipt attached</span>
                          <a href={req.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5">
                            <Eye className="w-3 h-3" /> View
                          </a>
                          <a href={req.receiptUrl} download
                            className="text-slate-500 hover:underline flex items-center gap-0.5 ml-1">
                            <Download className="w-3 h-3" /> Save
                          </a>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex gap-3 text-xs text-slate-400 flex-wrap">
                        <span>Requested: {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {req.paidAt && <span>Paid: {new Date(req.paidAt).toLocaleDateString()}</span>}
                        {req.confirmedAt && <span className="text-green-600 font-medium">✓ Confirmed {new Date(req.confirmedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>

                    {/* Action panel */}
                    {(req.status === "PENDING" || req.status === "APPROVED") && (
                      <div className="flex-shrink-0 min-w-44">
                        {!isReviewing ? (
                          <Button
                            size="sm"
                            className={`w-full gap-1.5 ${req.status === "PENDING" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-800 hover:bg-slate-900 text-white"}`}
                            onClick={() => openReview(req.id)}
                          >
                            {req.status === "PENDING" ? "Review & Action" : "Send Payment"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                            <Select onValueChange={v => setReviewForm(f => ({ ...f, status: v }))}>
                              <SelectTrigger className="text-sm bg-white h-9">
                                <SelectValue placeholder="Choose action…" />
                              </SelectTrigger>
                              <SelectContent>
                                {req.status === "PENDING" && <SelectItem value="APPROVED">✅ Approve</SelectItem>}
                                {req.status === "PENDING" && <SelectItem value="REJECTED">❌ Reject</SelectItem>}
                                <SelectItem value="PAID">💰 Mark as Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            {reviewForm.status === "PAID" && (
                              <>
                                <Input
                                  className="text-xs bg-white h-9"
                                  placeholder="TX hash / reference (optional)"
                                  value={reviewForm.txHash}
                                  onChange={e => setReviewForm(f => ({ ...f, txHash: e.target.value }))}
                                />
                                {/* Receipt upload */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                    Payment Receipt
                                  </label>
                                  {reviewForm.receiptUrl ? (
                                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                                      <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                      <span className="text-xs text-slate-600 truncate flex-1">Receipt uploaded ✓</span>
                                      <button
                                        type="button"
                                        onClick={() => setReviewForm(f => ({ ...f, receiptUrl: "" }))}
                                        className="text-xs text-red-500 hover:text-red-700 flex-shrink-0"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-2 cursor-pointer px-2 py-2 rounded-lg border border-dashed border-slate-300 bg-white hover:bg-slate-50 transition-colors">
                                      {uploadingReceipt
                                        ? <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                                        : <Upload className="w-3.5 h-3.5 text-slate-400" />
                                      }
                                      <span className="text-xs text-slate-500">
                                        {uploadingReceipt ? "Uploading…" : "Attach receipt (PDF/image)"}
                                      </span>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        disabled={uploadingReceipt}
                                        onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (file) uploadReceiptFile(file);
                                          e.target.value = "";
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                              </>
                            )}
                            <Input
                              className="text-xs bg-white h-9"
                              placeholder="Admin note (optional)"
                              value={reviewForm.adminNote}
                              onChange={e => setReviewForm(f => ({ ...f, adminNote: e.target.value }))}
                            />
                            <div className="flex gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => closeReview()}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white"
                                disabled={!reviewForm.status || updateMutation.isPending || uploadingReceipt}
                                onClick={() => updateMutation.mutate({ id: req.id, data: reviewForm })}
                              >
                                {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

// ─── PayoutAccountGuide (keep for Dashboard compatibility) ────────────────────
// Re-exported so Dashboard.tsx import doesn't break
export { PayoutAccountGuide } from "./PayoutAccountGuide";
