import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Globe,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  MapPin,
  FileText,
  BarChart3,
  Loader2,
  Copy,
  Send,
  Link2,
  ShieldCheck,
  Rss,
} from "lucide-react";

function SitemapPreview() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/seo/sitemap-preview"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const allUrls: any[] = data?.urls || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-blue-500" />
          <strong className="text-slate-700">{allUrls.length}</strong> URLs indexed
        </span>
        <span>·</span>
        <span>{data?.staticCount} static pages</span>
        <span>·</span>
        <span>{data?.blogCount} blog posts</span>
        <span>·</span>
        <span>{data?.listingCount} listings</span>
      </div>
      <div className="border rounded-lg divide-y max-h-72 overflow-y-auto text-sm">
        {allUrls.map((u: any, i: number) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
            <div className="flex items-center gap-2 min-w-0">
              {u.type === "static" && <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              {u.type === "blog" && <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
              {u.type === "listing" && <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              <span className="truncate text-slate-600">{u.loc}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-slate-400">{u.priority}</span>
              <a href={u.loc} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 text-slate-400 hover:text-blue-500" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SEOHealthCheck() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/seo/health"],
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  const checks = data?.checks || [];

  return (
    <div className="space-y-2">
      {checks.map((check: any, i: number) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50">
          {check.status === "ok" ? (
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">{check.label}</span>
              <Badge variant={check.status === "ok" ? "default" : "secondary"} className="text-xs">
                {check.status === "ok" ? "Good" : `${check.count} issues`}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminSEOTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pingUrl, setPingUrl] = useState("");

  const { data: settings } = useQuery<any[]>({ queryKey: ["/api/platform-settings"] });

  const getSetting = (key: string) => settings?.find((s: any) => s.key === key)?.value || "";

  const [ga4Id, setGa4Id] = useState("");
  const [gscCode, setGscCode] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  const settingsLoaded = !!settings;
  if (settingsLoaded && !ga4Id && getSetting("seo_ga4_id")) setGa4Id(getSetting("seo_ga4_id"));
  if (settingsLoaded && !gscCode && getSetting("seo_gsc_verification")) setGscCode(getSetting("seo_gsc_verification"));
  if (settingsLoaded && !siteUrl && getSetting("seo_site_url")) setSiteUrl(getSetting("seo_site_url"));

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      apiRequest("POST", "/api/admin/seo/settings", { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
      toast({ title: "Saved", description: "SEO setting updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save setting.", variant: "destructive" }),
  });

  const pingGoogle = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/seo/ping-google", {}),
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "✅ Google Pinged!" : "⚠️ Ping sent",
        description: data.message || "Google has been notified to crawl the sitemap.",
      });
    },
    onError: () => toast({ title: "Error", description: "Failed to ping Google.", variant: "destructive" }),
  });

  const pingSpecificUrl = useMutation({
    mutationFn: (url: string) => apiRequest("POST", "/api/admin/seo/ping-url", { url }),
    onSuccess: () => {
      toast({ title: "URL Submitted", description: "Google has been notified about this URL." });
      setPingUrl("");
    },
    onError: () => toast({ title: "Error", description: "Failed to submit URL.", variant: "destructive" }),
  });

  const sitemapUrl = (getSetting("seo_site_url") || "https://beagvsmarine.com") + "/sitemap.xml";
  const robotsUrl = (getSetting("seo_site_url") || "https://beagvsmarine.com") + "/robots.txt";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Google SEO & Indexing
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage sitemap, Google Analytics, and ensure all pages are discoverable by search engines.
          </p>
        </div>
        <Button
          onClick={() => pingGoogle.mutate()}
          disabled={pingGoogle.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          data-testid="button-ping-google"
        >
          {pingGoogle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Submit Sitemap to Google
        </Button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <a href={sitemapUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
          <Rss className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">sitemap.xml</div>
            <div className="text-xs text-slate-400 truncate">{sitemapUrl}</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        </a>
        <a href={robotsUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors group">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">robots.txt</div>
            <div className="text-xs text-slate-400 truncate">{robotsUrl}</div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sitemap Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              Sitemap URLs
            </CardTitle>
            <CardDescription>
              All pages, blog posts and listings auto-included. Updates whenever new content is published.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SitemapPreview />
          </CardContent>
        </Card>

        {/* SEO Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              SEO Health Check
            </CardTitle>
            <CardDescription>
              Issues that could prevent pages from ranking well on Google.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SEOHealthCheck />
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GA4 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Google Analytics 4
            </CardTitle>
            <CardDescription>
              Paste your GA4 Measurement ID to enable analytics tracking across all pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga4-id">Measurement ID</Label>
              <div className="flex gap-2">
                <Input
                  id="ga4-id"
                  data-testid="input-ga4-id"
                  placeholder="G-XXXXXXXXXX"
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                />
                <Button
                  onClick={() => saveSetting.mutate({ key: "seo_ga4_id", value: ga4Id })}
                  disabled={saveSetting.isPending}
                  data-testid="button-save-ga4"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Find this in{" "}
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Google Analytics
                </a>{" "}
                → Admin → Data Streams → your stream → Measurement ID
              </p>
            </div>
            {getSetting("seo_ga4_id") && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                GA4 active: <strong>{getSetting("seo_ga4_id")}</strong>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Search Console */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Google Search Console
            </CardTitle>
            <CardDescription>
              Verify site ownership with a meta tag verification code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gsc-code">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="gsc-code"
                  data-testid="input-gsc-code"
                  placeholder="google-site-verification=xxxxxx"
                  value={gscCode}
                  onChange={(e) => setGscCode(e.target.value)}
                />
                <Button
                  onClick={() => saveSetting.mutate({ key: "seo_gsc_verification", value: gscCode })}
                  disabled={saveSetting.isPending}
                  data-testid="button-save-gsc"
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                In{" "}
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Search Console
                </a>
                {" "}→ Add Property → HTML Tag → paste the <code>content</code> value here.
              </p>
            </div>
            {getSetting("seo_gsc_verification") && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                Verification tag active
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Site URL + Ping URL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-slate-500" />
              Site URL
            </CardTitle>
            <CardDescription>
              The canonical base URL used in the sitemap and robots.txt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-url">Base URL</Label>
              <div className="flex gap-2">
                <Input
                  id="site-url"
                  data-testid="input-site-url"
                  placeholder="https://beagvsmarine.com"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
                <Button
                  onClick={() => saveSetting.mutate({ key: "seo_site_url", value: siteUrl })}
                  disabled={saveSetting.isPending}
                  data-testid="button-save-site-url"
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-green-500" />
              Ping Specific URL
            </CardTitle>
            <CardDescription>
              Tell Google to immediately crawl a newly published page or blog post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ping-url">Page URL</Label>
              <div className="flex gap-2">
                <Input
                  id="ping-url"
                  data-testid="input-ping-url"
                  placeholder="https://beagvsmarine.com/blog/my-post"
                  value={pingUrl}
                  onChange={(e) => setPingUrl(e.target.value)}
                />
                <Button
                  onClick={() => pingUrl && pingSpecificUrl.mutate(pingUrl)}
                  disabled={pingSpecificUrl.isPending || !pingUrl}
                  data-testid="button-ping-url"
                  variant="outline"
                >
                  {pingSpecificUrl.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                All new published blog posts are automatically pinged when saved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-blue-800">How Auto-Indexing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
            <li>Every published blog post and approved listing is automatically added to <code className="bg-blue-100 px-1 rounded">/sitemap.xml</code>.</li>
            <li>When you publish a new blog post, Google is automatically pinged via Search Console ping API.</li>
            <li>The sitemap is submitted to Google Search Console at <strong>beagvsmarine.com</strong> — verify it once in Search Console.</li>
            <li>Google Analytics 4 tracks all visitor traffic once your Measurement ID is saved above.</li>
            <li>The <code className="bg-blue-100 px-1 rounded">robots.txt</code> allows all public pages and blocks admin/private routes.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
