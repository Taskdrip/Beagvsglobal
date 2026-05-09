import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Truck, MapPin, CheckCircle, Clock, AlertCircle, ArrowLeft,
  Plus, RotateCcw, Plane, Globe, Box, Send, Loader2, Ship, Weight,
  Thermometer, FileText, Shield, Zap, ArrowRight, Calculator, Search,
  Wind, Layers, AnchorIcon, Activity
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

const CARRIERS = ["DHL Express", "FedEx", "UPS", "TNT", "Aramex", "EMS / PostExpress", "Maersk (Sea)", "MSC (Sea)", "COSCO (Sea)", "Air France Cargo", "Ethiopian Airlines Cargo", "PiShip Express", "Local Courier", "Other"];
const SERVICE_TYPES = ["Air Express (1-3 days)", "Air Standard (5-7 days)", "Sea Freight FCL", "Sea Freight LCL", "Road Freight", "Rail Freight", "Economy Parcel (7-14 days)", "Same Day Courier", "Overnight Express"];

const CARGO_CATEGORIES = [
  { id: "GENERAL", label: "General Cargo", icon: Box, desc: "Standard goods, clothing, electronics" },
  { id: "PERISHABLES", label: "Perishables", icon: Thermometer, desc: "Food, flowers, pharmaceuticals" },
  { id: "HEAVY_MACHINERY", label: "Heavy Machinery", icon: Weight, desc: "Industrial equipment, vehicles" },
  { id: "DANGEROUS_GOODS", label: "Dangerous Goods", icon: AlertCircle, desc: "Chemicals, batteries, gases (ADR/IATA)" },
  { id: "DOCUMENTS", label: "Documents", icon: FileText, desc: "Legal papers, passports, certificates" },
  { id: "VEHICLES", label: "Vehicles", icon: Truck, desc: "Cars, motorcycles, boats" },
  { id: "BULK_CARGO", label: "Bulk Cargo", icon: Layers, desc: "Grains, minerals, liquids" },
  { id: "LIVESTOCK", label: "Live Animals", icon: Activity, desc: "Pets, agricultural animals (CITES)" },
];

const SHIPPING_ZONES = [
  { zone: "Zone 1 – West Africa", baseRate: 3.5, countries: "Nigeria, Ghana, Senegal, Ivory Coast…" },
  { zone: "Zone 2 – East Africa", baseRate: 4.2, countries: "Kenya, Ethiopia, Tanzania, Uganda…" },
  { zone: "Zone 3 – Europe", baseRate: 6.8, countries: "UK, France, Germany, Netherlands…" },
  { zone: "Zone 4 – North America", baseRate: 8.5, countries: "USA, Canada, Mexico…" },
  { zone: "Zone 5 – Asia Pacific", baseRate: 9.2, countries: "China, India, UAE, Singapore…" },
  { zone: "Zone 6 – Rest of World", baseRate: 12.0, countries: "South America, Oceania, Central Asia…" },
];

