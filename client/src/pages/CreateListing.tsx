import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Upload, X, Loader2, Video, TrendingDown, Info, CheckCircle2 } from "lucide-react";

const listingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  type: z.enum(["REAL_ESTATE", "SHIPPING_SERVICE", "PRODUCT", "SERVICE"], {
    required_error: "Please select a listing type",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priceCrypto: z.string().min(1, "Price is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Price must be a positive number"
  ),
  currency: z.enum(["PI", "USDT", "USD", "NGN", "EUR", "GBP", "CAD"], {
    required_error: "Please select a currency",
  }),
  network: z.enum(["PI_MAINNET", "TRON", "TON", "BNB", "SOL", "AVAX", "BANK_TRANSFER"], {
    required_error: "Please select a network",
  }),
  location: z.string().optional(),
  videoUrl: z.string().url("Must be a valid URL (YouTube, Vimeo, etc.)").optional().or(z.literal("")),
  images: z.array(z.string()).default([]),
});

type ListingFormData = z.infer<typeof listingSchema>;

async function uploadImageToServer(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const response = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ base64, filename: file.name }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || "Upload failed");
        }
        const { url } = await response.json();
        resolve(url);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

const FEE_KEY_MAP: Record<string, string> = {
  REAL_ESTATE: 'fee_real_estate',
  SHIPPING_SERVICE: 'fee_shipping_service',
  PRODUCT: 'fee_product',
  SERVICE: 'fee_service',
};

const DEFAULT_FEES: Record<string, number> = {
  REAL_ESTATE: 5,
  SHIPPING_SERVICE: 8,
  PRODUCT: 10,
  SERVICE: 10,
};

