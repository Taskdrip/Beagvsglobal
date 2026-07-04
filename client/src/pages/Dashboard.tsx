import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WalletManager from "@/components/WalletManager";
import { SellerPayoutManager } from "@/components/PayoutRequestManager";
import { ActiveOrdersPanel } from "@/components/TransactionGuide";
import BankAccountManager from "@/components/BankAccountManager";
import EscrowProgress from "@/components/EscrowProgress";
import { KycStatus } from "@/components/KycStatus";
import CryptoIcon from "@/components/CryptoIcon";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Package,
  DollarSign,
  Users,
  Bell,
  MessageSquare,
  Clock,
  ShoppingCart,
  Store,
  Truck,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

// ── Shipments Tab ─────────────────────────────────────────────────────────────
const SHIPMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:          { label: "Pending",          color: "text-yellow-600",  bg: "bg-yellow-50"  },
  PICKED_UP:        { label: "Picked Up",         color: "text-blue-600",    bg: "bg-blue-50"    },
  IN_TRANSIT:       { label: "In Transit",        color: "text-cyan-600",    bg: "bg-cyan-50"    },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "text-purple-600",  bg: "bg-purple-50"  },
  DELIVERED:        { label: "Delivered",         color: "text-green-600",   bg: "bg-green-50"   },
  FAILED:           { label: "Failed",            color: "text-red-600",     bg: "bg-red-50"     },
  RETURNED:         { label: "Returned",          color: "text-orange-600",  bg: "bg-orange-50"  },
};

