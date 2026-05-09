import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Package, Truck, MapPin, CheckCircle, Clock, AlertCircle,
  Search, ArrowRight, Globe, Box, RotateCcw, Plane, Shield
} from "lucide-react";
import { format } from "date-fns";

type ShipmentStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:          { label: "Pending",          color: "text-yellow-400",  bg: "bg-yellow-400/10",  icon: Clock },
  PICKED_UP:        { label: "Picked Up",         color: "text-blue-400",    bg: "bg-blue-400/10",    icon: Package },
  IN_TRANSIT:       { label: "In Transit",        color: "text-cyan-400",    bg: "bg-cyan-400/10",    icon: Truck },
  OUT_FOR_DELIVERY: { label: "Out for Delivery",  color: "text-purple-400",  bg: "bg-purple-400/10",  icon: Plane },
  DELIVERED:        { label: "Delivered",         color: "text-green-400",   bg: "bg-green-400/10",   icon: CheckCircle },
  FAILED:           { label: "Delivery Failed",   color: "text-red-400",     bg: "bg-red-400/10",     icon: AlertCircle },
  RETURNED:         { label: "Returned",          color: "text-orange-400",  bg: "bg-orange-400/10",  icon: RotateCcw },
};

const STATUS_ORDER: ShipmentStatus[] = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function TrackingTimeline({ events, currentStatus }: { events: any[]; currentStatus: ShipmentStatus }) {
  const steps = STATUS_ORDER;
  const currentIdx = steps.indexOf(currentStatus);

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-white/10" />
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
            <div key={step} className="relative flex items-start gap-4 pb-8 last:pb-0">
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                done
                  ? "border-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  : "border-white/20 bg-white/5"
              }`}>
                <Icon className={`w-4 h-4 ${done ? "text-cyan-400" : "text-white/30"}`} />
                {active && (
                  <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className={`font-semibold text-sm ${done ? "text-white" : "text-white/40"}`}>
                  {cfg.label}
                </div>
                {active && events.length > 0 && (
                  <div className="mt-0.5 text-xs text-cyan-300/80">
                    {events[0]?.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventFeed({ events }: { events: any[] }) {
  if (!events?.length) return (
    <p className="text-white/40 text-sm text-center py-6">No tracking events yet.</p>
  );

  return (
    <div className="space-y-3">
      {events.map((ev: any, i: number) => {
        const cfg = STATUS_CONFIG[ev.status as ShipmentStatus] ?? STATUS_CONFIG.IN_TRANSIT;
        const Icon = cfg.icon;
        return (
          <div key={ev.id || i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-cyan-400/30 transition-colors">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
              <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-white/40">
                  {ev.eventTimestamp ? format(new Date(ev.eventTimestamp), "MMM d, yyyy · h:mm a") : "—"}
                </span>
              </div>
              <p className="text-sm text-white/80 mt-0.5">{ev.description}</p>
              {ev.location && (
                <div className="flex items-center gap-1 mt-1 text-xs text-white/40">
                  <MapPin className="w-3 h-3" /> {ev.location}{ev.country ? `, ${ev.country}` : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ShippingTracker() {
  const [inputValue, setInputValue] = useState("");
  const [searchedNumber, setSearchedNumber] = useState("");

  const { data: shipment, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/tracking", searchedNumber],
    queryFn: async () => {
      const res = await fetch(`/api/tracking/${searchedNumber}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!searchedNumber,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) setSearchedNumber(trimmed);
  };

  const cfg = shipment ? STATUS_CONFIG[shipment.status as ShipmentStatus] : null;
  const StatusIcon = cfg?.icon;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navigation dark />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-[#050d1a] to-blue-900/20" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(56,189,248,0.3) 0%, transparent 60%)" }} />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Truck className="w-3.5 h-3.5" /> Global Shipping Tracker
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Track Your Shipment
          </h1>
          <p className="text-white/60 text-lg mb-10">
            Enter your tracking number to see real-time delivery updates anywhere in the world.
          </p>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                data-testid="input-tracking-number"
                value={inputValue}
                onChange={e => setInputValue(e.target.value.toUpperCase())}
                placeholder="e.g. BGV-1234567890"
                className="pl-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-cyan-400 uppercase tracking-widest"
              />
            </div>
            <Button
              type="submit"
              data-testid="button-track"
              className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
            >
              Track <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-white/60">Searching for your shipment…</p>
          </div>
        )}

        {isError && searchedNumber && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400/60 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Tracking Number Not Found</h3>
            <p className="text-white/50">
              No shipment found for <span className="text-cyan-300 font-mono">{searchedNumber}</span>. Please check the number and try again.
            </p>
          </div>
        )}

        {shipment && cfg && StatusIcon && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: timeline */}
            <div className="md:col-span-1">
              <Card className="bg-[#0a1628] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">Delivery Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {shipment.status !== 'FAILED' && shipment.status !== 'RETURNED' ? (
                    <TrackingTimeline events={shipment.events} currentStatus={shipment.status} />
                  ) : (
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${cfg.bg} border border-${cfg.color}/20`}>
                      <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                      <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: details */}
            <div className="md:col-span-2 space-y-4">
              {/* Status card */}
              <Card className="bg-[#0a1628] border-white/10">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                        <span className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="font-mono text-2xl font-bold text-white">{shipment.trackingNumber}</p>
                      <p className="text-white/50 text-sm mt-1">
                        {shipment.carrier}{shipment.serviceType ? ` · ${shipment.serviceType}` : ""}
                      </p>
                    </div>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-sm px-3 py-1.5`}>
                      {cfg.label}
                    </Badge>
                  </div>

                  <Separator className="my-4 bg-white/10" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">From</p>
                      <p className="text-white font-medium">{shipment.origin || "—"}</p>
                      <p className="text-white/50">{shipment.originCountry || ""}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-1">To</p>
                      <p className="text-white font-medium">{shipment.destination || "—"}</p>
                      <p className="text-white/50">{shipment.destinationCountry || ""}</p>
                    </div>
                    {shipment.estimatedDelivery && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Est. Delivery</p>
                        <p className="text-white font-medium">
                          {format(new Date(shipment.estimatedDelivery), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                    {shipment.actualDelivery && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Delivered On</p>
                        <p className="text-green-400 font-medium">
                          {format(new Date(shipment.actualDelivery), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                    )}
                    {shipment.weightKg && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Weight</p>
                        <p className="text-white font-medium">{shipment.weightKg} kg</p>
                      </div>
                    )}
                    {shipment.recipientName && (
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Recipient</p>
                        <p className="text-white font-medium">{shipment.recipientName}</p>
                      </div>
                    )}
                  </div>

                  {shipment.specialInstructions && (
                    <>
                      <Separator className="my-4 bg-white/10" />
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Special Instructions</p>
                        <p className="text-white/70 text-sm">{shipment.specialInstructions}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Event feed */}
              <Card className="bg-[#0a1628] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">Tracking History</CardTitle>
                </CardHeader>
                <CardContent>
                  <EventFeed events={shipment.events} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Features strip (shown when no search active) */}
        {!searchedNumber && !isLoading && (
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            {[
              { icon: Globe, title: "Worldwide Coverage", desc: "Track shipments across 200+ countries and territories in real time." },
              { icon: Shield, title: "Escrow Protected", desc: "Every shipment on Beagvs is backed by our secure crypto escrow system." },
              { icon: Box, title: "Multi-Carrier", desc: "FedEx, UPS, DHL, USPS, and local carriers all in one place." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="bg-[#0a1628]/60 border-white/8 hover:border-cyan-400/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-white/50 text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
