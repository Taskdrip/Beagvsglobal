import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
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
  Plus, RotateCcw, Plane, Globe, Box, FileText, Send, Loader2
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

const CARRIERS = ["FedEx", "UPS", "DHL", "USPS", "TNT", "Aramex", "EMS", "PiShip", "Local Courier", "Other"];
const SERVICE_TYPES = ["Express", "Standard", "Economy", "Overnight", "Same Day", "International Priority"];

// ── Create shipment form schema ──────────────────────────────────────────────
const createShipmentSchema = z.object({
  trackingNumber: z.string().min(4, "Tracking number required"),
  carrier: z.string().min(1, "Carrier required"),
  serviceType: z.string().optional(),
  origin: z.string().optional(),
  originCountry: z.string().optional(),
  destination: z.string().optional(),
  destinationCountry: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  weightKg: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  specialInstructions: z.string().optional(),
  buyerId: z.string().optional(),
  escrowId: z.string().optional(),
});

// ── Add event form schema ────────────────────────────────────────────────────
const addEventSchema = z.object({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']),
  description: z.string().min(3, "Description required"),
  location: z.string().optional(),
  country: z.string().optional(),
});

// ─── Create Shipment Form ────────────────────────────────────────────────────
function CreateShipmentForm({ escrowId, buyerId }: { escrowId?: string; buyerId?: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof createShipmentSchema>>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      trackingNumber: "",
      carrier: "",
      serviceType: "",
      origin: "",
      originCountry: "",
      destination: "",
      destinationCountry: "",
      recipientName: "",
      recipientPhone: "",
      weightKg: "",
      estimatedDelivery: "",
      specialInstructions: "",
      buyerId: buyerId ?? "",
      escrowId: escrowId ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof createShipmentSchema>) => {
      const payload: any = { ...values };
      if (values.weightKg) payload.weightKg = parseFloat(values.weightKg);
      if (values.estimatedDelivery) payload.estimatedDelivery = new Date(values.estimatedDelivery).toISOString();
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="trackingNumber" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Tracking Number *</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-tracking-number" placeholder="BGV-1234567890"
                  className="bg-white/5 border-white/15 text-white uppercase tracking-widest" />
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
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="estimatedDelivery" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Estimated Delivery Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <Separator className="bg-white/10" />
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Route Details</p>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="origin" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Origin City</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Lagos" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="originCountry" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Origin Country</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nigeria" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="destination" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Destination City</FormLabel>
              <FormControl>
                <Input {...field} placeholder="London" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="destinationCountry" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Destination Country</FormLabel>
              <FormControl>
                <Input {...field} placeholder="United Kingdom" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <Separator className="bg-white/10" />
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Package & Recipient</p>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField control={form.control} name="recipientName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Recipient Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="John Doe" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="recipientPhone" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Recipient Phone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="+1 555 000 0000" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="weightKg" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Weight (kg)</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.001" placeholder="2.500" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          {!escrowId && (
            <FormField control={form.control} name="buyerId" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/70">Buyer ID (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Buyer user ID" className="bg-white/5 border-white/15 text-white" />
                </FormControl>
              </FormItem>
            )} />
          )}
        </div>

        <FormField control={form.control} name="specialInstructions" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Special Instructions</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Fragile, handle with care…" rows={3}
                className="bg-white/5 border-white/15 text-white resize-none" />
            </FormControl>
          </FormItem>
        )} />

        <Button
          type="submit"
          data-testid="button-create-shipment"
          disabled={mutation.isPending}
          className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Create Shipment & Assign Tracking
        </Button>
      </form>
    </Form>
  );
}

