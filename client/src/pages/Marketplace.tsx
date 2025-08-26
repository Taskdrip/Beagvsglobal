import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StarRating from "@/components/StarRating";
import { Link } from "wouter";
import { 
  Search,
  Filter,
  MapPin,
  Star,
  MessageCircle,
  Heart,
  Home,
  Ship,
  Store,
  Package
} from "lucide-react";

export default function Marketplace() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("");

  const { data: listings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/listings", { 
      search: searchQuery || undefined,
      type: selectedType === "all" ? undefined : selectedType,
      currency: selectedCurrency === "all" ? undefined : selectedCurrency,
      location: selectedLocation || undefined
    }],
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE': return <Home className="w-5 h-5" />;
      case 'SHIPPING_SERVICE': return <Ship className="w-5 h-5" />;
      case 'PRODUCT': return <Package className="w-5 h-5" />;
      case 'SERVICE': return <Store className="w-5 h-5" />;
      default: return <Store className="w-5 h-5" />;
    }
  };

  const formatListingType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const generateWhatsAppLink = (whatsapp: string, listingTitle: string) => {
    const message = `Hi! I'm interested in ${listingTitle}`;
    return `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-dark mb-2" data-testid="text-marketplace-title">
            Marketplace
          </h1>
          <p className="text-slate-medium">Discover real estate, shipping services, and products with comprehensive crypto and fiat payment options. All transactions protected by military-grade escrow security across 180+ countries.</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                  <SelectItem value="SHIPPING_SERVICE">Shipping Services</SelectItem>
                  <SelectItem value="PRODUCT">Products</SelectItem>
                  <SelectItem value="SERVICE">Services</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger data-testid="select-currency">
                  <SelectValue placeholder="All Currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="PI">Pi Network (π)</SelectItem>
                  <SelectItem value="USDT">USDT (Multi-Network)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                  <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Location..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                data-testid="input-location"
              />

              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("all");
                  setSelectedCurrency("all");
                  setSelectedLocation("");
                }}
                data-testid="button-clear-filters"
              >
                <Filter className="w-4 h-4" />
                <span>Clear</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing: any) => (
              <Card key={listing.id} className="group hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-crypto-blue/30" data-testid={`listing-card-${listing.id}`}>
                <div className="relative overflow-hidden rounded-t-lg">
                  {listing.images && listing.images.length > 0 ? (
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                      {getTypeIcon(listing.type)}
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      listing.type === 'REAL_ESTATE' ? 'bg-green-100 text-green-800' :
                      listing.type === 'SHIPPING_SERVICE' ? 'bg-blue-100 text-blue-800' :
                      listing.type === 'PRODUCT' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {formatListingType(listing.type)}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white"
                      data-testid={`button-favorite-${listing.id}`}
                    >
                      <Heart className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/listing/${listing.slug}`}>
                      <h3 className="font-semibold text-slate-dark text-lg group-hover:text-crypto-blue transition-colors cursor-pointer line-clamp-1">
                        {listing.title}
                      </h3>
                    </Link>
                    {listing.avgRating && Number(listing.avgRating) > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-slate-medium">{Number(listing.avgRating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {listing.location && (
                    <p className="text-slate-medium text-sm mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.location}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        listing.currency === 'PI' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {listing.currency === 'PI' ? 'π PI' : 'USDT'}
                      </span>
                      <span className="font-bold text-slate-dark text-lg">{parseFloat(listing.priceCrypto).toLocaleString()}</span>
                    </div>
                    {listing.seller?.whatsapp && (
                      <a
                        href={generateWhatsAppLink(listing.seller.whatsapp, listing.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                        data-testid={`link-whatsapp-${listing.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Contact</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                        {listing.seller?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <Link href={`/profile/${listing.seller?.id}`}>
                        <span className="text-sm text-slate-medium hover:text-crypto-blue cursor-pointer">
                          {listing.seller?.username || 'Anonymous'}
                        </span>
                      </Link>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/listing/${listing.slug}`} className="flex-1">
                      <Button className="w-full bg-crypto-blue hover:bg-crypto-teal" data-testid={`button-view-details-${listing.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {listing.reviewCount && Number(listing.reviewCount) > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-sm text-slate-medium">
                        <span>{Number(listing.reviewCount)} review{Number(listing.reviewCount) !== 1 ? 's' : ''}</span>
                        <div className="flex items-center space-x-1">
                          <StarRating rating={Number(listing.avgRating || 0)} size="sm" readonly />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-dark mb-2">No listings found</h3>
            <p className="text-slate-medium mb-6">
              {searchQuery || selectedType || selectedCurrency || selectedLocation 
                ? "Try adjusting your search filters" 
                : "Be the first to create a listing!"
              }
            </p>
            {!(searchQuery || selectedType || selectedCurrency || selectedLocation) && (
              <Link href="/sell/new">
                <Button data-testid="button-create-first-listing">Create Listing</Button>
              </Link>
            )}
          </div>
        )}

        {/* Load More */}
        {listings && Array.isArray(listings) && listings.length > 0 && listings.length >= 12 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" data-testid="button-load-more">
              Load More Listings
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
