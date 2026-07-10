import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, CheckCircle, XCircle, Clock, AlertCircle,
  Search, Loader2, Eye, FileText, Camera, MessageSquare,
  Bell, ExternalLink, ChevronRight, User, Globe, Hash, Calendar,
  ZoomIn,
} from "lucide-react";

const STATUS_CFG: Record<string, { color: string; label: string; icon: any }> = {
  NOT_STARTED: { color: "bg-slate-100 text-slate-600 border-slate-200",   label: "Not Started",   icon: AlertCircle },
  PENDING:     { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending",       icon: Clock },
  UNDER_REVIEW:{ color: "bg-blue-100 text-blue-800 border-blue-200",      label: "Under Review",  icon: Clock },
  APPROVED:    { color: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Approved ✓", icon: CheckCircle },
  REJECTED:    { color: "bg-red-100 text-red-800 border-red-200",         label: "Rejected",      icon: XCircle },
};

const DOC_LABELS: Record<string, string> = {
  DRIVERS_LICENSE: "Driver's License",
  INTERNATIONAL_PASSPORT: "International Passport",
  NATIONAL_ID: "National ID Card",
  VOTER_ID: "Voter ID Card",
};

function ImagePreview({ url, label }: { url: string; label: string }) {
  const [enlarged, setEnlarged] = useState(false);
  const isPdf = url?.toLowerCase().endsWith(".pdf");

  if (!url) return (
    <div className="w-full h-36 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
      <p className="text-xs text-slate-400">No {label} uploaded</p>
    </div>
  );

  if (isPdf) return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-sm text-blue-600"
    >
      <FileText className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{label} (PDF)</span>
      <ExternalLink className="w-4 h-4 ml-auto flex-shrink-0" />
    </a>
  );

  return (
    <>
      <div
        className="relative group cursor-zoom-in rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
        onClick={() => setEnlarged(true)}
      >
        <img
          src={url}
          alt={label}
          className="w-full h-40 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">{label}</p>
      </div>

      {enlarged && (
        <Dialog open onOpenChange={() => setEnlarged(false)}>
          <DialogContent className="max-w-3xl p-2">
            <img src={url} alt={label} className="w-full rounded" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default function AdminKycManager() {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("UNDER_REVIEW");
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [activeTab, setActiveTab] = useState("documents");

  const { data: applications = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/admin/kyc-applications"],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userId, status, rejectionReason }: { userId: string; status: string; rejectionReason?: string }) =>
      apiRequest("PATCH", `/api/admin/kyc/${userId}`, { status, rejectionReason }),
    onSuccess: (_res, vars) => {
      toast({
        title: vars.status === "APPROVED" ? "KYC Approved ✓" : "KYC Rejected",
        description: "The user has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc-applications"] });
      setSelected(null);
      setRejectReason("");
    },
    onError: (e: any) => toast({ title: "Action failed", description: e.message, variant: "destructive" }),
  });

  const notifyMutation = useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      apiRequest("POST", `/api/admin/kyc/${userId}/notify`, { message }),
    onSuccess: () => {
      toast({ title: "Notification sent", description: "The user has received your message." });
      setNotifyMsg("");
    },
    onError: (e: any) => toast({ title: "Failed to send", description: e.message, variant: "destructive" }),
  });

  const chatMutation = useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      apiRequest("POST", `/api/admin/kyc/${userId}/start-chat`, { message }),
    onSuccess: (res) => {
      res.json().then((data: any) => {
        toast({ title: "Chat opened", description: "Message sent. You can continue in Messages." });
        setChatMsg("");
      });
    },
    onError: (e: any) => toast({ title: "Failed to start chat", description: e.message, variant: "destructive" }),
  });

  const pendingCount = (applications as any[]).filter((a: any) => a.kycStatus === "UNDER_REVIEW").length;

  const filtered = (applications as any[]).filter((a: any) => {
    if (statusFilter !== "ALL" && a.kycStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.username?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.firstName?.toLowerCase().includes(q) ||
        a.lastName?.toLowerCase().includes(q)
      );
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
              <Badge className="bg-red-500 text-white text-xs ml-1">{pendingCount} pending</Badge>
            )}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Review identity verification submissions</p>
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
              {s === "UNDER_REVIEW" ? "Pending Review" : s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 w-8 p-0">
            <Loader2 className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
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
            <p className="text-slate-500">No KYC applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((app: any) => {
            const cfg = STATUS_CFG[app.kycStatus] ?? STATUS_CFG.NOT_STARTED;
            const Icon = cfg.icon;
            return (
              <Card
                key={app.id}
                className={`border transition-all hover:shadow-sm ${
                  app.kycStatus === "UNDER_REVIEW" ? "border-blue-200 bg-blue-50/30" : "border-slate-200"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(app.firstName?.[0] || app.username?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{app.username || "—"}</span>
                        <Badge className={`text-xs border ${cfg.color}`}>
                          <Icon className="w-3 h-3 mr-1" />{cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{app.email || "No email"}</p>
                      {app.kycSubmittedAt && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Submitted {new Date(app.kycSubmittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex gap-2">
                      {app.kycStatus === "UNDER_REVIEW" && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
                          onClick={() => { setSelected(app); setActiveTab("documents"); setRejectReason(""); }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Review
                        </Button>
                      )}
                      {(app.kycStatus === "APPROVED" || app.kycStatus === "REJECTED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => { setSelected(app); setActiveTab("documents"); setRejectReason(""); }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                KYC Review — {selected.username || selected.email}
              </DialogTitle>
            </DialogHeader>

            {/* User summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                {(selected.firstName?.[0] || selected.username?.[0] || "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-slate-900">{selected.firstName} {selected.lastName}</div>
                <div className="text-xs text-slate-500">{selected.email}</div>
                <div className="text-xs text-slate-400">@{selected.username}</div>
              </div>
              <Badge className={`text-xs border ${(STATUS_CFG[selected.kycStatus] ?? STATUS_CFG.NOT_STARTED).color}`}>
                {(STATUS_CFG[selected.kycStatus] ?? STATUS_CFG.NOT_STARTED).label}
              </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="documents" className="flex-1 text-xs">
                  <Camera className="w-3.5 h-3.5 mr-1" />Documents
                </TabsTrigger>
                <TabsTrigger value="decision" className="flex-1 text-xs">
                  <Shield className="w-3.5 h-3.5 mr-1" />Decision
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex-1 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />Contact
                </TabsTrigger>
              </TabsList>

              {/* Documents tab */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />Facial Photo
                    </p>
                    <ImagePreview url={selected.facialImageUrl} label="Facial Photo" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />ID Document
                    </p>
                    <ImagePreview url={selected.documentUrl} label="ID Document" />
                  </div>
                </div>

                {/* Document details */}
                {(selected.documentForm || selected.documents?.[0]) && (() => {
                  const doc = selected.documentForm || (selected.documents?.[0] ? {
                    documentType: selected.documents[0].documentType,
                    country: selected.documents[0].country,
                    documentNumber: selected.documents[0].documentNumber,
                    expiryDate: selected.documents[0].expiryDate,
                  } : null);
                  if (!doc) return null;
                  return (
                    <div className="bg-slate-50 rounded-lg border p-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-700">Document Details</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {doc.documentType && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Type:</span>
                            <span>{DOC_LABELS[doc.documentType] ?? doc.documentType}</span>
                          </div>
                        )}
                        {doc.country && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Country:</span>
                            <span>{doc.country}</span>
                          </div>
                        )}
                        {doc.documentNumber && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Number:</span>
                            <span className="font-mono">{doc.documentNumber}</span>
                          </div>
                        )}
                        {doc.expiryDate && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-medium">Expiry:</span>
                            <span>{new Date(doc.expiryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {selected.kycStatus === "UNDER_REVIEW" && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => setActiveTab("decision")}
                  >
                    Proceed to Decision
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </TabsContent>

              {/* Decision tab */}
              <TabsContent value="decision" className="space-y-4 mt-4">
                {selected.kycStatus === "APPROVED" ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-emerald-800">Already Approved</p>
                    <p className="text-xs text-emerald-600">
                      Approved on {selected.kycApprovedAt ? new Date(selected.kycApprovedAt).toLocaleDateString() : "—"}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 mt-2"
                      disabled={reviewMutation.isPending || !rejectReason.trim()}
                      onClick={() => reviewMutation.mutate({ userId: selected.id, status: "REJECTED", rejectionReason: rejectReason })}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Revoke Approval
                    </Button>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-600 block mb-1 text-left">Revocation reason (required)</label>
                      <Textarea
                        rows={2}
                        className="text-sm"
                        placeholder="Reason for revoking…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                    </div>
                  </div>
                ) : selected.kycStatus === "REJECTED" ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <p className="font-semibold text-red-800">Previously Rejected</p>
                    </div>
                    {selected.kycRejectionReason && (
                      <p className="text-xs text-red-700 bg-red-100 rounded p-2">{selected.kycRejectionReason}</p>
                    )}
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 w-full"
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ userId: selected.id, status: "APPROVED" })}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Approve Anyway
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Approve */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                      <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />Approve KYC
                      </p>
                      <p className="text-xs text-emerald-700">
                        The user will receive a verified badge and full platform access.
                      </p>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 w-full"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ userId: selected.id, status: "APPROVED" })}
                      >
                        {reviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Approve
                      </Button>
                    </div>

                    {/* Reject */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                      <p className="text-sm font-semibold text-red-800 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />Reject KYC
                      </p>
                      <div>
                        <label className="text-xs font-medium text-red-700 block mb-1">
                          Rejection reason <span className="text-red-400">(required)</span>
                        </label>
                        <Textarea
                          rows={3}
                          className="text-sm border-red-200 focus:border-red-400"
                          placeholder="e.g. Document image is blurry — please resubmit with a clearer photo."
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100 w-full"
                        disabled={reviewMutation.isPending || !rejectReason.trim()}
                        onClick={() => {
                          if (!rejectReason.trim()) {
                            toast({ title: "Reason required", description: "Please provide a rejection reason.", variant: "destructive" });
                            return;
                          }
                          reviewMutation.mutate({ userId: selected.id, status: "REJECTED", rejectionReason: rejectReason });
                        }}
                      >
                        {reviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Contact tab */}
              <TabsContent value="contact" className="space-y-4 mt-4">
                {/* Send notification */}
                <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Send Notification
                  </p>
                  <p className="text-xs text-slate-500">
                    Sends an in-app notification to the user explaining the issue or providing guidance.
                  </p>
                  <Textarea
                    rows={3}
                    className="text-sm"
                    placeholder="e.g. Your document photo is too dark. Please resubmit with better lighting."
                    value={notifyMsg}
                    onChange={e => setNotifyMsg(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    disabled={notifyMutation.isPending || !notifyMsg.trim()}
                    onClick={() => notifyMutation.mutate({ userId: selected.id, message: notifyMsg })}
                  >
                    {notifyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Bell className="w-3.5 h-3.5 mr-1.5" />}
                    Send Notification
                  </Button>
                </div>

                {/* Start chat */}
                <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Open Chat
                  </p>
                  <p className="text-xs text-slate-500">
                    Opens a direct message thread with the user. They can reply from their Messages page.
                  </p>
                  <Textarea
                    rows={3}
                    className="text-sm"
                    placeholder="Opening message (optional)…"
                    value={chatMsg}
                    onChange={e => setChatMsg(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={chatMutation.isPending}
                    onClick={() => chatMutation.mutate({ userId: selected.id, message: chatMsg })}
                  >
                    {chatMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5 mr-1.5" />}
                    {chatMsg.trim() ? "Send & Open Chat" : "Open Chat Thread"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
