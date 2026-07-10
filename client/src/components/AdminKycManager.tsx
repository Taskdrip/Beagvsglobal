import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, CheckCircle, XCircle, Clock, AlertCircle,
  Search, Loader2, User, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

const STATUS_CFG: Record<string, { color: string; label: string; icon: any }> = {
  NOT_STARTED: { color: "bg-slate-100 text-slate-600 border-slate-200",   label: "Not Started",   icon: AlertCircle },
  PENDING:     { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending",       icon: Clock },
  UNDER_REVIEW:{ color: "bg-blue-100 text-blue-800 border-blue-200",      label: "Under Review",  icon: Clock },
  APPROVED:    { color: "bg-green-100 text-green-800 border-green-200",   label: "Approved ✓",    icon: CheckCircle },
  REJECTED:    { color: "bg-red-100 text-red-800 border-red-200",         label: "Rejected",      icon: XCircle },
};

export default function AdminKycManager() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<Record<string, { status: string; reason: string }>>({});

  const { data: applications = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/kyc-applications"],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userId, status, rejectionReason }: { userId: string; status: string; rejectionReason?: string }) =>
      apiRequest("PATCH", `/api/admin/kyc/${userId}`, { status, rejectionReason }),
    onSuccess: (_res, vars) => {
      toast({
        title: vars.status === "APPROVED" ? "KYC Approved ✓" : "KYC Rejected",
        description: `The user has been notified.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-applications"] });
      setExpandedId(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const pendingCount = (applications as any[]).filter((a: any) => a.kycStatus === "UNDER_REVIEW").length;

  const filtered = (applications as any[])
    .filter((a: any) => {
      if (statusFilter !== "ALL" && a.kycStatus !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.username?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) ||
               a.firstName?.toLowerCase().includes(q) || a.lastName?.toLowerCase().includes(q);
      }
      return true;
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            KYC Applications
            {pendingCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{pendingCount} pending</Badge>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Review and approve identity verification submissions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "UNDER_REVIEW", "APPROVED", "REJECTED"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s === "UNDER_REVIEW" ? "Pending Review" : s}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <Loader2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by username, email or name…"
          className="pl-9 text-sm"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No KYC applications {statusFilter !== "ALL" ? `with status "${statusFilter}"` : "found"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => {
            const cfg = STATUS_CFG[app.kycStatus] ?? STATUS_CFG.NOT_STARTED;
            const Icon = cfg.icon;
            const isExpanded = expandedId === app.id;
            const form = reviewForm[app.id] ?? { status: "", reason: "" };

            return (
              <Card
                key={app.id}
                className={`border transition-all ${app.kycStatus === "UNDER_REVIEW" ? "border-blue-200 bg-blue-50/30" : "border-slate-200"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* User info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(app.firstName?.[0] || app.username?.[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-semibold text-slate-900 text-sm">{app.username || "—"}</span>
                          <Badge className={`text-xs border ${cfg.color}`}>
                            <Icon className="w-3 h-3 mr-1" />{cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{app.email || "No email"}</p>
                        {app.firstName && (
                          <p className="text-xs text-slate-400">{app.firstName} {app.lastName || ""}</p>
                        )}
                        {app.kycSubmittedAt && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Submitted: {new Date(app.kycSubmittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {app.kycApprovedAt && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Approved: {new Date(app.kycApprovedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {app.kycRejectedAt && (
                          <p className="text-xs text-red-600 mt-0.5">
                            Rejected: {new Date(app.kycRejectedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {app.kycRejectionReason && ` — ${app.kycRejectionReason}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {app.kycStatus === "UNDER_REVIEW" && (
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="text-xs h-8"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Review
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                      </div>
                    )}
                    {app.kycStatus === "APPROVED" && (
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="text-xs h-8 text-red-600 hover:bg-red-50"
                        >
                          Revoke
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Review panel */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-3">
                      <p className="text-sm font-medium text-slate-700">
                        {app.kycStatus === "APPROVED" ? "Revoke KYC approval?" : "Review KYC submission for"} <strong>{app.username || app.email}</strong>
                      </p>

                      {app.kycStatus !== "APPROVED" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs flex-1"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({ userId: app.id, status: "APPROVED" })}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-red-200 text-red-700 hover:bg-red-50 flex-1"
                            disabled={reviewMutation.isPending}
                            onClick={() => {
                              if (!form.reason.trim()) {
                                toast({ title: "Please provide a rejection reason", variant: "destructive" });
                                return;
                              }
                              reviewMutation.mutate({ userId: app.id, status: "REJECTED", rejectionReason: form.reason });
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">
                          {app.kycStatus === "APPROVED" ? "Revocation reason (required)" : "Rejection reason (required for reject)"}
                        </label>
                        <Textarea
                          rows={2}
                          className="text-sm"
                          placeholder="e.g. Document unclear, please resubmit with a better photo"
                          value={form.reason}
                          onChange={e => setReviewForm(prev => ({ ...prev, [app.id]: { ...form, reason: e.target.value } }))}
                        />
                      </div>

                      {app.kycStatus === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-red-200 text-red-700 hover:bg-red-50 w-full"
                          disabled={reviewMutation.isPending || !form.reason.trim()}
                          onClick={() => reviewMutation.mutate({ userId: app.id, status: "REJECTED", rejectionReason: form.reason })}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Revoke Approval
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-slate-400 w-full"
                        onClick={() => setExpandedId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
