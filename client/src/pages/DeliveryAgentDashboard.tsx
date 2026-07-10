import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import WalletManager from "@/components/WalletManager";
import BankAccountManager from "@/components/BankAccountManager";
import { AgentPayoutManager } from "@/components/PayoutRequestManager";
import {
  Package, Truck, CheckCircle2, Clock, MapPin,
  AlertCircle, LogOut, RefreshCw, ChevronRight,
  Search, Loader2, MessageCircle, Filter, ShoppingBag,
  User2, TrendingUp, Wallet, DollarSign, BarChart3,
  ArrowUpRight, Inbox, Star, Navigation, PhoneCall,
} from "lucide-react";

// ── constants ─────────────────────────────────────────────────────────────────

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
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  OUT_FOR_DELIVERY: "bg-violet-100 text-violet-800 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
};

const NEXT_STATUS: Record<string, { status: string; label: string; color: string }[]> = {
  PENDING: [{ status: "PICKED_UP", label: "Mark Picked Up", color: "bg-blue-600 hover:bg-blue-700" }],
  PICKED_UP: [
    { status: "IN_TRANSIT", label: "In Transit", color: "bg-cyan-600 hover:bg-cyan-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  IN_TRANSIT: [
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "bg-violet-600 hover:bg-violet-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  OUT_FOR_DELIVERY: [
    { status: "DELIVERED", label: "✓ Confirm Delivered", color: "bg-emerald-600 hover:bg-emerald-700" },
    { status: "FAILED", label: "Delivery Failed", color: "bg-red-500 hover:bg-red-600" },
    { status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  FAILED: [{ status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" }],
  DELIVERED: [],
  RETURNED: [],
};

// ── main component ────────────────────────────────────────────────────────────

export default function DeliveryAgentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const valid = ["overview", "pickups", "deliveries", "earnings", "messages"];
    return tab && valid.includes(tab) ? tab : "overview";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const valid = ["overview", "pickups", "deliveries", "earnings", "messages"];
    if (tab && valid.includes(tab)) setActiveTab(tab);
  }, [location]);
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

  const { data: payoutRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/payout-requests"],
    enabled: !!user,
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
    mutationFn: ({ shipmentId, status }: { shipmentId: string; status: string }) =>
      apiRequest("POST", `/api/agent/shipments/${shipmentId}/status`, { status }),
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/shipments"] });
    },
    onError: (err: any) => toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const claimMutation = useMutation({
    mutationFn: (shipmentId: string) => apiRequest("POST", `/api/agent/shipments/${shipmentId}/claim`),
    onSuccess: () => {
      toast({ title: "Shipment claimed!", description: "Check 'My Deliveries' to manage it." });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/available-shipments"] });
    },
    onError: (err: any) => toast({ title: "Failed to claim", description: err.message, variant: "destructive" }),
  });

  const openChat = async (shipmentId: string) => {
    try {
      const thread = await apiRequest("GET", `/api/agent/shipments/${shipmentId}/thread`).then(r => r.json());
      setLocation(`/chat/${thread.id}`);
    } catch {
      toast({ title: "No chat available", description: "No conversation linked yet.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    setLocation("/login");
  };

  // ── guards ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || (user as any).role !== "DELIVERY_AGENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-sm w-full">
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

  // ── derived stats ─────────────────────────────────────────────────────────
  const delivered = shipments.filter((s: any) => s.status === "DELIVERED").length;
  const active = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length;
  const pending = shipments.filter((s: any) => s.status === "PENDING").length;

  const pendingShipments = shipments.filter((s: any) => s.status === "PENDING");
  const activeShipments = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status));
  const completedShipments = shipments.filter((s: any) => ["DELIVERED", "FAILED", "RETURNED"].includes(s.status));

  // Earnings computation
  const totalEarned = shipments
    .filter((s: any) => s.status === "DELIVERED" && s.escrow?.shippingAgentFeeAmount)
    .reduce((sum: number, s: any) => sum + Number(s.escrow.shippingAgentFeeAmount || 0), 0);
  const paidOut = (payoutRequests as any[])
    .filter((r: any) => r.status === "PAID")
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
  const pendingPayouts = (payoutRequests as any[])
    .filter((r: any) => ["PENDING", "APPROVED"].includes(r.status))
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
  const estimatedBalance = totalEarned - paidOut;

  // Shipments that have chats (all assigned shipments can have a chat)
  const chatsAvailable = shipments.filter((s: any) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s.status)
  );

  // Location filter for available pickups
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

  const displayName = (user as any).firstName || (user as any).username || (user as any).email || "Agent";

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Sticky Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm leading-tight truncate">Agent Portal</p>
            <p className="text-xs text-slate-400 leading-tight truncate">
              {displayName}{(user as any).location ? ` · ${(user as any).location}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
              onClick={() => { refetch(); refetchAvailable(); }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-8 px-2 text-slate-400 hover:text-red-600 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Scrollable tab bar — no line wrap on mobile */}
          <div className="overflow-x-auto -mx-1 px-1 pb-0">
            <TabsList className="flex w-max min-w-full gap-0.5 bg-slate-100 rounded-xl p-1 h-auto">
              <TabsTrigger value="overview" className="flex-1 min-w-[80px] text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="pickups" className="flex-1 min-w-[80px] text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                <Inbox className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Pickups</span>
                {availableShipments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                    {availableShipments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="flex-1 min-w-[84px] text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
                <Truck className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Deliveries</span>
                {(pending + active) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center px-1">
                    {pending + active}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex-1 min-w-[82px] text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Wallet className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Earnings</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 min-w-[86px] text-xs sm:text-sm py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <MessageCircle className="w-3.5 h-3.5 mr-1 sm:mr-1.5" />
                <span>Messages</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Balance hero card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Estimated Balance</p>
                  <p className="text-3xl font-bold">
                    {totalEarned > 0 ? `₦${estimatedBalance.toLocaleString()}` : "—"}
                  </p>
                  <p className="text-blue-200 text-xs mt-1">
                    {totalEarned > 0
                      ? `₦${totalEarned.toLocaleString()} earned · ₦${paidOut.toLocaleString()} paid out`
                      : "Complete deliveries to earn commissions"}
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20">
                <div className="text-center">
                  <p className="text-xl font-bold">{delivered}</p>
                  <p className="text-blue-200 text-xs">Delivered</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{active}</p>
                  <p className="text-blue-200 text-xs">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{availableShipments.length}</p>
                  <p className="text-blue-200 text-xs">Available</p>
                </div>
              </div>
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("pickups")}
                className="bg-white rounded-xl p-4 border border-slate-200 text-left hover:border-blue-300 hover:shadow-sm transition-all active:scale-95"
              >
                <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                  <Inbox className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">Available Pickups</p>
                <p className="text-xs text-slate-400 mt-0.5">{availableShipments.length} ready to claim</p>
              </button>
              <button
                onClick={() => setActiveTab("deliveries")}
                className="bg-white rounded-xl p-4 border border-slate-200 text-left hover:border-blue-300 hover:shadow-sm transition-all active:scale-95"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">My Deliveries</p>
                <p className="text-xs text-slate-400 mt-0.5">{active} active, {pending} pending</p>
              </button>
              <button
                onClick={() => setActiveTab("earnings")}
                className="bg-white rounded-xl p-4 border border-slate-200 text-left hover:border-blue-300 hover:shadow-sm transition-all active:scale-95"
              >
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-violet-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">Earnings & Wallets</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pendingPayouts > 0 ? `₦${pendingPayouts.toLocaleString()} pending` : "Manage payouts"}
                </p>
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className="bg-white rounded-xl p-4 border border-slate-200 text-left hover:border-blue-300 hover:shadow-sm transition-all active:scale-95"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">Messages</p>
                <p className="text-xs text-slate-400 mt-0.5">{chatsAvailable.length} active conversations</p>
              </button>
            </div>

            {/* Delivery analytics */}
            {shipments.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Delivery Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {[
                    { label: "Delivered", count: delivered, total: shipments.length, color: "bg-emerald-500" },
                    { label: "In Progress", count: active, total: shipments.length, color: "bg-blue-500" },
                    { label: "Awaiting Pickup", count: pending, total: shipments.length, color: "bg-amber-500" },
                    { label: "Failed / Returned", count: shipments.filter((s:any) => ["FAILED","RETURNED"].includes(s.status)).length, total: shipments.length, color: "bg-red-400" },
                  ].filter(r => r.count > 0).map(row => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{row.label}</span>
                        <span className="text-xs font-semibold text-slate-800">{row.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.color} transition-all`}
                          style={{ width: `${Math.round((row.count / row.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Commission rate badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <Star className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-800">Your Commission Rate</p>
                <p className="text-xs text-emerald-600">You earn {agentPayoutPct}% of every shipping fee you collect</p>
              </div>
              <span className="ml-auto text-lg font-bold text-emerald-700 flex-shrink-0">{agentPayoutPct}%</span>
            </div>
          </TabsContent>

          {/* ══ PICKUPS TAB ═══════════════════════════════════════════════════ */}
          <TabsContent value="pickups" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Available Pickups</h3>
                <p className="text-xs text-slate-400">Unclaimed orders you can self-assign</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => refetchAvailable()} disabled={loadingAvailable}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingAvailable ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Filter by city or region…"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>

            {loadingAvailable ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : filteredAvailable.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="text-center py-14">
                  <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">
                    {locationFilter ? "No pickups match this location" : "No pickups available right now"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {locationFilter ? "Clear the filter to see all pickups" : "New orders appear here once sellers submit payment."}
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

          {/* ══ DELIVERIES TAB ════════════════════════════════════════════════ */}
          <TabsContent value="deliveries" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
              </div>
            ) : shipments.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="text-center py-14">
                  <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">No deliveries assigned yet</p>
                  <p className="text-xs text-slate-400 mt-1">Claim pickups from the Pickups tab.</p>
                  <Button size="sm" className="mt-4" onClick={() => setActiveTab("pickups")}>
                    Browse Pickups
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {pendingShipments.length > 0 && (
                  <DeliverySection
                    title="Awaiting Pickup"
                    icon={<Clock className="w-4 h-4 text-amber-500" />}
                    shipments={pendingShipments}
                    onUpdateStatus={updateStatusMutation.mutate}
                    isUpdating={updateStatusMutation.isPending}
                    onChat={openChat}
                  />
                )}
                {activeShipments.length > 0 && (
                  <DeliverySection
                    title="Active Deliveries"
                    icon={<Truck className="w-4 h-4 text-blue-500" />}
                    shipments={activeShipments}
                    onUpdateStatus={updateStatusMutation.mutate}
                    isUpdating={updateStatusMutation.isPending}
                    onChat={openChat}
                  />
                )}
                {completedShipments.length > 0 && (
                  <DeliverySection
                    title="Completed"
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
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

          {/* ══ EARNINGS TAB ══════════════════════════════════════════════════ */}
          <TabsContent value="earnings" className="space-y-4 mt-4">
            {/* Balance summary */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Total Earned</p>
                  <p className="text-xl font-bold text-blue-900">
                    {totalEarned > 0 ? `₦${totalEarned.toLocaleString()}` : "—"}
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">{delivered} deliveries</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-4">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Est. Balance</p>
                  <p className="text-xl font-bold text-emerald-900">
                    {totalEarned > 0 ? `₦${Math.max(0, estimatedBalance).toLocaleString()}` : "—"}
                  </p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    {paidOut > 0 ? `₦${paidOut.toLocaleString()} paid out` : "Available"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payout requests */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
                Payout Requests
              </h3>
              <AgentPayoutManager shipments={shipments} />
            </div>

            <Separator />

            {/* Pi & crypto wallets */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-violet-500" />
                Pi & Crypto Wallets
              </h3>
              <p className="text-xs text-slate-400 mb-3">Add your Pi wallet address to receive shipping commissions in Pi</p>
              <WalletManager />
            </div>

            <Separator />

            {/* Bank accounts */}
            <div>
              <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Bank Accounts
              </h3>
              <p className="text-xs text-slate-400 mb-3">Add a bank account for fiat payout withdrawals</p>
              <BankAccountManager />
            </div>
          </TabsContent>

          {/* ══ MESSAGES TAB ══════════════════════════════════════════════════ */}
          <TabsContent value="messages" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Delivery Conversations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chat with buyers or sellers about your active deliveries</p>
            </div>

            {chatsAvailable.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="text-center py-14">
                  <MessageCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="font-medium text-slate-500 text-sm">No active conversations</p>
                  <p className="text-xs text-slate-400 mt-1">Chats appear once you pick up a shipment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {chatsAvailable.map((s: any) => {
                  const images: string[] = s.listing?.images ?? [];
                  return (
                    <Card key={s.id} className="border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {images[0] ? (
                            <img src={images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <ShoppingBag className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {s.listing?.title || `Shipment ${s.trackingNumber}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                {STATUS_LABELS[s.status] || s.status}
                              </Badge>
                              {s.recipientName && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <User2 className="w-3 h-3" />{s.recipientName}
                                </span>
                              )}
                            </div>
                            {s.buyer && (
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                Buyer: {s.buyer.firstName || s.buyer.username}
                                {s.buyer.whatsapp ? ` · ${s.buyer.whatsapp}` : ""}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => openChat(s.id)}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
                            </Button>
                            {s.buyer?.whatsapp && (
                              <a
                                href={`https://wa.me/${s.buyer.whatsapp.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline" className="h-8 w-full text-xs border-green-200 text-green-700 hover:bg-green-50">
                                  <PhoneCall className="w-3.5 h-3.5 mr-1" /> WhatsApp
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                        {/* Tracking link */}
                        {s.trackingNumber && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500">{s.trackingNumber}</span>
                            <a
                              href={`/tracking/${s.trackingNumber}`}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Navigation className="w-3 h-3" /> Track
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-slate-100 py-4 text-center text-xs text-slate-300 bg-white mt-4">
        Beagvs Global · Agent Portal
      </footer>
    </div>
  );
}

// ── AvailableShipmentCard ──────────────────────────────────────────────────────

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
  const images: string[] = s.listing?.images ?? [];

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-4">
        {s.listing && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
            {images[0] ? (
              <img src={images[0]} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-slate-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1">{s.listing.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.listing.type?.replace(/_/g, " ")}</p>
            </div>
            <Badge className="text-[10px] px-1.5 border bg-amber-100 text-amber-800 border-amber-200 flex-shrink-0">Unclaimed</Badge>
          </div>
        )}

        <div className="space-y-1.5 mb-3">
          <p className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</p>
          {(s.origin || s.destination) && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="break-all">{s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination}</span>
            </div>
          )}
          {s.recipientName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{s.recipientName}</span>
            </div>
          )}
          {s.seller && (
            <p className="text-xs text-slate-400">
              Seller: <span className="font-medium text-slate-600">{s.seller.firstName || s.seller.username}</span>
              {s.seller.location ? ` · ${s.seller.location}` : ""}
            </p>
          )}
        </div>

        {feeMatch && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-emerald-700 font-medium">
              💰 Your payout: {feeMatch[1]} ({agentPayoutPct}% of fee)
            </p>
          </div>
        )}
        {!feeMatch && s.specialInstructions && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-amber-700">⚠ {s.specialInstructions}</p>
          </div>
        )}

        <Button
          size="sm"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9"
          disabled={isClaiming}
          onClick={onClaim}
        >
          {isClaiming ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
          Claim Shipment
          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── DeliverySection ────────────────────────────────────────────────────────────

function DeliverySection({
  title, icon, shipments, onUpdateStatus, isUpdating, onChat, muted = false,
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
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <h2 className={`font-semibold text-sm ${muted ? "text-slate-400" : "text-slate-700"}`}>{title}</h2>
        <Badge variant="secondary" className="text-xs h-5">{shipments.length}</Badge>
      </div>
      {shipments.map((s) => (
        <DeliveryCard
          key={s.id}
          shipment={s}
          onUpdateStatus={onUpdateStatus}
          isUpdating={isUpdating}
          onChat={onChat}
          muted={muted}
        />
      ))}
    </section>
  );
}

// ── DeliveryCard ───────────────────────────────────────────────────────────────

function DeliveryCard({
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
  const images: string[] = s.listing?.images ?? [];

  return (
    <Card className={`border shadow-sm overflow-hidden ${muted ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        {/* Product row */}
        {s.listing && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
            {images[0] ? (
              <img src={images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-slate-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm leading-tight line-clamp-1">{s.listing.title}</p>
              <p className="text-xs text-slate-400">{s.listing.type?.replace(/_/g, " ")}</p>
            </div>
            <Badge className={`text-[10px] px-1.5 border flex-shrink-0 ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
              {STATUS_LABELS[s.status] || s.status}
            </Badge>
          </div>
        )}

        {/* Shipment details */}
        <div className="space-y-1.5 mb-3">
          <p className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</p>
          {(s.origin || s.destination) && (
            <div className="flex items-start gap-1.5 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span className="break-all">{s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination}</span>
            </div>
          )}
          {s.recipientName && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <User2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{s.recipientName}{s.recipientPhone ? ` · ${s.recipientPhone}` : ""}</span>
            </div>
          )}
          {s.buyer?.whatsapp && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <PhoneCall className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Buyer WhatsApp: {s.buyer.whatsapp}</span>
            </div>
          )}
          {s.specialInstructions && (
            <div className="bg-amber-50 border border-amber-100 rounded px-2 py-1">
              <p className="text-xs text-amber-700">⚠ {s.specialInstructions}</p>
            </div>
          )}
          {s.events?.length > 0 && (
            <p className="text-xs text-slate-400 italic">Last: {s.events[0].description}</p>
          )}
          {s.escrow?.shippingAgentFeeAmount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <DollarSign className="w-3.5 h-3.5 flex-shrink-0" />
              Commission: ₦{Number(s.escrow.shippingAgentFeeAmount).toLocaleString()}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex-shrink-0"
            onClick={() => onChat(s.id)}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1" /> Chat
          </Button>
          {s.trackingNumber && (
            <a href={`/tracking/${s.trackingNumber}`}>
              <Button size="sm" variant="outline" className="h-8 text-xs flex-shrink-0">
                <Navigation className="w-3.5 h-3.5 mr-1" /> Track
              </Button>
            </a>
          )}
          {actions.map((action) => (
            <Button
              key={action.status}
              size="sm"
              className={`h-8 text-xs text-white flex-shrink-0 ${action.color}`}
              disabled={isUpdating}
              onClick={() => onUpdateStatus({ shipmentId: s.id, status: action.status })}
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
