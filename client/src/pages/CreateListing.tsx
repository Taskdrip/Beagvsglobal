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
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Upload, X } from "lucide-react";

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
  currency: z.enum(["PI", "USDT", "USD"], {
    required_error: "Please select a currency",
  }),
  network: z.enum(["PI_MAINNET", "TRON", "TON", "BNB", "SOL", "AVAX", "BANK_TRANSFER"], {
    required_error: "Please select a network",
  }),
  location: z.string().optional(),
  images: z.array(z.string()).default([]),
});

type ListingFormData = z.infer<typeof listingSchema>;

export default function CreateListing() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

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
        images: existingListing.images || [],
      });
      setImageUrls(existingListing.images || []);
    }
  }, [existingListing, isEditing, form]);

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const endpoint = isEditing ? `/api/listings/${id}` : "/api/listings";
      const method = isEditing ? "PATCH" : "POST";
      return await apiRequest(method, endpoint, { ...data, images: imageUrls });
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          setImageUrls(prev => [...prev, imageUrl]);
        };
        reader.readAsDataURL(file);
      }
    });
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

    // Validate network matches currency
    if (data.currency === 'PI' && data.network !== 'PI_MAINNET') {
      toast({
        title: "Invalid network selection",
        description: "Pi currency requires Pi Mainnet",
        variant: "destructive",
      });
      return;
    }

    if (data.currency === 'USDT' && data.network === 'PI_MAINNET') {
      toast({
        title: "Invalid network selection",
        description: "USDT cannot use Pi Mainnet",
        variant: "destructive",
      });
      return;
    }

    createListingMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Authentication Required</h1>
          <p className="text-slate-medium mb-8">Please sign in to create or edit listings</p>
          <Link href="/auth/sign-in">
            <Button>Sign In</Button>
          </Link>
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
        {/* Header */}
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
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
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
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.title.message}
                    </p>
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
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.type.message}
                    </p>
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
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.description.message}
                    </p>
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
              <CardHeader>
                <CardTitle>Pricing & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priceCrypto">Price *</Label>
                    <Input
                      id="priceCrypto"
                      type="number"
                      step="0.00000001"
                      placeholder="0.00000000"
                      {...form.register("priceCrypto")}
                      data-testid="input-price"
                    />
                    {form.formState.errors.priceCrypto && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.priceCrypto.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select
                      value={form.watch("currency") || ""}
                      onValueChange={(value) => {
                        form.setValue("currency", value as any);
                        // Auto-set network based on currency
                        if (value === "PI") {
                          form.setValue("network", "PI_MAINNET");
                        } else if (value === "USDT") {
                          form.setValue("network", "TRON");
                        } else if (value === "USD") {
                          form.setValue("network", "BANK_TRANSFER");
                        }
                      }}
                    >
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PI">Pi (π)</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="USD">USD (Bank Transfer)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.currency && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.currency.message}
                      </p>
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
                            <SelectItem value="BNB">BNB Chain (BEP20)</SelectItem>
                            <SelectItem value="SOL">Solana (SPL)</SelectItem>
                            <SelectItem value="AVAX">Avalanche</SelectItem>
                          </>
                        ) : form.watch("currency") === "USD" ? (
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.network && (
                      <p className="text-sm text-red-600 mt-1">
                        {form.formState.errors.network.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> All transactions will be protected by our escrow system. 
                    A 10% platform fee will be deducted from the final amount.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="images">Upload Images</Label>
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
                        disabled={uploadingImage}
                        className="w-full h-32 border-2 border-dashed border-slate-300 hover:border-crypto-blue"
                        data-testid="button-upload-images"
                      >
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                          <p className="text-slate-600">Click to upload images</p>
                          <p className="text-sm text-slate-400">PNG, JPG, GIF up to 5MB each</p>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Listing image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
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
                    disabled={createListingMutation.isPending}
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
