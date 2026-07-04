/**
 * TransactionGuide — contextual, role-aware step guide for buyers, sellers, and agents.
 * Shows where we are in the escrow lifecycle and exactly what each party must do next.
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, Clock, Truck, ShieldCheck, Banknote,
  AlertCircle, ArrowRight, MessageCircle, Package, DollarSign,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = {
  id: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  active: boolean;
  skipped?: boolean;
};

type GuideVariant = "buyer" | "seller" | "agent";

// ── Status label helpers ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { short: string; color: string }> = {
  CREATED:           { short: "Awaiting Payment",     color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  PAYMENT_SUBMITTED: { short: "Payment Under Review", color: "bg-blue-100 text-blue-800 border-blue-200" },
  FUNDED:            { short: "Escrow Funded",         color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  SHIPPED:           { short: "Shipped",               color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  DELIVERED:         { short: "Delivery Confirmed",    color: "bg-purple-100 text-purple-800 border-purple-200" },
  RELEASED:          { short: "Complete",              color: "bg-green-100 text-green-800 border-green-200" },
  DISPUTED:          { short: "In Dispute",            color: "bg-red-100 text-red-800 border-red-200" },
  CANCELLED:         { short: "Cancelled",             color: "bg-slate-100 text-slate-600 border-slate-200" },
  REFUNDED:          { short: "Refunded",              color: "bg-orange-100 text-orange-800 border-orange-200" },
};

// ── Per-role action messages ───────────────────────────────────────────────────

type ActionInfo = {
  title: string;
  description: string;
  cta?: string;
  ctaLink?: string;
  ctaVariant?: "default" | "outline" | "destructive";
  urgent?: boolean;
};

function getActionForBuyer(status: string, escrowId: string, physicallyDelivered?: boolean): ActionInfo {
  switch (status) {
    case "CREATED":
      return { title: "Complete your payment", description: "Submit your payment and upload proof to fund the escrow.", cta: "Go to Checkout", ctaLink: `/checkout/${escrowId}`, urgent: true };
    case "PAYMENT_SUBMITTED":
      return { title: "Payment is being verified", description: "Our team is reviewing your payment receipt. You'll be notified once approved — usually within 1–24 hrs." };
    case "FUNDED":
      return { title: "Waiting for the seller to ship", description: "The escrow is funded. The seller will ship your order and update the tracking number." };
    case "SHIPPED":
      return physicallyDelivered
        ? { title: "Your package has arrived — confirm receipt", description: "The courier marked this as delivered. Check your item and confirm receipt to release payment to the seller.", cta: "Confirm Delivery", ctaLink: `/checkout/${escrowId}`, urgent: true }
        : { title: "Confirm you received the item", description: "Your order is on its way. Once it arrives, confirm receipt to release payment to the seller.", cta: "Track & Confirm", ctaLink: `/checkout/${escrowId}`, urgent: true };
    case "DELIVERED":
      return { title: "You confirmed delivery ✓", description: "Funds will be released to the seller once they submit a payout request and admin approves." };
    case "RELEASED":
      return { title: "Transaction complete 🎉", description: "Funds have been released to the seller. Thank you for trading on Beagvs!" };
    case "DISPUTED":
      return { title: "Dispute in progress", description: "Our team is reviewing the dispute. Please check your messages for updates.", cta: "Open Chat", ctaLink: "/chat", urgent: true };
    default:
      return { title: status, description: "" };
  }
}

function getActionForSeller(status: string, escrowId: string, physicallyDelivered?: boolean): ActionInfo {
  switch (status) {
    case "CREATED":
      return { title: "Waiting for buyer payment", description: "The buyer needs to submit their payment. You'll be notified when they do." };
    case "PAYMENT_SUBMITTED":
      return { title: "Admin is verifying payment", description: "Payment has been submitted by the buyer. Our team is reviewing it — you'll be notified once funds are secured." };
    case "FUNDED":
      return { title: "Ship the order now", description: "Payment is secured in escrow. Fulfil and ship the order, then mark it as shipped.", cta: "Mark as Shipped", ctaLink: `/checkout/${escrowId}`, urgent: true };
    case "SHIPPED":
      return physicallyDelivered
        ? { title: "Package delivered — awaiting buyer confirmation", description: "The courier delivered the package. The buyer still needs to confirm receipt before funds are released to you." }
        : { title: "Waiting for buyer to confirm receipt", description: "The order is shipped. The buyer must confirm delivery before funds are released to you." };
    case "DELIVERED":
      return { title: "Request your payout", description: "The buyer confirmed receipt. Add your payout account (if you haven't) and submit your payout request.", cta: "Request Payout", ctaLink: `/checkout/${escrowId}`, urgent: true };
    case "RELEASED":
      return { title: "Funds released to you 🎉", description: "The escrow is complete. Check your payout requests for payment status.", cta: "View Payouts", ctaLink: "/dashboard?tab=payouts" };
    case "DISPUTED":
      return { title: "Dispute in progress", description: "Our team is reviewing the dispute. Check your messages.", cta: "Open Chat", ctaLink: "/chat", urgent: true };
    default:
      return { title: status, description: "" };
  }
}

function getActionForAgent(status: string): ActionInfo {
  switch (status) {
    case "FUNDED":
      return { title: "Awaiting pickup", description: "This order is funded and waiting for the seller to hand off the package for shipping." };
    case "SHIPPED":
      return { title: "Deliver this package", description: "Update the shipment status as you move the package — pick up, in transit, out for delivery — then mark it delivered once handed to the buyer.", cta: "Open Deliveries", ctaLink: "/delivery-agent", urgent: true };
    case "DELIVERED":
      return { title: "Delivery complete ✓", description: "You've marked this package as delivered. Waiting on the buyer to confirm receipt." };
    case "RELEASED":
      return { title: "Order complete 🎉", description: "This transaction has been completed and funds released." };
    default:
      return { title: status, description: "" };
  }
}

// ── Step builder ──────────────────────────────────────────────────────────────

function buildSteps(status: string, role: GuideVariant): Step[] {
  const ORDER = ["CREATED", "PAYMENT_SUBMITTED", "FUNDED", "SHIPPED", "DELIVERED", "RELEASED"];
  const idx = ORDER.indexOf(status);

  const definitions: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "CREATED",           label: "Payment Initiated",     icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: "PAYMENT_SUBMITTED", label: "Payment Verified",      icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: "FUNDED",            label: "Escrow Funded",         icon: <Package className="w-3.5 h-3.5" /> },
    { id: "SHIPPED",           label: "Order Shipped",         icon: <Truck className="w-3.5 h-3.5" /> },
    { id: "DELIVERED",         label: "Delivery Confirmed",    icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: "RELEASED",          label: "Funds Released",        icon: <Banknote className="w-3.5 h-3.5" /> },
  ];

  return definitions.map((d, i) => ({
    ...d,
    done: i < idx,
    active: i === idx,
    skipped: false,
  }));
}

// ── Main component ─────────────────────────────────────────────────────────────

type TransactionGuideProps = {
  escrow: any;
  userId: string;
  compact?: boolean;
  className?: string;
};

export default function TransactionGuide({ escrow, userId, compact = false, className = "" }: TransactionGuideProps) {
  if (!escrow) return null;

  const role: GuideVariant =
    escrow.buyerId === userId ? "buyer" :
    escrow.sellerId === userId ? "seller" : "agent";

  const status: string = escrow.status ?? "CREATED";
  const physicallyDelivered = !!(escrow.metadata as any)?.physicallyDelivered;
  const steps = buildSteps(status, role);
  const action =
    role === "buyer" ? getActionForBuyer(status, escrow.id, physicallyDelivered) :
    role === "seller" ? getActionForSeller(status, escrow.id, physicallyDelivered) :
    getActionForAgent(status);
  const statusMeta = STATUS_LABELS[status] ?? { short: status, color: "bg-slate-100 text-slate-600 border-slate-200" };
  const isTerminal = ["RELEASED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(status);
  const listingTitle = escrow.listing?.title ?? "Your Transaction";

  if (compact) {
    return (
      <div className={`rounded-xl border p-3 bg-white ${action.urgent ? "border-orange-300 bg-orange-50" : "border-slate-200"} ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${action.urgent ? "bg-orange-100" : "bg-slate-100"}`}>
            {action.urgent ? <AlertCircle className="w-4 h-4 text-orange-600" /> : <Clock className="w-4 h-4 text-slate-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-slate-900 text-sm truncate">{listingTitle}</p>
              <Badge className={`text-xs border flex-shrink-0 ${statusMeta.color}`}>{statusMeta.short}</Badge>
            </div>
            <p className="text-xs text-slate-600 font-medium">{action.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{action.description}</p>
          </div>
          {action.cta && action.ctaLink && (
            <Link href={action.ctaLink}>
              <Button size="sm" className={`flex-shrink-0 text-xs h-7 ${action.urgent ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}`} variant={action.urgent ? "default" : "outline"}>
                {action.cta} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white ${action.urgent ? "border-orange-200" : "border-slate-200"} overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between gap-2 ${action.urgent ? "bg-orange-50 border-b border-orange-100" : "bg-slate-50 border-b border-slate-100"}`}>
        <div className="flex items-center gap-2 min-w-0">
          {action.urgent && <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />}
          <p className="font-semibold text-slate-900 text-sm truncate">{listingTitle}</p>
        </div>
        <Badge className={`text-xs border flex-shrink-0 ${statusMeta.color}`}>{statusMeta.short}</Badge>
      </div>

      {/* Step progress bar */}
      {!isTerminal && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  step.done ? "bg-emerald-500 text-white" :
                  step.active ? "bg-blue-600 text-white ring-2 ring-blue-200" :
                  "bg-slate-200 text-slate-400"
                }`}>
                  {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-0.5 ${step.done ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-0 mt-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <span className={`text-[9px] leading-tight text-center w-6 flex-shrink-0 ${step.active ? "text-blue-600 font-semibold" : step.done ? "text-emerald-600" : "text-slate-400"}`}>
                  {step.label.split(" ")[0]}
                </span>
                {i < steps.length - 1 && <div className="flex-1" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="px-4 py-3 border-t border-slate-100">
        <p className="font-semibold text-slate-900 text-sm mb-1">{action.title}</p>
        <p className="text-xs text-slate-500 mb-3">{action.description}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {action.cta && action.ctaLink && (
            <Link href={action.ctaLink}>
              <Button size="sm" className={`text-xs h-7 ${action.urgent ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                {action.cta} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          )}
          {escrow.listingId && (
            <Link href={`/chat/${escrow.listingId}`}>
              <Button size="sm" variant="outline" className="text-xs h-7">
                <MessageCircle className="w-3 h-3 mr-1" /> Chat
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ActiveOrdersPanel — dashboard overview widget ─────────────────────────────

type ActiveOrdersPanelProps = {
  escrows: any[];
  userId: string;
};

export function ActiveOrdersPanel({ escrows, userId }: ActiveOrdersPanelProps) {
  const active = escrows.filter(e => !["RELEASED", "CANCELLED", "REFUNDED"].includes(e.status));
  const urgent = active.filter(e => {
    const isBuyer = e.buyerId === userId;
    const isSeller = e.sellerId === userId;
    return (
      (isBuyer && ["CREATED", "SHIPPED"].includes(e.status)) ||
      (isSeller && ["FUNDED", "DELIVERED"].includes(e.status))
    );
  });

  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      {urgent.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <p className="font-semibold text-orange-700 text-sm">Action Required ({urgent.length})</p>
        </div>
      )}
      {urgent.map(e => (
        <TransactionGuide key={e.id} escrow={e} userId={userId} compact />
      ))}
      {active.filter(e => !urgent.includes(e)).length > 0 && (
        <>
          {urgent.length > 0 && <p className="text-xs text-slate-400 font-medium pt-1">Other Active Orders</p>}
          {active.filter(e => !urgent.includes(e)).map(e => (
            <TransactionGuide key={e.id} escrow={e} userId={userId} compact />
          ))}
        </>
      )}
    </div>
  );
}
