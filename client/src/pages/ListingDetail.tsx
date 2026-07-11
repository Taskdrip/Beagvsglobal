import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import EscrowProgress from "@/components/EscrowProgress";
import CryptoIcon from "@/components/CryptoIcon";
import GuestCheckoutAuth from "@/components/GuestCheckoutAuth";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  MapPin,
  MessageCircle,
  UserPlus,
  Star,
  Shield,
  Calendar,
  Package,
  DollarSign,
  Eye,
  Heart,
  Share2,
  Flag,
  ArrowLeft,
  CheckCircle,
  Bed,
  Bath,
  Square,
  FileText,
  Phone
} from "lucide-react";

const FEE_KEY_MAP: Record<string, string> = {
  REAL_ESTATE: 'fee_real_estate',
  SHIPPING_SERVICE: 'fee_shipping_service',
  PRODUCT: 'fee_product',
  SERVICE: 'fee_service',
};
const DEFAULT_FEES: Record<string, number> = { REAL_ESTATE: 5, SHIPPING_SERVICE: 8, PRODUCT: 10, SERVICE: 10 };

function EscrowConfirmBreakdown({ listing, onConfirm, onCancel, isPending }: {
  listing: any; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  const { data: platformSettings } = useQuery<any[]>({ queryKey: ["/api/platform-settings"] });

  const feeKey = FEE_KEY_MAP[listing?.type] || 'fee_product';
  const feeSettingRaw = platformSettings?.find((s: any) => s.key === feeKey);
  // Fee settings are stored as jsonb, e.g. { percentage: 10 } — reading the
  // whole object with String() used to produce "[object Object]" -> NaN.
  const rawFeeValue = feeSettingRaw?.value;
  const parsedFeePct = Number(
    rawFeeValue && typeof rawFeeValue === "object" ? (rawFeeValue as any).percentage : rawFeeValue
  );
  const feePct = !isNaN(parsedFeePct) ? parsedFeePct : (DEFAULT_FEES[listing?.type] ?? 10);

  const price = parseFloat(listing?.priceCrypto || "0");
  const feeAmount = price * (feePct / 100);
  const sellerReceives = price - feeAmount;

  const NETWORK_LABELS: Record<string, string> = {
    PI_MAINNET: "Pi Network", TRON: "USDT · TRON", TON: "USDT · TON",
    BNB: "USDT · BNB Chain", SOL: "USDT · Solana", AVAX: "USDT · Avalanche",
    BANK_TRANSFER: "Bank Transfer",
  };

  const TYPE_LABELS: Record<string, string> = {
    REAL_ESTATE: "Real Estate", SHIPPING_SERVICE: "Shipping Service",
    PRODUCT: "Product", SERVICE: "Service",
  };

  return (
    <div className="space-y-4 pt-1">
      {/* What you're buying */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{TYPE_LABELS[listing?.type] || listing?.type}</p>
        <p className="font-semibold text-slate-900">{listing?.title}</p>
        {listing?.location && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{listing.location}</p>}
        <div className="mt-2 flex items-center gap-1 text-sm font-medium text-slate-500">
          <span>Payment via:</span>
          <span className="text-slate-700 font-semibold">{NETWORK_LABELS[listing?.network] || listing?.network}</span>
          <CryptoIcon currency={listing?.currency} showLabel={false} size="sm" />
          <span>{listing?.currency}</span>
        </div>
      </div>

      {/* Fee breakdown */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Item Price <span className="text-xs text-slate-400">(you pay)</span></span>
          <div className="flex items-center gap-1 font-bold text-slate-900">
            {price.toLocaleString()} <CryptoIcon currency={listing?.currency} showLabel={false} size="sm" /> {listing?.currency}
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 flex items-center gap-1">
            Platform Fee
            <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full font-medium">{feePct}%</span>
            <span className="text-xs text-slate-400">(deducted from seller)</span>
          </span>
          <span className="text-slate-500 text-sm">− {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {listing?.currency}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-700 text-sm">💸 Amount You Send</span>
          <div className="flex items-center gap-1 font-bold text-blue-700 text-lg">
            {price.toLocaleString()} <CryptoIcon currency={listing?.currency} showLabel={false} size="sm" /> {listing?.currency}
          </div>
        </div>
      </div>

      {/* Escrow guarantee */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-emerald-800">
            <strong>Escrow Protected</strong> — Your payment is held safely until the transaction completes. The platform fee ({feePct}%) is deducted from the seller's payout; you pay only the listed price.
          </div>
        </div>
        <div className="text-xs text-emerald-700 ml-6">
          Seller receives: <strong>{sellerReceives.toLocaleString(undefined, { maximumFractionDigits: 8 })} {listing?.currency}</strong> after fee
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isPending} data-testid="button-cancel-escrow">
          Cancel
        </Button>
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onConfirm} disabled={isPending} data-testid="button-confirm-escrow">
          {isPending ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</span>
          ) : (
            <span className="flex items-center gap-2"><Shield className="w-4 h-4" />Proceed to Checkout</span>
          )}
        </Button>
      </div>
    </div>
  );
}

const WHATSAPP_NUMBER = "2348037232210";

function getWhatsAppUrl(listing: any) {
  const message = encodeURIComponent(
    `Hi! I'm interested in your property:\n*${listing.title}*\nLocation: ${listing.location || "N/A"}\nPrice: ${listing.currency} ${parseFloat(listing.priceCrypto || "0").toLocaleString()}\n\nPlease send me more details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().min(1, "Please write a comment"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ListingDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showEscrowDialog, setShowEscrowDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [escrowDialogStep, setEscrowDialogStep] = useState<"auth" | "confirm">("confirm");

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ["/api/listings/slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/listings/slug/${encodeURIComponent(slug!)}`, {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 404) return null;
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    enabled: !!slug,
    retry: 1,
  });

  const { data: platformWallet } = useQuery({
    queryKey: ["/api/platform-wallets/currency", listing?.currency, "network", listing?.network],
    enabled: !!(listing && listing.currency && listing.network),
  });

  const { data: followStatus } = useQuery({
    queryKey: ["/api/follows/status", listing?.seller?.id],
    enabled: !!(listing && listing.seller && listing.seller.id) && isAuthenticated && listing.seller.id !== user?.id,
  });

  const { data: userEscrows } = useQuery({
    queryKey: ["/api/user/escrows"],
    enabled: isAuthenticated,
  });

  // Check if user has created an escrow for this listing
  const hasEscrow = userEscrows?.some((escrow: any) => escrow.listingId === listing?.id);

  // Scroll to top when component loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const createEscrowMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !listing.id) return;
      const response = await apiRequest("POST", "/api/escrows", {
        listingId: listing.id,
        sellerId: listing.sellerId,
        amount: listing.priceCrypto,
        currency: listing.currency,
        network: listing.network,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Escrow created successfully",
        description: "Redirecting to secure checkout...",
      });
      setShowEscrowDialog(false);
      // Use the wouter navigate hook (declared below) so the React Query cache is
      // preserved and the checkout page loads without a full page reload.
      // The navigate reference is captured via the closure; it is assigned at line ~322.
      setTimeout(() => navigate(`/checkout/${data.id}`), 500);
    },
    onError: (error: any) => {
      // Check if error starts with "401:" which is the format from the API
      if (error.message.startsWith("401:") || error.message.includes("Unauthorized")) {
        toast({
          title: "Authentication required",
          description: "Please sign in to continue",
          variant: "destructive",
        });
        navigate("/login");
      } else {
        toast({
          title: "Failed to create escrow",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !listing.seller || !listing.seller.id) return;
      await apiRequest("POST", "/api/follows", {
        followeeId: listing.seller.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Follow request sent",
        description: "The user will be notified of your follow request",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/follows/status", listing?.seller?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send follow request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!listing || !listing.id) return;
      await apiRequest("POST", "/api/reviews", {
        listingId: listing.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review posted successfully",
        description: "Thank you for your feedback!",
      });
      setShowReviewDialog(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/listings/slug", slug] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post review",
        description: error.message,
        variant: "destructive",
      });
    },
  });


  const handleCreateEscrow = () => {
    createEscrowMutation.mutate();
  };

  const [, navigate] = useLocation();

  const handleOpenEscrowDialog = () => {
    if (!isAuthenticated) {
      navigate(`/buy/${slug}`);
      return;
    }
    setEscrowDialogStep("confirm");
    setShowEscrowDialog(true);
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate();
  };

  const handleReview = (data: ReviewFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="h-96 bg-slate-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Something went wrong</h1>
          <p className="text-slate-medium mb-8">We couldn't load this listing. Please try again.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
            <Link href="/real-estate">
              <Button variant="outline">Browse Properties</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && !listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Listing not found</h1>
          <p className="text-slate-medium mb-8">The listing you're looking for doesn't exist or has been removed.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/real-estate">
              <Button>Browse Properties</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline">Browse Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing?.sellerId;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-4 sm:mb-6">
          <Link href={listing?.type === "REAL_ESTATE" ? "/real-estate" : "/marketplace"}>
            <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              <span>{listing?.type === "REAL_ESTATE" ? "Back to Real Estate" : "Back to Marketplace"}</span>
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div>
                    <div className="relative h-56 sm:h-72 md:h-96 overflow-hidden rounded-t-lg">
                      <img
                        src={listing.images[selectedImageIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        data-testid="img-listing-main"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-full h-full bg-slate-200 flex items-center justify-center" 
                        style={{display: 'none'}}
                      >
                        <Package className="w-16 h-16 text-slate-400" />
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          listing.type === 'REAL_ESTATE' ? 'bg-green-100 text-green-800' :
                          listing.type === 'SHIPPING_SERVICE' ? 'bg-blue-100 text-blue-800' :
                          listing.type === 'PRODUCT' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {listing.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2"
                          data-testid="button-favorite"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/90 backdrop-blur-sm rounded-full p-2"
                          data-testid="button-share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {listing.images.length > 1 && (
                      <div className="flex space-x-2 p-4 overflow-x-auto">
                        {listing.images.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                              selectedImageIndex === index ? 'border-crypto-blue' : 'border-slate-200'
                            }`}
                            data-testid={`button-image-${index}`}
                          >
                            <img 
                              src={image} 
                              alt={`${listing.title} ${index + 1}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const button = target.closest('button');
                                if (button) {
                                  button.innerHTML = '<div class="w-full h-full bg-slate-200 flex items-center justify-center"><svg class="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20,6H16L14,4H10L8,6H4A2,2 0 0,0 2,8V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8A2,2 0 0,0 20,6Z" /></svg></div>';
                                }
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-56 sm:h-72 md:h-96 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Video */}
            {listing.videoUrl && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-dark flex items-center gap-2">
                    <span className="text-lg">🎬</span> Property Video Tour
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-4 px-4">
                  <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: "56.25%" }}>
                    <iframe
                      className="absolute inset-0 w-full h-full rounded-lg"
                      src={(() => {
                        const url = listing.videoUrl || "";
                        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
                        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
                        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                        return url;
                      })()}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      data-testid="iframe-listing-video"
                      title="Property video tour"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-dark" data-testid="text-listing-title">
                  {listing.title}
                </CardTitle>
                {listing.location && (
                  <p className="text-slate-medium flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-slate-dark whitespace-pre-wrap" data-testid="text-listing-description">
                    {listing.description}
                  </p>
                </div>

                {/* Property Specs (Real Estate) */}
                {listing.type === "REAL_ESTATE" && listing.metadata && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-dark mb-4">Property Details</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-5">
                      {listing.metadata.bedrooms && (
                        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                          <Bed className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{listing.metadata.bedrooms} Bedrooms</span>
                        </div>
                      )}
                      {listing.metadata.bathrooms && (
                        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                          <Bath className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{listing.metadata.bathrooms} Bathrooms</span>
                        </div>
                      )}
                      {listing.metadata.areaSqft && (
                        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                          <Square className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{Number(listing.metadata.areaSqft).toLocaleString()} sqft</span>
                        </div>
                      )}
                      {listing.metadata.propertyTitle && (
                        <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-xs">{listing.metadata.propertyTitle}</span>
                        </div>
                      )}
                    </div>

                    {/* Facilities */}
                    {listing.metadata.facilities?.length > 0 && (
                      <div className="mb-5">
                        <h5 className="font-semibold text-slate-700 mb-3">Facilities</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {listing.metadata.facilities.map((f: string) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {listing.metadata.amenities?.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-slate-700 mb-3">Amenities</h5>
                        <div className="flex flex-wrap gap-2">
                          {listing.metadata.amenities.map((a: string) => (
                            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-medium">Category</p>
                      <p className="font-medium text-slate-dark">
                        {listing.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Network</p>
                      <p className="font-medium text-slate-dark">{listing.network}</p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Listed</p>
                      <p className="font-medium text-slate-dark">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-medium">Views</p>
                      <p className="font-medium text-slate-dark flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {Math.floor(Math.random() * 500) + 50}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp CTA Banner */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Enquire on WhatsApp</p>
                    <p className="text-xs text-green-700">Chat directly with our agent — fast response guaranteed</p>
                  </div>
                  <a
                    href={getWhatsAppUrl(listing)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="button-whatsapp-detail"
                  >
                    <Button className="bg-green-500 hover:bg-green-600 text-white gap-2 whitespace-nowrap">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Us
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Seller Info and Actions */}
          <div className="space-y-6">
            {/* Price and Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <CryptoIcon currency={listing.currency} size="md" />
                      <span className="text-xs text-slate-medium">{listing.network}</span>
                    </div>
                    <CardTitle className="text-3xl font-bold text-slate-dark" data-testid="text-listing-price">
                      {parseFloat(listing.priceCrypto).toLocaleString()}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isOwner ? (
                  <>
                    {/* WhatsApp Enquiry Button */}
                    <a
                      href={getWhatsAppUrl(listing)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="button-whatsapp-sidebar"
                    >
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold gap-2" size="lg">
                        <MessageCircle className="w-4 h-4" />
                        Enquire on WhatsApp
                      </Button>
                    </a>

                    {/* Buy via Escrow — open to all, auth inline */}
                    <Button 
                      className="w-full bg-crypto-blue hover:bg-crypto-teal font-semibold" 
                      size="lg"
                      data-testid="button-buy-escrow"
                      onClick={handleOpenEscrowDialog}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Buy via Escrow
                    </Button>

                    <Dialog open={showEscrowDialog} onOpenChange={(open) => { setShowEscrowDialog(open); if (!open) setEscrowDialogStep(isAuthenticated ? "confirm" : "auth"); }}>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            {escrowDialogStep === "auth" ? "Create Account to Continue" : "Secure Escrow Checkout"}
                          </DialogTitle>
                        </DialogHeader>

                        {escrowDialogStep === "auth" ? (
                          <GuestCheckoutAuth
                            ctaContext={`Sign in or create a free account to buy "${listing?.title}" via secure escrow.`}
                            onAuthSuccess={() => {
                              setEscrowDialogStep("confirm");
                            }}
                          />
                        ) : (
                          <EscrowConfirmBreakdown
                            listing={listing}
                            onConfirm={handleCreateEscrow}
                            onCancel={() => setShowEscrowDialog(false)}
                            isPending={createEscrowMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    {!isAuthenticated ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full border-crypto-blue text-crypto-blue hover:bg-blue-50"
                            data-testid="button-login-to-chat"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat with Seller
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 text-blue-600" />
                              Sign In to Chat
                            </DialogTitle>
                          </DialogHeader>
                          <GuestCheckoutAuth
                            ctaContext="Create a free account or sign in to chat with the seller."
                            onAuthSuccess={async () => {
                              await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
                              await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    ) : hasEscrow ? (
                      <Link href={`/chat/${listing.id}`}>
                        <Button 
                          variant="outline" 
                          className="w-full border-green-500 text-green-600 hover:bg-green-50"
                          data-testid="button-open-chat"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Open Escrow Chat
                        </Button>
                      </Link>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700 font-medium mb-2">💬 Secure Chat Available</p>
                        <p className="text-xs text-blue-600">
                          Chat will be enabled after you create an escrow transaction. This ensures secure communication between all parties.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">This is your listing</p>
                    <div className="mt-3 space-y-2">
                      <Link href={`/sell/${listing.id}/edit`}>
                        <Button variant="outline" className="w-full" data-testid="button-edit-listing">
                          Edit Listing
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            {listing.seller && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seller Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      {listing.seller.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <Link href={`/profile/${listing.seller.id}`}>
                        <h4 className="font-semibold text-slate-dark hover:text-crypto-blue cursor-pointer">
                          {listing.seller.username}
                        </h4>
                      </Link>
                      <p className="text-sm text-slate-medium">
                        {listing.seller.firstName} {listing.seller.lastName}
                      </p>
                    </div>
                  </div>

                  {listing.seller.bio && (
                    <p className="text-sm text-slate-medium">{listing.seller.bio}</p>
                  )}

                  <div className="text-sm text-slate-medium">
                    <p>Member since {new Date(listing.seller.createdAt).toLocaleDateString()}</p>
                    <p>{listing.seller.location}</p>
                  </div>

                  {!isOwner && isAuthenticated && (
                    <div className="pt-4 border-t border-slate-200">
                      {!followStatus ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleFollow}
                          disabled={followMutation.isPending}
                          data-testid="button-follow"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {followMutation.isPending ? "Sending..." : "Follow Seller"}
                        </Button>
                      ) : (
                        <div className="text-center py-2">
                          <span className="text-sm text-slate-medium">
                            {followStatus.status === 'PENDING' ? 'Follow request sent' : 
                             followStatus.status === 'ACCEPTED' ? 'Following' : 
                             'Follow request rejected'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Reviews ({listing.reviews?.length || 0})</span>
                </CardTitle>
                {isAuthenticated && !isOwner && (
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-write-review">Write Review</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Write a Review</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={reviewForm.handleSubmit(handleReview)} className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="mt-2">
                            <StarRating
                              rating={reviewForm.watch("rating")}
                              onRatingChange={(rating) => reviewForm.setValue("rating", rating)}
                              size="lg"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label>Comment</Label>
                          <Textarea
                            {...reviewForm.register("comment")}
                            placeholder="Share your experience with this listing..."
                            className="mt-1"
                            rows={4}
                            data-testid="input-review-comment"
                          />
                          {reviewForm.formState.errors.comment && (
                            <p className="text-sm text-red-600 mt-1">
                              {reviewForm.formState.errors.comment.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowReviewDialog(false)}
                            data-testid="button-cancel-review"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={createReviewMutation.isPending}
                            data-testid="button-submit-review"
                          >
                            {createReviewMutation.isPending ? "Posting..." : "Post Review"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {listing.reviews && listing.reviews.length > 0 ? (
                <div className="space-y-6">
                  {listing.reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-slate-200 last:border-b-0 pb-6 last:pb-0" data-testid={`review-${review.id}`}>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          {review.reviewer?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-slate-dark">{review.reviewer?.username}</h4>
                            <StarRating rating={review.rating} size="sm" readonly />
                            <span className="text-sm text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-medium">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-dark mb-2">No reviews yet</h3>
                  <p className="text-slate-medium">Be the first to review this listing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
