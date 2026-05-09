import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import CryptoIcon from "@/components/CryptoIcon";
import { 
  Plus,
  TrendingUp,
  Wallet,
  MessageSquare,
  Users,
  Package,
  DollarSign,
  Activity
} from "lucide-react";

export default function Home() {
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

  const activeListings = Array.isArray(userListings) ? userListings.filter((listing: any) => listing.isActive)?.length : 0;
  const pendingEscrows = Array.isArray(userEscrows) ? userEscrows.filter((escrow: any) => escrow.status === 'PENDING' || escrow.status === 'FUNDED')?.length : 0;
  const unreadNotifications = Array.isArray(notifications) ? notifications.filter((notification: any) => !notification.readAt)?.length : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2" data-testid="text-welcome">Welcome back!</h1>
          <p className="text-slate-medium">Manage your crypto-powered marketplace activities</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/sell/new">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-slate-200 hover:border-crypto-blue" data-testid="card-create-listing">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Plus className="w-8 h-8 text-crypto-blue mb-3" />
                <h3 className="font-semibold gradient-text mb-2">Create New Listing</h3>
                <p className="text-sm text-slate-medium text-center">List your property, service, or product</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/marketplace">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-browse-marketplace">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold gradient-text mb-2">Browse Marketplace</h3>
                <p className="text-sm text-slate-medium text-center">Discover new opportunities</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid="card-manage-wallets">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Wallet className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="font-semibold gradient-text mb-2">Manage Wallets</h3>
                <p className="text-sm text-slate-medium text-center">Update your crypto wallets</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-stat-listings">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-listings">{activeListings}</div>
              <p className="text-xs text-muted-foreground">
                Your active marketplace items
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-escrows">
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

          <Card data-testid="card-stat-wallets">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Wallets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-connected-wallets">{Array.isArray(userWallets) ? userWallets.length : 0}</div>
              <p className="text-xs text-muted-foreground">
                Crypto wallets linked
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-notifications">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-unread-notifications">{unreadNotifications}</div>
              <p className="text-xs text-muted-foreground">
                Unread updates
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Listings</span>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" data-testid="button-view-all-listings">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(userListings) && userListings.length > 0 ? (
                <div className="space-y-4">
                  {userListings.slice(0, 3).map((listing: any) => (
                    <div key={listing.id} className="flex items-center space-x-4 p-3 border rounded-lg" data-testid={`listing-item-${listing.id}`}>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-dark">{listing.title}</h4>
                        <p className="text-sm text-slate-medium">{listing.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-semibold text-slate-dark">
                          {parseFloat(listing.priceCrypto).toLocaleString()} <CryptoIcon currency={listing.currency} showLabel={false} size="sm" />
                        </div>
                        <p className="text-sm text-slate-medium">{listing.isActive ? 'Active' : 'Inactive'}</p>
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
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" data-testid="button-view-all-escrows">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(userEscrows) && userEscrows.length > 0 ? (
                <div className="space-y-4">
                  {userEscrows.slice(0, 3).map((escrow: any) => (
                    <div key={escrow.id} className="flex items-center space-x-4 p-3 border rounded-lg" data-testid={`escrow-item-${escrow.id}`}>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-dark">{escrow.listing?.title}</h4>
                        <p className="text-sm text-slate-medium">
                          {escrow.buyerId === escrow.listing?.sellerId ? 'Selling to' : 'Buying from'} {escrow.buyer?.username || escrow.seller?.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 font-semibold text-slate-dark">
                          {escrow.amount} <CryptoIcon currency={escrow.currency} showLabel={false} size="sm" />
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          escrow.status === 'RELEASED' ? 'bg-green-100 text-green-800' :
                          escrow.status === 'FUNDED' ? 'bg-blue-100 text-blue-800' :
                          escrow.status === 'DISPUTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {escrow.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-medium mb-4">No escrow transactions yet</p>
                  <Link href="/marketplace">
                    <Button data-testid="button-start-buying">Start Buying or Selling</Button>
                  </Link>
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
