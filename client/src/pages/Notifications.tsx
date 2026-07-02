import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, BellOff, CheckCheck, MessageSquare, DollarSign,
  Star, UserPlus, ShieldCheck, ExternalLink, Clock, Trash2, Package, Store
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ESCROW_UPDATE:          { icon: DollarSign,    color: "text-blue-600",   bg: "bg-blue-50",   label: "Escrow" },
  MESSAGE:                { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", label: "Message" },
  REVIEW:                 { icon: Star,          color: "text-yellow-600", bg: "bg-yellow-50", label: "Review" },
  FOLLOW_REQUEST:         { icon: UserPlus,      color: "text-green-600",  bg: "bg-green-50",  label: "Follow" },
  KYC_STATUS:             { icon: ShieldCheck,   color: "text-orange-600", bg: "bg-orange-50", label: "KYC" },
  LISTING_PENDING_REVIEW: { icon: Package,       color: "text-amber-600",  bg: "bg-amber-50",  label: "Listing" },
  LISTING_SUBMITTED:      { icon: Store,         color: "text-indigo-600", bg: "bg-indigo-50", label: "Listing" },
  LISTING_APPROVED:       { icon: Package,       color: "text-green-600",  bg: "bg-green-50",  label: "Listing" },
  LISTING_REJECTED:       { icon: Package,       color: "text-red-600",    bg: "bg-red-50",    label: "Listing" },
};

function getActionLink(notification: any): string | null {
  const data = notification.data || {};
  if (notification.type === "ESCROW_UPDATE" && data.escrowId) return `/checkout/${data.escrowId}`;
  if (notification.type === "MESSAGE") return "/dashboard?tab=messages";
  if (notification.type === "REVIEW") return "/dashboard";
  if (notification.type === "FOLLOW_REQUEST") return "/dashboard?tab=social";
  if (notification.type === "KYC_STATUS") return "/kyc";
  if (notification.type === "LISTING_PENDING_REVIEW") return "/admin?tab=listings";
  if (notification.type === "LISTING_SUBMITTED" && data.listingId) return `/listing/${data.listingId}`;
  if (notification.type === "LISTING_APPROVED" && data.listingId) return `/listing/${data.listingId}`;
  if (notification.type === "LISTING_REJECTED") return "/dashboard?tab=listings";
  return null;
}

export default function Notifications() {
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Notification deleted" });
    },
  });

  const markAllRead = async () => {
    const unread = (notifications as any[]).filter((n: any) => !n.readAt);
    await Promise.all(unread.map((n: any) => apiRequest("PATCH", `/api/notifications/${n.id}/read`, {})));
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    toast({ title: "All notifications marked as read" });
  };

  const unreadCount = (notifications as any[]).filter((n: any) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" /> Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BellOff className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">No notifications yet</h3>
              <p className="text-slate-500 text-sm">You'll be notified about escrow updates, messages, and more.</p>
              <Link href="/marketplace">
                <Button className="mt-6" data-testid="button-browse-from-notifications">Browse Marketplace</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {(notifications as any[]).map((n: any) => {
              const cfg = TYPE_CONFIG[n.type] || { icon: Bell, color: "text-blue-600", bg: "bg-blue-50", label: n.type.replace(/_/g, " ") };
              const Icon = cfg.icon;
              const isUnread = !n.readAt;
              const link = getActionLink(n);
              const message = n.data?.message || n.type.replace(/_/g, " ");

              return (
                <div
                  key={n.id}
                  data-testid={`notification-${n.id}`}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    isUnread
                      ? "bg-white border-blue-100 shadow-sm"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${cfg.color} border-current bg-transparent`}>
                        {cfg.label}
                      </Badge>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className={`text-sm leading-snug ${isUnread ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                      {message}
                    </p>
                    {n.data?.listingTitle && (
                      <p className="text-xs text-slate-400 mt-0.5">"{n.data.listingTitle}"</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {link && (
                      <Link href={link}>
                        <Button size="sm" variant="outline" className="text-xs gap-1" data-testid={`button-view-notification-${n.id}`}>
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </Link>
                    )}
                    {isUnread && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="text-xs text-slate-400 hover:text-blue-600 transition-colors"
                        data-testid={`button-mark-read-${n.id}`}
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(n.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-slate-300 hover:text-red-500 transition-colors"
                      data-testid={`button-delete-notification-${n.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
