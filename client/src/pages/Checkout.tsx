import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, Copy, CheckCircle, MessageCircle, Shield, AlertCircle, Package,
  MapPin, Truck, ChevronRight, Info, Lock, Banknote, Wallet, ArrowRight,
  RefreshCw, User, Building2, Upload, FileImage, ReceiptText, ShieldCheck,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import CryptoIcon from "@/components/CryptoIcon";
import GuestCheckoutAuth from "@/components/GuestCheckoutAuth";
import { authenticateWithPi, createPiPayment, isPiBrowser } from "@/lib/pi";

const NETWORK_LABELS: Record<string, string> = {
  PI_MAINNET: "Pi Network (Mainnet)",
  TRON: "USDT via TRON (TRC20)",
  TON: "USDT via TON",
  BNB: "USDT via BNB Chain",
  SOL: "USDT via Solana",
  AVAX: "USDT via Avalanche",
  BANK_TRANSFER: "Bank Transfer",
};

const LISTING_TYPE_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  SHIPPING_SERVICE: "Shipping Service",
  PRODUCT: "Product",
  SERVICE: "Service",
};

// ─── Step Tracker ─────────────────────────────────────────────────────────────

function StepTracker({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Review & Pay" },
    { n: 2, label: "Confirm" },
    { n: 3, label: "Complete" },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s.n ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {step > s.n ? <CheckCircle className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-xs mt-1 font-medium ${step >= s.n ? "text-blue-600" : "text-slate-400"}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded ${step > s.n ? "bg-blue-600" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function CountdownTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const urgent = seconds < 120;
  const warn = seconds < 300;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${urgent ? "bg-red-50 border-red-200" : warn ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
      <Clock className={`w-5 h-5 flex-shrink-0 ${urgent ? "text-red-500 animate-pulse" : warn ? "text-amber-500" : "text-green-500"}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${urgent ? "text-red-700" : warn ? "text-amber-700" : "text-green-700"}`}>
          {seconds > 0 ? "Complete payment within" : "Payment window expired"}
        </p>
        {seconds > 0 && <p className={`text-xs ${urgent ? "text-red-500" : warn ? "text-amber-500" : "text-green-500"}`}>Contact support if you've already sent payment</p>}
      </div>
      <div className={`text-2xl font-mono font-bold tabular-nums ${urgent ? "text-red-600" : warn ? "text-amber-600" : "text-green-700"}`}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
    </div>
  );
}

// ─── Fee Breakdown Panel ──────────────────────────────────────────────────────

// ─── Seller Inline Payout Panel (shown on DELIVERED screen) ──────────────────

function SellerPayoutPanel({ escrow }: { escrow: any }) {
  const { toast } = useToast();
  const [method, setMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: payoutRequests = [] } = useQuery<any[]>({ queryKey: ["/api/payout-requests"] });
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });

  const existingRequest = (payoutRequests as any[]).find((r: any) => r.escrowId === escrow.id);

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payout-requests", data),
    onSuccess: () => {
      toast({ title: "Payout request submitted!", description: "Admin will review and process your payout." });
      queryClient.invalidateQueries({ queryKey: ["/api/payout-requests"] });
      setSubmitted(true);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-50 border-yellow-200 text-yellow-800",
    APPROVED: "bg-blue-50 border-blue-200 text-blue-800",
    REJECTED: "bg-red-50 border-red-200 text-red-800",
    PAID: "bg-green-50 border-green-200 text-green-800",
  };

  if (existingRequest || submitted) {
    const req = existingRequest;
    return (
      <Card className="shadow-md border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Payout Request</h2>
              <p className="text-xs text-slate-500">Your earnings for this order</p>
            </div>
          </div>
          {req && (
            <div className={`rounded-xl border px-4 py-3 mb-4 ${STATUS_STYLE[req.status] || "bg-slate-50 border-slate-200"}`}>
              <p className="font-semibold text-sm capitalize">{req.status === "PAID" ? "✅ Paid!" : req.status === "APPROVED" ? "✅ Approved — processing payment" : req.status === "REJECTED" ? "❌ Rejected" : "⏳ Under Review"}</p>
              <p className="text-xs mt-0.5">{req.status === "PAID" ? "Your payout has been sent." : req.status === "APPROVED" ? "Your request was approved. Payment is being sent." : req.status === "REJECTED" ? req.adminNote || "Please contact support." : "Admin will process your payout within 1–24 hrs."}</p>
              {req.txHash && <p className="text-xs mt-1 font-mono text-slate-600">TX: {req.txHash}</p>}
            </div>
          )}
          {!req && <p className="text-sm text-slate-500 mb-4">Your payout request has been submitted. Admin will review it shortly.</p>}
          <Link href="/dashboard?tab=payouts">
            <Button variant="outline" className="w-full text-sm">View All Payout Requests</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const noBankAccounts = (bankAccounts as any[]).length === 0;

  return (
    <Card className="shadow-md border-emerald-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Request Your Payout</h2>
            <p className="text-xs text-slate-500">You earned: <strong>{escrow.sellerNetAmount || escrow.amount} {escrow.currency}</strong></p>
          </div>
        </div>

        {noBankAccounts ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">You need to add a payout account before requesting your funds.</p>
            </div>
            <Link href="/account/settings">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Building2 className="w-4 h-4 mr-2" /> Add Payout Account
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Payment method</label>
              <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="bank">Bank Transfer</option>
                <option value="crypto">Crypto Wallet</option>
              </select>
            </div>
            {method === "bank" && (
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Select bank account</label>
                <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)}>
                  <option value="">Choose account…</option>
                  {(bankAccounts as any[]).map((acc: any) => (
                    <option key={acc.id} value={acc.id}>{acc.bankName} — {acc.accountNumber} ({acc.accountName})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Notes (optional)</label>
              <Textarea className="text-sm h-20 resize-none" placeholder="Add any extra info for admin…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={submitMutation.isPending || (method === "bank" && !selectedBankId)}
              onClick={() => submitMutation.mutate({ escrowId: escrow.id, paymentMethod: method, bankAccountId: selectedBankId || undefined, notes })}
            >
              {submitMutation.isPending ? "Submitting…" : "Submit Payout Request"}
            </Button>
            <p className="text-xs text-center text-slate-400">Admin will process your payout within 1–24 hours.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Fee Breakdown Panel ──────────────────────────────────────────────────────

export function computeShippingInfo(escrow: any, selectedShippingRate?: any) {
  const savedShippingCost = parseFloat((escrow.metadata as any)?.shipping?.cost || escrow.shippingFee || "0");
  const shippingFeeNGN = selectedShippingRate
    ? parseFloat(selectedShippingRate.price || "0")
    : savedShippingCost;
  const shippingOption = selectedShippingRate?.option || (escrow.metadata as any)?.shipping?.option || escrow.shippingOption;
  const hasShipping = shippingFeeNGN > 0 && shippingOption && shippingOption !== 'SELF_PICKUP';
  const shippingCurrency = escrow.shippingFeeCurrency || 'NGN';
  const sameCurrencyAsItem = hasShipping && shippingCurrency === escrow.currency;
  return { shippingFeeNGN, shippingOption, hasShipping, shippingCurrency, sameCurrencyAsItem };
}

function FeeBreakdown({ escrow, isSeller, selectedShippingRate }: { escrow: any; isSeller?: boolean; selectedShippingRate?: any }) {
  const amount = parseFloat(escrow.amount || "0");
  const feePct = parseFloat(escrow.platformFeePct || "10");
  // Platform fee is deducted from the product price only (not from shipping)
  const feeAmount = amount * (feePct / 100);
  const sellerReceives = amount - feeAmount;

  // Shipping fee — from selected rate (live) or already-saved on escrow metadata
  const { shippingFeeNGN, hasShipping, sameCurrencyAsItem } = computeShippingInfo(escrow, selectedShippingRate);
  // Buyer total = item price + shipping fee (summed when they share the same currency)
  const buyerTotal = sameCurrencyAsItem ? amount + shippingFeeNGN : amount;

  return (
    <div className="space-y-2.5">
      {/* Item price line */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600">Item Price</span>
        <div className="flex items-center gap-1 font-semibold text-slate-800">
          {amount.toLocaleString()} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
        </div>
      </div>

      {/* Shipping fee line */}
      {hasShipping && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            Shipping Fee
          </span>
          <span className="font-semibold text-blue-700">+ ₦{shippingFeeNGN.toLocaleString()} NGN</span>
        </div>
      )}

      {/* Platform fee line — shown only in seller context or for transparency */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500 flex items-center gap-1.5">
          Platform Service Fee
          <Badge variant="outline" className="text-xs font-medium text-orange-700 border-orange-200 bg-orange-50 py-0">{feePct}%</Badge>
          <span className="text-xs text-slate-400">(on item price only)</span>
        </span>
        <span className="text-slate-500">− {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}</span>
      </div>

      <Separator />

      {/* Buyer total — item price + shipping fee, summed when in the same currency */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Buyer Total
        </p>
        {sameCurrencyAsItem ? (
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Total to Pay</span>
            <div className="flex items-center gap-1 font-bold text-blue-800 text-base">
              {buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">Crypto Payment</span>
              <div className="flex items-center gap-1 font-bold text-blue-800 text-base">
                {amount.toLocaleString()} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
              </div>
            </div>
            {hasShipping && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Shipping Fee (NGN, paid separately)
                </span>
                <span className="font-bold text-blue-800 text-base">₦{shippingFeeNGN.toLocaleString()}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Seller row — platform fee deducted from item price only */}
      <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          <Building2 className="w-4 h-4" /> Seller Receives
        </span>
        <span className="text-sm font-medium text-slate-700">
          {sellerReceives.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}
        </span>
      </div>
    </div>
  );
}

// ─── Main Checkout ─────────────────────────────────────────────────────────────

export default function Checkout() {
  const [, params] = useRoute("/checkout/:escrowId");
  const escrowId = params?.escrowId;
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: "", recipientPhone: "", addressLine1: "", addressLine2: "",
    city: "", country: "", postalCode: "",
  });

  const { data: escrow, isLoading: escrowLoading, isError: escrowError } = useQuery<any>({
    queryKey: ["/api/escrows", escrowId],
    enabled: !!escrowId && isAuthenticated,
    refetchInterval: 30000,
    retry: 1,
  });

  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: platformWallet } = useQuery<any>({
    queryKey: ["/api/platform-wallets/currency", escrow?.currency, "network", escrow?.network],
    enabled: !!(escrow && escrow.currency && escrow.network && !["USD","EUR","GBP","CAD","NGN"].includes(escrow.currency)),
  });

  // Countdown timer
  useEffect(() => {
    if (paymentConfirmed || step >= 2) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentConfirmed, step]);

  const [txHash, setTxHash] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptUploading, setReceiptUploading] = useState(false);
  // shippingOption is stored in escrow.metadata.shipping.option (not a direct DB column).
  // We sync it into local state once the escrow query resolves so the selector pre-selects
  // the option the buyer chose on a previous visit.
  const [selectedShippingOption, setSelectedShippingOption] = useState<string>("");
  useEffect(() => {
    const saved = (escrow?.metadata as any)?.shipping?.option;
    if (saved && !selectedShippingOption) setSelectedShippingOption(saved);
  }, [escrow?.metadata]); // eslint-disable-line react-hooks/exhaustive-deps
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProductListing = ['PRODUCT', 'SHIPPING_SERVICE'].includes(escrow?.listing?.listingType || escrow?.listing?.type);

  const { data: shippingRates } = useQuery<any[]>({
    queryKey: ["/api/shipping-rates"],
    enabled: isProductListing,
  });

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const resp = await fetch(`/api/escrows/${escrowId}/upload-receipt`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: buffer,
      });
      if (!resp.ok) throw new Error("Upload failed");
      const { url } = await resp.json();
      setReceiptUrl(url);
      toast({ title: "Receipt uploaded successfully!" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setReceiptUploading(false);
    }
  };

  const [chatThreadId, setChatThreadId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/escrows/${escrowId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/escrows", escrowId] });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      // Persist the shipping selection alongside the payment submission so it is
      // never lost even if the earlier non-blocking PATCH (from the CTA button) failed.
      const selectedRate = shippingRates?.find((r: any) => r.option === selectedShippingOption);
      await apiRequest("PATCH", `/api/escrows/${escrowId}`, {
        status: "PAYMENT_SUBMITTED",
        buyerTxHash: txHash || undefined,
        paymentReceiptUrl: receiptUrl || undefined,
        paymentNotes: paymentNotes || undefined,
        ...(selectedShippingOption && {
          shippingOption: selectedShippingOption,
          shippingCost: selectedRate?.price || "0",
          shippingFee: selectedRate?.price || "0",
          shippingFeeCurrency: selectedRate?.currency || "NGN",
        }),
      });
      // Create/get escrow chat thread with seller
      try {
        const threadRes = await apiRequest("POST", "/api/chat/threads", {
          listingId: escrow?.listingId,
          sellerId: escrow?.sellerId,
          escrowId: escrowId,
        });
        const thread = await threadRes.json();
        return thread;
      } catch { return null; }
    },
    onSuccess: (thread: any) => {
      setPaymentConfirmed(true);
      setStep(3);
      if (thread?.id) setChatThreadId(thread.id);
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
      toast({ title: "Payment submitted for review!", description: "Admin will verify your payment shortly. You're now in the escrow chat." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to submit payment", description: error.message, variant: "destructive" });
    },
  });

  const [piPaying, setPiPaying] = useState(false);

  const piCompleteMutation = useMutation({
    mutationFn: async ({ paymentId, txid }: { paymentId: string; txid: string }) => {
      const res = await apiRequest("POST", "/api/pi/complete", { paymentId, txid, escrowId });
      return res.json();
    },
    onSuccess: async () => {
      setPiPaying(false);
      setPaymentConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/escrows", escrowId] });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      try {
        const threadRes = await apiRequest("POST", "/api/chat/threads", {
          listingId: escrow?.listingId,
          sellerId: escrow?.sellerId,
          escrowId: escrowId,
        });
        const thread = await threadRes.json();
        if (thread?.id) setChatThreadId(thread.id);
      } catch { /* non-fatal */ }
      toast({ title: "Payment received!", description: "Your Pi payment was confirmed on-chain. Funds are now held in escrow." });
    },
    onError: (error: any) => {
      setPiPaying(false);
      toast({ title: "Payment failed to finalize", description: error.message, variant: "destructive" });
    },
  });

  const handlePayWithPi = async () => {
    if (!isPiBrowser()) {
      toast({
        title: "Open in Pi Browser",
        description: "Pi payments can only be completed inside the Pi Browser app. Open this page there to pay.",
        variant: "destructive",
      });
      return;
    }
    setPiPaying(true);
    try {
      await authenticateWithPi(async (incompletePayment: any) => {
        // Reconcile any prior incomplete payment before starting a new one
        try {
          await apiRequest("POST", "/api/pi/incomplete", { paymentId: incompletePayment.identifier });
        } catch { /* non-fatal */ }
      });

      createPiPayment(
        buyerTotal,
        `Beagvs Global — Escrow ${escrowId?.slice(0, 8)}`,
        { escrowId },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              await apiRequest("POST", "/api/pi/approve", { paymentId, escrowId });
            } catch (e: any) {
              setPiPaying(false);
              toast({ title: "Approval failed", description: e.message, variant: "destructive" });
            }
          },
          onReadyForServerCompletion: (paymentId: string, txid: string) => {
            piCompleteMutation.mutate({ paymentId, txid });
          },
          onCancel: async (paymentId: string) => {
            setPiPaying(false);
            try { await apiRequest("POST", "/api/pi/cancel", { paymentId }); } catch { /* non-fatal */ }
            toast({ title: "Payment cancelled" });
          },
          onError: (error: Error) => {
            setPiPaying(false);
            toast({ title: "Pi payment error", description: error.message, variant: "destructive" });
          },
        }
      );
    } catch (e: any) {
      setPiPaying(false);
      toast({ title: "Pi authentication failed", description: e.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${label} copied to clipboard` });
    });
  };

  // ─── Auth guard (inline — no bounce) ─────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10 pb-16">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-3">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-slate-600">Secured by Beagvs Escrow</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Complete Your Purchase</h1>
            <p className="text-slate-500 text-sm mt-1">Create a free account or sign in to continue checkout</p>
          </div>

          {/* What they're checking out (from URL params — shown even before auth) */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Escrow-Protected Transaction</p>
              <p className="text-xs text-blue-600 mt-0.5">Your payment is held safely until delivery is confirmed. Sign in to view payment details.</p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-6">
              <GuestCheckoutAuth
                ctaContext="Create a free account or sign in to complete your escrow purchase. It only takes a minute."
                onAuthSuccess={async () => {
                  // Refetch the auth user so isAuthenticated becomes true and the
                  // checkout page re-renders without a full page reload (which would
                  // wipe React Query cache and cause a visible flash / re-auth loop).
                  await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                  await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                }}
              />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-4">
            Already have an account? Use the "Sign In" tab above.
          </p>
        </div>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  const isFiatCurrency = ["USD", "EUR", "GBP", "CAD", "NGN"].includes(escrow?.currency || "");

  if (escrowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading checkout…</p>
        </div>
      </div>
    );
  }

  if (escrowError || !escrow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Checkout Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            This checkout session could not be loaded. It may have expired or you may not have access to it.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>← Go Back</Button>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isSeller = user?.id === escrow.sellerId;
  const isBuyer = user?.id === escrow.buyerId;
  const isGoodsEscrow = ['PRODUCT', 'SHIPPING_SERVICE'].includes(escrow.listing?.type);

  const amount = parseFloat(escrow.amount || "0");
  const feePct = parseFloat(escrow.platformFeePct || "10");
  const feeAmount = amount * (feePct / 100);
  const sellerReceives = amount - feeAmount;
  const selectedRate = shippingRates?.find((r: any) => r.option === selectedShippingOption);
  const { shippingFeeNGN, sameCurrencyAsItem } = computeShippingInfo(escrow, selectedRate);
  // Buyer total = item price + shipping fee when they share the same currency
  const buyerTotal = sameCurrencyAsItem ? amount + shippingFeeNGN : amount;

  // ─── Status-aware screens (when returning to an existing escrow) ───────────

  // Escrow disputed — both parties see a holding screen
  if (escrow.status === 'DISPUTED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10">
          <Card className="shadow-lg border-red-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-9 h-9 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-red-700 mb-2">Dispute Raised</h1>
              <p className="text-slate-600 mb-1">This escrow is currently under dispute review.</p>
              <p className="text-slate-500 text-sm mb-6">Our admin team has been notified and will mediate. Funds are safely held in escrow until the dispute is resolved.</p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-left flex gap-2">
                <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Please use the escrow chat to communicate with the other party and provide any relevant evidence to our support team.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link href={`/chat/${escrow.listingId}`}>
                  <Button className="w-full bg-red-600 hover:bg-red-700 gap-2">
                    <MessageCircle className="w-4 h-4" /> Open Escrow Chat
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">View My Transactions</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Escrow refunded — buyer's payment returned
  if (escrow.status === 'REFUNDED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10">
          <Card className="shadow-lg border-orange-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-9 h-9 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-orange-700 mb-2">Payment Refunded</h1>
              <p className="text-slate-600 mb-1">Your payment has been refunded.</p>
              <p className="text-slate-500 text-sm mb-6">The escrow has been cancelled and your funds have been returned. Please check your wallet or bank account — refunds may take 1–5 business days depending on your payment method.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Amount", value: `${amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${escrow.currency}` },
                  { label: "Escrow ID", value: escrow.id?.slice(0, 8) + "…" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>
              <Link href="/dashboard">
                <Button className="w-full">View My Transactions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Escrow cancelled
  if (escrow.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10">
          <Card className="shadow-lg border-slate-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-9 h-9 text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-700 mb-2">Transaction Cancelled</h1>
              <p className="text-slate-500 text-sm mb-6">This escrow transaction has been cancelled. If you believe this is an error, please contact support with your Escrow ID: <strong>{escrow.id?.slice(0, 8)}…</strong></p>
              <Link href="/dashboard">
                <Button className="w-full">View My Transactions</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Payment already submitted — under review
  if (escrow.status === 'PAYMENT_SUBMITTED' && !paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10 space-y-5">
          <Card className="shadow-lg border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-blue-700 mb-2">Payment Under Review</h1>
              <p className="text-slate-600 mb-1">Your payment proof has been received.</p>
              <p className="text-slate-500 text-sm mb-6">
                Our team is verifying your payment. You'll receive a notification once it's approved — usually within 1–24 hours.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Amount", value: `${buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${escrow.currency}` },
                  { label: "Escrow ID", value: escrow.id?.slice(0, 8) + "…" },
                  { label: "Status", value: "Under Review" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>

              {escrow.buyerTxHash && (
                <div className="bg-slate-50 border rounded-xl p-3 text-left mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Your Transaction Hash</p>
                  <p className="font-mono text-xs text-slate-700 break-all">{escrow.buyerTxHash}</p>
                </div>
              )}
              {escrow.paymentReceiptUrl && (
                <a href={escrow.paymentReceiptUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4 block">
                  <Eye className="w-4 h-4" /> View submitted receipt
                </a>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left flex gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <strong>What's next?</strong> Once admin approves, the seller will be notified and you can proceed with your order via the escrow chat below.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href={`/chat/${escrow.listingId}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" data-testid="button-open-chat">
                    <MessageCircle className="w-4 h-4" /> Open Escrow Chat
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full gap-2" data-testid="button-go-dashboard">
                    View My Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Escrow is funded (admin approved) — seller ships, buyer waits
  if (escrow.status === 'FUNDED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10 space-y-5">
          <Card className="shadow-lg border-emerald-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-9 h-9 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-emerald-700 mb-2">Payment Approved!</h1>
              <p className="text-slate-600 mb-1">Payment verified — escrow is now active.</p>
              <p className="text-slate-500 text-sm mb-6">
                {isSeller
                  ? "Fulfil the order, then mark it as shipped below so the buyer can confirm receipt."
                  : "The seller has been notified. They will ship your order and you'll be able to confirm delivery."}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Amount", value: `${buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${escrow.currency}` },
                  { label: "Escrow ID", value: escrow.id?.slice(0, 8) + "…" },
                  { label: "Status", value: "Active" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {isSeller && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                    onClick={() => updateStatusMutation.mutate('SHIPPED')}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-mark-shipped"
                  >
                    <Truck className="w-4 h-4" />
                    {updateStatusMutation.isPending ? "Updating…" : "Mark as Shipped"}
                  </Button>
                )}
                <Link href={`/chat/${escrow.listingId}`}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="button-open-chat-funded">
                    <MessageCircle className="w-4 h-4" /> Open Escrow Chat
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full" data-testid="button-go-dashboard-funded">
                    View My Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {isGoodsEscrow && isBuyer && (
            <Card className="border-blue-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                  <MapPin className="w-4 h-4" /> Delivery Address
                </CardTitle>
                <p className="text-sm text-blue-600">Make sure the seller knows where to send your item.</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const saved = (escrow?.metadata as any)?.shipping?.address;
                  const hasSaved = saved?.recipientName || saved?.city;
                  if (hasSaved && !showShippingForm) {
                    return (
                      <div className="space-y-2">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-green-800">
                            <p className="font-medium">{saved.recipientName}</p>
                            {saved.addressLine1 && <p className="text-xs">{saved.addressLine1}{saved.addressLine2 ? `, ${saved.addressLine2}` : ""}</p>}
                            <p className="text-xs">{[saved.city, saved.country, saved.postalCode].filter(Boolean).join(", ")}</p>
                            {saved.recipientPhone && <p className="text-xs text-green-700">{saved.recipientPhone}</p>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowShippingForm(true)} className="text-xs" data-testid="button-edit-address-funded">
                          <MapPin className="w-3.5 h-3.5 mr-1" /> Edit Address
                        </Button>
                      </div>
                    );
                  }
                  if (!showShippingForm) {
                    return (
                      <Button onClick={() => setShowShippingForm(true)} className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-add-address-funded">
                        <MapPin className="w-4 h-4 mr-2" /> Add Delivery Address
                      </Button>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Recipient Name *</label>
                          <Input value={shippingAddress.recipientName} onChange={e => setShippingAddress(p => ({ ...p, recipientName: e.target.value }))} placeholder="Full name" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Phone Number</label>
                          <Input value={shippingAddress.recipientPhone} onChange={e => setShippingAddress(p => ({ ...p, recipientPhone: e.target.value }))} placeholder="+234 800 000 0000" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-600 block mb-1">Street Address *</label>
                          <Input value={shippingAddress.addressLine1} onChange={e => setShippingAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="Street, P.O. Box" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-slate-600 block mb-1">Address Line 2</label>
                          <Input value={shippingAddress.addressLine2} onChange={e => setShippingAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, suite (optional)" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">City *</label>
                          <Input value={shippingAddress.city} onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Country *</label>
                          <Input value={shippingAddress.country} onChange={e => setShippingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Postal / ZIP Code</label>
                          <Input value={shippingAddress.postalCode} onChange={e => setShippingAddress(p => ({ ...p, postalCode: e.target.value }))} placeholder="e.g. 100001" />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" onClick={() => setShowShippingForm(false)} className="flex-1">Cancel</Button>
                        <Button
                          onClick={async () => {
                            if (!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country) {
                              toast({ title: "Please fill in required fields (Name, City, Country)", variant: "destructive" }); return;
                            }
                            try {
                              await apiRequest("PATCH", `/api/escrows/${escrowId}`, { shippingAddress });
                              toast({ title: "Delivery address saved!", description: "The seller will see your address." });
                              queryClient.invalidateQueries({ queryKey: ["/api/escrows", escrowId] });
                              setShowShippingForm(false);
                            } catch (e: any) { toast({ title: "Failed to save", description: e.message, variant: "destructive" }); }
                          }}
                          disabled={!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          data-testid="button-save-address-funded"
                        >
                          <Truck className="w-4 h-4 mr-2" /> Save Address
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Order shipped — buyer confirms delivery
  if (escrow.status === 'SHIPPED') {
    const physicallyDelivered = !!(escrow.metadata as any)?.physicallyDelivered;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10 space-y-5">
          <Card className={`shadow-lg ${physicallyDelivered ? "border-green-300" : "border-cyan-200"}`}>
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${physicallyDelivered ? "bg-green-100" : "bg-cyan-100"}`}>
                {physicallyDelivered ? <Package className="w-9 h-9 text-green-600" /> : <Truck className="w-9 h-9 text-cyan-600" />}
              </div>
              <h1 className={`text-2xl font-bold mb-2 ${physicallyDelivered ? "text-green-700" : "text-cyan-700"}`}>
                {physicallyDelivered ? "Package Delivered!" : "Order Shipped!"}
              </h1>
              <p className="text-slate-600 mb-1">
                {physicallyDelivered
                  ? (isBuyer ? "Your package has arrived at your address." : "The courier confirmed delivery to the buyer.")
                  : (isBuyer ? "Your order is on its way." : "You marked this order as shipped.")}
              </p>
              <p className="text-slate-500 text-sm mb-6">
                {isBuyer
                  ? "Once you receive your item, click 'Confirm Delivery' below to release funds to the seller."
                  : "Waiting for the buyer to confirm they received the item. Funds will be released after confirmation."}
              </p>

              {isBuyer && physicallyDelivered && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    <strong>Action needed:</strong> The courier has marked this package as delivered. Please check your item and confirm receipt below so the seller can be paid.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Amount", value: `${buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${escrow.currency}` },
                  { label: "Escrow ID", value: escrow.id?.slice(0, 8) + "…" },
                  { label: "Status", value: physicallyDelivered ? "Delivered — Awaiting Confirmation" : "Shipped" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {isBuyer && (
                  <Button
                    className={`w-full gap-2 font-semibold ${physicallyDelivered ? "bg-green-600 hover:bg-green-700 animate-pulse" : "bg-green-600 hover:bg-green-700"}`}
                    onClick={() => updateStatusMutation.mutate('DELIVERED')}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-confirm-delivery"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updateStatusMutation.isPending ? "Confirming…" : "Confirm I Received This ✓"}
                  </Button>
                )}
                <Link href={`/chat/${escrow.listingId}`}>
                  <Button variant="outline" className="w-full gap-2" data-testid="button-chat-shipped">
                    <MessageCircle className="w-4 h-4" /> Open Escrow Chat
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full" data-testid="button-dashboard-shipped">
                    View My Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Buyer confirmed delivery — payout request for seller
  if (escrow.status === 'DELIVERED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10 space-y-5">

          {/* Status card */}
          <Card className="shadow-lg border-purple-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-purple-700 mb-2">Delivery Confirmed!</h1>
              <p className="text-slate-600 mb-1">
                {isBuyer ? "You confirmed receiving the item. Thank you!" : "The buyer confirmed they received your item."}
              </p>
              {isBuyer && (
                <p className="text-slate-500 text-sm mb-4">
                  Funds will be released to the seller once they submit a payout request and admin approves. The transaction is almost complete.
                </p>
              )}
              {isBuyer && (
                <div className="flex flex-col gap-3">
                  <Link href={`/chat/${escrow.listingId}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <MessageCircle className="w-4 h-4" /> Open Escrow Chat
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button className="w-full" data-testid="button-dashboard-delivered">View Dashboard</Button>
                  </Link>
                </div>
              )}
              {isSeller && (
                <p className="text-slate-500 text-sm">
                  Submit your payout request below to receive your funds.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Seller payout request panel */}
          {isSeller && <SellerPayoutPanel escrow={escrow} />}
        </div>
      </div>
    );
  }

  // Escrow released/completed
  if (escrow.status === 'RELEASED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-10">
          <Card className="shadow-lg border-green-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">Transaction Complete</h1>
              <p className="text-slate-600 mb-6">This escrow has been completed successfully. Funds have been released to the seller.</p>
              <Link href="/dashboard">
                <Button className="w-full" data-testid="button-dashboard-released">View Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Step 3: Success state (just submitted) ────────────────────────────────

  if (step === 3 || paymentConfirmed) {
    const chatHref = escrow?.listingId ? `/chat/${escrow.listingId}` : "/dashboard";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 space-y-5">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ReceiptText className="w-10 h-10 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-blue-700 mb-2">Payment Submitted!</h1>
              <p className="text-slate-600 mb-1">Your payment proof has been received and is being reviewed.</p>
              <p className="text-slate-500 text-sm mb-4">Our team will verify and approve it within 1–24 hours. You'll get a notification once it's done.</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Amount", value: `${buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${escrow.currency}` },
                  { label: "Escrow ID", value: escrow.id?.slice(0, 8) + "…" },
                  { label: "Status", value: "Under Review" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5 break-all">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-left flex gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 mb-0.5">What happens next?</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Admin reviews your payment proof (within 1–24 hours)</li>
                    <li>You get a notification when approved or if more info is needed</li>
                    <li>Chat with the seller anytime in the escrow chat below</li>
                    <li>Once approved, the seller fulfils your order</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-left">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <MessageCircle className="w-4 h-4" /> Escrow Chat is Active
                </div>
                <p className="text-sm text-green-600">You can now communicate with the seller and our admin team in the secure escrow chat.</p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href={chatHref}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 font-semibold gap-2 text-base py-3" data-testid="button-open-escrow-chat">
                    <MessageCircle className="w-5 h-5" /> Open Escrow Chat
                  </Button>
                </Link>
                <Link href="/dashboard?tab=transactions">
                  <Button variant="outline" className="w-full gap-2" data-testid="button-view-transactions">
                    View My Transactions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Shipping address for goods/products */}
          {isGoodsEscrow && isBuyer && (
            <Card className="border-blue-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                  <Package className="w-5 h-5" /> Provide Your Delivery Address
                </CardTitle>
                <p className="text-sm text-blue-600">Share where the seller should send your item.</p>
              </CardHeader>
              <CardContent>
                {!showShippingForm ? (
                  <Button onClick={() => setShowShippingForm(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                    <MapPin className="w-4 h-4 mr-2" /> Add Delivery Address
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Recipient Name *</label>
                        <Input value={shippingAddress.recipientName} onChange={e => setShippingAddress(p => ({ ...p, recipientName: e.target.value }))} placeholder="Full name" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Phone Number</label>
                        <Input value={shippingAddress.recipientPhone} onChange={e => setShippingAddress(p => ({ ...p, recipientPhone: e.target.value }))} placeholder="+234 800 000 0000" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Street Address *</label>
                        <Input value={shippingAddress.addressLine1} onChange={e => setShippingAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="Street, P.O. Box" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Address Line 2</label>
                        <Input value={shippingAddress.addressLine2} onChange={e => setShippingAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, suite (optional)" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">City *</label>
                        <Input value={shippingAddress.city} onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Country *</label>
                        <Input value={shippingAddress.country} onChange={e => setShippingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Postal / ZIP Code</label>
                        <Input value={shippingAddress.postalCode} onChange={e => setShippingAddress(p => ({ ...p, postalCode: e.target.value }))} placeholder="e.g. 100001" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" onClick={() => setShowShippingForm(false)} className="flex-1">Cancel</Button>
                      <Button
                        onClick={async () => {
                          if (!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country) {
                            toast({ title: "Please fill in required fields", variant: "destructive" }); return;
                          }
                          try {
                            // Send shippingAddress at the top level so the server merges it into
                            // metadata.shipping.address — sending it inside metadata: { shippingAddress }
                            // would replace the entire JSONB field, erasing the saved shipping option.
                            await apiRequest("PATCH", `/api/escrows/${escrowId}`, { shippingAddress });
                            toast({ title: "Delivery address saved!", description: "The seller has been notified." });
                            queryClient.invalidateQueries({ queryKey: ["/api/escrows", escrowId] });
                            setShowShippingForm(false);
                          } catch (e: any) { toast({ title: "Failed to save", description: e.message, variant: "destructive" }); }
                        }}
                        disabled={!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="w-4 h-4 mr-2" /> Save & Notify Seller
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {escrow?.status === 'SHIPPED' && (
            <Card className="border-cyan-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="font-semibold text-cyan-800 text-sm">Shipment In Progress</p>
                    <p className="text-xs text-cyan-600">Your package is on its way — track it now.</p>
                  </div>
                </div>
                <Link href="/tracking">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">Track Now →</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // ─── Step 2: Submit payment proof ─────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-6">
          <StepTracker step={2} />

          <Card className="shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <ReceiptText className="w-5 h-5 text-blue-600" /> Submit Payment Proof
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Provide your transaction details so our team can verify your payment quickly.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800">Payment Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">{escrow.listing?.title || "Item"}</span>
                  <span className="font-bold text-blue-800 flex items-center gap-1">
                    {buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-blue-500">
                  <span>via {NETWORK_LABELS[escrow.network] || escrow.network}</span>
                  <span>Escrow ID: {escrow.id?.slice(0, 8)}…</span>
                </div>
              </div>

              {/* Tx Hash */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Transaction Hash / Reference ID
                  {!isFiatCurrency && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input
                  placeholder={isFiatCurrency ? "Bank transfer reference / receipt number" : "e.g. 0x1a2b3c4d…"}
                  value={txHash}
                  onChange={e => setTxHash(e.target.value)}
                  className="font-mono text-sm"
                  data-testid="input-tx-hash"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {isFiatCurrency
                    ? "Enter the bank transfer reference or receipt number"
                    : "Paste the blockchain transaction hash from your wallet"}
                </p>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Payment Screenshot / Receipt <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  className="hidden"
                  data-testid="input-receipt-file"
                />
                {receiptUrl ? (
                  <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50 flex items-center gap-3">
                    <FileImage className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-700">Receipt uploaded ✓</p>
                      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 underline">View receipt</a>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setReceiptUrl("")} className="text-xs">Remove</Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={receiptUploading}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                    data-testid="button-upload-receipt"
                  >
                    {receiptUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-blue-600">Uploading…</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-slate-400" />
                        <p className="text-sm font-medium text-slate-600">Upload receipt or screenshot</p>
                        <p className="text-xs text-slate-400">PNG, JPG, PDF accepted</p>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Notes for Admin <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Any additional information about your payment…"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  rows={2}
                  className="text-sm"
                  data-testid="input-payment-notes"
                />
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Your payment will be reviewed by our team within 1–24 hours. You'll receive a notification once approved.
                  False submissions may result in account suspension.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)} data-testid="button-back-to-step1">← Back</Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold"
                  onClick={() => confirmPaymentMutation.mutate()}
                  disabled={confirmPaymentMutation.isPending || (!txHash && !receiptUrl)}
                  data-testid="button-confirm-payment"
                >
                  {confirmPaymentMutation.isPending ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span>
                  ) : (
                    <span className="flex items-center gap-2"><ReceiptText className="w-4 h-4" />Submit Payment for Review</span>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-slate-400">You need at least a transaction hash or receipt to submit.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Step 1: Review & Pay ──────────────────────────────────────────────────

  // Find the right bank transfer method
  const bankTransferMethod = paymentMethods?.find(
    m => m.type === "BANK_TRANSFER" && m.currency === escrow.currency && m.isActive
  ) || paymentMethods?.find(m => m.type === "BANK_TRANSFER" && m.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-xl mx-auto pt-6 pb-10">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-slate-600">Secured by Beagvs Escrow</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Payment</h1>
          <p className="text-slate-500 text-sm mt-1">Funds are held safely until delivery is confirmed</p>
        </div>

        <StepTracker step={1} />

        {/* Countdown timer */}
        <div className="mb-4">
          <CountdownTimer seconds={timeRemaining} />
        </div>

        {/* Role indicator */}
        <div className={`mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${isSeller ? "bg-purple-50 border-purple-200 text-purple-800" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
          <User className="w-4 h-4" />
          {isSeller ? "You are the Seller — this is a view of your buyer's checkout" : "You are the Buyer — complete payment below"}
        </div>

        {/* Listing summary */}
        <Card className="mb-4 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{escrow.listing?.title || "Listing"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{LISTING_TYPE_LABELS[escrow.listing?.type] || escrow.listing?.type}</p>
                {escrow.listing?.location && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {escrow.listing.location}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-slate-400">Seller</p>
                <p className="text-sm font-medium text-slate-700">{escrow.seller?.firstName || escrow.seller?.username || "Seller"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery address — PRODUCT listings, buyer only */}
        {isProductListing && isBuyer && (
          <Card className="mb-4 shadow-sm border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Delivery Address
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Where should we deliver your item?</p>
            </CardHeader>
            <CardContent>
              {/* Show saved address if already in escrow metadata */}
              {(() => {
                const saved = (escrow?.metadata as any)?.shipping?.address;
                const hasSaved = saved?.recipientName || saved?.city;
                if (hasSaved && !showShippingForm) {
                  return (
                    <div className="space-y-2">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium">{saved.recipientName}</p>
                          {saved.addressLine1 && <p className="text-xs">{saved.addressLine1}{saved.addressLine2 ? `, ${saved.addressLine2}` : ""}</p>}
                          <p className="text-xs">{[saved.city, saved.country, saved.postalCode].filter(Boolean).join(", ")}</p>
                          {saved.recipientPhone && <p className="text-xs text-green-700">{saved.recipientPhone}</p>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowShippingForm(true)} className="text-xs">
                        <MapPin className="w-3.5 h-3.5 mr-1" /> Edit Address
                      </Button>
                    </div>
                  );
                }
                if (!showShippingForm) {
                  return (
                    <Button onClick={() => setShowShippingForm(true)} className="w-full bg-blue-600 hover:bg-blue-700">
                      <MapPin className="w-4 h-4 mr-2" /> Add Delivery Address
                    </Button>
                  );
                }
                return (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Recipient Name *</label>
                        <Input value={shippingAddress.recipientName} onChange={e => setShippingAddress(p => ({ ...p, recipientName: e.target.value }))} placeholder="Full name" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Phone Number</label>
                        <Input value={shippingAddress.recipientPhone} onChange={e => setShippingAddress(p => ({ ...p, recipientPhone: e.target.value }))} placeholder="+234 800 000 0000" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Street Address *</label>
                        <Input value={shippingAddress.addressLine1} onChange={e => setShippingAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="Street, P.O. Box" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-slate-600 block mb-1">Address Line 2</label>
                        <Input value={shippingAddress.addressLine2} onChange={e => setShippingAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, suite (optional)" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">City *</label>
                        <Input value={shippingAddress.city} onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Country *</label>
                        <Input value={shippingAddress.country} onChange={e => setShippingAddress(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Postal / ZIP Code</label>
                        <Input value={shippingAddress.postalCode} onChange={e => setShippingAddress(p => ({ ...p, postalCode: e.target.value }))} placeholder="e.g. 100001" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" onClick={() => setShowShippingForm(false)} className="flex-1">Cancel</Button>
                      <Button
                        onClick={async () => {
                          if (!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country) {
                            toast({ title: "Please fill in required fields (Name, City, Country)", variant: "destructive" }); return;
                          }
                          try {
                            await apiRequest("PATCH", `/api/escrows/${escrowId}`, { shippingAddress });
                            toast({ title: "Delivery address saved!", description: "The seller will see your address." });
                            queryClient.invalidateQueries({ queryKey: ["/api/escrows", escrowId] });
                            setShowShippingForm(false);
                          } catch (e: any) { toast({ title: "Failed to save", description: e.message, variant: "destructive" }); }
                        }}
                        disabled={!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Truck className="w-4 h-4 mr-2" /> Save Address
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Shipping option selector — PRODUCT listings only */}
        {isProductListing && isBuyer && (
          <Card className="mb-4 shadow-sm border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" /> Select Delivery Option
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Choose how you'd like to receive your item</p>
            </CardHeader>
            <CardContent>
              {!shippingRates || shippingRates.length === 0 ? (
                <p className="text-sm text-slate-400">Loading shipping options…</p>
              ) : (
                <div className="space-y-2">
                  {shippingRates.filter((r: any) => r.isActive).map((rate: any) => {
                    const isSelected = selectedShippingOption === rate.option;
                    return (
                      <button
                        key={rate.id}
                        type="button"
                        onClick={() => setSelectedShippingOption(rate.option)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                        }`}
                        data-testid={`shipping-option-${rate.option}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{rate.name}</p>
                            {rate.description && <p className="text-xs text-slate-500">{rate.description}</p>}
                            {rate.estimatedDays && <p className="text-xs text-blue-600">{rate.estimatedDays}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                            {parseFloat(rate.price) === 0 ? 'Free' : `₦${parseFloat(rate.price).toLocaleString()}`}
                          </p>
                          {parseFloat(rate.price) > 0 && <p className="text-xs text-slate-400">{rate.currency}</p>}
                        </div>
                      </button>
                    );
                  })}
                  {selectedShippingOption && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-green-700">
                        <strong>{shippingRates.find((r: any) => r.option === selectedShippingOption)?.name}</strong> selected.
                        {selectedShippingOption !== 'SELF_PICKUP'
                          ? ' Our team will handle logistics after payment is confirmed.'
                          : ' Coordinate pickup location via the escrow chat after payment.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fee breakdown */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeeBreakdown
            escrow={escrow}
            selectedShippingRate={shippingRates?.find((r: any) => r.option === selectedShippingOption)}
          />
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" /> Payment Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Amount to send callout */}
            <div className="bg-blue-600 text-white rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-blue-200 mb-1">Send exactly this amount</p>
              <p className="text-3xl font-bold tabular-nums">
                {buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })}
              </p>
              <p className="text-blue-200 text-sm mt-0.5 flex items-center justify-center gap-1">
                <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
                <span className="mx-1">·</span>
                {NETWORK_LABELS[escrow.network] || escrow.network}
              </p>
            </div>

            {isFiatCurrency ? (
              /* ── Bank Transfer ─────────────────────────────────────────── */
              bankTransferMethod?.details ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-slate-500" /> Transfer to this bank account:
                  </p>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                    {[
                      { label: "Bank Name", value: bankTransferMethod.details.bankName },
                      { label: "Account Name", value: bankTransferMethod.details.accountName },
                      { label: "Account Number", value: bankTransferMethod.details.accountNumber, mono: true, copy: true },
                      { label: "Routing / Sort Code", value: bankTransferMethod.details.routingNumber, mono: true },
                      { label: "SWIFT / BIC", value: bankTransferMethod.details.swiftCode, mono: true },
                    ].filter(f => f.value).map(field => (
                      <div key={field.label} className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{field.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold text-slate-800 ${field.mono ? "font-mono" : ""}`}>{field.value}</span>
                          {field.copy && (
                            <button onClick={() => copyToClipboard(field.value, field.label)} className="text-blue-500 hover:text-blue-700 transition-colors" data-testid={`button-copy-${field.label.replace(/\s+/g, "-").toLowerCase()}`}>
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {bankTransferMethod.instructions && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{bankTransferMethod.instructions}</p>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Use your <strong>Escrow ID ({escrow.id?.slice(0, 8)}…)</strong> as the payment reference so we can match your transfer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Bank details not configured for {escrow.currency}</p>
                    <p className="text-xs text-orange-600 mt-0.5">Please contact support with your Escrow ID: <strong>{escrow.id?.slice(0, 8)}…</strong></p>
                  </div>
                </div>
              )
            ) : escrow.currency === "PI" ? (
              /* ── Pi Network (native SDK payment) ─────────────────────────── */
              <div className="space-y-3">
                {isBuyer ? (
                  <>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                      <img src="https://minepi.com/favicon.ico" alt="Pi" className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-purple-900">Pay directly with your Pi wallet</p>
                        <p className="text-xs text-purple-700 mt-0.5">
                          Tap the button below to open your Pi Wallet and confirm the payment. Funds are verified on the Pi blockchain and released to escrow automatically — no manual review needed.
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 font-semibold"
                      onClick={handlePayWithPi}
                      disabled={piPaying || piCompleteMutation.isPending}
                      data-testid="button-pay-with-pi"
                    >
                      {piPaying || piCompleteMutation.isPending ? (
                        <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing Pi Payment…</span>
                      ) : (
                        <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />Pay {buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} π with Pi</span>
                      )}
                    </Button>
                    {!isPiBrowser() && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">Open this checkout page inside the <strong>Pi Browser</strong> app to complete a Pi payment.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-sm text-slate-600">Waiting for the buyer to complete payment via their Pi Wallet.</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Crypto ────────────────────────────────────────────────── */
              platformWallet ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-500" /> Send to this wallet address:
                  </p>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Wallet Address</p>
                        <p className="font-mono text-sm break-all text-slate-800 leading-relaxed" data-testid="text-wallet-address">
                          {platformWallet.address}
                        </p>
                      </div>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => copyToClipboard(platformWallet.address, "Wallet address")}
                        className="flex-shrink-0 mt-5"
                        data-testid="button-copy-wallet"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                      </Button>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Send <strong>exactly</strong> {buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency} on the <strong>{NETWORK_LABELS[escrow.network] || escrow.network}</strong> network. Sending to the wrong network may result in permanent loss of funds.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">Wallet not configured for this network</p>
                    <p className="text-xs text-orange-600 mt-0.5">Contact support with Escrow ID: <strong>{escrow.id?.slice(0, 8)}…</strong></p>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Seller guidance card (if viewer is seller) */}
        {isSeller && (
          <Card className="mb-4 border-purple-200 bg-purple-50/50 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-purple-800 flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4" /> Seller — Your Payout Summary
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-600">Buyer Sends</span>
                  <span className="font-medium text-purple-800">{buyerTotal.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Platform Fee ({feePct}%)</span>
                  <span className="text-red-500">− {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between font-semibold">
                  <span className="text-purple-800">You Receive</span>
                  <span className="text-emerald-700">{sellerReceives.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}</span>
                </div>
              </div>
              <p className="text-xs text-purple-500 mt-2">Payment released by admin once buyer confirms delivery.</p>
            </CardContent>
          </Card>
        )}

        {/* Confirm Payment CTA */}
        {isBuyer && (
          <Card className="shadow-md border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Have you sent the payment?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Click below only after completing your transfer. This activates secure chat with the seller.</p>
                </div>
              </div>

              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold py-3 text-base"
                onClick={async () => {
                  // Only PATCH when the selection has changed from what's already persisted
                  const persistedOption = (escrow?.metadata as any)?.shipping?.option;
                  if (selectedShippingOption && selectedShippingOption !== persistedOption) {
                    try {
                      const selectedRate = shippingRates?.find((r: any) => r.option === selectedShippingOption);
                      await apiRequest("PATCH", `/api/escrows/${escrowId}`, {
                        shippingOption: selectedShippingOption,
                        shippingCost: selectedRate?.price || "0",
                        shippingFee: selectedRate?.price || "0",
                        shippingFeeCurrency: selectedRate?.currency || "NGN",
                      });
                    } catch { /* shipping option also included in confirmPaymentMutation as a fallback */ }
                  }
                  setStep(2);
                }}
                disabled={timeRemaining === 0 || (isProductListing && isBuyer && !!shippingRates?.length && !selectedShippingOption)}
                data-testid="button-i-have-paid"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                I've Completed the Payment →
              </Button>
              {isProductListing && isBuyer && !!shippingRates?.length && !selectedShippingOption && (
                <p className="text-xs text-orange-600 text-center mt-1">Please select a delivery option above to continue.</p>
              )}

              {timeRemaining === 0 && (
                <p className="text-xs text-red-500 text-center mt-2">
                  Time expired — contact support if you've already sent payment.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back to listing */}
        <div className="mt-5 text-center">
          <a href={`/listing/${escrow.listing?.slug || escrow.listingId}`}>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
              ← Back to Listing
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
