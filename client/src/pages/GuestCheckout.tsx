import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Shield, MapPin, CheckCircle, Loader2, Lock, ArrowRight, Home, Package,
  Truck, Briefcase, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import GuestCheckoutAuth from "@/components/GuestCheckoutAuth";
import CryptoIcon from "@/components/CryptoIcon";
import { Link } from "wouter";

const FEE_KEY_MAP: Record<string, string> = {
  REAL_ESTATE: "fee_real_estate",
  SHIPPING_SERVICE: "fee_shipping_service",
  PRODUCT: "fee_product",
  SERVICE: "fee_service",
};
const DEFAULT_FEES: Record<string, number> = {
  REAL_ESTATE: 5, SHIPPING_SERVICE: 8, PRODUCT: 10, SERVICE: 10,
};
const NETWORK_LABELS: Record<string, string> = {
  PI_MAINNET: "Pi Network", TRON: "USDT · TRON", TON: "USDT · TON",
  BNB: "USDT · BNB Chain", SOL: "USDT · Solana", AVAX: "USDT · Avalanche",
  BANK_TRANSFER: "Bank Transfer",
};
const TYPE_ICONS: Record<string, any> = {
  REAL_ESTATE: Home, PRODUCT: Package, SHIPPING_SERVICE: Truck, SERVICE: Briefcase,
};
const TYPE_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate", SHIPPING_SERVICE: "Shipping Service",
  PRODUCT: "Product", SERVICE: "Service",
};

export default function GuestCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  // authComplete tracks whether the user just finished the inline auth form so
  // we know to immediately create the escrow (vs. the user already being logged in).

  const { data: listing, isLoading: listingLoading } = useQuery<any>({
    queryKey: ["/api/listings/slug", slug],
    queryFn: getQueryFn({ on401: "returnNull", on404: "returnNull" }),
    enabled: !!slug,
  });

  const { data: platformSettings } = useQuery<any[]>({
    queryKey: ["/api/platform-settings"],
  });

  const feeKey = FEE_KEY_MAP[listing?.type] || "fee_product";
  const feePct = (() => {
    const raw = platformSettings?.find((s: any) => s.key === feeKey);
    return raw ? parseFloat(String(raw.value)) : (DEFAULT_FEES[listing?.type] ?? 10);
  })();
  const price = parseFloat(listing?.priceCrypto || "0");
  const feeAmount = price * (feePct / 100);
  const sellerReceives = price - feeAmount;

  const createEscrowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/escrows", {
        listingId: listing.id,
        sellerId: listing.sellerId || listing.seller?.id,
        amount: listing.priceCrypto,
        currency: listing.currency,
        network: listing.network,
      });
      return res.json();
    },
    onSuccess: (escrow: any) => {
      navigate(`/checkout/${escrow.id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to start checkout",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // No useEffect needed — createEscrowMutation.mutate() is called directly from
  // onAuthSuccess once the auth state is confirmed. A useEffect approach caused
  // potential double-mutations if the mutation hadn't started before the effect ran.

  const TypeIcon = TYPE_ICONS[listing?.type] || Package;
  const isLoading = listingLoading || authLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <p className="text-slate-600 mb-4">Listing not found.</p>
            <Link href="/marketplace">
              <Button variant="outline">Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-lg mx-auto pt-6 pb-16 space-y-4">

        {/* Back link */}
        <Link href={`/listing/${slug}`}>
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to listing
          </button>
        </Link>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-sm mb-3">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-slate-600">Secured by Beagvs Escrow</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAuthenticated
              ? "Review your order and confirm to proceed to payment."
              : "Create a free account or sign in — it only takes a minute."}
          </p>
        </div>

        {/* Listing card */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 rounded-lg border flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {TYPE_LABELS[listing.type] || listing.type}
                </p>
                <h2 className="font-semibold text-slate-900 line-clamp-2 mt-0.5">{listing.title}</h2>
                {listing.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {listing.location}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  via {NETWORK_LABELS[listing.network] || listing.network}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price breakdown */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm">Order Summary</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Item price <span className="text-xs text-slate-400">(you pay)</span></span>
              <div className="flex items-center gap-1 font-bold text-slate-900">
                {price.toLocaleString()} <CryptoIcon currency={listing.currency} showLabel={false} size="sm" /> {listing.currency}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 flex items-center gap-1">
                Platform fee
                <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full font-medium">{feePct}%</span>
                <span className="text-xs text-slate-400">(from seller)</span>
              </span>
              <span className="text-slate-400 text-sm">
                − {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {listing.currency}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-700 text-sm">You send</span>
              <div className="flex items-center gap-1 font-bold text-blue-700 text-lg">
                {price.toLocaleString()} <CryptoIcon currency={listing.currency} showLabel={false} size="sm" /> {listing.currency}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-1">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-emerald-800">
                  <strong>Escrow Protected</strong> — Your {price.toLocaleString()} {listing.currency} is held securely until you confirm delivery. The platform fee is deducted from the seller's payout only.
                </div>
              </div>
              <p className="text-xs text-emerald-700 mt-1.5 ml-6">
                Seller receives: <strong>{sellerReceives.toLocaleString(undefined, { maximumFractionDigits: 8 })} {listing.currency}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auth or Confirm */}
        {isAuthenticated ? (
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-5"
                onClick={() => createEscrowMutation.mutate()}
                disabled={createEscrowMutation.isPending}
                data-testid="button-confirm-proceed"
              >
                {createEscrowMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating secure checkout…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Confirm & Proceed to Payment
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-5">
              {createEscrowMutation.isPending ? (
                <div className="text-center py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">Creating your secure checkout…</p>
                  <p className="text-sm text-slate-400 mt-1">You'll be redirected to payment in a moment.</p>
                </div>
              ) : (
                <GuestCheckoutAuth
                  ctaContext={`Sign in or create a free account to buy "${listing.title}" via secure escrow. Takes under a minute.`}
                  onAuthSuccess={async () => {
                    // Ensure the auth cache is fresh before creating the escrow so
                    // the server-side session is recognised on the next API call.
                    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                    await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                    // Create the escrow immediately — the session cookie is now set.
                    createEscrowMutation.mutate();
                  }}
                  defaultTab="signup"
                />
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Your details are encrypted and never shared with third parties
        </p>
      </div>
    </div>
  );
}