function ShipmentsTab() {
  const { data: shipments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/shipments/me"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shipments || shipments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Truck className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-dark mb-2">No shipments yet</h3>
          <p className="text-slate-medium mb-6">Book a shipment to see your tracking codes here</p>
          <Link href="/shipping">
            <Button data-testid="button-book-shipment">Book a Shipment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          My Shipments ({shipments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shipments.map((s: any) => {
            const cfg = SHIPMENT_STATUS[s.status] ?? { label: s.status, color: "text-slate-600", bg: "bg-slate-50" };
            return (
              <div key={s.id} data-testid={`shipment-row-${s.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Truck className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mono font-bold text-slate-dark text-sm" data-testid={`text-tracking-${s.id}`}>
                      {s.trackingNumber}
                    </span>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs font-medium`}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-slate-medium text-xs">
                    {s.carrier}
                    {s.origin ? ` · ${s.origin}` : ""}
                    {s.destination ? ` → ${s.destination}` : ""}
                    {s.weightKg ? ` · ${s.weightKg}kg` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/tracking?q=${s.trackingNumber}`}>
                    <Button variant="outline" size="sm" className="text-xs gap-1" data-testid={`button-track-${s.id}`}>
                      <ExternalLink className="w-3 h-3" /> Track
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const ESCROW_STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  CREATED:           { label: "Awaiting Payment",   color: "text-yellow-700", bg: "bg-yellow-50",  icon: Clock },
  PAYMENT_SUBMITTED: { label: "Payment Under Review", color: "text-blue-700",   bg: "bg-blue-50",   icon: ReceiptText },
  FUNDED:            { label: "Funded",              color: "text-cyan-700",   bg: "bg-cyan-50",   icon: ShieldCheck },
  SHIPPED:           { label: "Shipped",             color: "text-purple-700", bg: "bg-purple-50", icon: Truck },
  DELIVERED:         { label: "Delivered",           color: "text-indigo-700", bg: "bg-indigo-50", icon: CheckCircle },
  RELEASED:          { label: "Completed",           color: "text-green-700",  bg: "bg-green-50",  icon: CheckCircle },
  DISPUTED:          { label: "Disputed",            color: "text-red-700",    bg: "bg-red-50",    icon: AlertCircle },
  REFUNDED:          { label: "Refunded",            color: "text-orange-700", bg: "bg-orange-50", icon: RefreshCw },
};

// ── Payout Account Guide — shown at top of payouts tab ───────────────────────
function PayoutAccountGuide({ userId, escrows }: { userId: string; escrows: any[] }) {
  const [showSetup, setShowSetup] = useState(false);
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });
  const hasDeliveredAsSeller = escrows?.some(e => e.sellerId === userId && ["DELIVERED", "RELEASED"].includes(e.status));
  if (!hasDeliveredAsSeller) return null;
  const hasAccount = (bankAccounts as any[]).length > 0;
  if (hasAccount && !showSetup) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800 text-sm">Payout account set up</p>
          <p className="text-xs text-emerald-600">{(bankAccounts as any[]).length} account(s) saved. You're ready to receive payouts.</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setShowSetup(v => !v)}>Manage</Button>
      </div>
    );
  }
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="font-semibold text-amber-800 text-sm">Set up your payout account</p>
      </div>
      <p className="text-xs text-amber-700">Add a bank account or crypto wallet so admin can send your earnings when funds are released.</p>
      {showSetup ? (
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <BankAccountManager />
          <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowSetup(false)}>Done</Button>
        </div>
      ) : (
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowSetup(true)}>
          Add Payout Account
        </Button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [currentMode, setCurrentMode] = useState<"buyer" | "seller">("buyer");
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "overview";
  });
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location]);
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Redirect delivery agents to their specialized portal
  useEffect(() => {
    if (user && (user as any).role === 'DELIVERY_AGENT') {
      navigate('/agent/dashboard');
    }
  }, [user]);

  const { data: userListings } = useQuery({
    queryKey: ["/api/user/listings"],
  });

  const { data: userEscrows } = useQuery({
    queryKey: ["/api/user/escrows"],
  });

  const { data: userWallets } = useQuery({
    queryKey: ["/api/wallets"],
  });

  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });

  const { data: chatThreads } = useQuery<any[]>({
    queryKey: ["/api/chat/threads"],
  });

  const { data: followers } = useQuery({
    queryKey: ["/api/user/followers"],
  });

  const { data: following } = useQuery({
    queryKey: ["/api/user/following"],
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = (notifications as any[] || []).filter((n: any) => !n.readAt);
      await Promise.all(unread.map((n: any) => apiRequest("PATCH", `/api/notifications/${n.id}/read`, {})));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      toast({ title: "Listing deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete listing", description: err.message, variant: "destructive" }),
  });

  const activeListings = Array.isArray(userListings) ? userListings.filter((listing: any) => listing.isActive)?.length : 0;
  const pendingEscrows = Array.isArray(userEscrows) ? userEscrows.filter((escrow: any) => escrow.status === 'PENDING' || escrow.status === 'FUNDED')?.length : 0;
  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((notification: any) => !notification.readAt)?.length : 0;
  const totalEscrowValue = Array.isArray(userEscrows) ? userEscrows.reduce((sum: number, escrow: any) => {
    return sum + (escrow.status !== 'REFUNDED' ? parseFloat(escrow.amount) : 0);
  }, 0) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="text-dashboard-title">
              Welcome back, {(user && (user.username || user.firstName)) || 'User'}!
            </h1>
            <p className="text-slate-medium">
              {currentMode === "buyer" ? "Browse and manage your purchases" : "Manage your listings and sales"}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            {/* Account Mode Switcher for BOTH account types */}
            {user?.accountType === "BOTH" && (
              <div className="flex items-center gap-2">
                <Select value={currentMode} onValueChange={(value) => setCurrentMode(value as "buyer" | "seller")}>
                  <SelectTrigger className="w-48" data-testid="select-account-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Buyer Mode
                      </div>
                    </SelectItem>
                    <SelectItem value="seller">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Seller Mode
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {(currentMode === "seller" || user?.accountType === "SELLER") && (
              <Link href="/sell/new">
                <Button className="button-primary" data-testid="button-create-listing">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
            )}
            
            <Link href="/account/settings">
              <Button variant="outline" data-testid="button-account-settings">
                Account Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* KYC Status - Show if not approved */}
        {user && user.kycStatus !== 'APPROVED' && (
          <div className="mb-8">
            <KycStatus user={user} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-active-listings" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("listings")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-listings">{activeListings}</div>
              <p className="text-xs text-muted-foreground">Click to manage listings</p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-escrows" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("escrows")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Escrows</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending-escrows">{pendingEscrows}</div>
              <p className="text-xs text-muted-foreground">Click to view transactions</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-followers" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("social")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-followers">{(followers as any[])?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Click to view social</p>
            </CardContent>
          </Card>

          <Card data-testid="card-notifications" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("notifications")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-notifications">{unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">Click to view updates</p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto gap-0.5 h-auto flex-wrap">
            <TabsTrigger value="overview" className="flex-1 min-w-fit" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 min-w-fit" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 min-w-fit" data-testid="tab-messages">Messages</TabsTrigger>
            <TabsTrigger value="listings" className="flex-1 min-w-fit" data-testid="tab-listings">Listings</TabsTrigger>
            <TabsTrigger value="escrows" className="flex-1 min-w-fit" data-testid="tab-escrows">Escrows</TabsTrigger>
            <TabsTrigger value="shipments" className="flex-1 min-w-fit" data-testid="tab-shipments">Shipments</TabsTrigger>
            <TabsTrigger value="wallets" className="flex-1 min-w-fit" data-testid="tab-wallets">Wallets</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 min-w-fit" data-testid="tab-notifications">
              Notifications {unreadNotifications > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unreadNotifications}</span>}
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-1 min-w-fit" data-testid="tab-social">Social</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 min-w-fit" data-testid="tab-payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* ── Action Required Panel ── */}
            {userEscrows && (userEscrows as any[]).filter(e => !["RELEASED","CANCELLED","REFUNDED"].includes(e.status)).length > 0 && (
              <Card className="border-orange-100 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
                    Active Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ActiveOrdersPanel escrows={userEscrows as any[]} userId={(user as any)?.id ?? ""} />
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Listings</span>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("listings")} data-testid="button-view-all-listings">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userListings && userListings.length > 0 ? (
                    <div className="space-y-4">
                      {userListings.slice(0, 3).map((listing: any) => (
                        <div key={listing.id} className="flex items-center space-x-4 p-3 border rounded-lg" data-testid={`listing-${listing.id}`}>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-dark">{listing.title}</h4>
                            <p className="text-sm text-slate-medium">{listing.type.replace('_', ' ')}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-semibold text-slate-dark">
                            {parseFloat(listing.priceCrypto).toLocaleString()} <CryptoIcon currency={listing.currency} showLabel={false} size="sm" />
                          </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {listing.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-medium mb-4">No listings yet</p>
                      <Link href="/sell/new">
                        <Button data-testid="button-create-first-listing">Create Your First Listing</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Escrows */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Escrows</span>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("escrows")} data-testid="button-view-all-escrows">
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userEscrows && userEscrows.length > 0 ? (
                    <div className="space-y-4">
                      {userEscrows.slice(0, 3).map((escrow: any) => (
                        <div key={escrow.id} className="p-3 border rounded-lg" data-testid={`escrow-${escrow.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-slate-dark">{escrow.listing?.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              escrow.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                              escrow.status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                              escrow.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {escrow.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-medium">
                              {escrow.buyerId === user?.id ? `Buying from ${escrow.seller?.username}` : `Selling to ${escrow.buyer?.username}`}
                            </p>
                            <div className="flex items-center gap-1 font-semibold text-slate-dark">
                              {escrow.amount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" />
                            </div>
                          </div>
                          <EscrowProgress status={escrow.status} className="mt-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-medium mb-4">No escrow transactions yet</p>
                      <Link href="/marketplace">
                        <Button data-testid="button-start-trading">Start Trading</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Listings</span>
                  <Link href="/sell/new">
                    <Button data-testid="button-new-listing">
                      <Plus className="w-4 h-4 mr-2" />
                      New Listing
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userListings && userListings.length > 0 ? (
                  <div className="space-y-4">
                    {userListings.map((listing: any) => (
                      <div key={listing.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow" data-testid={`listing-detail-${listing.id}`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                            <h4 className="font-medium text-slate-dark">{listing.title}</h4>
                            {/* Approval status badge */}
                            {listing.approvalStatus === 'PENDING' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">⏳ Pending Review</span>
                            )}
                            {listing.approvalStatus === 'APPROVED' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">✓ Approved</span>
                            )}
                            {listing.approvalStatus === 'REJECTED' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">✗ Not Approved</span>
                            )}
                          </div>
                          {listing.approvalStatus === 'PENDING' && (
                            <p className="text-xs text-yellow-600 mb-1">Your listing is under review and will appear in the marketplace once approved.</p>
                          )}
                          {listing.approvalStatus === 'REJECTED' && (
                            <p className="text-xs text-red-600 mb-1">This listing was not approved. Check your notifications for details.</p>
                          )}
                          <p className="text-sm text-slate-medium mb-2">{listing.type.replace('_', ' ')} • {listing.location}</p>
                          <p className="text-xs text-slate-400">Created {new Date(listing.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 font-semibold text-slate-dark text-lg">
                            {parseFloat(listing.priceCrypto).toLocaleString()} <CryptoIcon currency={listing.currency} showLabel={false} size="sm" />
                          </div>
                          <p className="text-sm text-slate-medium">{listing.network}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link href={`/listing/${listing.slug}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-${listing.id}`}>View</Button>
                          </Link>
                          <Link href={`/sell/${listing.id}/edit`}>
                            <Button variant="outline" size="sm" data-testid={`button-edit-${listing.id}`}>Edit</Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            data-testid={`button-delete-${listing.id}`}
                            disabled={deleteListingMutation.isPending}
                            onClick={() => {
                              if (confirm("Delete this listing? This cannot be undone.")) {
                                deleteListingMutation.mutate(listing.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-dark mb-2">No listings yet</h3>
                    <p className="text-slate-medium mb-6">Create your first listing to start selling</p>
                    <Link href="/sell/new">
                      <Button data-testid="button-create-listing-empty">Create Listing</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escrows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Escrow Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {userEscrows && userEscrows.length > 0 ? (
                  <div className="space-y-4">
                    {userEscrows.map((escrow: any) => (
                      <div key={escrow.id} className="p-4 border rounded-lg" data-testid={`escrow-detail-${escrow.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-slate-dark">{escrow.listing?.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            escrow.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                            escrow.status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                            escrow.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {escrow.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-medium">Amount</p>
                            <div className="flex items-center gap-1 font-semibold">
                              {escrow.amount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" />
                            </div>
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

                        {escrow.status === 'RELEASED' && escrow.platformFeeAmount && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-700">Platform Fee (10%)</p>
                                <div className="flex items-center gap-1 font-semibold text-green-800">
                                  {escrow.platformFeeAmount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" />
                                </div>
                              </div>
                              <div>
                                <p className="text-green-700">Net Amount</p>
                                <div className="flex items-center gap-1 font-semibold text-green-800">
                                  {escrow.sellerNetAmount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <EscrowProgress status={escrow.status} />

                        <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                          <p className="text-sm text-slate-medium">
                            {escrow.buyerId === user?.id 
                              ? `Buying from ${escrow.seller?.username}` 
                              : `Selling to ${escrow.buyer?.username}`
                            }
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(escrow.status === 'SHIPPED' || escrow.status === 'DELIVERED') && (
                              <Link href={`/shipments?escrow=${escrow.id}`}>
                                <Button size="sm" variant="outline" data-testid={`button-track-shipment-${escrow.id}`}>
                                  <Truck className="w-3 h-3 mr-1" /> Track Shipment
                                </Button>
                              </Link>
                            )}
                            {(escrow.status === 'FUNDED' && escrow.sellerId === user?.id) && (
                              <Link href={`/shipments?create=1&escrowId=${escrow.id}`}>
                                <Button size="sm" variant="outline" data-testid={`button-add-shipment-${escrow.id}`}>
                                  <Truck className="w-3 h-3 mr-1" /> Add Tracking
                                </Button>
                              </Link>
                            )}
                            {(escrow.status === 'SHIPPED' && escrow.buyerId === user?.id) && (
                              <Link href={`/checkout/${escrow.id}`}>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`button-mark-delivered-${escrow.id}`}>
                                  ✓ Confirm Receipt
                                </Button>
                              </Link>
                            )}
                            {(escrow.status === 'DELIVERED' && escrow.sellerId === user?.id) && (
                              <Link href={`/checkout/${escrow.id}`}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`button-request-payout-${escrow.id}`}>
                                  Request Payout
                                </Button>
                              </Link>
                            )}
                            {(escrow.status === 'FUNDED' && escrow.sellerId === user?.id) && (
                              <Link href={`/checkout/${escrow.id}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid={`button-ship-now-${escrow.id}`}>
                                  Ship Now
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-dark mb-2">No escrow transactions</h3>
                    <p className="text-slate-medium mb-6">Start buying or selling to see your escrow history</p>
                    <Link href="/marketplace">
                      <Button data-testid="button-browse-marketplace">Browse Marketplace</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Transactions Tab ───────────────────────────────────────────── */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-blue-600" />
                  My Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userEscrows ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : (userEscrows as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <ReceiptText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No transactions yet</h3>
                    <p className="text-slate-500 mb-6">Your buy/sell escrow transactions will appear here</p>
                    <Link href="/marketplace">
                      <Button data-testid="button-browse-transactions">Browse Marketplace</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(userEscrows as any[]).map((escrow: any) => {
                      const cfg = ESCROW_STATUS_CFG[escrow.status] ?? { label: escrow.status, color: "text-slate-700", bg: "bg-slate-50", icon: Clock };
                      const Icon = cfg.icon;
                      const isBuyer = escrow.buyerId === (user as any)?.id;
                      return (
                        <div key={escrow.id} data-testid={`transaction-row-${escrow.id}`}
                          className="border rounded-xl p-4 hover:shadow-sm transition-all">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              <Icon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-semibold text-slate-800 truncate">{escrow.listing?.title || "Listing"}</span>
                                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs font-medium`}>{cfg.label}</Badge>
                                <Badge variant="outline" className="text-xs">
                                  {isBuyer ? "Buyer" : "Seller"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                <span className="text-slate-500">
                                  {isBuyer ? `Seller: ${escrow.seller?.username}` : `Buyer: ${escrow.buyer?.username}`}
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  {escrow.amount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" /> {escrow.currency}
                                </span>
                                <span className="text-slate-400 text-xs">{new Date(escrow.createdAt).toLocaleDateString()}</span>
                              </div>
                              {escrow.status === 'PAYMENT_SUBMITTED' && isBuyer && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Payment submitted — awaiting admin review
                                </p>
                              )}
                              {escrow.status === 'PAYMENT_SUBMITTED' && !isBuyer && (
                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Buyer submitted payment — admin is reviewing
                                </p>
                              )}
                              {escrow.buyerTxHash && (
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                  Tx: {escrow.buyerTxHash.slice(0,20)}…
                                </p>
                              )}
                              {escrow.adminNote && (
                                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {escrow.adminNote}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Link href={`/checkout/${escrow.id}`}>
                                <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-view-transaction-${escrow.id}`}>
                                  <ExternalLink className="w-3 h-3" /> View
                                </Button>
                              </Link>
                              {escrow.listing?.listingId && (
                                <Link href={`/chat/${escrow.listingId}`}>
                                  <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-chat-transaction-${escrow.id}`}>
                                    <MessageSquare className="w-3 h-3" /> Chat
                                  </Button>
                                </Link>
                              )}
                              {escrow.listingId && (
                                <Link href={`/chat/${escrow.listingId}`}>
                                  <Button size="sm" variant="ghost" className="text-xs gap-1 text-blue-600" data-testid={`button-open-chat-${escrow.id}`}>
                                    <MessageSquare className="w-3 h-3" /> Chat
                                  </Button>
                                </Link>
                              )}
                              {escrow.status === 'SHIPPED' && isBuyer && (
                                <Link href={`/tracking`}>
                                  <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-track-tx-${escrow.id}`}>
                                    <Truck className="w-3 h-3" /> Track
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                          <EscrowProgress status={escrow.status} className="mt-3" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Messages Tab ───────────────────────────────────────────────── */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  My Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!chatThreads ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : chatThreads.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">No messages yet</h3>
                    <p className="text-slate-500 mb-6">Messages with buyers/sellers appear here when you start a transaction</p>
                    <Link href="/marketplace">
                      <Button data-testid="button-browse-messages">Browse Marketplace</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatThreads.map((thread: any) => {
                      const isAsbuyer = thread.buyerId === (user as any)?.id;
                      const counterpart = isAsbuyer ? thread.seller : thread.buyer;
                      const listing = thread.listing;
                      return (
                        <div key={thread.id} data-testid={`chat-thread-${thread.id}`}
                          className="flex items-center gap-4 p-4 rounded-xl border hover:bg-slate-50 transition-all">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                            {counterpart?.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-slate-800 text-sm">{counterpart?.username || "User"}</span>
                              <Badge variant="outline" className="text-xs">{isAsbuyer ? "You're buyer" : "You're seller"}</Badge>
                            </div>
                            {listing && (
                              <p className="text-xs text-slate-500 truncate">{listing.title}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : "No messages yet"}
                            </p>
                          </div>
                          {thread.listingId && (
                            <Link href={`/chat/${thread.listingId}`}>
                              <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-open-thread-${thread.id}`}>
                                <MessageSquare className="w-3 h-3" /> Open <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments" className="space-y-4">
            <ShipmentsTab />
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            <WalletManager />
          </TabsContent>

          {/* ── Notifications Tab ──────────────────────────────────────────── */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unreadNotifications}</span>
                    )}
                  </CardTitle>
                  {unreadNotifications > 0 && (
                    <Button size="sm" variant="outline" onClick={() => markAllReadMutation.mutate()} data-testid="button-mark-all-read">
                      Mark all read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!notifications ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : (notifications as any[]).length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(notifications as any[]).map((n: any) => {
                      const isUnread = !n.readAt;
                      const message = n.data?.message || n.type.replace(/_/g, " ");
                      return (
                        <div key={n.id} data-testid={`notification-item-${n.id}`}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isUnread ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100"}`}>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${isUnread ? "bg-blue-500" : "bg-slate-300"}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${isUnread ? "font-medium text-slate-800" : "text-slate-600"}`}>{message}</p>
                            {n.data?.listingTitle && <p className="text-xs text-slate-400">"{n.data.listingTitle}"</p>}
                            <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {n.data?.escrowId && (
                              <Link href={`/checkout/${n.data.escrowId}`}>
                                <Button size="sm" variant="ghost" className="text-xs h-7" data-testid={`button-notif-view-${n.id}`}>View</Button>
                              </Link>
                            )}
                            {isUnread && (
                              <button onClick={() => markReadMutation.mutate(n.id)} className="text-xs text-slate-400 hover:text-blue-600" data-testid={`button-notif-read-${n.id}`}>✓</button>
                            )}
                            <button
                              onClick={() => deleteNotifMutation.mutate(n.id)}
                              className="text-xs text-slate-300 hover:text-red-500 transition-colors"
                              data-testid={`button-notif-delete-${n.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {/* Payout account setup prompt */}
            <PayoutAccountGuide userId={(user as any)?.id} escrows={userEscrows as any[]} />
            <SellerPayoutManager escrows={userEscrows as any[]} />
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Followers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Followers ({followers?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {followers && followers.length > 0 ? (
                    <div className="space-y-3">
                      {followers.slice(0, 5).map((follow: any) => (
                        <div key={follow.id} className="flex items-center space-x-3" data-testid={`follower-${follow.follower.id}`}>
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            {follow.follower.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-dark">{follow.follower.username}</p>
                            <p className="text-sm text-slate-medium">{follow.follower.firstName} {follow.follower.lastName}</p>
                          </div>
                          <Link href={`/profile/${follow.follower.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-profile-${follow.follower.id}`}>
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-medium text-center py-4">No followers yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Following */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Following ({following?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {following && following.length > 0 ? (
                    <div className="space-y-3">
                      {following.slice(0, 5).map((follow: any) => (
                        <div key={follow.id} className="flex items-center space-x-3" data-testid={`following-${follow.followee.id}`}>
                          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            {follow.followee.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-dark">{follow.followee.username}</p>
                            <p className="text-sm text-slate-medium">{follow.followee.firstName} {follow.followee.lastName}</p>
                          </div>
                          <Link href={`/profile/${follow.followee.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-following-${follow.followee.id}`}>
                              View
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-medium text-center py-4">Not following anyone yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
