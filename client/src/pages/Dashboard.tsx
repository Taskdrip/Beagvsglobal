import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WalletManager from "@/components/WalletManager";
import EscrowProgress from "@/components/EscrowProgress";
import { Link } from "wouter";
import { 
  Plus,
  Package,
  DollarSign,
  Users,
  Bell,
  TrendingUp,
  MessageSquare,
  Star,
  Clock,
  ShoppingCart,
  Store
} from "lucide-react";

export default function Dashboard() {
  const [currentMode, setCurrentMode] = useState<"buyer" | "seller">("buyer");
  
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

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

  const { data: followers } = useQuery({
    queryKey: ["/api/user/followers"],
  });

  const { data: following } = useQuery({
    queryKey: ["/api/user/following"],
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
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-active-listings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-listings">{activeListings}</div>
              <p className="text-xs text-muted-foreground">
                Items for sale
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-escrows">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Escrows</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-pending-escrows">{pendingEscrows}</div>
              <p className="text-xs text-muted-foreground">
                Transactions in progress
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-followers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Followers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-followers">{followers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Following you
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-notifications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-notifications">{unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">
                Unread updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="listings" data-testid="tab-listings">Listings</TabsTrigger>
            <TabsTrigger value="escrows" data-testid="tab-escrows">Escrows</TabsTrigger>
            <TabsTrigger value="wallets" data-testid="tab-wallets">Wallets</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Listings</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="#listings" data-testid="button-view-all-listings">View All</Link>
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
                            <p className="font-semibold text-slate-dark">{listing.priceCrypto} {listing.currency}</p>
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
                    <Button variant="outline" size="sm" asChild>
                      <Link href="#escrows" data-testid="button-view-all-escrows">View All</Link>
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
                            <p className="font-semibold text-slate-dark">{escrow.amount} {escrow.currency}</p>
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
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-slate-dark">{listing.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              listing.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {listing.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-medium mb-2">{listing.type.replace('_', ' ')} • {listing.location}</p>
                          <p className="text-xs text-slate-400">Created {new Date(listing.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-dark text-lg">{listing.priceCrypto} {listing.currency}</p>
                          <p className="text-sm text-slate-medium">{listing.network}</p>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link href={`/listing/${listing.slug}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-${listing.id}`}>View</Button>
                          </Link>
                          <Link href={`/sell/${listing.id}/edit`}>
                            <Button variant="outline" size="sm" data-testid={`button-edit-${listing.id}`}>Edit</Button>
                          </Link>
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

                        {escrow.status === 'RELEASED' && escrow.platformFeeAmount && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-700">Platform Fee (10%)</p>
                                <p className="font-semibold text-green-800">{escrow.platformFeeAmount} {escrow.currency}</p>
                              </div>
                              <div>
                                <p className="text-green-700">Net Amount</p>
                                <p className="font-semibold text-green-800">{escrow.sellerNetAmount} {escrow.currency}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <EscrowProgress status={escrow.status} />

                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-slate-medium">
                            {escrow.buyerId === user?.id 
                              ? `Buying from ${escrow.seller?.username}` 
                              : `Selling to ${escrow.buyer?.username}`
                            }
                          </p>
                          {(escrow.status === 'SHIPPED' && escrow.buyerId === user?.id) && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`button-mark-delivered-${escrow.id}`}>
                              Mark as Delivered
                            </Button>
                          )}
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

          <TabsContent value="wallets" className="space-y-4">
            <WalletManager />
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
