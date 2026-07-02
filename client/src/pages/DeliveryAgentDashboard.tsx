import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package, Truck, CheckCircle2, Clock, MapPin,
  AlertCircle, LogOut, User2, RefreshCw, ChevronRight,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

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
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800 border-cyan-200",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800 border-purple-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  RETURNED: "bg-orange-100 text-orange-800 border-orange-200",
};

/** The next logical status transitions an agent can make */
const NEXT_STATUS: Record<string, { status: string; label: string; color: string }[]> = {
  PENDING: [{ status: "PICKED_UP", label: "Mark as Picked Up", color: "bg-blue-600 hover:bg-blue-700" }],
  PICKED_UP: [
    { status: "IN_TRANSIT", label: "Mark In Transit", color: "bg-cyan-600 hover:bg-cyan-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  IN_TRANSIT: [
    { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", color: "bg-purple-600 hover:bg-purple-700" },
    { status: "FAILED", label: "Report Failed", color: "bg-red-500 hover:bg-red-600" },
  ],
  OUT_FOR_DELIVERY: [
    { status: "DELIVERED", label: "Confirm Delivered", color: "bg-green-600 hover:bg-green-700" },
    { status: "FAILED", label: "Delivery Failed", color: "bg-red-500 hover:bg-red-600" },
    { status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  FAILED: [{ status: "RETURNED", label: "Return to Sender", color: "bg-orange-500 hover:bg-orange-600" }],
  DELIVERED: [],
  RETURNED: [],
};

// ── component ─────────────────────────────────────────────────────────────────

export default function DeliveryAgentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: shipments = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/agent/shipments"],
    enabled: !!user,
    refetchInterval: 30_000, // auto-refresh every 30 s
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ shipmentId, status, location }: { shipmentId: string; status: string; location?: string }) =>
      apiRequest("POST", `/api/agent/shipments/${shipmentId}/status`, { status, location }),
    onSuccess: () => {
      toast({ title: "Status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/agent/shipments"] });
    },
    onError: (err: any) => toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    setLocation("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || (user as any).role !== "DELIVERY_AGENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-sm w-full mx-4">
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

  // Summary stats
  const total = shipments.length;
  const pending = shipments.filter((s: any) => s.status === "PENDING").length;
  const active = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length;
  const delivered = shipments.filter((s: any) => s.status === "DELIVERED").length;

  const pendingShipments = shipments.filter((s: any) => s.status === "PENDING");
  const activeShipments = shipments.filter((s: any) => ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status));
  const completedShipments = shipments.filter((s: any) => ["DELIVERED", "FAILED", "RETURNED"].includes(s.status));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 leading-tight">Agent Portal</p>
              <p className="text-xs text-slate-500 leading-tight">
                {(user as any).firstName || (user as any).username || (user as any).email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-slate-500 hover:text-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Assigned", value: total, icon: Package, color: "text-slate-600", bg: "bg-slate-100" },
            { label: "Awaiting Pickup", value: pending, icon: Clock, color: "text-yellow-700", bg: "bg-yellow-50" },
            { label: "In Progress", value: active, icon: Truck, color: "text-blue-700", bg: "bg-blue-50" },
            { label: "Delivered", value: delivered, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500 leading-tight">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Loading your shipments…</p>
          </div>
        ) : shipments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-14">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No shipments assigned yet</p>
              <p className="text-slate-400 text-sm mt-1">You'll be notified when a delivery is assigned to you.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Awaiting Pickup */}
            {pendingShipments.length > 0 && (
              <ShipmentSection
                title="Awaiting Pickup"
                icon={<Clock className="w-4 h-4 text-yellow-600" />}
                shipments={pendingShipments}
                onUpdateStatus={updateStatusMutation.mutate}
                isUpdating={updateStatusMutation.isPending}
              />
            )}

            {/* Active Deliveries */}
            {activeShipments.length > 0 && (
              <ShipmentSection
                title="Active Deliveries"
                icon={<Truck className="w-4 h-4 text-blue-600" />}
                shipments={activeShipments}
                onUpdateStatus={updateStatusMutation.mutate}
                isUpdating={updateStatusMutation.isPending}
              />
            )}

            {/* Completed */}
            {completedShipments.length > 0 && (
              <ShipmentSection
                title="Completed"
                icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                shipments={completedShipments}
                onUpdateStatus={updateStatusMutation.mutate}
                isUpdating={updateStatusMutation.isPending}
                muted
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 bg-white">
        Beagvs Global · Delivery Agent Portal
      </footer>
    </div>
  );
}

// ── ShipmentSection ───────────────────────────────────────────────────────────

function ShipmentSection({
  title,
  icon,
  shipments,
  onUpdateStatus,
  isUpdating,
  muted = false,
}: {
  title: string;
  icon: React.ReactNode;
  shipments: any[];
  onUpdateStatus: (args: { shipmentId: string; status: string }) => void;
  isUpdating: boolean;
  muted?: boolean;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className={`font-semibold text-sm ${muted ? "text-slate-400" : "text-slate-700"}`}>{title}</h2>
        <Badge variant="secondary" className="text-xs">{shipments.length}</Badge>
      </div>
      <div className="space-y-3">
        {shipments.map((s) => (
          <ShipmentCard
            key={s.id}
            shipment={s}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
            muted={muted}
          />
        ))}
      </div>
    </section>
  );
}

// ── ShipmentCard ──────────────────────────────────────────────────────────────

function ShipmentCard({
  shipment: s,
  onUpdateStatus,
  isUpdating,
  muted,
}: {
  shipment: any;
  onUpdateStatus: (args: { shipmentId: string; status: string }) => void;
  isUpdating: boolean;
  muted: boolean;
}) {
  const actions = NEXT_STATUS[s.status] ?? [];

  return (
    <Card className={`border shadow-sm transition-shadow hover:shadow-md ${muted ? "opacity-70" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {/* Tracking + status */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</span>
              <Badge className={`text-xs border ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {STATUS_LABELS[s.status] || s.status}
              </Badge>
            </div>

            {/* Route */}
            {(s.origin || s.destination) && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {s.origin && s.destination
                    ? `${s.origin} → ${s.destination}`
                    : s.origin || s.destination}
                </span>
              </div>
            )}

            {/* Recipient */}
            {s.recipientName && (
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                <User2 className="w-3 h-3 flex-shrink-0" />
                <span>{s.recipientName}{s.recipientPhone ? ` · ${s.recipientPhone}` : ""}</span>
              </div>
            )}

            {/* Carrier + weight */}
            <p className="text-xs text-slate-400">
              {s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}
              {s.weightKg ? ` · ${s.weightKg} kg` : ""}
            </p>

            {/* Special instructions */}
            {s.specialInstructions && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-2 border border-amber-100">
                ⚠ {s.specialInstructions}
              </p>
            )}

            {/* Latest event */}
            {s.events?.length > 0 && (
              <p className="text-xs text-slate-400 mt-1.5 italic">
                Last update: {s.events[0].description}
              </p>
            )}
          </div>

          {/* Action buttons — primary action + secondary (FAILED/RETURNED) */}
          {actions.length > 0 && (
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  size="sm"
                  className={`text-xs text-white ${action.color}`}
                  disabled={isUpdating}
                  onClick={() => onUpdateStatus({ shipmentId: s.id, status: action.status })}
                >
                  {action.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
