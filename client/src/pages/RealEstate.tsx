import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  Search, MapPin, Home, Building, Warehouse, Trees, Star,
  Bed, Bath, Square, Shield, TrendingUp, Globe, ChevronRight,
  Filter, Heart, Eye, DollarSign, Calculator, Phone, ChevronDown
} from "lucide-react";

const PROPERTY_TYPES = [
  { id: "all",        label: "All Properties",  icon: Globe },
  { id: "apartment",  label: "Apartments",       icon: Building },
  { id: "house",      label: "Houses",           icon: Home },
  { id: "villa",      label: "Villas",           icon: Home },
  { id: "commercial", label: "Commercial",       icon: Warehouse },
  { id: "land",       label: "Land / Plot",      icon: Trees },
  { id: "warehouse",  label: "Warehouse",        icon: Warehouse },
];

const LISTING_CATEGORIES = [
  { id: "all",     label: "All" },
  { id: "sale",    label: "For Sale" },
  { id: "rent",    label: "For Rent" },
  { id: "lease",   label: "Commercial Lease" },
];

// Mortgage calculator
function MortgageCalculator() {
  const [price, setPrice] = useState("200000");
  const [down, setDown] = useState("20");
  const [rate, setRate] = useState("6.5");
  const [years, setYears] = useState("30");

  const principal = parseFloat(price) * (1 - parseFloat(down) / 100);
  const monthlyRate = parseFloat(rate) / 100 / 12;
  const n = parseFloat(years) * 12;
  const monthly = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : principal / n;

  return (
    <Card className="bg-[#0a1628] border-white/10">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white font-bold text-lg">Mortgage Calculator</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          {[
            { label: "Property Price ($)", value: price, setter: setPrice, placeholder: "200000" },
            { label: "Down Payment (%)", value: down, setter: setDown, placeholder: "20" },
            { label: "Interest Rate (%)", value: rate, setter: setRate, placeholder: "6.5" },
            { label: "Loan Term (years)", value: years, setter: setYears, placeholder: "30" },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">{label}</label>
              <Input
                type="number"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                className="bg-white/5 border-white/15 text-white"
              />
            </div>
          ))}
        </div>
        {monthly > 0 && !isNaN(monthly) && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Loan Amount</p>
                <p className="text-white font-semibold">${principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Monthly Payment</p>
                <p className="text-cyan-400 font-bold text-xl">${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Total Interest</p>
                <p className="text-white font-semibold">${((monthly * n) - principal).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Property Card
function PropertyCard({ listing }: { listing: any }) {
  const [liked, setLiked] = useState(false);
  const meta = listing.metadata || {};

  const typeColors: Record<string, string> = {
    REAL_ESTATE: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  };

  return (
    <Card
      data-testid={`property-card-${listing.id}`}
      className="bg-[#0a1628] border-white/10 hover:border-cyan-400/30 transition-all duration-300 group overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-cyan-900/40 flex items-center justify-center">
            <Home className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <Badge className="bg-[#050d1a]/80 backdrop-blur text-cyan-300 border-cyan-400/30 text-xs">
            {listing.currency} {parseFloat(listing.priceCrypto).toLocaleString()}
          </Badge>
          {meta.category && (
            <Badge className="bg-[#050d1a]/80 backdrop-blur text-white/70 border-white/15 text-xs capitalize">
              {meta.category}
            </Badge>
          )}
        </div>
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${liked ? "bg-red-500/30 border border-red-400/40" : "bg-black/30 border border-white/15 hover:border-white/40"}`}
          data-testid={`button-like-${listing.id}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "text-red-400 fill-current" : "text-white/60"}`} />
        </button>

        {/* Location pin */}
        {listing.location && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white/80 text-xs">
            <MapPin className="w-3 h-3" /> {listing.location}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <Link href={`/listing/${listing.slug}`}>
          <h3 className="text-white font-semibold text-base mb-1 group-hover:text-cyan-300 transition-colors line-clamp-1 cursor-pointer">
            {listing.title}
          </h3>
        </Link>

        {/* Property specs */}
        <div className="flex items-center gap-4 mb-3 text-white/50 text-sm">
          {meta.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" /> {meta.bedrooms} bd
            </span>
          )}
          {meta.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {meta.bathrooms} ba
            </span>
          )}
          {meta.areaSqft && (
            <span className="flex items-center gap-1">
              <Square className="w-3.5 h-3.5" /> {Number(meta.areaSqft).toLocaleString()} sqft
            </span>
          )}
        </div>

        <p className="text-white/40 text-xs mb-3 line-clamp-2">{listing.description}</p>

        {/* Amenities */}
        {meta.amenities?.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {meta.amenities.slice(0, 3).map((a: string) => (
              <Badge key={a} className="bg-white/5 text-white/50 border-white/10 text-xs">{a}</Badge>
            ))}
            {meta.amenities.length > 3 && (
              <Badge className="bg-white/5 text-white/50 border-white/10 text-xs">+{meta.amenities.length - 3}</Badge>
            )}
          </div>
        )}

        <Separator className="bg-white/8 mb-3" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
              {listing.seller?.username?.[0]?.toUpperCase() || "?"}
            </div>
            <Link href={`/profile/${listing.seller?.id}`}>
              <span className="text-white/50 text-xs hover:text-cyan-300 cursor-pointer">{listing.seller?.username || "Anonymous"}</span>
            </Link>
          </div>
          {listing.avgRating && Number(listing.avgRating) > 0 && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Star className="w-3 h-3 fill-current" /> {Number(listing.avgRating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Link href={`/listing/${listing.slug}`} className="flex-1">
            <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-600 text-white text-xs h-9"
              data-testid={`button-view-property-${listing.id}`}>
              <Eye className="w-3.5 h-3.5 mr-1" /> View Property
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RealEstate() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { isAuthenticated } = useAuth();

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [category, setCategory] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [location, setLocation] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const { data: listings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/listings", {
      type: "REAL_ESTATE",
      search: search || undefined,
      currency: currency === "all" ? undefined : currency,
      location: location || undefined,
    }],
  });

  const filtered = listings?.filter(l => {
    const meta = l.metadata || {};
    if (propertyType !== "all" && meta.propertyType !== propertyType) return false;
    if (category !== "all" && meta.category !== category) return false;
    const price = parseFloat(l.priceCrypto) || 0;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    return true;
  }) ?? [];

  const STATS = [
    { label: "Active Listings", value: listings?.length ?? "—", icon: Building },
    { label: "Countries Covered", value: "58+", icon: Globe },
    { label: "Escrow Protected", value: "100%", icon: Shield },
    { label: "Avg. Transaction", value: "$82K", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navigation dark />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-[#050d1a] to-blue-900/20" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 40%, rgba(52,211,153,0.3) 0%, transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Home className="w-3.5 h-3.5" /> Global Real Estate Marketplace
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-emerald-100 to-cyan-200 bg-clip-text text-transparent leading-tight">
            Buy, Sell & Invest in<br />Property Worldwide
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
            From apartments in Lagos to villas in Dubai — discover real estate across 58 countries, all transactions secured by crypto escrow.
          </p>

          {/* Quick search */}
          <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur border border-white/15 rounded-2xl p-3 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city, country, or property type…"
                className="pl-9 bg-transparent border-0 text-white placeholder:text-white/30 focus-visible:ring-0 h-11"
                data-testid="input-property-search"
              />
            </div>
            <Button className="h-11 px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 font-semibold">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/8 bg-white/2">
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-white/50 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8">
          {/* Property type tabs */}
          <div className="flex gap-2 flex-wrap mb-5">
            {PROPERTY_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPropertyType(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  propertyType === id
                    ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                    : "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                }`}
                data-testid={`filter-type-${id}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* Advanced filters toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {LISTING_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    category === c.id ? "border-cyan-400 bg-cyan-400/10 text-cyan-300" : "border-white/15 text-white/50 hover:text-white"
                  }`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                className="border-white/20 text-white/70 hover:text-white">
                <Filter className="w-3.5 h-3.5 mr-1.5" /> Filters <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCalc(!showCalc)}
                className="border-white/20 text-white/70 hover:text-white">
                <Calculator className="w-3.5 h-3.5 mr-1.5" /> Mortgage Calc
              </Button>
              {isAuthenticated && (
                <Link href="/sell/new">
                  <Button size="sm" className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/25 hover:bg-emerald-500/30">
                    + List Property
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">Location</label>
                <Input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or country…"
                  className="bg-white/5 border-white/15 text-white" />
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-white/5 border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                    <SelectItem value="all">All Currencies</SelectItem>
                    <SelectItem value="PI">Pi Network (π)</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="NGN">NGN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/50 text-xs uppercase tracking-wide block mb-1.5">
                  Price Range: {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()}
                </label>
                <Slider
                  min={0} max={2000000} step={5000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mt-3"
                />
              </div>
            </div>
          )}

          {showCalc && <div className="mt-4"><MortgageCalculator /></div>}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isLoading ? "Loading…" : `${filtered.length} Properties Found`}
            </h2>
            <p className="text-white/40 text-sm mt-0.5">
              {search && `Searching "${search}"`}
              {location && ` in ${location}`}
            </p>
          </div>
          <Select defaultValue="newest">
            <SelectTrigger className="w-40 bg-white/5 border-white/15 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1628] border-white/15 text-white">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building className="w-14 h-14 text-white/15 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
            <p className="text-white/50 mb-6">
              {search || location || propertyType !== "all" ? "Try adjusting your filters." : "Be the first to list a property!"}
            </p>
            {isAuthenticated && (
              <Link href="/sell/new">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold">
                  List Your Property
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Bottom mortgage calc (always shown) */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Plan Your Investment</h2>
            <p className="text-white/50">Calculate monthly repayments before making an offer.</p>
          </div>
          <MortgageCalculator />
        </div>

        {/* CTA */}
        {!isAuthenticated && (
          <div className="mt-12 rounded-2xl border border-emerald-400/25 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d2510 0%, #091525 60%, #0c2535 100%)' }}>
            <div className="py-12 px-6">
              <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Buy or Sell Property with Crypto Escrow</h3>
              <p className="text-slate-400 mb-6 max-w-lg mx-auto">Every property transaction on Beagvs is secured by our multi-chain escrow system — no fraud, no risk.</p>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold h-11 px-8">
                  Create Free Account <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