// ─── Add Event Form ──────────────────────────────────────────────────────────
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
      toast({ title: "Tracking event added" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments", shipmentId] });
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: "Failed to add event", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Status *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-event-status" className="bg-white/5 border-white/15 text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#0a1628] border-white/15 text-white">
                  {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Location</FormLabel>
              <FormControl>
                <Input {...field} placeholder="London Heathrow Hub" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="country" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Country</FormLabel>
              <FormControl>
                <Input {...field} placeholder="United Kingdom" className="bg-white/5 border-white/15 text-white" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/70">Description *</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Package arrived at sorting facility…" rows={2}
                data-testid="input-event-description"
                className="bg-white/5 border-white/15 text-white resize-none" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button
          type="submit"
          data-testid="button-add-event"
          disabled={mutation.isPending}
          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/20 hover:border-cyan-400/40"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Add Tracking Update
        </Button>
      </form>
    </Form>
  );
}

// ─── Shipment Detail Page ────────────────────────────────────────────────────
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

  if (!shipment) return (
    <div className="text-center py-20">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
      <p className="text-white/60">Shipment not found.</p>
    </div>
  );

  const cfg = STATUS_CONFIG[shipment.status as ShipmentStatus];
  const StatusIcon = cfg.icon;
  const isSeller = user?.id === shipment.sellerId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
          </div>
          <h2 className="text-2xl font-bold text-white font-mono">{shipment.trackingNumber}</h2>
          <p className="text-white/50">{shipment.carrier}{shipment.serviceType ? ` · ${shipment.serviceType}` : ""}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/tracking?q=${shipment.trackingNumber}`)}
          className="border-white/20 text-white/70 hover:text-white"
        >
          <Globe className="w-4 h-4 mr-2" /> Public Tracking Page
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Shipment info */}
        <Card className="md:col-span-2 bg-[#0a1628] border-white/10">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "From", value: shipment.origin ? `${shipment.origin}${shipment.originCountry ? `, ${shipment.originCountry}` : ""}` : "—" },
                { label: "To", value: shipment.destination ? `${shipment.destination}${shipment.destinationCountry ? `, ${shipment.destinationCountry}` : ""}` : "—" },
                { label: "Recipient", value: shipment.recipientName || "—" },
                { label: "Phone", value: shipment.recipientPhone || "—" },
                { label: "Weight", value: shipment.weightKg ? `${shipment.weightKg} kg` : "—" },
                { label: "Est. Delivery", value: shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), "MMM d, yyyy") : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-white font-medium">{value}</p>
                </div>
              ))}
            </div>

            {shipment.specialInstructions && (
              <>
                <Separator className="bg-white/10" />
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Special Instructions</p>
                  <p className="text-white/70 text-sm">{shipment.specialInstructions}</p>
                </div>
              </>
            )}

            {shipment.escrowId && (
              <>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-xs uppercase tracking-wide">Linked Escrow</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/checkout/${shipment.escrowId}`)}
                    className="text-cyan-400 hover:text-cyan-300 text-xs"
                  >
                    View Escrow →
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Seller: add event */}
        {isSeller && (
          <Card className="bg-[#0a1628] border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">Add Tracking Update</CardTitle>
            </CardHeader>
            <CardContent>
              <AddEventForm shipmentId={id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Event timeline */}
      <Card className="bg-[#0a1628] border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/60 uppercase tracking-wide font-medium">
            Tracking History ({shipment.events?.length || 0} events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!shipment.events?.length ? (
            <p className="text-white/40 text-sm text-center py-6">No tracking events yet.</p>
          ) : (
            <div className="space-y-3">
              {shipment.events.map((ev: any) => {
                const evCfg = STATUS_CONFIG[ev.status as ShipmentStatus] ?? STATUS_CONFIG.IN_TRANSIT;
                const EvIcon = evCfg.icon;
                return (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${evCfg.bg}`}>
                      <EvIcon className={`w-4 h-4 ${evCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${evCfg.color}`}>{evCfg.label}</span>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── My Shipments List ───────────────────────────────────────────────────────
function MyShipmentsList() {
  const [, navigate] = useLocation();
  const { data: myShipments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/shipments/me"],
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  if (!myShipments?.length) return (
    <div className="text-center py-16">
      <Box className="w-12 h-12 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">No Shipments Yet</h3>
      <p className="text-white/50 text-sm">Shipments you send or receive will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {myShipments.map((s: any) => {
        const cfg = STATUS_CONFIG[s.status as ShipmentStatus];
        const Icon = cfg.icon;
        return (
          <div
            key={s.id}
            data-testid={`card-shipment-${s.id}`}
            onClick={() => navigate(`/shipments/${s.id}`)}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-400/30 hover:bg-white/8 cursor-pointer transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-white text-sm">{s.trackingNumber}</span>
                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
              </div>
              <p className="text-white/50 text-xs mt-0.5">
                {s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}
                {s.origin ? ` · From ${s.origin}` : ""}
                {s.destination ? ` → ${s.destination}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-white/30">
                {s.estimatedDelivery ? format(new Date(s.estimatedDelivery), "MMM d") : "No ETA"}
              </p>
              <p className="text-xs text-cyan-400 mt-1">View →</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ShipmentManagement() {
  const [matchDetail, paramsDetail] = useRoute("/shipments/:id");
  const [, navigate] = useLocation();

  const shipmentId = paramsDetail?.id;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navigation dark />

      <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">
        {/* Back button when viewing detail */}
        {matchDetail && shipmentId && (
          <Button
            variant="ghost"
            onClick={() => navigate("/shipments")}
            className="mb-6 text-white/60 hover:text-white -ml-2"
            data-testid="button-back-shipments"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> All Shipments
          </Button>
        )}

        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Truck className="w-3.5 h-3.5" /> Shipping Management
          </div>
          <h1 className="text-3xl font-bold text-white">
            {matchDetail && shipmentId ? "Shipment Detail" : "My Shipments"}
          </h1>
          <p className="text-white/50 mt-1">
            {matchDetail && shipmentId
              ? "View and update tracking information for this shipment."
              : "Manage all your inbound and outbound shipments."}
          </p>
        </div>

        {/* Detail view */}
        {matchDetail && shipmentId ? (
          <ShipmentDetail id={shipmentId} />
        ) : (
          /* List + create */
          <Tabs defaultValue="my-shipments">
            <TabsList className="bg-white/5 border border-white/10 mb-6">
              <TabsTrigger value="my-shipments" data-testid="tab-my-shipments" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <Box className="w-4 h-4 mr-2" /> My Shipments
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-shipment" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                <Plus className="w-4 h-4 mr-2" /> Create Shipment
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
                  <CardTitle className="text-white">Create New Shipment</CardTitle>
                  <CardDescription className="text-white/50">
                    Register a shipment and generate a tracking number for your buyer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateShipmentForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