function SellerFeeBreakdown({ price, currency, listingType, network }: {
  price: string;
  currency: string;
  listingType: string;
  network: string;
}) {
  const { data: platformSettings } = useQuery<any[]>({
    queryKey: ["/api/platform-settings"],
  });

  const feeKey = FEE_KEY_MAP[listingType] || 'fee_product';
  const feeSettingRaw = platformSettings?.find((s: any) => s.key === feeKey);
  const feePct = feeSettingRaw ? parseFloat(String(feeSettingRaw.value)) : (DEFAULT_FEES[listingType] ?? 10);

  const priceNum = parseFloat(price || "0");
  const isValid = !isNaN(priceNum) && priceNum > 0 && currency;

  const feeAmount = priceNum * (feePct / 100);
  const sellerReceives = priceNum - feeAmount;

  const NETWORK_LABELS: Record<string, string> = {
    PI_MAINNET: "Pi Network (Mainnet)",
    TRON: "USDT via TRON (TRC20)",
    TON: "USDT via TON",
    BNB: "USDT via BNB Chain",
    SOL: "USDT via Solana",
    AVAX: "USDT via Avalanche",
    BANK_TRANSFER: "Bank Transfer",
  };

  return (
    <div className="space-y-3">
      {/* Fee Breakdown Card */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-semibold">Seller Earnings Breakdown</span>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Platform Fee: {feePct}%</span>
        </div>
        <div className="p-4 space-y-2.5">
          {!isValid ? (
            <p className="text-sm text-slate-400 text-center py-2 flex items-center justify-center gap-1.5">
              <Info className="w-4 h-4" /> Enter a price above to see your earnings breakdown
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Listing Price (buyer pays)</span>
                <span className="font-semibold text-slate-800">{priceNum.toLocaleString()} {currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-1">
                  Platform Service Fee
                  <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">{feePct}%</span>
                </span>
                <span className="text-red-500 font-medium">− {feeAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {currency}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> You Receive
                </span>
                <span className="text-lg font-bold text-emerald-700">{sellerReceives.toLocaleString(undefined, { maximumFractionDigits: 8 })} {currency}</span>
              </div>
              {network && (
                <div className="mt-1 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Payment method: <span className="font-medium">{NETWORK_LABELS[network] || network}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Escrow protection note */}
      <div className="flex gap-2 items-start p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-emerald-800">
          <strong>Escrow Protected.</strong> The buyer's payment is held securely until the transaction is complete. The platform fee is deducted from your payout — the buyer pays only the listed price.
        </p>
      </div>
    </div>
  );
}

export default function CreateListing() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  const isEditing = !!id;

  const { data: existingListing, isLoading: loadingListing } = useQuery({
    queryKey: ["/api/listings", id],
    enabled: isEditing,
  });

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      type: undefined,
      description: "",
      priceCrypto: "",
      currency: undefined,
      network: undefined,
      location: "",
      videoUrl: "",
      images: [],
    },
  });

  useEffect(() => {
    if (existingListing && isEditing) {
      form.reset({
        title: existingListing.title,
        type: existingListing.type,
        description: existingListing.description,
        priceCrypto: existingListing.priceCrypto,
        currency: existingListing.currency,
        network: existingListing.network,
        location: existingListing.location || "",
        videoUrl: existingListing.videoUrl || "",
        images: existingListing.images || [],
      });
      setImageUrls(existingListing.images || []);
    }
  }, [existingListing, isEditing, form]);

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const endpoint = isEditing ? `/api/listings/${id}` : "/api/listings";
      const method = isEditing ? "PATCH" : "POST";
      return await apiRequest(method, endpoint, {
        ...data,
        images: imageUrls,
        videoUrl: data.videoUrl || null,
      });
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Listing updated successfully" : "Listing created successfully",
        description: isEditing ? "Your listing has been updated" : "Your listing is now live on the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Failed to update listing" : "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newKeys: Record<string, boolean> = {};
    files.forEach((f) => { newKeys[f.name + f.size] = true; });
    setUploadingImages(prev => ({ ...prev, ...newKeys }));

    const results = await Promise.allSettled(
      files.filter(f => f.type.startsWith("image/")).map(async (file) => {
        try {
          const url = await uploadImageToServer(file);
          setImageUrls(prev => [...prev, url]);
        } catch (err: any) {
          toast({
            title: `Failed to upload ${file.name}`,
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setUploadingImages(prev => {
            const next = { ...prev };
            delete next[file.name + file.size];
            return next;
          });
        }
      })
    );

    // Reset input so the same file can be re-selected
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (data: ListingFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive",
      });
      return;
    }

    if (data.currency === 'PI' && data.network !== 'PI_MAINNET') {
      toast({ title: "Invalid network", description: "Pi currency requires Pi Mainnet", variant: "destructive" });
      return;
    }
    if (data.currency === 'USDT' && data.network === 'PI_MAINNET') {
      toast({ title: "Invalid network", description: "USDT cannot use Pi Mainnet", variant: "destructive" });
      return;
    }

    createListingMutation.mutate(data);
  };

  const isUploading = Object.keys(uploadingImages).length > 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Authentication Required</h1>
          <p className="text-slate-medium mb-8">Please sign in to create or edit listings</p>
          <a href="/login"><Button>Sign In</Button></a>
        </div>
      </div>
    );
  }

  if (isEditing && loadingListing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center space-x-2 mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-dark mb-2" data-testid="text-page-title">
            {isEditing ? "Edit Listing" : "Create New Listing"}
          </h1>
          <p className="text-slate-medium">
            {isEditing ? "Update your listing details" : "List your property, service, or product on the marketplace"}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title for your listing"
                    {...form.register("title")}
                    data-testid="input-title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Category *</Label>
                  <Select
                    value={form.watch("type") || ""}
                    onValueChange={(value) => form.setValue("type", value as any)}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue placeholder="Select listing category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                      <SelectItem value="SHIPPING_SERVICE">Shipping Service</SelectItem>
                      <SelectItem value="PRODUCT">Product</SelectItem>
                      <SelectItem value="SERVICE">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.type.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of your listing"
                    rows={6}
                    {...form.register("description")}
                    data-testid="input-description"
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, Country (optional)"
                    {...form.register("location")}
                    data-testid="input-location"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader><CardTitle>Pricing & Payment</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priceCrypto">Price *</Label>
                    <Input
                      id="priceCrypto"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00"
                      {...form.register("priceCrypto")}
                      data-testid="input-price"
                    />
                    {form.formState.errors.priceCrypto && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.priceCrypto.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={form.watch("currency") || ""}
                      onValueChange={(value) => {
                        form.setValue("currency", value as any);
                        if (value === "PI") form.setValue("network", "PI_MAINNET");
                        else if (value === "USDT") form.setValue("network", "TRON");
                        else if (["USD", "EUR", "GBP", "CAD", "NGN"].includes(value)) form.setValue("network", "BANK_TRANSFER");
                      }}
                    >
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PI">π Pi</SelectItem>
                        <SelectItem value="USDT">💎 USDT</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                        <SelectItem value="CAD">🇨🇦 CAD</SelectItem>
                        <SelectItem value="NGN">🇳🇬 NGN</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currency && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.currency.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="network">Network *</Label>
                    <Select
                      value={form.watch("network") || ""}
                      onValueChange={(value) => form.setValue("network", value as any)}
                      disabled={!form.watch("currency")}
                    >
                      <SelectTrigger data-testid="select-network">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.watch("currency") === "PI" ? (
                          <SelectItem value="PI_MAINNET">Pi Mainnet</SelectItem>
                        ) : form.watch("currency") === "USDT" ? (
                          <>
                            <SelectItem value="TRON">TRON (TRC20)</SelectItem>
                            <SelectItem value="TON">TON</SelectItem>
                            <SelectItem value="BNB">BNB Chain</SelectItem>
                            <SelectItem value="SOL">Solana</SelectItem>
                            <SelectItem value="AVAX">Avalanche</SelectItem>
                          </>
                        ) : ["USD", "EUR", "GBP", "CAD", "NGN"].includes(form.watch("currency") || "") ? (
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.network && (
                      <p className="text-sm text-red-600 mt-1">{form.formState.errors.network.message}</p>
                    )}
                  </div>
                </div>

                {/* Real-time fee breakdown for seller */}
                <SellerFeeBreakdown
                  price={form.watch("priceCrypto")}
                  currency={form.watch("currency")}
                  listingType={form.watch("type")}
                  network={form.watch("network")}
                />
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="images">Upload Images</Label>
                    <p className="text-xs text-slate-500 mb-2">Images are uploaded to the server and will display correctly on all devices.</p>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="images"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-images"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('images')?.click()}
                        disabled={isUploading}
                        className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-crypto-blue"
                        data-testid="button-upload-images"
                      >
                        <div className="text-center">
                          {isUploading ? (
                            <>
                              <Loader2 className="w-8 h-8 mx-auto mb-2 text-crypto-blue animate-spin" />
                              <p className="text-slate-600">Uploading...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                              <p className="text-slate-600">Click to upload images</p>
                              <p className="text-sm text-slate-400">PNG, JPG, WEBP — multiple allowed</p>
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Listing image ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-slate-200"
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23e2e8f0' width='100' height='100'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='12' x='50' y='55' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-crypto-blue text-white text-xs px-1.5 py-0.5 rounded font-medium">
                              Main
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 p-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Video */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-crypto-blue" />
                  Featured Video (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="videoUrl">YouTube or Vimeo Video Link</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                  {...form.register("videoUrl")}
                  data-testid="input-video-url"
                  className="mt-1"
                />
                {form.formState.errors.videoUrl && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.videoUrl.message}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  Paste a YouTube or Vimeo link to add a walkthrough video that buyers can watch on the listing page.
                </p>
                {form.watch("videoUrl") && !form.formState.errors.videoUrl && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <Video className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Video link saved — it will appear on your listing page.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex space-x-4">
                  <Link href="/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full" data-testid="button-cancel">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 bg-crypto-blue hover:bg-crypto-teal"
                    disabled={createListingMutation.isPending || isUploading}
                    data-testid="button-submit"
                  >
                    {createListingMutation.isPending
                      ? (isEditing ? "Updating..." : "Creating...")
                      : (isEditing ? "Update Listing" : "Create Listing")
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