// ── Rate Calculator ──────────────────────────────────────────────────────────
function RateCalculator() {
  const [weight, setWeight] = useState("");
  const [zone, setZone] = useState("");
  const [serviceType, setServiceType] = useState("air");
  const [insurance, setInsurance] = useState(false);

  const selectedZone = SHIPPING_ZONES.find(z => z.zone === zone);
  const weightKg = parseFloat(weight) || 0;
  const multiplier = serviceType === "sea" ? 0.4 : serviceType === "economy" ? 0.7 : 1.0;
  const baseRate = (selectedZone?.baseRate || 0) * weightKg * multiplier;
  const insuranceAmt = insurance ? baseRate * 0.02 : 0;
  const total = baseRate + insuranceAmt;

  return (
    <Card className="bg-[#0a1628] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" /> Shipping Rate Calculator
        </CardTitle>
        <CardDescription className="text-white/50">Estimate costs before booking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wide block mb-1.5">Weight (kg)</label>
            <Input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 25"
              className="bg-white/5 border-white/15 text-white"
              data-testid="input-calc-weight"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wide block mb-1.5">Destination Zone</label>
            <Select onValueChange={setZone}>
              <SelectTrigger className="bg-white/5 border-white/15 text-white">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                {SHIPPING_ZONES.map(z => (
                  <SelectItem key={z.zone} value={z.zone}>
                    {z.zone} (${z.baseRate}/kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-white/50 uppercase tracking-wide block mb-1.5">Service Type</label>
            <Select onValueChange={setServiceType} defaultValue="air">
              <SelectTrigger className="bg-white/5 border-white/15 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                <SelectItem value="air">Air Freight (×1.0)</SelectItem>
                <SelectItem value="economy">Economy Parcel (×0.7)</SelectItem>
                <SelectItem value="sea">Sea Freight (×0.4)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={insurance} onChange={e => setInsurance(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5" />
              <span className="text-sm text-white/70">Add Insurance (+2%)</span>
            </label>
          </div>
        </div>

        {total > 0 && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <p className="text-white/40 text-xs mb-0.5">Base Rate</p>
                <p className="text-white font-semibold">${baseRate.toFixed(2)}</p>
              </div>
              {insurance && (
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Insurance</p>
                  <p className="text-white font-semibold">${insuranceAmt.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="text-white/40 text-xs mb-0.5">Total Est.</p>
                <p className="text-cyan-400 font-bold text-lg">${total.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-white/30">*Estimates only. Final rates may vary based on actual weight, dimensions, customs, and carrier surcharges.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Create Shipment Form ─────────────────────────────────────────────────────
const createShipmentSchema = z.object({
  trackingNumber: z.string().min(4, "Tracking number required"),
  carrier: z.string().min(1, "Carrier required"),
  serviceType: z.string().optional(),
  cargoCategory: z.string().optional(),
  origin: z.string().optional(),
  originCountry: z.string().optional(),
  destination: z.string().optional(),
  destinationCountry: z.string().optional(),
  recipientName: z.string().min(1, "Recipient name required"),
  recipientPhone: z.string().optional(),
  weightKg: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  specialInstructions: z.string().optional(),
  buyerId: z.string().optional(),
  escrowId: z.string().optional(),
  insuranceValue: z.string().optional(),
  insuranceCurrency: z.string().optional(),
});

function CreateShipmentForm({ escrowId, buyerId }: { escrowId?: string; buyerId?: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("GENERAL");

  const form = useForm<z.infer<typeof createShipmentSchema>>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      trackingNumber: "", carrier: "", serviceType: "", cargoCategory: "GENERAL",
      origin: "", originCountry: "", destination: "", destinationCountry: "",
      recipientName: "", recipientPhone: "", weightKg: "", estimatedDelivery: "",
      specialInstructions: "", buyerId: buyerId ?? "", escrowId: escrowId ?? "",
      insuranceValue: "", insuranceCurrency: "USDT",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof createShipmentSchema>) => {
      const payload: any = { ...values, cargoCategory: selectedCategory };
      if (values.weightKg) payload.weightKg = parseFloat(values.weightKg);
      if (values.estimatedDelivery) payload.estimatedDelivery = new Date(values.estimatedDelivery).toISOString();
      if (values.insuranceValue) payload.insuranceValue = parseFloat(values.insuranceValue);
      return apiRequest("POST", "/api/shipments", payload);
    },
    onSuccess: (data: any) => {
      toast({ title: "Shipment created!", description: `Tracking: ${data.trackingNumber}` });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments/me"] });
      navigate(`/shipments/${data.id}`);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create shipment", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-8">
      {/* Cargo Category */}
      <div>
        <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Cargo Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CARGO_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? "border-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-white/3 hover:border-white/25"
                }`}
                data-testid={`cargo-category-${cat.id}`}
              >
                <Icon className={`w-5 h-5 mb-1.5 ${active ? "text-cyan-400" : "text-white/50"}`} />
                <p className={`text-xs font-semibold ${active ? "text-white" : "text-white/60"}`}>{cat.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5 leading-tight">{cat.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-6">
          {/* Carrier & Service */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">Carrier & Service</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <FormField control={form.control} name="trackingNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Tracking Number *</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-tracking-number" placeholder="BGV-1234567890"
                      className="bg-white/5 border-white/15 text-white uppercase font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="carrier" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Carrier *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-carrier" className="bg-white/5 border-white/15 text-white">
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                      {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Service Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/15 text-white">
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                      {SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
          </div>

          <Separator className="bg-white/10" />
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Route</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "origin" as const, label: "Origin City", placeholder: "Lagos" },
              { name: "originCountry" as const, label: "Origin Country", placeholder: "Nigeria" },
              { name: "destination" as const, label: "Destination City", placeholder: "London" },
              { name: "destinationCountry" as const, label: "Destination Country", placeholder: "United Kingdom" },
            ].map(f => (
              <FormField key={f.name} control={form.control} name={f.name} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">{f.label}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={f.placeholder} className="bg-white/5 border-white/15 text-white" />
                  </FormControl>
                </FormItem>
              )} />
            ))}
          </div>

          <Separator className="bg-white/10" />
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Recipient & Package</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <FormField control={form.control} name="recipientName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Recipient Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="recipientPhone" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Recipient Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+44 20 0000 0000" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="weightKg" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Weight (kg)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.001" placeholder="25.000" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="estimatedDelivery" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Est. Delivery Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="insuranceValue" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Declared Value (for insurance)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="500" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
              </FormItem>
            )} />
            {!escrowId && (
              <FormField control={form.control} name="buyerId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Buyer User ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional" className="bg-white/5 border-white/15 text-white" />
                  </FormControl>
                </FormItem>
              )} />
            )}
          </div>

          <FormField control={form.control} name="specialInstructions" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Special Instructions / Customs Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Fragile, handle with care. Customs HS code: 8471.30" rows={3}
                  className="bg-white/5 border-white/15 text-white resize-none" />
              </FormControl>
            </FormItem>
          )} />

          {escrowId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
              <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <p className="text-xs text-cyan-300">This shipment is linked to Escrow <span className="font-mono">{escrowId.slice(0, 8)}…</span>. Creating it will mark the escrow as SHIPPED.</p>
            </div>
          )}

          <Button
            type="submit"
            data-testid="button-create-shipment"
            disabled={mutation.isPending}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Shipment & Generate Tracking
          </Button>
        </form>
      </Form>
    </div>
  );
}

// ── Add Event Form ───────────────────────────────────────────────────────────
const addEventSchema = z.object({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']),
  description: z.string().min(3, "Description required"),
  location: z.string().optional(),
  country: z.string().optional(),
});

function AddEventForm({ shipmentId }: { shipmentId: string }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof addEventSchema>>({
    resolver: zodResolver(addEventSchema),
    defaultValues: { status: "IN_TRANSIT", description: "", location: "", country: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof addEventSchema>) =>
      apiRequest("POST", `/api/shipments/${shipmentId}/events`, values),
    onSuccess: () => {
      toast({ title: "Tracking update added" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipmentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments/me"] });
      form.reset();
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-3">
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/60 text-xs">New Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-white/5 border-white/15 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/60 text-xs">Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Hub / City" className="bg-white/5 border-white/15 text-white text-sm" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/60 text-xs">Country</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Country" className="bg-white/5 border-white/15 text-white text-sm" />
              </FormControl>
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/60 text-xs">Update Description *</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} placeholder="Arrived at transit hub…" className="bg-white/5 border-white/15 text-white text-sm resize-none" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={mutation.isPending} size="sm"
          className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/20">
          {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
          Post Update
        </Button>
      </form>
    </Form>
  );
}

// ── Shipment Detail ──────────────────────────────────────────────────────────
function ShipmentDetail({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const { user } = useAuth() as any;

  const { data: shipment, isLoading } = useQuery<any>({
    queryKey: ["/api/shipments", id],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );
  if (!shipment) return <div className="text-center py-20 text-white/40">Shipment not found.</div>;

  const cfg = STATUS_CONFIG[shipment.status as ShipmentStatus];
  const StatusIcon = cfg.icon;
  const isSeller = user?.id === shipment.sellerId;
  const cargoInfo = CARGO_CATEGORIES.find(c => c.id === (shipment.metadata as any)?.cargoCategory);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/shipping")} className="text-white/60 hover:text-white -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> All Shipments
      </Button>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
            {cargoInfo && <Badge className="bg-white/10 text-white/60 border-0">{cargoInfo.label}</Badge>}
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">{shipment.trackingNumber}</h2>
          <p className="text-white/50">{shipment.carrier}{shipment.serviceType ? ` · ${shipment.serviceType}` : ""}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/tracking?q=${shipment.trackingNumber}`}>
            <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white">
              <Globe className="w-4 h-4 mr-1" /> Public Tracker
            </Button>
          </Link>
          {shipment.escrowId && (
            <Link href={`/checkout/${shipment.escrowId}`}>
              <Button variant="outline" size="sm" className="border-cyan-400/30 text-cyan-400">
                <Shield className="w-4 h-4 mr-1" /> View Escrow
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Card className="md:col-span-2 bg-[#0a1628] border-white/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "From", value: [shipment.origin, shipment.originCountry].filter(Boolean).join(", ") || "—" },
                { label: "To", value: [shipment.destination, shipment.destinationCountry].filter(Boolean).join(", ") || "—" },
                { label: "Recipient", value: shipment.recipientName || "—" },
                { label: "Phone", value: shipment.recipientPhone || "—" },
                { label: "Weight", value: shipment.weightKg ? `${shipment.weightKg} kg` : "—" },
                { label: "Est. Delivery", value: shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), "MMM d, yyyy") : "—" },
                { label: "Insured Value", value: shipment.insuranceValue ? `${shipment.insuranceValue} ${shipment.insuranceCurrency || ""}` : "—" },
                { label: "Created", value: format(new Date(shipment.createdAt), "MMM d, yyyy") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-white font-medium text-sm">{value}</p>
                </div>
              ))}
            </div>
            {shipment.specialInstructions && (
              <>
                <Separator className="my-4 bg-white/10" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Special Instructions / Customs</p>
                  <p className="text-white/70 text-sm">{shipment.specialInstructions}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isSeller && (
          <Card className="bg-[#0a1628] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">Post Update</CardTitle>
            </CardHeader>
            <CardContent>
              <AddEventForm shipmentId={id} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-[#0a1628] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">
            Tracking History ({shipment.events?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!shipment.events?.length ? (
            <p className="text-white/30 text-sm text-center py-8">No tracking events yet.</p>
          ) : (
            <div className="space-y-3">
              {shipment.events.map((ev: any) => {
                const evCfg = STATUS_CONFIG[ev.status as ShipmentStatus] ?? STATUS_CONFIG.IN_TRANSIT;
                const EvIcon = evCfg.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-cyan-400/20 transition-colors">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${evCfg.bg}`}>
                      <EvIcon className={`w-4 h-4 ${evCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${evCfg.color}`}>{evCfg.label}</span>
                        <span className="text-xs text-white/30">{ev.eventTimestamp ? format(new Date(ev.eventTimestamp), "MMM d · h:mm a") : "—"}</span>
                      </div>
                      <p className="text-sm text-white/80 mt-0.5">{ev.description}</p>
                      {ev.location && (
                        <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {ev.location}{ev.country ? `, ${ev.country}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── My Shipments List ────────────────────────────────────────────────────────
function MyShipmentsList() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState("all");

  const { data: myShipments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/shipments/me"],
  });

  const filtered = myShipments?.filter(s => filter === "all" || s.status === filter) ?? [];

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "IN_TRANSIT", "DELIVERED", "PENDING", "FAILED"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f
                ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                : "border-white/15 text-white/50 hover:text-white hover:border-white/30"
            }`}>
            {f === "all" ? "All" : STATUS_CONFIG[f as ShipmentStatus]?.label ?? f}
            {f !== "all" && myShipments && (
              <span className="ml-1.5 opacity-60">({myShipments.filter(s => s.status === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="text-center py-16">
          <Box className="w-12 h-12 text-white/15 mx-auto mb-4" />
          <p className="text-white/40">{filter === "all" ? "No shipments yet." : `No ${STATUS_CONFIG[filter as ShipmentStatus]?.label ?? filter} shipments.`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s: any) => {
            const cfg = STATUS_CONFIG[s.status as ShipmentStatus];
            const Icon = cfg.icon;
            return (
              <div key={s.id} data-testid={`card-shipment-${s.id}`}
                onClick={() => navigate(`/shipments/${s.id}`)}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/8 cursor-pointer transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-white text-sm">{s.trackingNumber}</span>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {s.carrier}
                    {s.origin ? ` · ${s.origin}` : ""}
                    {s.destination ? ` → ${s.destination}` : ""}
                    {s.weightKg ? ` · ${s.weightKg}kg` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-white/30">{s.estimatedDelivery ? format(new Date(s.estimatedDelivery), "MMM d") : "—"}</p>
                  <p className="text-xs text-cyan-400 mt-1 group-hover:translate-x-0.5 transition-transform">View →</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ShippingHub() {
  const [matchDetail, paramsDetail] = useRoute("/shipments/:id");
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const shipmentId = paramsDetail?.id;

  const SERVICES = [
    { icon: Plane, title: "Air Freight", time: "1–7 days", desc: "Express and standard air cargo for time-sensitive shipments", color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: Ship, title: "Sea Freight", time: "14–45 days", desc: "FCL and LCL ocean freight for large volume cargo", color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { icon: Truck, title: "Road Freight", time: "1–14 days", desc: "Cross-border trucking and last-mile delivery", color: "text-green-400", bg: "bg-green-400/10" },
    { icon: Wind, title: "Rail Freight", time: "7–21 days", desc: "Sustainable, high-capacity intermodal rail logistics", color: "text-purple-400", bg: "bg-purple-400/10" },
    { icon: Zap, title: "Express Courier", time: "1–3 days", desc: "DHL, FedEx, UPS door-to-door priority delivery", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: AnchorIcon, title: "Port-to-Port", time: "Custom", desc: "Bulk cargo, containers, breakbulk shipping", color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navigation dark />

      {!shipmentId ? (
        <>
          {/* Hero */}
          <section className="relative overflow-hidden pt-28 pb-16 px-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-[#050d1a] to-cyan-900/20" />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 60%, rgba(56,189,248,0.3) 0%, transparent 50%)" }} />
            <div className="relative max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <Ship className="w-3.5 h-3.5" /> Global Freight & Cargo Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent leading-tight">
                Ship Anything,<br />Anywhere in the World
              </h1>
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Air freight, sea cargo, road freight, express courier — all backed by blockchain escrow and real-time tracking across 200+ countries.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {isAuthenticated ? (
                  <>
                    <Button onClick={() => navigate("/shipping?tab=create")}
                      className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold">
                      <Plus className="w-4 h-4 mr-2" /> Book a Shipment
                    </Button>
                    <Button onClick={() => navigate("/tracking")} variant="outline"
                      className="h-12 px-6 border-white/20 text-white hover:bg-white/10">
                      <Search className="w-4 h-4 mr-2" /> Track Shipment
                    </Button>
                  </>
                ) : (
                  <Link href="/login">
                    <Button className="h-12 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold">
                      Sign In to Book
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Services Grid */}
          <section className="max-w-6xl mx-auto px-4 pb-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Shipping Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {SERVICES.map(({ icon: Icon, title, time, desc, color, bg }) => (
                <Card key={title} className="bg-[#0a1628] border-white/10 hover:border-cyan-400/30 transition-all group">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-0.5">{title}</h3>
                    <p className={`text-sm font-medium mb-2 ${color}`}>{time}</p>
                    <p className="text-white/50 text-sm">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cargo categories */}
            <h2 className="text-2xl font-bold text-white text-center mb-6">Cargo Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
              {CARGO_CATEGORIES.map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="bg-[#0a1628] border-white/10 hover:border-cyan-400/30 transition-all">
                  <CardContent className="pt-5 pb-5 text-center">
                    <Icon className="w-8 h-8 text-cyan-400/70 mx-auto mb-2" />
                    <p className="text-white font-medium text-sm">{label}</p>
                    <p className="text-white/40 text-xs mt-1">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Rate calculator */}
            <div className="mb-16">
              <RateCalculator />
            </div>

            {/* Zones table */}
            <h2 className="text-2xl font-bold text-white text-center mb-6">Shipping Zones & Base Rates</h2>
            <Card className="bg-[#0a1628] border-white/10 mb-16">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white/40 text-xs uppercase tracking-wide pb-3">Zone</th>
                        <th className="text-left text-white/40 text-xs uppercase tracking-wide pb-3">Base Rate (Air)</th>
                        <th className="text-left text-white/40 text-xs uppercase tracking-wide pb-3">Countries</th>
                      </tr>
                    </thead>
                    <tbody className="space-y-2">
                      {SHIPPING_ZONES.map(z => (
                        <tr key={z.zone} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 text-white font-medium">{z.zone}</td>
                          <td className="py-3 text-cyan-400 font-semibold">${z.baseRate}/kg</td>
                          <td className="py-3 text-white/50">{z.countries}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-white/30 mt-4">*Base rates for air freight. Sea freight ×0.4, economy ×0.7. Fuel surcharges and customs duties not included.</p>
              </CardContent>
            </Card>

            {/* Management tabs — only for logged-in users */}
            {isAuthenticated && (
              <Tabs defaultValue="my-shipments" id="shipment-tabs">
                <TabsList className="bg-white/5 border border-white/10 mb-6">
                  <TabsTrigger value="my-shipments" data-testid="tab-my-shipments" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                    <Box className="w-4 h-4 mr-2" /> My Shipments
                  </TabsTrigger>
                  <TabsTrigger value="create" data-testid="tab-create-shipment" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                    <Plus className="w-4 h-4 mr-2" /> Book Shipment
                  </TabsTrigger>
                  <TabsTrigger value="calculator" data-testid="tab-calculator" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                    <Calculator className="w-4 h-4 mr-2" /> Rate Calculator
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-shipments">
                  <Card className="bg-[#0a1628] border-white/10">
                    <CardContent className="pt-6">
                      <MyShipmentsList />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="create">
                  <Card className="bg-[#0a1628] border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Book a New Shipment</CardTitle>
                      <CardDescription className="text-white/50">Register your cargo and generate a tracking number for your recipient.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CreateShipmentForm />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="calculator">
                  <RateCalculator />
                </TabsContent>
              </Tabs>
            )}

            {!isAuthenticated && (
              <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 text-center">
                <CardContent className="py-12">
                  <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Sign in to Book Shipments</h3>
                  <p className="text-white/60 mb-6">Create an account to book cargo, manage shipments, and track deliveries with escrow protection.</p>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold h-11 px-8">
                      Get Started <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : (
        <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">
          <ShipmentDetail id={shipmentId} />
        </div>
      )}

      <Footer />
    </div>
  );
}
