import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { AgentPayoutManager } from "@/components/PayoutRequestManager";
import { Building2 } from "lucide-react";
import {
  Package, Truck, CheckCircle2, Clock, MapPin,
  AlertCircle, LogOut, User2, RefreshCw, ChevronRight,
  Search, Loader2, MessageCircle, Filter, ShoppingBag,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Pickup",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  RETURNED: "Returned",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
};

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }[]> = {
  PENDING: [{ status: "PICKED_UP", label: "Mark as Picked Up", color: "bg-blue-600 hover:bg-blue-700" }],
  PICKED_UP: [
    { status: "IN_TRANSIT", label: "Mark In Transit", color: "bg-cyan-600 hover:bg-cyan-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  IN_TRANSIT: [
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "bg-purple-600 hover:bg-purple-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  OUT_FOR_DELIVERY: [
    { status: "DELIVERED", label: "Confirm Delivered", color: "bg-green-600 hover:bg-green-700" },
    { status: "FAILED", label: "Delivery Failed", color: "bg-red-500 hover:bg-red-600" },
    { status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  FAILED: [{ status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" }],
  DELIVERED: [],
  RETURNED: [],
};

// ── component ─────────────────────────────────────────────────────────────────

export default function DeliveryAgentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [locationFilter, setLocationFilter] = useState("");

  const { data: shipments = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/agent/shipments"],
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const { data: availableShipments = [], isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery<any[]>({
    queryKey: ["/api/agent/available-shipments"],
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const { data: platformSettings = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-settings"],
    enabled: !!user,
  });
  const agentPayoutPct: number = (() => {
    const s = (platformSettings as any[]).find((x: any) => x.key === "fee_agent_payout");
    return s?.value?.percentage ?? 75;
  })();

  const updateStatusMutation = useMutation({
    mutationFn: ({ shipmentId, status, location }: { shipmentId: string; status: string; location?: string }) =>
      apiRequest("POST", `/api/agent/shipments/${shipmentId}/status`, { status, location }),
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/shipments"] });
    },
    onError: (err: any) => toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  const claimMutation = useMutation({
    mutationFn: (shipmentId: string) => apiRequest("POST", `/api/agent/shipments/${shipmentId}/claim`),
    onSuccess: () => {
      toast({ title: "Shipment claimed!", description: "It's now in your assigned deliveries." });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/available-shipments"] });
    },
    onError: (err: any) => toast({ title: "Failed to claim shipment", description: err.message, variant: "destructive" }),
  });

  const openChat = async (shipmentId: string) => {
    try {
      const thread = await apiRequest("GET", `/api/agent/shipments/${shipmentId}/thread`).then(r => r.json());
      setLocation(`/chat/${thread.id}`);
    } catch {
      toast({ title: "Chat not available", description: "No conversation linked to this order yet.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    setLocation("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || (user as any).role !== "DELIVERY_AGENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-sm w-full mx-4">
          <CardContent className="pt-8 pb-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-slate-500 text-sm mb-4">This portal is for delivery agents only.</p>
            <Button onClick={() => setLocation("/login")} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Summary stats
  const total = shipments.length;
  const pending = shipments.filter((s: any) => s.status === "PENDING").length;
  const active = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length;
  const delivered = shipments.filter((s: any) => s.status === "DELIVERED").length;

  const pendingShipments = shipments.filter((s: any) => s.status === "PENDING");
  const activeShipments = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status));
  const completedShipments = shipments.filter((s: any) => ["DELIVERED", "FAILED", "RETURNED"].includes(s.status));

  // Location-filtered available shipments
  const filteredAvailable = locationFilter.trim()
    ? availableShipments.filter((s: any) => {
        const q = locationFilter.toLowerCase();
        return (
          s.origin?.toLowerCase().includes(q) ||
          s.destination?.toLowerCase().includes(q) ||
          s.seller?.location?.toLowerCase().includes(q) ||
          s.listing?.location?.toLowerCase().includes(q)
        );
      })
    : availableShipments;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">Agent Portal</p>
              <p className="text-xs text-slate-500 leading-tight">
                {(user as any).firstName || (user as any).username || (user as any).email}
                {(user as any).location ? ` · ${(user as any).location}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/chat")} className="text-slate-500 hover:text-blue-600">
              <MessageCircle className="w-4 h-4 mr-1" /> Chat
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { refetch(); refetchAvailable(); }} className="text-slate-500 hover:text-slate-700">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Assigned", value: total, icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
            { label: "Awaiting Pickup", value: pending, icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "In Progress", value: active, icon: Truck, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Delivered", value: delivered, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500 leading-tight">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: My Deliveries / Available Pickups */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="available" className="flex-1">
              Available Pickups
              {availableShipments.length > 0 && (
                <Badge className="ml-2 bg-green-600 text-white text-xs">{availableShipments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-deliveries" className="flex-1">
              My Deliveries
              {total > 0 && <Badge className="ml-2 bg-blue-600 text-white text-xs">{total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex-1">
              Earnings & Payouts
            </TabsTrigger>
          </TabsList>

          {/* Available Pickups */}
          <TabsContent value="available" className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-slate-900">Available Pickups</h3>
                <p className="text-sm text-slate-500">Unclaimed orders you can self-assign for delivery</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetchAvailable()} disabled={loadingAvailable}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loadingAvailable ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {/* Location filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Filter by location (e.g. Lagos, Abuja)…"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredAvailable.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-14">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    {locationFilter ? "No pickups match this location" : "No available pickups right now"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {locationFilter ? "Try a different location or clear the filter." : "New orders will appear here once sellers submit payments."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {(filteredAvailable as any[]).map((s) => (
                  <AvailableShipmentCard
                    key={s.id}
                    shipment={s}
                    agentPayoutPct={agentPayoutPct}
                    onClaim={() => claimMutation.mutate(s.id)}
                    isClaiming={claimMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Deliveries */}
          <TabsContent value="my-deliveries" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading your shipments…</p>
              </div>
            ) : shipments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-14">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No shipments assigned yet</p>
                  <p className="text-slate-400 text-sm mt-1">Browse "Available Pickups" to self-assign deliveries.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {pendingShipments.length > 0 && (
                  <ShipmentSection
                    title="Awaiting Pickup"
                    icon={<Clock className="w-4 h-4 text-yellow-600" />}
                    shipments={pendingShipments}
                    onUpdateStatus={updateStatusMutation.mutate}
                    isUpdating={updateStatusMutation.isPending}
                    onChat={openChat}
                  />
                )}
                {activeShipments.length > 0 && (
                  <ShipmentSection
                    title="Active Deliveries"
                    icon={<Truck className="w-4 h-4 text-blue-600" />}
                    shipments={activeShipments}
                    onUpdateStatus={updateStatusMutation.mutate}
                    isUpdating={updateStatusMutation.isPending}
                    onChat={openChat}
                  />
                )}
                {completedShipments.length > 0 && (
                  <ShipmentSection
                    title="Completed"
                    icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                    shipments={completedShipments}
                    onUpdateStatus={updateStatusMutation.mutate}
                    isUpdating={updateStatusMutation.isPending}
                    onChat={openChat}
                    muted
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Earnings & Payouts */}
          <TabsContent value="earnings" className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-slate-900">Payout account</p>
                  <p className="text-xs text-slate-500">Add or update your bank account or crypto wallet to receive earnings.</p>
                </div>
                <Link href="/account/settings">
                  <Button size="sm" variant="outline">
                    <Building2 className="w-4 h-4 mr-1.5" /> Manage Payout Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <AgentPayoutManager shipments={shipments} />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        Beagvs Global · Delivery Agent Portal
      </footer>
    </div>
  );
}

// ── AvailableShipmentCard ─────────────────────────────────────────────────────

function AvailableShipmentCard({
  shipment: s,
  agentPayoutPct,
  onClaim,
  isClaiming,
}: {
  shipment: any;
  agentPayoutPct: number;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const feeMatch = s.specialInstructions?.match(/Shipping fee: ([\₦\d,.]+ \w+)/);
  const listingImages: string[] = s.listing?.images ?? [];

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Product info row */}
        {s.listing && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
            {listingImages[0] ? (
              <img src={listingImages[0]} alt={s.listing.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">{s.listing.title}</p>
              <p className="text-xs text-slate-500">{s.listing.type?.replace(/_/g, " ")} · {s.listing.priceCrypto} {s.listing.currency}</p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</span>
              <Badge className="text-xs border bg-yellow-100 text-yellow-800 border-yellow-200">Unclaimed</Badge>
            </div>
            {(s.origin || s.destination) && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination}</span>
              </div>
            )}
            {s.recipientName && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <User2 className="w-3 h-3 flex-shrink-0" />
                <span>{s.recipientName}</span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              {s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}
              {s.weightKg ? ` · ${s.weightKg} kg` : ""}
            </p>
            {s.seller && (
              <p className="text-xs text-slate-500">
                Seller: <span className="font-medium">{s.seller.firstName || s.seller.username}</span>
                {s.seller.location ? ` · ${s.seller.location}` : ""}
              </p>
            )}
            {feeMatch ? (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded px-2 py-1">
                <span className="text-xs text-green-700 font-medium">
                  💰 Your payout: {feeMatch[1]} ({agentPayoutPct}% of fee)
                </span>
              </div>
            ) : s.specialInstructions ? (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 border border-amber-100">
                ⚠ {s.specialInstructions}
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
            disabled={isClaiming}
            onClick={onClaim}
          >
            {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Claim <ChevronRight className="w-3.5 h-3.5 ml-1" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── ShipmentSection ───────────────────────────────────────────────────────────

function ShipmentSection({
  title,
  icon,
  shipments,
  onUpdateStatus,
  isUpdating,
  onChat,
  muted = false,
}: {
  title: string;
  icon: React.ReactNode;
  shipments: any[];
  onUpdateStatus: (args: { shipmentId: string; status: string }) => void;
  isUpdating: boolean;
  onChat: (shipmentId: string) => void;
  muted?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className={`font-semibold text-sm ${muted ? "text-slate-400" : "text-slate-700"}`}>{title}</h2>
        <Badge variant="secondary" className="text-xs">{shipments.length}</Badge>
      </div>
      <div className="space-y-3">
        {shipments.map((s) => (
          <ShipmentCard
            key={s.id}
            shipment={s}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
            onChat={onChat}
            muted={muted}
          />
        ))}
      </div>
    </section>
  );
}

// ── ShipmentCard ──────────────────────────────────────────────────────────────

function ShipmentCard({
  shipment: s,
  onUpdateStatus,
  isUpdating,
  onChat,
  muted,
}: {
  shipment: any;
  onUpdateStatus: (args: { shipmentId: string; status: string }) => void;
  isUpdating: boolean;
  onChat: (shipmentId: string) => void;
  muted: boolean;
}) {
  const actions = NEXT_STATUS[s.status] ?? [];
  const listingImages: string[] = s.listing?.images ?? [];

  return (
    <Card className={`border shadow-sm transition-shadow hover:shadow-md ${muted ? "opacity-70" : ""}`}>
      <CardContent className="p-4">
        {/* Product row */}
        {s.listing && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
            {listingImages[0] ? (
              <img src={listingImages[0]} alt={s.listing.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">{s.listing.title}</p>
              <p className="text-xs text-slate-500">{s.listing.type?.replace(/_/g, " ")}</p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</span>
              <Badge className={`text-xs border ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {STATUS_LABELS[s.status] || s.status}
              </Badge>
            </div>
            {(s.origin || s.destination) && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination}
                </span>
              </div>
            )}
            {s.recipientName && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                <User2 className="w-3 h-3 flex-shrink-0" />
                <span>{s.recipientName}{s.recipientPhone ? ` · ${s.recipientPhone}` : ""}</span>
              </div>
            )}
            <p className="text-xs text-slate-400">
              {s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}
              {s.weightKg ? ` · ${s.weightKg} kg` : ""}
            </p>
            {/* Buyer contact */}
            {s.buyer && (
              <p className="text-xs text-slate-500 mt-1">
                Buyer: <span className="font-medium">{s.buyer.firstName || s.buyer.username}</span>
                {s.buyer.whatsapp ? ` · WhatsApp: ${s.buyer.whatsapp}` : ""}
              </p>
            )}
            {s.specialInstructions && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2 border border-amber-100">
                ⚠ {s.specialInstructions}
              </p>
            )}
            {s.events?.length > 0 && (
              <p className="text-xs text-slate-400 mt-1.5 italic">
                Last update: {s.events[0].description}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Chat button */}
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => onChat(s.id)}
            >
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
            </Button>
            {/* Status action buttons */}
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                className={`text-xs text-white ${action.color}`}
                disabled={isUpdating}
                onClick={() => onUpdateStatus({ shipmentId: s.id, status: action.status })}
              >
                {action.label}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
