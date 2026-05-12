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
import PagesContentTab from "@/components/PagesContentTab";
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
} from "lucide-react";

const platformWalletSchema = z.object({
  type: z.enum(["PI", "USDT_TRON", "USDT_TON", "USDT_BNB", "USDT_SOL", "USDT_AVAX"]),
  address: z.string().min(1, "Wallet address is required"),
});

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  contentMarkdown: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published: z.boolean().default(false),
  metaDescription: z.string().max(160, "Keep under 160 characters for best SEO").optional().or(z.literal("")),
  focusKeyword: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  ogTitle: z.string().max(60, "Keep under 60 characters").optional().or(z.literal("")),
  ogDescription: z.string().max(160, "Keep under 160 characters").optional().or(z.literal("")),
});

type PlatformWalletFormData = z.infer<typeof platformWalletSchema>;
type BlogPostFormData = z.infer<typeof blogPostSchema>;

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
  const [seeding, setSeeding] = useState(false);
  const [facilitiesInput, setFacilitiesInput] = useState("");
  const [amenitiesInput, setAmenitiesInput] = useState("");
  const [imagesInput, setImagesInput] = useState("");

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
                variant="outline"
                size="sm"
                onClick={handleSeedProperties}
                disabled={seeding}
                data-testid="button-seed-properties"
              >
                {seeding ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Seeding…</> : <><Plus className="w-4 h-4 mr-1" /> Seed Nigerian Properties</>}
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
                <Label className="text-sm font-medium">Image URLs <span className="text-slate-400 font-normal">(one per line)</span></Label>
                <Textarea
                  rows={4}
                  value={imagesInput}
                  onChange={e => setImagesInput(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  data-testid="textarea-images"
                />
                {imagesInput && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {imagesInput.split("\n").filter(u => u.trim()).slice(0, 4).map((url, i) => (
                      <img key={i} src={url.trim()} alt="" className="w-16 h-16 object-cover rounded border" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ))}
                  </div>
                )}
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
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<any>(null);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);

  // Check admin access
  if (!isAuthenticated || user?.role !== 'ADMIN') {
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

  // Data queries
  const { data: escrows } = useQuery({
    queryKey: ["/api/escrows", { admin: true }],
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

  const { data: blogPosts } = useQuery({
    queryKey: ["/api/blog", { published: false }],
  });

  const { data: platformSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/platform-settings"],
  });

  const { data: allShipments } = useQuery({
    queryKey: ["/api/admin/shipments"],
  });

  const { data: allUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: adminStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const [feeEdits, setFeeEdits] = useState<Record<string, any>>({});

  // Form setup
  const walletForm = useForm<PlatformWalletFormData>({
    resolver: zodResolver(platformWalletSchema),
    defaultValues: {
      type: undefined,
      address: "",
    },
  });

  const blogForm = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      contentMarkdown: "",
      coverImageUrl: "",
      published: false,
      metaDescription: "",
      focusKeyword: "",
      tags: "",
      ogTitle: "",
      ogDescription: "",
    },
  });

  // Mutations
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

  const blogMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const endpoint = editingBlogPost ? `/api/blog/${editingBlogPost.id}` : "/api/blog";
      const method = editingBlogPost ? "PATCH" : "POST";
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      };
      await apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: editingBlogPost ? "Blog post updated successfully" : "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setShowBlogDialog(false);
      setEditingBlogPost(null);
      blogForm.reset();
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
        title: editingBlogPost ? "Failed to update blog post" : "Failed to create blog post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/blog/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Blog post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
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
        title: "Failed to delete blog post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleBlogSubmit = (data: BlogPostFormData) => {
    blogMutation.mutate(data);
  };

  // Fee management mutations
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

  const handleEditBlogPost = (post: any) => {
    setEditingBlogPost(post);
    blogForm.reset({
      title: post.title,
      excerpt: post.excerpt || "",
      contentMarkdown: post.contentMarkdown,
      coverImageUrl: post.coverImageUrl || "",
      published: post.published,
      metaDescription: post.metaDescription || "",
      focusKeyword: post.focusKeyword || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || ""),
      ogTitle: post.ogTitle || "",
      ogDescription: post.ogDescription || "",
    });
    setShowBlogDialog(true);
  };

  const handleDeleteBlogPost = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteBlogMutation.mutate(id);
    }
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
          </TabsList>

          <TabsContent value="escrows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Management</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Blog Management</span>
                  <Dialog open={showBlogDialog} onOpenChange={setShowBlogDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-blog-post">
                        <Plus className="w-4 h-4 mr-2" />
                        New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingBlogPost ? "Edit Blog Post" : "Create New Blog Post"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={blogForm.handleSubmit(handleBlogSubmit)} className="space-y-4">
                        <Tabs defaultValue="content" className="w-full">
                          <TabsList className="w-full">
                            <TabsTrigger value="content" className="flex-1 flex items-center gap-2">
                              <FileText className="w-4 h-4" /> Content
                            </TabsTrigger>
                            <TabsTrigger value="seo" className="flex-1 flex items-center gap-2">
                              <Globe className="w-4 h-4" /> SEO
                            </TabsTrigger>
                            <TabsTrigger value="social" className="flex-1 flex items-center gap-2">
                              <Tag className="w-4 h-4" /> Social & Tags
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="content" className="space-y-4 mt-4">
                            <div>
                              <Label>Title *</Label>
                              <Input
                                {...blogForm.register("title")}
                                placeholder="Enter blog post title"
                                data-testid="input-blog-title"
                              />
                              {blogForm.formState.errors.title && (
                                <p className="text-sm text-red-600 mt-1">{blogForm.formState.errors.title.message}</p>
                              )}
                            </div>

                            <div>
                              <Label>Excerpt *</Label>
                              <Textarea
                                {...blogForm.register("excerpt")}
                                placeholder="Brief description shown in post listings and search results"
                                rows={2}
                                data-testid="input-blog-excerpt"
                              />
                              {blogForm.formState.errors.excerpt && (
                                <p className="text-sm text-red-600 mt-1">{blogForm.formState.errors.excerpt.message}</p>
                              )}
                            </div>

                            <div>
                              <Label>Cover Image URL (optional)</Label>
                              <Input
                                {...blogForm.register("coverImageUrl")}
                                placeholder="https://example.com/image.jpg"
                                data-testid="input-blog-cover"
                              />
                              {blogForm.formState.errors.coverImageUrl && (
                                <p className="text-sm text-red-600 mt-1">{blogForm.formState.errors.coverImageUrl.message}</p>
                              )}
                            </div>

                            <div>
                              <Label>Content (Markdown) *</Label>
                              <Textarea
                                {...blogForm.register("contentMarkdown")}
                                placeholder="Write your content in Markdown format...&#10;&#10;# Heading&#10;## Subheading&#10;&#10;**Bold**, *italic*, `code`&#10;&#10;- List item&#10;- List item"
                                rows={14}
                                className="font-mono text-sm"
                                data-testid="input-blog-content"
                              />
                              {blogForm.formState.errors.contentMarkdown && (
                                <p className="text-sm text-red-600 mt-1">{blogForm.formState.errors.contentMarkdown.message}</p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                              <input
                                type="checkbox"
                                id="published"
                                {...blogForm.register("published")}
                                className="rounded"
                                data-testid="checkbox-blog-published"
                              />
                              <Label htmlFor="published" className="cursor-pointer">Publish immediately (visible to all users)</Label>
                            </div>
                          </TabsContent>

                          <TabsContent value="seo" className="space-y-4 mt-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                              <strong>SEO Tips:</strong> Meta description should be 120–160 characters. Focus keyword should appear in title, first paragraph, and headings. Fill all fields for best search engine visibility.
                            </div>

                            <div>
                              <Label className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-slate-400" />
                                Focus Keyword
                              </Label>
                              <Input
                                {...blogForm.register("focusKeyword")}
                                placeholder="e.g. customs clearance Nigeria"
                                data-testid="input-blog-focus-keyword"
                              />
                              <p className="text-xs text-slate-500 mt-1">The primary keyword this post should rank for in search engines</p>
                            </div>

                            <div>
                              <Label>Meta Description</Label>
                              <Textarea
                                {...blogForm.register("metaDescription")}
                                placeholder="Brief summary for search engines (120–160 characters recommended)"
                                rows={3}
                                data-testid="input-blog-meta-description"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {(blogForm.watch("metaDescription") || "").length}/160 characters
                                {(blogForm.watch("metaDescription") || "").length > 160 && <span className="text-red-500 ml-2">Too long!</span>}
                                {(blogForm.watch("metaDescription") || "").length > 0 && (blogForm.watch("metaDescription") || "").length < 120 && <span className="text-amber-500 ml-2">Could be longer for better SEO</span>}
                                {(blogForm.watch("metaDescription") || "").length >= 120 && (blogForm.watch("metaDescription") || "").length <= 160 && <span className="text-green-500 ml-2">✓ Good length</span>}
                              </p>
                              {blogForm.formState.errors.metaDescription && (
                                <p className="text-sm text-red-600 mt-1">{blogForm.formState.errors.metaDescription.message}</p>
                              )}
                            </div>

                            <div className="bg-slate-50 rounded-lg p-4 border">
                              <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Google Search Preview</p>
                              <p className="text-blue-600 text-sm font-medium truncate">
                                {blogForm.watch("title") || "Post Title"}
                              </p>
                              <p className="text-green-600 text-xs">beagvsglobal.com/blog/...</p>
                              <p className="text-slate-600 text-xs mt-1 line-clamp-2">
                                {blogForm.watch("metaDescription") || blogForm.watch("excerpt") || "Meta description will appear here..."}
                              </p>
                            </div>
                          </TabsContent>

                          <TabsContent value="social" className="space-y-4 mt-4">
                            <div className="bg-slate-50 border rounded-lg p-3 text-sm text-slate-600">
                              <strong>Open Graph tags</strong> control how your post appears when shared on Facebook, WhatsApp, LinkedIn, and other social platforms.
                            </div>

                            <div>
                              <Label>Tags (comma-separated)</Label>
                              <Input
                                {...blogForm.register("tags")}
                                placeholder="e.g. customs, Nigeria, freight, import"
                                data-testid="input-blog-tags"
                              />
                              <p className="text-xs text-slate-500 mt-1">Separate multiple tags with commas. Tags help categorize content and improve discoverability.</p>
                            </div>

                            <div>
                              <Label>OG Title (Social Share Title)</Label>
                              <Input
                                {...blogForm.register("ogTitle")}
                                placeholder="Title when shared on social media (leave blank to use post title)"
                                data-testid="input-blog-og-title"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {(blogForm.watch("ogTitle") || "").length}/60 characters
                                {(blogForm.watch("ogTitle") || "").length > 60 && <span className="text-red-500 ml-2">Too long!</span>}
                              </p>
                            </div>

                            <div>
                              <Label>OG Description (Social Share Description)</Label>
                              <Textarea
                                {...blogForm.register("ogDescription")}
                                placeholder="Description when shared on social media (leave blank to use meta description)"
                                rows={3}
                                data-testid="input-blog-og-description"
                              />
                              <p className="text-xs text-slate-500 mt-1">
                                {(blogForm.watch("ogDescription") || "").length}/160 characters
                              </p>
                            </div>

                            {(blogForm.watch("ogTitle") || blogForm.watch("title")) && (
                              <div className="bg-white border rounded-lg overflow-hidden">
                                <p className="text-xs font-medium text-slate-500 p-2 bg-slate-50 border-b uppercase tracking-wide">Social Share Preview</p>
                                {blogForm.watch("coverImageUrl") && (
                                  <div className="h-32 bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                                    Cover image preview
                                  </div>
                                )}
                                <div className="p-3">
                                  <p className="text-xs text-slate-400 uppercase">beagvsglobal.com</p>
                                  <p className="font-semibold text-sm text-slate-800 mt-1">
                                    {blogForm.watch("ogTitle") || blogForm.watch("title")}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {blogForm.watch("ogDescription") || blogForm.watch("metaDescription") || blogForm.watch("excerpt")}
                                  </p>
                                </div>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>

                        <div className="flex space-x-3 pt-2 border-t">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setShowBlogDialog(false);
                              setEditingBlogPost(null);
                              blogForm.reset();
                            }}
                            data-testid="button-cancel-blog"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={blogMutation.isPending}
                            data-testid="button-save-blog"
                          >
                            {blogMutation.isPending ? "Saving..." : (editingBlogPost ? "Update Post" : "Create Post")}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blogPosts && blogPosts.length > 0 ? (
                  <div className="space-y-4">
                    {blogPosts.map((post: any) => (
                      <div key={post.id} className="p-4 border rounded-lg" data-testid={`blog-post-${post.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-slate-dark">{post.title}</h4>
                              <Badge variant={post.published ? "default" : "secondary"}>
                                {post.published ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-medium mb-2">{post.excerpt}</p>
                            <p className="text-xs text-slate-400">
                              Created {new Date(post.createdAt).toLocaleDateString()} by {post.author?.username}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Link href={`/blog/${post.slug}`}>
                              <Button size="sm" variant="outline" data-testid={`button-view-blog-${post.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditBlogPost(post)}
                              data-testid={`button-edit-blog-${post.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteBlogPost(post.id)}
                              data-testid={`button-delete-blog-${post.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No blog posts found</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
            <PagesContentTab queryClient={queryClient} toast={toast} apiRequest={apiRequest} />
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
