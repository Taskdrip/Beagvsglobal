import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, Copy, CheckCircle, MessageCircle, Shield, AlertCircle, Package,
  MapPin, Truck, ChevronRight, Info, Lock, Banknote, Wallet, ArrowRight,
  RefreshCw, User, Building2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import CryptoIcon from "@/components/CryptoIcon";

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

function FeeBreakdown({ escrow, isSeller }: { escrow: any; isSeller?: boolean }) {
  const amount = parseFloat(escrow.amount || "0");
  const feePct = parseFloat(escrow.platformFeePct || "10");
  const feeAmount = amount * (feePct / 100);
  const sellerReceives = amount - feeAmount;

  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600">
          Item Price {!isSeller && <span className="text-xs text-slate-400">(what you pay)</span>}
        </span>
        <div className="flex items-center gap-1 font-semibold text-slate-800">
          {amount.toLocaleString()} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-500 flex items-center gap-1.5">
          Platform Service Fee
          <Badge variant="outline" className="text-xs font-medium text-orange-700 border-orange-200 bg-orange-50 py-0">{feePct}%</Badge>
          <span className="text-xs text-slate-400">(deducted from seller)</span>
        </span>
        <span className="text-slate-500">− {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency}</span>
      </div>

      <Separator />

      {/* Buyer row */}
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-1.5 font-semibold text-blue-700 text-sm">
          <User className="w-4 h-4" /> You Send
        </span>
        <div className="flex items-center gap-1 font-bold text-blue-700 text-lg">
          {amount.toLocaleString()} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
        </div>
      </div>

      {/* Seller row */}
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
  const { user, isAuthenticated } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: "", recipientPhone: "", addressLine1: "", addressLine2: "",
    city: "", country: "", postalCode: "",
  });

  const { data: escrow, isLoading } = useQuery<any>({
    queryKey: ["/api/escrows", escrowId],
    enabled: !!escrowId && isAuthenticated,
    refetchInterval: 30000,
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

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/escrows/${escrowId}`, { status: "FUNDED" });
    },
    onSuccess: () => {
      setPaymentConfirmed(true);
      setStep(3);
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      toast({ title: "Payment confirmed!", description: "Secure chat is now active. Redirecting…" });
      setTimeout(() => {
        if (escrow) {
          apiRequest("POST", "/api/chat/threads", {
            listingId: escrow.listingId, sellerId: escrow.sellerId, escrowId: escrow.id,
          }).then(() => { window.location.href = `/chat/${escrow.listingId}`; });
        }
      }, 2500);
    },
    onError: (error: any) => {
      toast({ title: "Failed to confirm payment", description: error.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${label} copied to clipboard` });
    });
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Sign In Required</h2>
            <p className="text-slate-500 mb-6">You need to be signed in to access the checkout page.</p>
            <a href="/api/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign In to Continue</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────

  const isFiatCurrency = ["USD", "EUR", "GBP", "CAD", "NGN"].includes(escrow?.currency || "");

  if (isLoading || !escrow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading checkout…</p>
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

  // ─── Step 3: Success state ─────────────────────────────────────────────────

  if (step === 3 || paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 space-y-5">
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-700 mb-2">Payment Confirmed!</h1>
              <p className="text-slate-600 mb-4">Your escrow transaction is now active and funds are secured.</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Amount Paid", value: `${amount.toLocaleString()} ${escrow.currency}` },
                  { label: "Transaction", value: escrow.id?.slice(0, 8) + "…" },
                  { label: "Status", value: "Funded" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-slate-800 text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-left">
                <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
                  <MessageCircle className="w-4 h-4" /> Secure Chat Activated
                </div>
                <p className="text-sm text-green-600">You can now communicate securely with {isBuyer ? "the seller" : "the buyer"} via escrow-protected chat.</p>
              </div>

              <p className="text-sm text-slate-400 animate-pulse">Redirecting to chat…</p>
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
                            await apiRequest("PATCH", `/api/escrows/${escrowId}`, { metadata: { shippingAddress } });
                            toast({ title: "Delivery address saved!", description: "The seller has been notified." });
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

  // ─── Step 2: Confirm payment ───────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-xl mx-auto pt-6">
          <StepTracker step={2} />

          <Card className="shadow-lg mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="w-5 h-5 text-blue-600" /> Confirm Payment Sent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800">Payment Summary</p>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">{escrow.listing?.title || "Item"}</span>
                  <span className="font-bold text-blue-800 flex items-center gap-1">
                    {amount.toLocaleString()} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-blue-500">
                  <span>via {NETWORK_LABELS[escrow.network] || escrow.network}</span>
                  <span>Escrow ID: {escrow.id?.slice(0, 8)}…</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {[
                  `I have sent exactly ${amount.toLocaleString()} ${escrow.currency} to the provided ${isFiatCurrency ? "bank account" : "wallet address"}`,
                  "I understand funds are held in escrow until the transaction is verified",
                  "I agree that false payment confirmations may result in account suspension",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-slate-50 rounded-lg p-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">{text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  onClick={() => confirmPaymentMutation.mutate()}
                  disabled={confirmPaymentMutation.isPending}
                  data-testid="button-confirm-payment"
                >
                  {confirmPaymentMutation.isPending ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming…</span>
                  ) : (
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />Yes, Payment Sent</span>
                  )}
                </Button>
              </div>
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

        {/* Fee breakdown */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Payment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FeeBreakdown escrow={escrow} />
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
                {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
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
                      Send <strong>exactly</strong> {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {escrow.currency} on the <strong>{NETWORK_LABELS[escrow.network] || escrow.network}</strong> network. Sending to the wrong network may result in permanent loss of funds.
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
                  <span className="font-medium text-purple-800">{amount.toLocaleString()} {escrow.currency}</span>
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
                onClick={() => setStep(2)}
                disabled={timeRemaining === 0}
                data-testid="button-i-have-paid"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                I've Completed the Payment →
              </Button>

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
