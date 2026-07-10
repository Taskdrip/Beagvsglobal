import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package, Truck, MapPin, CheckCircle, Clock, AlertCircle,
  Search, ArrowRight, Globe, Box, RotateCcw, Plane, Shield,
  Thermometer, FileText, Weight, X, Plus, Layers
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ShipmentStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  PENDING:          { label: "Pending",         color: "text-yellow-400",  bg: "bg-yellow-400/10",  border: "border-yellow-400/30",  icon: Clock },
  PICKED_UP:        { label: "Picked Up",        color: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30",    icon: Package },
  IN_TRANSIT:       { label: "In Transit",       color: "text-cyan-400",    bg: "bg-cyan-400/10",    border: "border-cyan-400/30",    icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "text-purple-400",  bg: "bg-purple-400/10",  border: "border-purple-400/30",  icon: Plane },
  DELIVERED:        { label: "Delivered",        color: "text-green-400",   bg: "bg-green-400/10",   border: "border-green-400/30",   icon: CheckCircle },
  FAILED:           { label: "Delivery Failed",  color: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/30",     icon: AlertCircle },
  RETURNED:         { label: "Returned",         color: "text-orange-400",  bg: "bg-orange-400/10",  border: "border-orange-400/30",  icon: RotateCcw },
};

const STATUS_ORDER: ShipmentStatus[] = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// ── World Route SVG Map ──────────────────────────────────────────────────────
function RouteMap({ origin, destination, status }: { origin?: string; destination?: string; status: ShipmentStatus }) {
  const progress = STATUS_ORDER.indexOf(status) / (STATUS_ORDER.length - 1);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#050d1a] border border-white/10">
      {/* Simplified world map background */}
      <svg viewBox="0 0 800 340" className="w-full h-full opacity-20">
        {/* Continents as simple shapes */}
        <ellipse cx="150" cy="120" rx="90" ry="60" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="160" cy="210" rx="70" ry="80" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="390" cy="120" rx="110" ry="65" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="400" cy="230" rx="40" ry="35" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="590" cy="100" rx="80" ry="50" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="650" cy="200" rx="70" ry="60" fill="#22d3ee" opacity="0.4" />
        <ellipse cx="730" cy="200" rx="40" ry="50" fill="#22d3ee" opacity="0.3" />
        <ellipse cx="730" cy="290" rx="35" ry="25" fill="#22d3ee" opacity="0.2" />
      </svg>

      {/* Route line */}
      <svg viewBox="0 0 800 340" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset={`${progress * 100}%`} stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset={`${progress * 100}%`} stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {/* Curved route */}
        <path d="M 120 160 Q 400 60 680 160"
          fill="none" stroke="url(#routeGrad)" strokeWidth="2.5" strokeDasharray="6 3" />

        {/* Origin dot */}
        <circle cx="120" cy="160" r="6" fill="#22d3ee" opacity="0.9" />
        <circle cx="120" cy="160" r="12" fill="#22d3ee" opacity="0.15" />

        {/* Destination dot */}
        <circle cx="680" cy="160" r="6" fill="#38bdf8" opacity={status === 'DELIVERED' ? "0.9" : "0.35"} />
        {status === 'DELIVERED' && <circle cx="680" cy="160" r="12" fill="#38bdf8" opacity="0.15" />}

        {/* Moving dot (current position) */}
        <circle cx={120 + progress * 560} cy={160 - Math.sin(Math.PI * progress) * 100} r="5" fill="#fff" />
        <circle cx={120 + progress * 560} cy={160 - Math.sin(Math.PI * progress) * 100} r="10" fill="#fff" opacity="0.15" />
      </svg>

      {/* Labels */}
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-4 pb-2">
        <div className="text-left">
          <p className="text-cyan-400 text-xs font-semibold">FROM</p>
          <p className="text-white text-xs">{origin || "Origin"}</p>
        </div>
        <div className="text-center">
          <p className={`text-xs font-semibold ${STATUS_CONFIG[status].color}`}>{STATUS_CONFIG[status].label}</p>
        </div>
        <div className="text-right">
          <p className="text-cyan-400 text-xs font-semibold">TO</p>
          <p className="text-white text-xs">{destination || "Destination"}</p>
        </div>
      </div>
    </div>
  );
}

