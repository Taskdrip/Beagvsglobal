import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import {
  Plus, Edit, Trash2, Search, Globe, ExternalLink, BarChart2, TrendingUp,
  FileText, Share2, Download, RefreshCw, ChevronUp, ChevronDown, Eye,
  Twitter, Instagram, Linkedin, Facebook, Youtube, Loader2, Target, Activity,
  AlertCircle, Filter, X, Send, Printer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const INDUSTRY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  SHIPPING: "Shipping",
  BOTH: "Both",
};

const PLATFORM_ICONS: Record<string, any> = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  blog: FileText,
  other: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  youtube: "#FF0000",
  blog: "#10B981",
  other: "#6B7280",
};

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

type SortDir = "asc" | "desc";

function SortButton({ field, current, dir, onSort }: { field: string; current: string; dir: SortDir; onSort: (f: string) => void }) {
  return (
    <button onClick={() => onSort(field)} className="inline-flex items-center gap-0.5 hover:text-blue-600">
      {current === field ? (dir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />}
    </button>
  );
}

// ─── Competitor Form Dialog ────────────────────────────────────────────────────

function CompetitorDialog({
  open, onClose, initial, onSave, saving,
}: { open: boolean; onClose: () => void; initial?: any; onSave: (d: any) => void; saving: boolean }) {
  const blank = { name: "", website: "", country: "", industry: "BOTH", notes: "", blogUrl: "", socialLinks: { twitter: "", instagram: "", linkedin: "", facebook: "", youtube: "" } };
  const [form, setForm] = useState(initial || blank);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setSocial = (k: string, v: string) => setForm((f: any) => ({ ...f, socialLinks: { ...f.socialLinks, [k]: v } }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, socialLinks: form.socialLinks });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            {initial ? "Edit Competitor" : "Add Competitor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Company Name *</Label>
              <Input className="mt-1" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Jumia Shipping" data-testid="input-competitor-name" />
            </div>
            <div>
              <Label className="text-sm font-medium">Industry</Label>
              <Select value={form.industry} onValueChange={v => set("industry", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                  <SelectItem value="SHIPPING">Shipping</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Website</Label>
              <Input className="mt-1" value={form.website || ""} onChange={e => set("website", e.target.value)} placeholder="https://example.com" />
            </div>
            <div>
              <Label className="text-sm font-medium">Country</Label>
              <Input className="mt-1" value={form.country || ""} onChange={e => set("country", e.target.value)} placeholder="e.g. Nigeria" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Blog URL</Label>
            <Input className="mt-1" value={form.blogUrl || ""} onChange={e => set("blogUrl", e.target.value)} placeholder="https://example.com/blog" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Social Media Links</Label>
            <div className="space-y-2">
              {["twitter", "instagram", "linkedin", "facebook", "youtube"].map(platform => (
                <div key={platform} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-slate-500 capitalize">{platform}</span>
                  <Input value={form.socialLinks?.[platform] || ""} onChange={e => setSocial(platform, e.target.value)} placeholder={`https://${platform}.com/...`} className="text-sm" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Notes</Label>
            <Textarea className="mt-1" rows={3} value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Internal notes about this competitor..." />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-700" data-testid="button-save-competitor">
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : "Save Competitor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Content Form Dialog ───────────────────────────────────────────────────────

function ContentDialog({
  open, onClose, initial, competitors, onSave, saving,
}: { open: boolean; onClose: () => void; initial?: any; competitors: any[]; onSave: (d: any) => void; saving: boolean }) {
  const blank = {
    competitorId: competitors[0]?.id || "",
    type: "blog",
    platform: "blog",
    title: "",
    summary: "",
    url: "",
    engagementLikes: 0,
    engagementShares: 0,
    engagementComments: 0,
    publishedAt: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(initial ? {
    ...initial,
    publishedAt: initial.publishedAt ? new Date(initial.publishedAt).toISOString().split("T")[0] : blank.publishedAt,
  } : blank);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const platforms = ["blog", "twitter", "instagram", "linkedin", "facebook", "youtube", "other"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {initial ? "Edit Content" : "Track New Content"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label className="text-sm font-medium">Competitor *</Label>
            <Select value={form.competitorId} onValueChange={v => set("competitorId", v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select competitor" /></SelectTrigger>
              <SelectContent>
                {competitors.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Platform</Label>
              <Select value={form.platform} onValueChange={v => { set("platform", v); set("type", v); }}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Published Date</Label>
              <Input type="date" className="mt-1" value={form.publishedAt} onChange={e => set("publishedAt", e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Title</Label>
            <Input className="mt-1" value={form.title || ""} onChange={e => set("title", e.target.value)} placeholder="Post title or headline" />
          </div>
          <div>
            <Label className="text-sm font-medium">Summary / Content Snippet</Label>
            <Textarea className="mt-1" rows={3} value={form.summary || ""} onChange={e => set("summary", e.target.value)} placeholder="Brief summary of the content..." />
          </div>
          <div>
            <Label className="text-sm font-medium">Link / URL</Label>
            <Input className="mt-1" value={form.url || ""} onChange={e => set("url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Engagement Metrics</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-slate-500">Likes</Label>
                <Input type="number" min={0} className="mt-0.5" value={form.engagementLikes} onChange={e => set("engagementLikes", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Shares</Label>
                <Input type="number" min={0} className="mt-0.5" value={form.engagementShares} onChange={e => set("engagementShares", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-xs text-slate-500">Comments</Label>
                <Input type="number" min={0} className="mt-0.5" value={form.engagementComments} onChange={e => set("engagementComments", parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={() => onSave({ ...form, publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null })} disabled={saving || !form.competitorId} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : "Save Content"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Competitor Table Tab ──────────────────────────────────────────────────────

function CompetitorTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("ALL");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: rawCompetitors = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/competitors"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/competitors", data),
    onSuccess: () => { toast({ title: "Competitor added" }); setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PATCH", `/api/admin/competitors/${id}`, data),
    onSuccess: () => { toast({ title: "Competitor updated" }); setEditTarget(null); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/competitors/${id}`),
    onSuccess: () => { toast({ title: "Competitor deleted" }); setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitor-content"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let list = [...(rawCompetitors as any[])];
    if (search) list = list.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()) || c.country?.toLowerCase().includes(search.toLowerCase()) || c.website?.toLowerCase().includes(search.toLowerCase()));
    if (filterIndustry !== "ALL") list = list.filter((c: any) => c.industry === filterIndustry);
    list.sort((a: any, b: any) => {
      const av = (a[sortField] || "").toString().toLowerCase();
      const bv = (b[sortField] || "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [rawCompetitors, search, filterIndustry, sortField, sortDir]);

  const industryBadge = (industry: string) => {
    const colors: Record<string, string> = { REAL_ESTATE: "bg-blue-100 text-blue-700", SHIPPING: "bg-emerald-100 text-emerald-700", BOTH: "bg-purple-100 text-purple-700" };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[industry] || "bg-slate-100 text-slate-600"}`}>{INDUSTRY_LABELS[industry] || industry}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8 w-52" placeholder="Search competitors…" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-competitor-search" />
          </div>
          <Select value={filterIndustry} onValueChange={setFilterIndustry}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Industries</SelectItem>
              <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
              <SelectItem value="SHIPPING">Shipping</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-competitor">
          <Plus className="w-4 h-4 mr-1" /> Add Competitor
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {[["name","Company Name"],["country","Country"],["industry","Industry"],["website","Website"]].map(([f,label]) => (
                  <th key={f} className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">{label}<SortButton field={f} current={sortField} dir={sortDir} onSort={handleSort} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-slate-600">Social</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400"><Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />{search || filterIndustry !== "ALL" ? "No results match your filters" : "No competitors tracked yet. Add your first one."}</td></tr>
              ) : filtered.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors" data-testid={`row-competitor-${c.id}`}>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.country || "—"}</td>
                  <td className="px-4 py-3">{industryBadge(c.industry)}</td>
                  <td className="px-4 py-3">
                    {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{new URL(c.website).hostname}</a> : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {Object.entries(c.socialLinks || {}).filter(([, url]) => url).map(([platform, url]) => {
                        const Icon = PLATFORM_ICONS[platform] || Globe;
                        return <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-500"><Icon className="w-4 h-4" /></a>;
                      })}
                      {c.blogUrl && <a href={c.blogUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500"><FileText className="w-4 h-4" /></a>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{c.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(c)} data-testid={`button-edit-competitor-${c.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(c)} data-testid={`button-delete-competitor-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} of {(rawCompetitors as any[]).length} competitors shown</p>

      <CompetitorDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={d => createMutation.mutate(d)} saving={createMutation.isPending} />
      {editTarget && <CompetitorDialog open={!!editTarget} onClose={() => setEditTarget(null)} initial={editTarget} onSave={d => updateMutation.mutate({ id: editTarget.id, data: d })} saving={updateMutation.isPending} />}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Competitor</DialogTitle></DialogHeader>
          <p className="text-slate-600">Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all tracked content for this competitor.</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Content Tracker Tab ──────────────────────────────────────────────────────

function ContentTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("ALL");
  const [filterCompetitor, setFilterCompetitor] = useState("ALL");
  const [sortField, setSortField] = useState("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: competitors = [] } = useQuery<any[]>({ queryKey: ["/api/admin/competitors"] });
  const { data: rawContent = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/competitor-content"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/competitor-content", data),
    onSuccess: () => { toast({ title: "Content tracked" }); setAddOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitor-content"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors/analytics"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest("PATCH", `/api/admin/competitor-content/${id}`, data),
    onSuccess: () => { toast({ title: "Content updated" }); setEditTarget(null); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitor-content"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors/analytics"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/competitor-content/${id}`),
    onSuccess: () => { toast({ title: "Content removed" }); setDeleteTarget(null); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitor-content"] }); queryClient.invalidateQueries({ queryKey: ["/api/admin/competitors/analytics"] }); },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let list = [...(rawContent as any[])];
    if (filterCompetitor !== "ALL") list = list.filter((c: any) => c.competitorId === filterCompetitor);
    if (filterPlatform !== "ALL") list = list.filter((c: any) => c.platform === filterPlatform);
    if (search) list = list.filter((c: any) => (c.title || "").toLowerCase().includes(search.toLowerCase()) || (c.summary || "").toLowerCase().includes(search.toLowerCase()));
    list.sort((a: any, b: any) => {
      const av = a[sortField]; const bv = b[sortField];
      if (sortField === "publishedAt" || sortField === "createdAt") {
        return sortDir === "asc" ? new Date(av || 0).getTime() - new Date(bv || 0).getTime() : new Date(bv || 0).getTime() - new Date(av || 0).getTime();
      }
      const as2 = (av || "").toString().toLowerCase(); const bs2 = (bv || "").toString().toLowerCase();
      return sortDir === "asc" ? as2.localeCompare(bs2) : bs2.localeCompare(as2);
    });
    return list;
  }, [rawContent, search, filterPlatform, filterCompetitor, sortField, sortDir]);

  const allPlatforms = useMemo(() => [...new Set((rawContent as any[]).map((c: any) => c.platform))], [rawContent]);

  const PlatformBadge = ({ platform }: { platform: string }) => {
    const Icon = PLATFORM_ICONS[platform] || Globe;
    const color = PLATFORM_COLORS[platform] || "#6B7280";
    return <span className="flex items-center gap-1 text-xs font-medium" style={{ color }}><Icon className="w-3.5 h-3.5" />{platform}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8 w-48" placeholder="Search content…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterCompetitor} onValueChange={setFilterCompetitor}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Competitors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Competitors</SelectItem>
              {(competitors as any[]).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-32"><SelectValue placeholder="All Platforms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Platforms</SelectItem>
              {allPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {(search || filterCompetitor !== "ALL" || filterPlatform !== "ALL") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterCompetitor("ALL"); setFilterPlatform("ALL"); }}><X className="w-4 h-4 mr-1" />Clear</Button>
          )}
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700" disabled={(competitors as any[]).length === 0} data-testid="button-track-content">
          <Plus className="w-4 h-4 mr-1" /> Track Content
        </Button>
      </div>

      {(competitors as any[]).length === 0 && (
        <div className="border rounded-lg p-8 text-center text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>Add competitors first before tracking their content.</p>
        </div>
      )}

      {(competitors as any[]).length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">Competitor<SortButton field="competitor.name" current={sortField} dir={sortDir} onSort={handleSort} /></span>
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600">Platform</th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">Title / Content<SortButton field="title" current={sortField} dir={sortDir} onSort={handleSort} /></span>
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">Published<SortButton field="publishedAt" current={sortField} dir={sortDir} onSort={handleSort} /></span>
                  </th>
                  <th className="text-left px-3 py-3 font-medium text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1">Engagement<SortButton field="engagementLikes" current={sortField} dir={sortDir} onSort={handleSort} /></span>
                  </th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />No content tracked yet. Click "Track Content" to add a post.</td></tr>
                ) : filtered.map((c: any) => {
                  const totalEng = (c.engagementLikes || 0) + (c.engagementShares || 0) + (c.engagementComments || 0);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors" data-testid={`row-content-${c.id}`}>
                      <td className="px-3 py-3 font-medium text-slate-800">{c.competitor?.name || "—"}</td>
                      <td className="px-3 py-3"><PlatformBadge platform={c.platform} /></td>
                      <td className="px-3 py-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">{c.title || "(no title)"}</div>
                        {c.summary && <div className="text-xs text-slate-500 truncate mt-0.5">{c.summary}</div>}
                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5"><ExternalLink className="w-3 h-3" />View</a>}
                      </td>
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                        {c.publishedAt ? new Date(c.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {totalEng > 0 ? (
                          <div className="text-xs space-y-0.5">
                            <div className="font-medium text-slate-800">{totalEng.toLocaleString()} total</div>
                            <div className="text-slate-400">👍{c.engagementLikes || 0} 🔁{c.engagementShares || 0} 💬{c.engagementComments || 0}</div>
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setEditTarget(c)} data-testid={`button-edit-content-${c.id}`}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-slate-400">{filtered.length} of {(rawContent as any[]).length} entries shown</p>

      <ContentDialog open={addOpen} onClose={() => setAddOpen(false)} competitors={competitors as any[]} onSave={d => createMutation.mutate(d)} saving={createMutation.isPending} />
      {editTarget && <ContentDialog open={!!editTarget} onClose={() => setEditTarget(null)} initial={editTarget} competitors={competitors as any[]} onSave={d => updateMutation.mutate({ id: editTarget.id, data: d })} saving={updateMutation.isPending} />}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Content</DialogTitle></DialogHeader>
          <p className="text-slate-600">Remove "<strong>{deleteTarget?.title || "this entry"}</strong>" from tracking?</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsView() {
  const { data: analytics, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["/api/admin/competitors/analytics"],
  });

  if (isLoading) return <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading analytics…</div>;

  if (!analytics || analytics.totalCompetitors === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <BarChart2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">No data yet</p>
        <p className="text-sm mt-1">Add competitors and track their content to see analytics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-600" />Competitor Intelligence Overview</h3>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Competitors Tracked", value: analytics.totalCompetitors, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Content Items", value: analytics.totalContent, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Most Active", value: analytics.topCompetitors[0]?.name || "—", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Top Platform", value: analytics.platformBreakdown[0]?.platform || "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xl font-bold text-slate-800 truncate">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Competitors */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Most Active Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.topCompetitors.slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={v => v.length > 10 ? v.slice(0, 10) + "…" : v} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => [v, "Posts"]} />
                <Bar dataKey="contentCount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Content by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analytics.platformBreakdown} dataKey="count" nameKey="platform" cx="50%" cy="50%" outerRadius={80} label={({ platform, percent }) => `${platform} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {analytics.platformBreakdown.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Activity Trend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Posting Activity (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.activityTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} name="Posts Tracked" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" />Engagement Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.topCompetitors.slice(0, 10).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-slate-800 truncate">{c.name}</span>
                    <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">{c.contentCount} posts · {c.totalEngagement.toLocaleString()} eng.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${analytics.topCompetitors[0]?.contentCount > 0 ? Math.round((c.contentCount / analytics.topCompetitors[0].contentCount) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {analytics.topCompetitors.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No data yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsView() {
  const { data: analytics } = useQuery<any>({ queryKey: ["/api/admin/competitors/analytics"] });
  const { data: competitors = [] } = useQuery<any[]>({ queryKey: ["/api/admin/competitors"] });
  const { data: content = [] } = useQuery<any[]>({ queryKey: ["/api/admin/competitor-content"] });
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const now = new Date();
  const reportTitle = `Beagvs Global — Competitor Intelligence Report (${reportType.charAt(0).toUpperCase() + reportType.slice(1)})`;
  const reportDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const topCompetitor = analytics?.topCompetitors?.[0];
  const recentItems = (content as any[]).slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ["Competitor", "Country", "Industry", "Platform", "Title", "Published", "Likes", "Shares", "Comments", "Total Engagement", "URL"];
    const rows = (content as any[]).map((c: any) => [
      c.competitor?.name || "", c.competitor?.country || "", c.competitor?.industry || "",
      c.platform, c.title || "", c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : "",
      c.engagementLikes || 0, c.engagementShares || 0, c.engagementComments || 0,
      (c.engagementLikes || 0) + (c.engagementShares || 0) + (c.engagementComments || 0),
      c.url || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `competitor-report-${now.toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Label className="text-sm text-slate-600">Report period:</Label>
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} data-testid="button-download-csv">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-report">
            <Printer className="w-4 h-4 mr-1" /> Print / Save PDF
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowSendModal(true)} data-testid="button-send-report">
            <Send className="w-4 h-4 mr-1" /> Send Report
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <div id="report-content" className="border rounded-xl overflow-hidden bg-white print:shadow-none print:border-none">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">Beagvs Global</h2>
              <p className="text-blue-200 text-sm mt-0.5">Competitor Intelligence Report</p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <p className="font-semibold text-white capitalize">{reportType} Report</p>
              <p>{reportDate}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-600" />Executive Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Competitors Tracked", value: analytics?.totalCompetitors || 0 },
                { label: "Content Items", value: analytics?.totalContent || 0 },
                { label: "Top Competitor", value: topCompetitor?.name || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Competitors */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600" />Competitor Rankings</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">#</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Company</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Country</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-600 border border-slate-200">Industry</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Posts</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-600 border border-slate-200">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.topCompetitors || []).slice(0, 10).map((c: any, i: number) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-3 py-2 border border-slate-200 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800">{c.name}</td>
                    <td className="px-3 py-2 border border-slate-200 text-slate-600">{c.country || "—"}</td>
                    <td className="px-3 py-2 border border-slate-200 text-slate-600">{INDUSTRY_LABELS[c.industry] || c.industry}</td>
                    <td className="px-3 py-2 border border-slate-200 text-right font-medium">{c.contentCount}</td>
                    <td className="px-3 py-2 border border-slate-200 text-right">{c.totalEngagement.toLocaleString()}</td>
                  </tr>
                ))}
                {(analytics?.topCompetitors || []).length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400 border border-slate-200">No competitors tracked yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Content */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-amber-600" />Recent Competitor Activity</h3>
            <div className="space-y-2">
              {recentItems.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No content tracked yet</p>
              ) : recentItems.map((c: any) => {
                const PIcon = PLATFORM_ICONS[c.platform] || Globe;
                const pColor = PLATFORM_COLORS[c.platform] || "#6B7280";
                return (
                  <div key={c.id} className="border border-slate-200 rounded-lg p-3 flex gap-3 items-start">
                    <PIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: pColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="font-medium text-slate-800 text-sm">{c.competitor?.name}</span>
                        <span className="text-xs text-slate-400">{c.publishedAt ? new Date(c.publishedAt).toLocaleDateString() : ""}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5 truncate">{c.title || c.summary || "(no title)"}</p>
                      {(c.engagementLikes || c.engagementShares || c.engagementComments) ? (
                        <p className="text-xs text-slate-400 mt-0.5">👍{c.engagementLikes || 0} 🔁{c.engagementShares || 0} 💬{c.engagementComments || 0}</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-xs text-slate-400 flex justify-between">
            <span>Generated by Beagvs Global Admin · {reportDate}</span>
            <span>Confidential — Internal Use Only</span>
          </div>
        </div>
      </div>

      {/* Send Report Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" />Send Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Recipients (one per line)</Label>
              <Textarea className="mt-1" rows={4} value={recipients} onChange={e => setRecipients(e.target.value)} placeholder={"ceo@beagvsglobal.com\nops@beagvsglobal.com"} data-testid="input-report-recipients" />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Email delivery requires an SMTP integration to be configured. You can use <strong>Print / Save PDF</strong> to export and share manually in the meantime.</span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p className="font-medium mb-1">Report will include:</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>{analytics?.totalCompetitors || 0} competitors tracked</li>
                <li>{analytics?.totalContent || 0} content items</li>
                <li>Full ranking table &amp; recent activity</li>
                <li>Generated: {reportDate}</li>
              </ul>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { handlePrint(); setShowSendModal(false); }} data-testid="button-confirm-send-report">
                <Printer className="w-4 h-4 mr-1" /> Print / Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body > *:not(#report-root) { display: none; }
          #report-content { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function CompetitorDashboard() {
  const { data: competitors = [] } = useQuery<any[]>({ queryKey: ["/api/admin/competitors"] });
  const { data: content = [] } = useQuery<any[]>({ queryKey: ["/api/admin/competitor-content"] });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Competitor Intelligence Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Monitor competitors in real estate &amp; shipping across Africa and globally</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-blue-600 border-blue-200">{(competitors as any[]).length} Competitors</Badge>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200">{(content as any[]).length} Tracked Items</Badge>
        </div>
      </div>

      <Tabs defaultValue="competitors" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100 rounded-lg">
          <TabsTrigger value="competitors" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-competitors">
            <Target className="w-4 h-4 mr-1.5" />Competitors
          </TabsTrigger>
          <TabsTrigger value="content" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-content-tracker">
            <FileText className="w-4 h-4 mr-1.5" />Content Tracker
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-analytics">
            <BarChart2 className="w-4 h-4 mr-1.5" />Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-reports">
            <Share2 className="w-4 h-4 mr-1.5" />Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors">
          <CompetitorTable />
        </TabsContent>

        <TabsContent value="content">
          <ContentTracker />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsView />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
