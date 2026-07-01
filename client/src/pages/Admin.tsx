import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EscrowProgress from "@/components/EscrowProgress";
import AdminPageEditor from "@/components/AdminPageEditor";
import AdminBlogManager from "@/components/AdminBlogManager";
import CompetitorDashboard from "@/components/CompetitorDashboard";
import AdminSEOTab from "@/components/AdminSEOTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";
import { 
  Shield,
  DollarSign,
  Users,
  FileText,
  Wallet,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Package,
  Truck,
  Loader2,
  RotateCcw,
  MapPin,
  Percent,
  Sliders,
  Save,
  KeyRound,
  UserCog,
  Database,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Globe,
  MessageCircle,
  Bot,
  Send,
  User as UserIcon,
  PhoneCall,
  Clock,
  CheckCheck,
  Upload,
  ImagePlus,
} from "lucide-react";

const platformWalletSchema = z.object({
  type: z.enum(["PI", "USDT_TRON", "USDT_TON", "USDT_BNB", "USDT_SOL", "USDT_AVAX"]),
  address: z.string().min(1, "Wallet address is required"),
});

type PlatformWalletFormData = z.infer<typeof platformWalletSchema>;

function AdminSecurityTab({ adminUser }: { adminUser: any }) {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [pwData, setPwData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (pwData.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setIsChanging(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Password changed successfully!" });
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: "Failed to change password", description: err.message, variant: "destructive" });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            Admin Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <div className="relative mt-1">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pwData.currentPassword}
                  onChange={e => setPwData(d => ({ ...d, currentPassword: e.target.value }))}
                  required
                  data-testid="input-admin-current-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <div className="relative mt-1">
                <input
                  type={showNew ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pwData.newPassword}
                  onChange={e => setPwData(d => ({ ...d, newPassword: e.target.value }))}
                  required
                  minLength={8}
                  data-testid="input-admin-new-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="w-full border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pwData.confirmPassword}
                  onChange={e => setPwData(d => ({ ...d, confirmPassword: e.target.value }))}
                  required
                  data-testid="input-admin-confirm-password"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isChanging} className="bg-amber-600 hover:bg-amber-700" data-testid="button-change-admin-password">
              {isChanging ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Admin Account Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-500">Email</span>
              <span className="font-medium">{adminUser?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-500">Username</span>
              <span className="font-medium">{adminUser?.username}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-500">Role</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">ADMIN</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500">Default Credentials</span>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">admin@beagvsglobal.com / Admin@2025!</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminListingsTab({ toast, queryClient, apiRequest }: { toast: any; queryClient: any; apiRequest: any }) {
  const [editingListing, setEditingListing] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [facilitiesInput, setFacilitiesInput] = useState("");
  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [imagesInput, setImagesInput] = useState("");
  const [newListing, setNewListing] = useState<any>({
    title: "", description: "", priceCrypto: "", currency: "NGN",
    location: "", type: "REAL_ESTATE", network: "BANK_TRANSFER",
    metadata: { propertyType: "apartment", category: "sale" }, isActive: true,
  });
  const [newFacilitiesInput, setNewFacilitiesInput] = useState("");
  const [newAmenitiesInput, setNewAmenitiesInput] = useState("");
  const [newImagesInput, setNewImagesInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const { data: allListings, refetch: refetchListings, isLoading } = useQuery({
    queryKey: ["/api/admin/listings"],
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/admin/listings/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Listing updated successfully" });
      setShowEditDialog(false);
      setEditingListing(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
    },
    onError: (err: any) => toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/listings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Listing created successfully" });
      setShowCreateDialog(false);
      setNewListing({ title: "", description: "", priceCrypto: "", currency: "NGN", location: "", type: "REAL_ESTATE", network: "BANK_TRANSFER", metadata: { propertyType: "apartment", category: "sale" }, isActive: true });
      setNewFacilitiesInput(""); setNewAmenitiesInput(""); setNewImagesInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
    },
    onError: (err: any) => toast({ title: "Failed to create listing", description: err.message, variant: "destructive" }),
  });

  const uploadImageFile = async (file: File, onSuccess: (url: string) => void) => {
    setUploadingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      const res = await apiRequest("POST", "/api/admin/upload-image", { base64, filename: file.name });
      const data = await res.json();
      if (data.url) {
        onSuccess(data.url);
        toast({ title: "Image uploaded successfully" });
      } else {
        toast({ title: "Upload failed", description: data.message || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImageFromInput = (input: string, urlToRemove: string): string =>
    input.split("\n").filter(u => u.trim() !== urlToRemove.trim()).join("\n");

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/listings/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Listing deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
    },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  const handleCreateListing = () => {
    const facilities = newFacilitiesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const amenities = newAmenitiesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const images = newImagesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    createListingMutation.mutate({
      ...newListing,
      images,
      metadata: { ...(newListing.metadata || {}), facilities, amenities, whatsapp: "+2348037232210" },
    });
  };

  const handleSeedProperties = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-properties", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Seeded ${data.created} properties (${data.skipped} skipped)` });
        refetchListings();
      } else {
        toast({ title: "Seed failed", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Seed failed", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const openEditDialog = (listing: any) => {
    setEditingListing({ ...listing });
    const meta = listing.metadata || {};
    setFacilitiesInput((meta.facilities || []).join("\n"));
    setAmenitiesInput((meta.amenities || []).join("\n"));
    setImagesInput((listing.images || []).join("\n"));
    setShowEditDialog(true);
  };

  const handleSaveListing = () => {
    if (!editingListing) return;
    const facilities = facilitiesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const amenities = amenitiesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const images = imagesInput.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const updatedMeta = {
      ...(editingListing.metadata || {}),
      facilities,
      amenities,
      bedrooms: editingListing.metadata?.bedrooms,
      bathrooms: editingListing.metadata?.bathrooms,
      areaSqft: editingListing.metadata?.areaSqft,
      propertyType: editingListing.metadata?.propertyType,
      category: editingListing.metadata?.category,
      propertyTitle: editingListing.metadata?.propertyTitle,
      thankYouMessage: editingListing.metadata?.thankYouMessage,
      whatsapp: "+2348037232210",
    };
    updateListingMutation.mutate({
      id: editingListing.id,
      data: {
        title: editingListing.title,
        description: editingListing.description,
        priceCrypto: editingListing.priceCrypto,
        currency: editingListing.currency,
        location: editingListing.location,
        images,
        metadata: updatedMeta,
        isActive: editingListing.isActive,
      },
    });
  };

  const listings = (allListings as any[]) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-3">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Property Listings ({listings.length})
            </span>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Add New Listing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedProperties}
                disabled={seeding}
                data-testid="button-seed-properties"
              >
                {seeding ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Seeding…</> : <><Database className="w-4 h-4 mr-1" /> Seed Nigerian Properties</>}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading listings…</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No listings yet. Seed the 8 Nigerian properties to get started.</p>
              <Button onClick={handleSeedProperties} disabled={seeding}>
                {seeding ? "Seeding…" : "Seed Properties"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing: any) => (
                <div key={listing.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors" data-testid={`admin-listing-${listing.id}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`w-2 h-2 rounded-full ${listing.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                        <h4 className="font-medium text-slate-900 text-sm truncate">{listing.title}</h4>
                        <Badge variant="outline" className="text-xs">{listing.type}</Badge>
                        <Badge variant="outline" className="text-xs">{listing.currency}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{listing.location}</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {listing.currency} {parseFloat(listing.priceCrypto).toLocaleString()}
                      </p>
                      {listing.metadata?.facilities?.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">{listing.metadata.facilities.length} facilities · {listing.metadata.amenities?.length || 0} amenities</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(listing)} data-testid={`button-edit-listing-${listing.id}`}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { if (confirm(`Delete "${listing.title}"?`)) deleteListingMutation.mutate(listing.id); }}
                        data-testid={`button-delete-listing-${listing.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Listing Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ImagePlus className="w-5 h-5 text-emerald-600" /> Add New Property Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input value={newListing.title} onChange={e => setNewListing((l: any) => ({ ...l, title: e.target.value }))} className="mt-1" placeholder="e.g. 4-Bedroom Duplex – Lekki Phase 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Price</Label>
                <Input type="number" value={newListing.priceCrypto} onChange={e => setNewListing((l: any) => ({ ...l, priceCrypto: e.target.value }))} className="mt-1" placeholder="e.g. 90000000" />
              </div>
              <div>
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={newListing.currency} onValueChange={v => setNewListing((l: any) => ({ ...l, currency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (Naira)</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Location</Label>
              <Input value={newListing.location} onChange={e => setNewListing((l: any) => ({ ...l, location: e.target.value }))} className="mt-1" placeholder="e.g. Lekki Phase 1, Lagos, Nigeria" />
            </div>
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <Textarea rows={4} value={newListing.description} onChange={e => setNewListing((l: any) => ({ ...l, description: e.target.value }))} className="mt-1" placeholder="Describe the property..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Property Type</Label>
                <Select value={newListing.metadata?.propertyType || "apartment"} onValueChange={v => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, propertyType: v } }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House/Duplex</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select value={newListing.metadata?.category || "sale"} onValueChange={v => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, category: v } }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">For Sale</SelectItem>
                    <SelectItem value="rent">For Rent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium">Bedrooms</Label>
                <Input type="number" value={newListing.metadata?.bedrooms || ""} onChange={e => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, bedrooms: parseInt(e.target.value) || undefined } }))} className="mt-1" placeholder="e.g. 4" />
              </div>
              <div>
                <Label className="text-sm font-medium">Bathrooms</Label>
                <Input type="number" value={newListing.metadata?.bathrooms || ""} onChange={e => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, bathrooms: parseInt(e.target.value) || undefined } }))} className="mt-1" placeholder="e.g. 3" />
              </div>
              <div>
                <Label className="text-sm font-medium">Area (sqft)</Label>
                <Input type="number" value={newListing.metadata?.areaSqft || ""} onChange={e => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, areaSqft: parseInt(e.target.value) || undefined } }))} className="mt-1" placeholder="e.g. 3000" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Title Document</Label>
              <Input value={newListing.metadata?.propertyTitle || ""} onChange={e => setNewListing((l: any) => ({ ...l, metadata: { ...l.metadata, propertyTitle: e.target.value } }))} className="mt-1" placeholder="e.g. Certificate of Occupancy (C of O)" />
            </div>
            <div>
              <Label className="text-sm font-medium">Facilities <span className="text-slate-400 font-normal">(one per line)</span></Label>
              <Textarea rows={3} value={newFacilitiesInput} onChange={e => setNewFacilitiesInput(e.target.value)} className="mt-1 font-mono text-sm" placeholder={"Gated Estate\nCCTV Security\nBorehole Water"} />
            </div>
            <div>
              <Label className="text-sm font-medium">Amenities <span className="text-slate-400 font-normal">(one per line)</span></Label>
              <Textarea rows={3} value={newAmenitiesInput} onChange={e => setNewAmenitiesInput(e.target.value)} className="mt-1 font-mono text-sm" placeholder={"Fitted Kitchen\nPOP Ceiling\nTiled Floors"} />
            </div>
            <div>
              <Label className="text-sm font-medium">Images</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadImageFile(file, (url) => setNewImagesInput(prev => prev ? `${prev}\n${url}` : url));
                      e.target.value = "";
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => createFileInputRef.current?.click()} disabled={uploadingImage} className="flex-shrink-0">
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                    {uploadingImage ? "Uploading…" : "Upload Photo"}
                  </Button>
                  <Input
                    placeholder="Or paste image URL and press Enter"
                    className="text-sm"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const url = (e.target as HTMLInputElement).value.trim();
                        if (url) { setNewImagesInput(prev => prev ? `${prev}\n${url}` : url); (e.target as HTMLInputElement).value = ""; }
                      }
                    }}
                  />
                </div>
                {newImagesInput.split("\n").filter(u => u.trim()).length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {newImagesInput.split("\n").filter(u => u.trim()).map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url.trim()} alt="" className="w-20 h-20 object-cover rounded border border-slate-200" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <button
                          type="button"
                          onClick={() => setNewImagesInput(removeImageFromInput(newImagesInput, url))}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No images added yet. Upload a photo or paste a URL above.</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="newIsActive" checked={newListing.isActive} onChange={e => setNewListing((l: any) => ({ ...l, isActive: e.target.checked }))} className="rounded" />
              <Label htmlFor="newIsActive" className="text-sm font-medium">Active (visible to buyers)</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateListing} disabled={createListingMutation.isPending || !newListing.title}>
                {createListingMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4 mr-1" /> Create Listing</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          {editingListing && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  value={editingListing.title}
                  onChange={e => setEditingListing((l: any) => ({ ...l, title: e.target.value }))}
                  className="mt-1"
                  data-testid="input-listing-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Price</Label>
                  <Input
                    type="number"
                    value={editingListing.priceCrypto}
                    onChange={e => setEditingListing((l: any) => ({ ...l, priceCrypto: e.target.value }))}
                    className="mt-1"
                    data-testid="input-listing-price"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select value={editingListing.currency} onValueChange={v => setEditingListing((l: any) => ({ ...l, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (Naira)</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="PI">PI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Location</Label>
                <Input
                  value={editingListing.location || ""}
                  onChange={e => setEditingListing((l: any) => ({ ...l, location: e.target.value }))}
                  className="mt-1"
                  data-testid="input-listing-location"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  rows={4}
                  value={editingListing.description}
                  onChange={e => setEditingListing((l: any) => ({ ...l, description: e.target.value }))}
                  className="mt-1"
                  data-testid="textarea-listing-description"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">Bedrooms</Label>
                  <Input
                    type="number"
                    value={editingListing.metadata?.bedrooms || ""}
                    onChange={e => setEditingListing((l: any) => ({ ...l, metadata: { ...l.metadata, bedrooms: parseInt(e.target.value) || undefined } }))}
                    className="mt-1"
                    placeholder="e.g. 4"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Bathrooms</Label>
                  <Input
                    type="number"
                    value={editingListing.metadata?.bathrooms || ""}
                    onChange={e => setEditingListing((l: any) => ({ ...l, metadata: { ...l.metadata, bathrooms: parseInt(e.target.value) || undefined } }))}
                    className="mt-1"
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Area (sqft)</Label>
                  <Input
                    type="number"
                    value={editingListing.metadata?.areaSqft || ""}
                    onChange={e => setEditingListing((l: any) => ({ ...l, metadata: { ...l.metadata, areaSqft: parseInt(e.target.value) || undefined } }))}
                    className="mt-1"
                    placeholder="e.g. 3000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Property Title Document</Label>
                <Input
                  value={editingListing.metadata?.propertyTitle || ""}
                  onChange={e => setEditingListing((l: any) => ({ ...l, metadata: { ...l.metadata, propertyTitle: e.target.value } }))}
                  className="mt-1"
                  placeholder="e.g. Certificate of Occupancy (C of O)"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Facilities <span className="text-slate-400 font-normal">(one per line)</span></Label>
                <Textarea
                  rows={4}
                  value={facilitiesInput}
                  onChange={e => setFacilitiesInput(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder={"Gated Estate\nCCTV Security\nBorehole Water\n24hr Electricity"}
                  data-testid="textarea-facilities"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Amenities <span className="text-slate-400 font-normal">(one per line)</span></Label>
                <Textarea
                  rows={3}
                  value={amenitiesInput}
                  onChange={e => setAmenitiesInput(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder={"Fitted Kitchen\nPOP Ceiling\nTiled Floors"}
                  data-testid="textarea-amenities"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Images</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadImageFile(file, (url) => setImagesInput(prev => prev ? `${prev}\n${url}` : url));
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-shrink-0"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                      {uploadingImage ? "Uploading…" : "Upload Photo"}
                    </Button>
                    <Input
                      placeholder="Or paste image URL and press Enter"
                      className="text-sm"
                      data-testid="input-add-image-url"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const url = (e.target as HTMLInputElement).value.trim();
                          if (url) { setImagesInput(prev => prev ? `${prev}\n${url}` : url); (e.target as HTMLInputElement).value = ""; }
                        }
                      }}
                    />
                  </div>
                  {imagesInput.split("\n").filter(u => u.trim()).length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {imagesInput.split("\n").filter(u => u.trim()).map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url.trim()} alt="" className="w-20 h-20 object-cover rounded border border-slate-200" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <button
                            type="button"
                            onClick={() => setImagesInput(removeImageFromInput(imagesInput, url))}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow"
                            title="Remove image"
                            data-testid={`button-remove-image-${i}`}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No images yet. Upload a photo or paste a URL above.</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Thank You Message <span className="text-slate-400 font-normal">(shown after enquiry)</span></Label>
                <Textarea
                  rows={2}
                  value={editingListing.metadata?.thankYouMessage || ""}
                  onChange={e => setEditingListing((l: any) => ({ ...l, metadata: { ...l.metadata, thankYouMessage: e.target.value } }))}
                  className="mt-1"
                  placeholder="Thank you for your interest! Our agent will contact you within 24 hours."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingListing.isActive}
                  onChange={e => setEditingListing((l: any) => ({ ...l, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="text-sm font-medium">Active (visible to buyers)</Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveListing}
                  disabled={updateListingMutation.isPending}
                  data-testid="button-save-listing"
                >
                  {updateListingMutation.isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminSupportChatTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSessionsRef = useRef<any[]>([]);
  const prevMsgCountRef = useRef<number>(0);
  const notifPermissionRef = useRef<boolean>(false);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        notifPermissionRef.current = true;
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
          notifPermissionRef.current = p === "granted";
        });
      }
    }
  }, []);

  function sendBrowserNotif(title: string, body: string) {
    if (notifPermissionRef.current && document.hidden) {
      try {
        const n = new Notification(title, { body, icon: "/favicon.ico", tag: "beagvs-support" });
        n.onclick = () => { window.focus(); n.close(); };
      } catch {}
    }
  }

  const { data: sessions = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/ai-support/sessions'],
    refetchInterval: 6000,
  });

  // Detect new/escalated sessions and fire popup
  useEffect(() => {
    if (!sessions || sessions.length === 0) { prevSessionsRef.current = sessions; return; }
    const prev = prevSessionsRef.current;
    const prevIds = new Set(prev.map((s: any) => s.id));
    for (const s of sessions) {
      if (!prevIds.has(s.id)) {
        const name = s.guestName || (s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : 'Guest');
        toast({ title: "💬 New Support Chat", description: `${name} started a chat session` });
        sendBrowserNotif("New Support Chat — Beagvs Global", `${name} started a support session`);
      } else {
        const prevS = prev.find((p: any) => p.id === s.id);
        if (prevS && prevS.status !== 'escalated' && s.status === 'escalated') {
          const name = s.guestName || (s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : 'Guest');
          toast({ title: "🔴 Escalation Alert", description: `${name} needs a live representative!`, variant: "destructive" });
          sendBrowserNotif("⚠️ Escalation — Beagvs Support", `${name} has been escalated to live support!`);
        }
        if (prevS && s.messageCount > prevS.messageCount && s.id !== selectedSessionId) {
          const name = s.guestName || (s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : 'Guest');
          sendBrowserNotif("New Message — Beagvs Support", `${name} sent a message`);
        }
      }
    }
    prevSessionsRef.current = sessions;
  }, [sessions]);

  const { data: sessionData } = useQuery<{ session: any; messages: any[] }>({
    queryKey: ['/api/ai-support/sessions', selectedSessionId, 'messages'],
    enabled: !!selectedSessionId,
    refetchInterval: 4000,
    select: (d: any) => d,
  });

  const messages = sessionData?.messages ?? [];
  const activeSession = sessionData?.session;

  // Notify on new messages in open sessions
  useEffect(() => {
    const count = messages.length;
    if (prevMsgCountRef.current > 0 && count > prevMsgCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user') {
        const name = lastMsg.senderName || 'User';
        sendBrowserNotif("New Message — Beagvs Support", `${name}: ${lastMsg.content.slice(0, 80)}`);
      }
    }
    prevMsgCountRef.current = count;
  }, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function sendReply() {
    if (!replyText.trim() || !selectedSessionId) return;
    setSending(true);
    try {
      await apiRequest('POST', `/api/admin/ai-support/sessions/${selectedSessionId}/messages`, { content: replyText });
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ['/api/ai-support/sessions', selectedSessionId, 'messages'] });
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function closeSession(sessionId: string) {
    try {
      await apiRequest('PATCH', `/api/admin/ai-support/sessions/${sessionId}`, { status: 'closed' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai-support/sessions'] });
      if (selectedSessionId === sessionId) setSelectedSessionId(null);
      toast({ title: "Session closed" });
    } catch {
      toast({ title: "Failed to close session", variant: "destructive" });
    }
  }

  const statusColor: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    escalated: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="flex gap-4 h-[680px]">
      {/* Session list */}
      <Card className="w-80 flex flex-col overflow-hidden flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4" />
            Support Sessions
            {sessions.filter((s: any) => s.status === 'escalated').length > 0 && (
              <Badge className="bg-yellow-500 text-white ml-auto">
                {sessions.filter((s: any) => s.status === 'escalated').length} escalated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
          {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No support sessions yet</div>
          )}
          {sessions.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedSessionId(s.id)}
              data-testid={`button-session-${s.id}`}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedSessionId === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-gray-900 truncate">
                  {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : s.guestName || 'Guest'}
                </span>
                <Badge className={`text-xs flex-shrink-0 ml-2 ${statusColor[s.status] || statusColor.open}`}>
                  {s.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(s.createdAt).toLocaleDateString()}
                <span className="ml-auto">{s.messageCount} msgs</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Chat panel */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {!selectedSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageCircle className="w-12 h-12 opacity-30" />
            <p className="text-sm">Select a session to view the conversation</p>
          </div>
        ) : (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    {activeSession?.guestName || 'Support Session'}
                    {activeSession && (
                      <Badge className={`text-xs ${statusColor[activeSession.status] || statusColor.open}`}>
                        {activeSession.status}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Session ID: {selectedSessionId.slice(0, 8)}…</p>
                </div>
                {activeSession?.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => closeSession(selectedSessionId)}
                    className="text-xs" data-testid="button-close-session">
                    <CheckCheck className="w-3 h-3 mr-1" /> Close
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-blue-500' : msg.role === 'admin' ? 'bg-green-600' : 'bg-gray-400'
                  }`}>
                    {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> :
                     msg.role === 'admin' ? <PhoneCall className="w-4 h-4 text-white" /> :
                     <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' :
                    msg.role === 'admin' ? 'bg-green-50 border border-green-200 text-gray-800 rounded-bl-sm' :
                    'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.role !== 'user' && (
                      <p className={`text-xs mb-1 font-medium ${msg.role === 'admin' ? 'text-green-600' : 'text-gray-500'}`}>
                        {msg.senderName || (msg.role === 'assistant' ? 'Beagvs AI' : 'Admin')}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-60 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            {activeSession?.status !== 'closed' && (
              <div className="border-t p-3 flex gap-2">
                <Input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type your reply as support rep…"
                  className="flex-1"
                  disabled={sending}
                  data-testid="input-admin-reply"
                />
                <Button onClick={sendReply} disabled={!replyText.trim() || sending} data-testid="button-send-admin-reply">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [feeEdits, setFeeEdits] = useState<Record<string, any>>({});

  const isAdminUser = isAuthenticated && user?.role === 'ADMIN';

  // All data queries — always called (hooks must not be conditional).
  // enabled: isAdminUser prevents actual network requests until access is confirmed.
  const { data: escrows } = useQuery({
    queryKey: ["/api/escrows", { admin: true }],
    enabled: isAdminUser,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: platformWallets } = useQuery({
    queryKey: ["/api/platform-wallets"],
    enabled: isAdminUser,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: platformSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/platform-settings"],
    enabled: isAdminUser,
  });

  const { data: allShipments } = useQuery({
    queryKey: ["/api/admin/shipments"],
    enabled: isAdminUser,
  });

  const { data: allUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAdminUser,
  });

  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAdminUser,
  });

  // Form setup — always called
  const walletForm = useForm<PlatformWalletFormData>({
    resolver: zodResolver(platformWalletSchema),
    defaultValues: {
      type: undefined,
      address: "",
    },
  });

  // Mutations — always called
  const updateEscrowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/escrows/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Escrow updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      setSelectedEscrow(null);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to update escrow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: async (data: PlatformWalletFormData) => {
      await apiRequest("POST", "/api/platform-wallets", data);
    },
    onSuccess: () => {
      toast({
        title: "Platform wallet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-wallets"] });
      setShowWalletDialog(false);
      walletForm.reset();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to create wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const upsertSettingMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: any; description?: string }) =>
      apiRequest("PUT", `/api/platform-settings/${key}`, { value, description }),
    onSuccess: () => {
      toast({ title: "Setting saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
      setFeeEdits({});
    },
    onError: (err: any) => toast({ title: "Failed to save", description: err.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      await apiRequest("POST", `/api/admin/users/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password reset", description: "User will be prompted to change on next login." });
      setResetPasswordTarget(null);
      setNewTempPassword("");
      refetchUsers();
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "User updated" });
      setEditingUser(null);
      refetchUsers();
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted" });
      refetchUsers();
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const updateShipmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/shipments/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Shipment status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments/all"] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  // Helpers (pure functions, safe to define after hooks)
  const DEFAULT_FEE_SETTINGS = [
    { key: "fee_product",          label: "Product / Goods",        description: "Platform fee % on product escrows",          defaultPct: 10 },
    { key: "fee_real_estate",      label: "Real Estate",            description: "Platform fee % on real estate escrows",      defaultPct: 5  },
    { key: "fee_shipping_service", label: "Shipping Services",      description: "Platform fee % on shipping service escrows", defaultPct: 8  },
    { key: "fee_service",          label: "General Services",       description: "Platform fee % on service escrows",          defaultPct: 10 },
  ];

  const getSettingValue = (key: string) => {
    const s = (platformSettings as any[])?.find((x: any) => x.key === key);
    return s?.value?.percentage ?? DEFAULT_FEE_SETTINGS.find(f => f.key === key)?.defaultPct ?? 10;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      CREATED: "bg-gray-100 text-gray-800",
      FUNDED: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-yellow-100 text-yellow-800",
      DELIVERED: "bg-purple-100 text-purple-800",
      RELEASED: "bg-green-100 text-green-800",
      DISPUTED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  // Event handlers
  const handleEscrowAction = (escrow: any, status: string) => {
    setSelectedEscrow({ ...escrow, newStatus: status });
  };

  const confirmEscrowAction = () => {
    if (!selectedEscrow) return;
    updateEscrowMutation.mutate({
      id: selectedEscrow.id,
      data: { status: selectedEscrow.newStatus }
    });
  };

  const handleCreateWallet = (data: PlatformWalletFormData) => {
    createWalletMutation.mutate(data);
  };

  // All conditional returns come AFTER all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Access Denied</h1>
          <p className="text-slate-medium mb-8">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-slate-800 text-white rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Control Panel</h1>
                <p className="text-slate-300">Manage platform operations and settings</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-300">Welcome back, {user?.firstName || user?.username}</p>
              <p className="text-sm text-slate-400">Last login: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Active Escrows</p>
                  <p className="text-xl font-bold" data-testid="stat-active-escrows">
                    {escrows?.filter((e: any) => ['FUNDED', 'SHIPPED', 'DELIVERED'].includes(e.status))?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Completed Today</p>
                  <p className="text-xl font-bold" data-testid="stat-completed-today">
                    {escrows?.filter((e: any) => e.status === 'RELEASED' && 
                      new Date(e.updatedAt).toDateString() === new Date().toDateString())?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Pending Verification</p>
                  <p className="text-xl font-bold" data-testid="stat-pending-verification">
                    {escrows?.filter((e: any) => e.status === 'CREATED')?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Platform Wallets</p>
                  <p className="text-xl font-bold" data-testid="stat-platform-wallets">
                    {platformWallets?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="escrows" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100 rounded-lg w-full">
            <TabsTrigger value="escrows" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-escrows">
              Escrows
            </TabsTrigger>
            <TabsTrigger value="users" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-users">
              Users
            </TabsTrigger>
            <TabsTrigger value="wallets" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-wallets">
              Wallets
            </TabsTrigger>
            <TabsTrigger value="fees" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-fees">
              Fees &amp; Rates
            </TabsTrigger>
            <TabsTrigger value="shipments" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-shipments">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-blog">
              Blog
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-settings">
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="pages" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-pages">
              Pages
            </TabsTrigger>
            <TabsTrigger value="listings" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-listings">
              Listings
            </TabsTrigger>
            <TabsTrigger value="database" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-database">
              Database
            </TabsTrigger>
            <TabsTrigger value="ai-support" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-ai-support">
              Support Chat
            </TabsTrigger>
            <TabsTrigger value="security" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-security">
              Security
            </TabsTrigger>
            <TabsTrigger value="competitors" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-competitors-main">
              🎯 Competitors
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-seo">
              🔍 SEO & Indexing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escrows" className="space-y-4">
            {/* ── PAYMENT_SUBMITTED Priority Queue ── */}
            {escrows && escrows.filter((e: any) => e.status === 'PAYMENT_SUBMITTED').length > 0 && (
              <Card className="border-blue-300 shadow-md">
                <CardHeader className="bg-blue-50 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse inline-block" />
                    Payments Awaiting Review ({escrows.filter((e: any) => e.status === 'PAYMENT_SUBMITTED').length})
                  </CardTitle>
                  <p className="text-sm text-blue-600">These buyers have submitted payment receipts and are waiting for your approval.</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {escrows.filter((e: any) => e.status === 'PAYMENT_SUBMITTED').map((escrow: any) => (
                    <div key={escrow.id} className="border border-blue-200 rounded-xl p-4 bg-white" data-testid={`payment-review-${escrow.id}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{escrow.listing?.title || "Unnamed Listing"}</h4>
                          <p className="text-sm text-slate-500">{escrow.buyer?.username} → {escrow.seller?.username}</p>
                          <p className="text-sm font-bold text-blue-700 mt-1">{escrow.amount} {escrow.currency}</p>
                          <p className="text-xs text-slate-400">Submitted: {escrow.paymentSubmittedAt ? new Date(escrow.paymentSubmittedAt).toLocaleString() : "—"}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            onClick={() => updateEscrowMutation.mutate({ id: escrow.id, data: { status: 'FUNDED' } })}
                            disabled={updateEscrowMutation.isPending}
                            data-testid={`button-approve-payment-${escrow.id}`}
                          >
                            ✓ Approve Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 gap-1"
                            onClick={() => {
                              const note = window.prompt("Enter rejection reason for the buyer:");
                              if (note !== null) {
                                updateEscrowMutation.mutate({ id: escrow.id, data: { status: 'CREATED', adminNote: note } });
                              }
                            }}
                            disabled={updateEscrowMutation.isPending}
                            data-testid={`button-reject-payment-${escrow.id}`}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </div>
                      {/* Payment evidence */}
                      {(escrow.buyerTxHash || escrow.paymentReceiptUrl || escrow.paymentNotes) && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                          {escrow.buyerTxHash && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Transaction Hash</p>
                              <p className="font-mono text-xs text-slate-700 break-all">{escrow.buyerTxHash}</p>
                            </div>
                          )}
                          {escrow.paymentNotes && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyer Notes</p>
                              <p className="text-xs text-slate-700">{escrow.paymentNotes}</p>
                            </div>
                          )}
                          {escrow.paymentReceiptUrl && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Payment Receipt</p>
                              {escrow.paymentReceiptUrl.endsWith('.pdf') ? (
                                <a href={escrow.paymentReceiptUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                  📄 View Receipt PDF
                                </a>
                              ) : (
                                <a href={escrow.paymentReceiptUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={escrow.paymentReceiptUrl} alt="Payment receipt" className="max-h-48 rounded-lg border cursor-pointer hover:opacity-90" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Escrow Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {escrows && escrows.length > 0 ? (
                  <div className="space-y-4">
                    {escrows.map((escrow: any) => (
                      <div key={escrow.id} className="p-4 border rounded-lg" data-testid={`escrow-${escrow.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-dark">{escrow.listing?.title}</h4>
                            <p className="text-sm text-slate-medium">
                              {escrow.buyer?.username} ↔ {escrow.seller?.username}
                            </p>
                          </div>
                          <Badge className={getStatusBadge(escrow.status)}>
                            {escrow.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-medium">Amount</p>
                            <p className="font-semibold">{escrow.amount} {escrow.currency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-medium">Network</p>
                            <p className="font-medium">{escrow.network}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-medium">Created</p>
                            <p className="font-medium">{new Date(escrow.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <EscrowProgress status={escrow.status} className="mb-4" />

                        <div className="flex space-x-2">
                          {escrow.status === 'CREATED' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleEscrowAction(escrow, 'FUNDED')}
                              data-testid={`button-verify-${escrow.id}`}
                            >
                              Verify & Fund
                            </Button>
                          )}
                          {escrow.status === 'DELIVERED' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleEscrowAction(escrow, 'RELEASED')}
                              data-testid={`button-release-${escrow.id}`}
                            >
                              Release
                            </Button>
                          )}
                          {['FUNDED', 'SHIPPED', 'DELIVERED'].includes(escrow.status) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleEscrowAction(escrow, 'DISPUTED')}
                              data-testid={`button-dispute-${escrow.id}`}
                            >
                              Dispute
                            </Button>
                          )}
                          {escrow.status === 'DISPUTED' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleEscrowAction(escrow, 'REFUNDED')}
                              data-testid={`button-refund-${escrow.id}`}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No escrow transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Platform Wallets</span>
                  <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-wallet">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Wallet
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Platform Wallet</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={walletForm.handleSubmit(handleCreateWallet)} className="space-y-4">
                        <div>
                          <Label>Wallet Type</Label>
                          <Select onValueChange={(value) => walletForm.setValue("type", value as any)}>
                            <SelectTrigger data-testid="select-wallet-type">
                              <SelectValue placeholder="Select wallet type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PI">Pi Network</SelectItem>
                              <SelectItem value="USDT_TRON">USDT (TRON)</SelectItem>
                              <SelectItem value="USDT_TON">USDT (TON)</SelectItem>
                              <SelectItem value="USDT_BNB">USDT (BNB Chain)</SelectItem>
                              <SelectItem value="USDT_SOL">USDT (Solana)</SelectItem>
                              <SelectItem value="USDT_AVAX">USDT (Avalanche)</SelectItem>
                            </SelectContent>
                          </Select>
                          {walletForm.formState.errors.type && (
                            <p className="text-sm text-red-600 mt-1">
                              {walletForm.formState.errors.type.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Wallet Address</Label>
                          <Input
                            {...walletForm.register("address")}
                            placeholder="Enter wallet address"
                            data-testid="input-wallet-address"
                          />
                          {walletForm.formState.errors.address && (
                            <p className="text-sm text-red-600 mt-1">
                              {walletForm.formState.errors.address.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setShowWalletDialog(false)}
                            data-testid="button-cancel-wallet"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={createWalletMutation.isPending}
                            data-testid="button-save-wallet"
                          >
                            {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformWallets && platformWallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformWallets.map((wallet: any) => (
                      <div key={wallet.id} className="p-4 border rounded-lg" data-testid={`wallet-${wallet.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-dark">
                            {wallet.type.replace('_', ' ').replace('USDT ', 'USDT on ')}
                          </h4>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-sm text-slate-medium mb-2">Address:</p>
                        <p className="font-mono text-xs bg-slate-50 p-2 rounded border break-all">
                          {wallet.address}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Added {new Date(wallet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No platform wallets configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog" className="space-y-4">
            <ErrorBoundary>
              <AdminBlogManager />
            </ErrorBoundary>
          </TabsContent>

          {/* ── Fees & Rates Tab ── */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-600" />
                  Platform Fee Configuration
                </CardTitle>
                <p className="text-sm text-slate-500">Set the platform fee percentage charged per transaction category. Changes apply to new escrows only.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {DEFAULT_FEE_SETTINGS.map(fee => {
                  const currentVal = feeEdits[fee.key] !== undefined ? feeEdits[fee.key] : getSettingValue(fee.key);
                  return (
                    <div key={fee.key} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50" data-testid={`fee-row-${fee.key}`}>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{fee.label}</p>
                        <p className="text-sm text-slate-500">{fee.description}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={currentVal}
                            onChange={e => setFeeEdits((prev: any) => ({ ...prev, [fee.key]: parseFloat(e.target.value) }))}
                            className="w-24 pr-7 text-right"
                            data-testid={`input-fee-${fee.key}`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                        </div>
                        <Button
                          size="sm"
                          disabled={upsertSettingMutation.isPending || feeEdits[fee.key] === undefined}
                          onClick={() => upsertSettingMutation.mutate({
                            key: fee.key,
                            value: { percentage: currentVal },
                            description: fee.description,
                          })}
                          data-testid={`button-save-fee-${fee.key}`}
                        >
                          {upsertSettingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  Shipping Zone Rates (Base Rate per kg — Air Freight)
                </CardTitle>
                <p className="text-sm text-slate-500">Set base shipping rates per destination zone. Displayed to buyers in the shipping calculator.</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const zoneSetting = (platformSettings as any[])?.find((x: any) => x.key === "shipping_rates");
                  const zones = zoneSetting?.value?.zones ?? [
                    { name: "Zone 1 – West Africa", rate: 3.5 },
                    { name: "Zone 2 – East Africa", rate: 4.2 },
                    { name: "Zone 3 – Europe", rate: 6.8 },
                    { name: "Zone 4 – North America", rate: 8.5 },
                    { name: "Zone 5 – Asia Pacific", rate: 9.2 },
                    { name: "Zone 6 – Rest of World", rate: 12.0 },
                  ];
                  const editedZones = (feeEdits["shipping_rates"] ?? zones) as any[];
                  return (
                    <div className="space-y-3">
                      {editedZones.map((zone: any, idx: number) => (
                        <div key={zone.name} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                          <p className="flex-1 text-sm font-medium text-slate-800">{zone.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={zone.rate}
                              onChange={e => {
                                const updated = editedZones.map((z, i) =>
                                  i === idx ? { ...z, rate: parseFloat(e.target.value) } : z
                                );
                                setFeeEdits((prev: any) => ({ ...prev, "shipping_rates": updated }));
                              }}
                              className="w-24 text-right"
                              data-testid={`input-zone-rate-${idx}`}
                            />
                            <span className="text-slate-400 text-sm">/kg</span>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => upsertSettingMutation.mutate({
                          key: "shipping_rates",
                          value: { zones: editedZones },
                          description: "Shipping zone base rates per kg (air freight)",
                        })}
                        disabled={upsertSettingMutation.isPending || !feeEdits["shipping_rates"]}
                        className="mt-2"
                        data-testid="button-save-shipping-rates"
                      >
                        {upsertSettingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Shipping Rates
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Current Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {(platformSettings as any[])?.length ? (
                  <div className="space-y-2">
                    {(platformSettings as any[]).map((s: any) => (
                      <div key={s.key} className="flex items-center justify-between p-3 border rounded-lg text-sm" data-testid={`setting-row-${s.key}`}>
                        <div>
                          <span className="font-mono font-semibold text-slate-700">{s.key}</span>
                          {s.description && <p className="text-slate-400 text-xs">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                            {JSON.stringify(s.value)}
                          </code>
                          <span className="text-xs text-slate-400">
                            {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No settings configured yet. Save a fee above to get started.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Shipments Tab ── */}
          <TabsContent value="shipments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-cyan-600" />
                    All Shipments ({(allShipments as any[])?.length ?? 0})
                  </span>
                  <Link href="/shipping">
                    <Button size="sm" variant="outline">View Public Hub</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!(allShipments as any[])?.length ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400">No shipments found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(allShipments as any[]).map((s: any) => {
                      const STATUS_COLORS: Record<string, string> = {
                        PENDING: "bg-yellow-100 text-yellow-800",
                        PICKED_UP: "bg-blue-100 text-blue-800",
                        IN_TRANSIT: "bg-cyan-100 text-cyan-800",
                        OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
                        DELIVERED: "bg-green-100 text-green-800",
                        FAILED: "bg-red-100 text-red-800",
                        RETURNED: "bg-orange-100 text-orange-800",
                      };
                      return (
                        <div key={s.id} className="p-4 border rounded-xl hover:shadow-sm transition-shadow" data-testid={`admin-shipment-${s.id}`}>
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</span>
                                <Badge className={`text-xs ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-800"}`}>{s.status}</Badge>
                              </div>
                              <p className="text-sm text-slate-500">{s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <MapPin className="w-3 h-3" />
                                {s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination || "Route not specified"}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Seller: {s.seller?.username ?? "—"} · Buyer: {s.buyer?.username ?? "—"}
                                {s.weightKg ? ` · ${s.weightKg}kg` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select
                                defaultValue={s.status}
                                onValueChange={val => updateShipmentStatusMutation.mutate({ id: s.id, status: val })}
                              >
                                <SelectTrigger className="w-44 text-xs h-8" data-testid={`select-shipment-status-${s.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["PENDING","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED","RETURNED"].map(st => (
                                    <SelectItem key={st} value={st} className="text-xs">{st.replace(/_/g," ")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Link href={`/shipments/${s.id}`}>
                                <Button size="sm" variant="outline" className="h-8 text-xs" data-testid={`button-view-shipment-${s.id}`}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Users Management Tab ── */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  User Management ({(allUsers as any[])?.length ?? 0} users)
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by username, email, or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="input-user-search"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!(allUsers as any[])?.length ? (
                  <div className="text-center py-10">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">No users found.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(allUsers as any[])
                      .filter((u: any) => {
                        const q = userSearch.toLowerCase();
                        return !q || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.firstName?.toLowerCase().includes(q) || u.lastName?.toLowerCase().includes(q);
                      })
                      .map((u: any) => (
                        <div key={u.id} className="p-3 border rounded-xl hover:shadow-sm transition-shadow" data-testid={`user-row-${u.id}`}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {(u.firstName?.[0] || u.username?.[0] || "?").toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-900 text-sm">{u.username || "—"}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {u.role}
                                  </span>
                                  {u.mustChangePassword && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Must Change PW</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{u.email || "No email"}{u.firstName ? ` · ${u.firstName} ${u.lastName || ""}` : ""}</p>
                                <p className="text-xs text-slate-400">Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setEditingUser(u)}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <UserCog className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => { setResetPasswordTarget(u); setNewTempPassword(""); }}
                                data-testid={`button-reset-pw-${u.id}`}
                              >
                                <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset PW
                              </Button>
                              {u.id !== (user as any)?.id && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    if (confirm(`Delete user "${u.username}"? This is permanent.`)) {
                                      deleteUserMutation.mutate(u.id);
                                    }
                                  }}
                                  data-testid={`button-delete-user-${u.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            {editingUser && (
              <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit User: {editingUser.username}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {[
                      { label: "Username", key: "username" },
                      { label: "Email", key: "email" },
                      { label: "First Name", key: "firstName" },
                      { label: "Last Name", key: "lastName" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <Label className="text-sm">{label}</Label>
                        <Input
                          defaultValue={editingUser[key] || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, [key]: e.target.value })}
                          className="mt-1"
                          data-testid={`input-user-${key}`}
                        />
                      </div>
                    ))}
                    <div>
                      <Label className="text-sm">Role</Label>
                      <Select defaultValue={editingUser.role} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Account Type</Label>
                      <Select defaultValue={editingUser.accountType || "INDIVIDUAL"} onValueChange={(v) => setEditingUser({ ...editingUser, accountType: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                          <SelectItem value="BUSINESS">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>Cancel</Button>
                      <Button
                        className="flex-1"
                        disabled={updateUserMutation.isPending}
                        onClick={() => updateUserMutation.mutate({
                          id: editingUser.id,
                          data: {
                            username: editingUser.username,
                            email: editingUser.email,
                            firstName: editingUser.firstName,
                            lastName: editingUser.lastName,
                            role: editingUser.role,
                            accountType: editingUser.accountType,
                          },
                        })}
                        data-testid="button-save-user-edit"
                      >
                        {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Reset Password Dialog */}
            {resetPasswordTarget && (
              <Dialog open={!!resetPasswordTarget} onOpenChange={() => setResetPasswordTarget(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password for {resetPasswordTarget.username}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Set a temporary password. The user will be required to change it on their next login.</p>
                    <div>
                      <Label className="text-sm">New Temporary Password</Label>
                      <Input
                        type="text"
                        value={newTempPassword}
                        onChange={(e) => setNewTempPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="mt-1 font-mono"
                        data-testid="input-temp-password"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={() => setResetPasswordTarget(null)}>Cancel</Button>
                      <Button
                        className="flex-1 bg-amber-600 hover:bg-amber-700"
                        disabled={resetPasswordMutation.isPending || newTempPassword.length < 8}
                        onClick={() => resetPasswordMutation.mutate({ id: resetPasswordTarget.id, newPassword: newTempPassword })}
                        data-testid="button-confirm-reset-pw"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* ── Database Management Tab ── */}
          <TabsContent value="database" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: (adminStats as any)?.totalUsers ?? "—", color: "blue" },
                { label: "Total Listings", value: (adminStats as any)?.totalListings ?? "—", color: "green" },
                { label: "Total Escrows", value: (adminStats as any)?.totalEscrows ?? "—", color: "purple" },
                { label: "Total Wallets", value: (adminStats as any)?.totalWallets ?? "—", color: "cyan" },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <CardContent className="p-4 text-center">
                    <Database className={`w-6 h-6 text-${color}-500 mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-slate-600" />
                    Database Overview
                  </span>
                  <Button size="sm" variant="outline" onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
                    toast({ title: "Refreshed" });
                  }} data-testid="button-refresh-db">
                    <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { table: "users", label: "Users", count: (adminStats as any)?.totalUsers, desc: "Registered accounts (regular + admin)" },
                    { table: "listings", label: "Listings", count: (adminStats as any)?.totalListings, desc: "Active and archived marketplace listings" },
                    { table: "escrows", label: "Escrows", count: (adminStats as any)?.totalEscrows, desc: "Transaction escrow records" },
                    { table: "wallets", label: "Wallets", count: (adminStats as any)?.totalWallets, desc: "User crypto wallets registered" },
                    { table: "blog_posts", label: "Blog Posts", count: (adminStats as any)?.totalBlogPosts, desc: "Published and draft blog content" },
                    { table: "reviews", label: "Reviews", count: (adminStats as any)?.totalReviews, desc: "User-submitted ratings and reviews" },
                    { table: "messages", label: "Messages", count: (adminStats as any)?.totalMessages, desc: "Direct messages between users" },
                    { table: "shipments", label: "Shipments", count: (adminStats as any)?.totalShipments, desc: "Shipping tracking records" },
                  ].map(({ table, label, count, desc }) => (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors" data-testid={`db-table-${table}`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-slate-700">{table}</span>
                          <span className="text-xs text-slate-400">{desc}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-900 min-w-[2.5rem] text-right">
                          {count !== undefined ? count : <Loader2 className="w-4 h-4 animate-spin inline" />}
                        </span>
                        <span className="text-xs text-slate-400">rows</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 pr-4 font-medium">Username</th>
                        <th className="pb-2 pr-4 font-medium">Email</th>
                        <th className="pb-2 pr-4 font-medium">Role</th>
                        <th className="pb-2 pr-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(allUsers as any[])?.slice(0, 10).map((u: any) => (
                        <tr key={u.id} className="border-b hover:bg-slate-50" data-testid={`db-user-row-${u.id}`}>
                          <td className="py-2 pr-4 font-medium text-slate-900">{u.username || "—"}</td>
                          <td className="py-2 pr-4 text-slate-600">{u.email || "—"}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!(allUsers as any[])?.length && (
                    <p className="text-center text-slate-400 py-6">No users found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Pages Content Management Tab ── */}
          <TabsContent value="pages" className="space-y-6">
            <AdminPageEditor />
          </TabsContent>

          {/* ── Listings Management Tab ── */}
          <TabsContent value="listings" className="space-y-6">
            <AdminListingsTab toast={toast} queryClient={queryClient} apiRequest={apiRequest} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Methods</span>
                  <Link href="/admin/payment-methods">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Platform Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Platform Fee:</p>
                        <p className="font-semibold text-blue-800">10%</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Supported Currencies:</p>
                        <p className="font-semibold text-blue-800">PI, USDT, USD (Bank Transfer)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Payment Methods Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Cryptocurrency Payments</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Bank Transfer</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Escrow Protection</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Note</h4>
                    <p className="text-sm text-yellow-700">
                      Bank transfer details must be manually managed by admins. 
                      Click "Manage Payment Methods" above to configure bank account information for customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-support" className="space-y-4">
            <AdminSupportChatTab />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <AdminSecurityTab adminUser={user} />
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <ErrorBoundary>
              <CompetitorDashboard />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <ErrorBoundary>
              <AdminSEOTab />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        {selectedEscrow && (
          <Dialog open={!!selectedEscrow} onOpenChange={() => setSelectedEscrow(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Escrow Action</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to change the status of escrow for "{selectedEscrow.listing?.title}" 
                  to <strong>{selectedEscrow.newStatus}</strong>?
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedEscrow(null)}
                    data-testid="button-cancel-escrow-action"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={confirmEscrowAction}
                    disabled={updateEscrowMutation.isPending}
                    data-testid="button-confirm-escrow-action"
                  >
                    {updateEscrowMutation.isPending ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Footer />
    </div>
  );
}