// ── Tracking Timeline ────────────────────────────────────────────────────────
function TrackingTimeline({ events, currentStatus }: { events: any[]; currentStatus: ShipmentStatus }) {
  const steps = STATUS_ORDER;
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="relative">
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-white/8" />
      <div
        className="absolute left-5 top-6 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-500 transition-all duration-700"
        style={{ height: `${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%` }}
      />
      <div className="space-y-0">
        {steps.map((step, idx) => {
          const cfg = STATUS_CONFIG[step];
          const Icon = cfg.icon;
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step} className="relative flex items-start gap-4 pb-7 last:pb-0">
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                done ? "border-cyan-400 bg-cyan-400/20 shadow-[0_0_14px_rgba(34,211,238,0.35)]" : "border-white/15 bg-white/5"
              }`}>
                <Icon className={`w-4 h-4 ${done ? "text-cyan-400" : "text-white/25"}`} />
                {active && <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-40" />}
              </div>
              <div className="flex-1 pt-1.5">
                <p className={`font-semibold text-sm ${done ? "text-white" : "text-white/30"}`}>{cfg.label}</p>
                {active && events[0] && (
                  <p className="text-xs text-cyan-300/70 mt-0.5">{events[0].description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Event Feed ───────────────────────────────────────────────────────────────
function EventFeed({ events }: { events: any[] }) {
  if (!events?.length) return (
    <p className="text-white/30 text-sm text-center py-8">No tracking events recorded yet.</p>
  );

  return (
    <div className="space-y-3">
      {events.map((ev: any, i: number) => {
        const cfg = STATUS_CONFIG[ev.status as ShipmentStatus] ?? STATUS_CONFIG.IN_TRANSIT;
        const Icon = cfg.icon;
        return (
          <div key={ev.id || i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.border} ${cfg.bg} transition-colors`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-white/30">
                  {ev.eventTimestamp ? format(new Date(ev.eventTimestamp), "MMM d, yyyy · h:mm a") : "—"}
                </span>
              </div>
              <p className="text-sm text-white/80">{ev.description}</p>
              {ev.location && (
                <p className="text-xs text-white/35 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {ev.location}{ev.country ? `, ${ev.country}` : ""}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Shipment Result ──────────────────────────────────────────────────────────
function ShipmentResult({ trackingNumber }: { trackingNumber: string }) {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: shipment, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/tracking", trackingNumber],
    queryFn: async () => {
      const res = await fetch(`/api/tracking/${trackingNumber}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    retry: false,
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: (escrowId: string) =>
      apiRequest("PATCH", `/api/escrows/${escrowId}`, { status: "DELIVERED" }),
    onSuccess: () => {
      toast({ title: "Receipt confirmed! ✓", description: "The seller will be notified that you've received your order." });
      queryClient.invalidateQueries({ queryKey: ["/api/tracking", trackingNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows-as-buyer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/escrows"] });
    },
    onError: (e: any) => toast({ title: "Failed to confirm receipt", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="text-center py-16">
      <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
      <p className="text-white/50">Searching for your shipment…</p>
    </div>
  );

  if (isError) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-red-400/50 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Not Found</h3>
      <p className="text-white/40">No shipment found for <span className="font-mono text-cyan-300">{trackingNumber}</span>.</p>
    </div>
  );

  if (!shipment) return null;

  const cfg = STATUS_CONFIG[shipment.status as ShipmentStatus];
  const StatusIcon = cfg.icon;

  return (
    <div className="space-y-5">
      {/* Route map */}
      <RouteMap
        origin={shipment.origin || shipment.originCountry}
        destination={shipment.destination || shipment.destinationCountry}
        status={shipment.status}
      />

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left: timeline */}
        <div className="md:col-span-1">
          <Card className="bg-[#0a1628] border-white/10 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs text-white/50 uppercase tracking-wide font-medium">Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {shipment.status !== 'FAILED' && shipment.status !== 'RETURNED' ? (
                <TrackingTimeline events={shipment.events} currentStatus={shipment.status} />
              ) : (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                  <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                  <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: details */}
        <div className="md:col-span-2 space-y-4">
          {/* Status hero */}
          <Card className="bg-[#0a1628] border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-sm px-3`}>{cfg.label}</Badge>
                  </div>
                  <p className="font-mono text-2xl font-bold text-white">{shipment.trackingNumber}</p>
                  <p className="text-white/45 text-sm mt-0.5">
                    {shipment.carrier}{shipment.serviceType ? ` · ${shipment.serviceType}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {shipment.insuranceValue && (
                    <Badge className="bg-purple-400/10 text-purple-300 border border-purple-400/20 text-xs">
                      <Shield className="w-3 h-3 mr-1" /> Insured
                    </Badge>
                  )}
                </div>
              </div>

              <Separator className="my-4 bg-white/8" />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  { label: "Origin", value: [shipment.origin, shipment.originCountry].filter(Boolean).join(", ") },
                  { label: "Destination", value: [shipment.destination, shipment.destinationCountry].filter(Boolean).join(", ") },
                  { label: "Recipient", value: shipment.recipientName },
                  { label: "Weight", value: shipment.weightKg ? `${shipment.weightKg} kg` : null },
                  { label: "Est. Delivery", value: shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), "MMM d, yyyy") : null },
                  { label: "Insured Value", value: shipment.insuranceValue ? `${shipment.insuranceValue} ${shipment.insuranceCurrency || ""}` : null },
                ].filter(i => i.value).map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-white/35 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-white font-medium text-sm">{value}</p>
                  </div>
                ))}
              </div>

              {shipment.actualDelivery && (
                <>
                  <Separator className="my-4 bg-white/8" />
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-400/8 border border-green-400/20">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 font-semibold text-sm">Package Delivered</p>
                      <p className="text-white/50 text-xs">{format(new Date(shipment.actualDelivery), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                    </div>
                  </div>
                </>
              )}

              {/* ── Buyer "I received it" button ── */}
              {shipment.escrowId && user && (user as any)?.id === shipment.buyerId &&
                ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(shipment.status) && (
                  <>
                    <Separator className="my-4 bg-white/8" />
                    <div className="p-4 rounded-xl bg-cyan-400/8 border border-cyan-400/20 space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-cyan-300 font-semibold text-sm">Have you received your order?</p>
                          <p className="text-white/45 text-xs mt-0.5">
                            Confirming receipt releases funds to the seller. Only do this once you have your item.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold"
                        disabled={confirmReceiptMutation.isPending}
                        onClick={() => {
                          if (confirm("Confirm you have received this order? This will release funds to the seller.")) {
                            confirmReceiptMutation.mutate(shipment.escrowId);
                          }
                        }}
                      >
                        {confirmReceiptMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Confirming…
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Yes, I Received My Order ✓
                          </span>
                        )}
                      </Button>
                    </div>
                  </>
                )
              }

              {shipment.specialInstructions && (
                <>
                  <Separator className="my-4 bg-white/8" />
                  <div>
                    <p className="text-white/35 text-xs uppercase tracking-wide mb-1">Special Instructions</p>
                    <p className="text-white/65 text-sm">{shipment.specialInstructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Event feed */}
          <Card className="bg-[#0a1628] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs text-white/50 uppercase tracking-wide font-medium">
                Tracking History ({shipment.events?.length || 0} events)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EventFeed events={shipment.events ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ShippingTracker() {
  const [inputValue, setInputValue] = useState("");
  const [searches, setSearches] = useState<string[]>([]);

  // Pre-fill from URL ?q= param
  useEffect(() => {
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q) {
      setInputValue(q.toUpperCase());
      setSearches([q.toUpperCase()]);
    }
    // Load recent searches
    try {
      const saved = localStorage.getItem("bgv_track_recent");
      if (saved) setSearches(prev => [...new Set([...prev, ...JSON.parse(saved)])].slice(0, 5));
    } catch {}
  }, []);

  const handleSearch = (e: React.FormEvent | null, value?: string) => {
    e?.preventDefault();
    const trimmed = (value ?? inputValue).trim().toUpperCase();
    if (!trimmed) return;
    const next = [trimmed, ...searches.filter(s => s !== trimmed)].slice(0, 5);
    setSearches(next);
    setInputValue(trimmed);
    try { localStorage.setItem("bgv_track_recent", JSON.stringify(next)); } catch {}
  };

  const removeSearch = (s: string) => {
    const next = searches.filter(x => x !== s);
    setSearches(next);
    try { localStorage.setItem("bgv_track_recent", JSON.stringify(next)); } catch {}
  };

  const activeTracking = searches[0];

  const FEATURES = [
    { icon: Globe, title: "Worldwide Coverage", desc: "Track shipments across 200+ countries in real time." },
    { icon: Shield, title: "Escrow Protected", desc: "Every Beagvs shipment is backed by crypto escrow." },
    { icon: Box, title: "All Cargo Types", desc: "Air, sea, road, express — all carriers in one place." },
    { icon: Layers, title: "Multi-Tracking", desc: "Track up to 5 shipments simultaneously." },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navigation dark />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-14 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-[#050d1a] to-blue-900/20" />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.4) 0%, transparent 55%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Truck className="w-3.5 h-3.5" /> Global Shipment Tracker
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Track Your Shipment
          </h1>
          <p className="text-white/55 text-base mb-8">
            Real-time updates for goods, cargo, freight and courier shipments worldwide.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
              <Input
                data-testid="input-tracking-number"
                value={inputValue}
                onChange={e => setInputValue(e.target.value.toUpperCase())}
                placeholder="BGV-1234567890"
                className="pl-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-cyan-400 uppercase font-mono tracking-widest text-sm"
              />
            </div>
            <Button type="submit" data-testid="button-track"
              className="h-12 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold">
              Track <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Recent searches */}
          {searches.length > 0 && (
            <div className="flex gap-2 justify-center flex-wrap">
              {searches.map(s => (
                <button key={s}
                  onClick={() => { setInputValue(s); handleSearch(null, s); }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/8 border border-white/12 text-white/60 hover:text-white text-xs font-mono transition-colors group">
                  {s}
                  <span onClick={e => { e.stopPropagation(); removeSearch(s); }}
                    className="hover:text-red-400 transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results / Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        {activeTracking ? (
          <ShipmentResult trackingNumber={activeTracking} />
        ) : (
          <>
            {/* Feature cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="bg-[#0a1628] border-white/10 hover:border-cyan-400/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-white/45 text-sm">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How it works */}
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-white mb-2">How Tracking Works</h2>
              <p className="text-white/50">Every shipment on Beagvs is tied to a crypto escrow — ensuring seller accountability at every step.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mb-14">
              {[
                { step: "01", title: "Seller Creates Shipment", desc: "Once escrow is funded, the seller books the shipment and receives a tracking number." },
                { step: "02", title: "Real-Time Updates", desc: "The seller posts tracking events as the package moves through hubs and borders." },
                { step: "03", title: "Escrow Release", desc: "Once you confirm delivery, escrow funds are released to the seller automatically." },
              ].map(({ step, title, desc }) => (
                <Card key={step} className="bg-[#0a1628] border-white/10 text-center">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto mb-3">
                      {step}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-white/45 text-sm">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
