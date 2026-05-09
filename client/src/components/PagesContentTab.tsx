import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2, Globe, Phone, Mail, MapPin, Home, Info } from "lucide-react";

const DEFAULT_LANDING = {
  heroTitle: "Revolutionizing",
  heroTitleAccent: "Global Commerce",
  heroSubtitle:
    "Trade real estate, ship globally, and exchange premium products with secure crypto & fiat escrow protection across 180+ countries.",
  heroCta: "Start Trading Now",
  heroSecondaryCta: "Explore Marketplace",
  stat1Value: "$50M+",
  stat1Label: "Total Volume",
  stat2Value: "25K+",
  stat2Label: "Verified Users",
  stat3Value: "180+",
  stat3Label: "Countries",
  stat4Value: "99.8%",
  stat4Label: "Success Rate",
  featuresTitle: "Everything You Need to Trade Globally",
  featuresSubtitle:
    "Our comprehensive platform combines real estate, shipping, and marketplace services with military-grade crypto escrow protection.",
};

const DEFAULT_ABOUT = {
  heroTitle: "The World's Premier Crypto & Fiat Marketplace",
  heroSubtitle:
    "We're revolutionizing global commerce with military-grade security, comprehensive escrow protection, and support for multiple cryptocurrencies and traditional payment methods across 180+ countries.",
  missionTitle: "Our Mission",
  missionContent:
    "We're building the world's most comprehensive crypto and fiat marketplace where users can trade real estate, access global shipping services, and exchange goods with complete security.",
  stat1Value: "25,000+",
  stat1Label: "Active Users",
  stat2Value: "180+",
  stat2Label: "Countries",
  stat3Value: "99.8%",
  stat3Label: "Success Rate",
  stat4Value: "$50M+",
  stat4Label: "Trade Volume",
};

const DEFAULT_CONTACT = {
  heroTitle: "Get in Touch",
  heroSubtitle:
    "Our support team is available 24/7 to help you with any questions or concerns.",
  email: "support@beagvsglobal.com",
  phone: "+1 (555) 123-4567",
  address: "Lagos, Nigeria • London, UK • New York, USA",
  hoursTitle: "Support Hours",
  hours: "24/7 — We never sleep so you can trade safely around the clock.",
  responseTime: "Typical response within 2 hours",
};

interface PagesContentTabProps {
  queryClient: any;
  toast: any;
  apiRequest: any;
}

function PageSection({
  title,
  icon: Icon,
  pageName,
  defaults,
  fields,
  toast,
  apiRequest,
  queryClient,
}: {
  title: string;
  icon: any;
  pageName: string;
  defaults: Record<string, string>;
  fields: { key: string; label: string; type?: "textarea" | "input"; rows?: number }[];
  toast: any;
  apiRequest: any;
  queryClient: any;
}) {
  const { data: savedContent, isLoading } = useQuery<any>({
    queryKey: [`/api/page-content/${pageName}`],
  });

  const merged = { ...defaults, ...(savedContent || {}) };
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const getValue = (key: string) =>
    edits[key] !== undefined ? edits[key] : merged[key] ?? "";

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...merged, ...edits };
      const resp = await apiRequest("PUT", `/api/admin/page-content/${pageName}`, payload);
      if (!resp.ok) throw new Error("Save failed");
      queryClient.invalidateQueries({ queryKey: [`/api/page-content/${pageName}`] });
      setEdits({});
      toast({ title: `${title} page saved` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(edits).length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-blue-600" />
            {title} Page Content
          </span>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
            data-testid={`button-save-page-${pageName}`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardTitle>
        {savedContent && (
          <p className="text-xs text-green-600">
            ✓ Custom content saved — changes are live on the website.
          </p>
        )}
        {!savedContent && (
          <p className="text-xs text-slate-400">
            Using default content. Edit fields below and save to publish changes.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
              <Label className="text-sm font-medium text-slate-700 mb-1 block">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={getValue(f.key)}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  rows={f.rows ?? 3}
                  className="resize-none"
                  data-testid={`input-${pageName}-${f.key}`}
                />
              ) : (
                <Input
                  value={getValue(f.key)}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  data-testid={`input-${pageName}-${f.key}`}
                />
              )}
            </div>
          ))}
        </div>
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            You have unsaved changes. Click "Save Changes" to publish them.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PagesContentTab({ queryClient, toast, apiRequest }: PagesContentTabProps) {
  return (
    <div className="space-y-2">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-1 flex items-center gap-2">
          <Globe className="w-4 h-4" /> Website Content Management
        </h3>
        <p className="text-sm text-blue-700">
          Edit the text content of your public pages here. Changes are saved to the database and
          shown live on the website. Images and layout are managed through the code.
        </p>
      </div>

      <Tabs defaultValue="landing" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-slate-100 rounded-lg w-full">
          <TabsTrigger value="landing" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white" data-testid="tab-page-landing">
            Landing
          </TabsTrigger>
          <TabsTrigger value="about" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white" data-testid="tab-page-about">
            About
          </TabsTrigger>
          <TabsTrigger value="contact" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white" data-testid="tab-page-contact">
            Contact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="landing">
          <PageSection
            title="Landing"
            icon={Home}
            pageName="landing"
            defaults={DEFAULT_LANDING}
            fields={[
              { key: "heroTitle", label: "Hero Title" },
              { key: "heroTitleAccent", label: "Hero Title Accent (colored)" },
              { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", rows: 2 },
              { key: "heroCta", label: "Primary CTA Button Text" },
              { key: "heroSecondaryCta", label: "Secondary CTA Button Text" },
              { key: "stat1Value", label: "Stat 1 Value" },
              { key: "stat1Label", label: "Stat 1 Label" },
              { key: "stat2Value", label: "Stat 2 Value" },
              { key: "stat2Label", label: "Stat 2 Label" },
              { key: "stat3Value", label: "Stat 3 Value" },
              { key: "stat3Label", label: "Stat 3 Label" },
              { key: "stat4Value", label: "Stat 4 Value" },
              { key: "stat4Label", label: "Stat 4 Label" },
              { key: "featuresTitle", label: "Features Section Title" },
              { key: "featuresSubtitle", label: "Features Section Subtitle", type: "textarea", rows: 2 },
            ]}
            toast={toast}
            apiRequest={apiRequest}
            queryClient={queryClient}
          />
        </TabsContent>

        <TabsContent value="about">
          <PageSection
            title="About"
            icon={Info}
            pageName="about"
            defaults={DEFAULT_ABOUT}
            fields={[
              { key: "heroTitle", label: "Hero Title", type: "textarea", rows: 2 },
              { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", rows: 3 },
              { key: "missionTitle", label: "Mission Section Title" },
              { key: "missionContent", label: "Mission Content", type: "textarea", rows: 4 },
              { key: "stat1Value", label: "Stat 1 Value" },
              { key: "stat1Label", label: "Stat 1 Label" },
              { key: "stat2Value", label: "Stat 2 Value" },
              { key: "stat2Label", label: "Stat 2 Label" },
              { key: "stat3Value", label: "Stat 3 Value" },
              { key: "stat3Label", label: "Stat 3 Label" },
              { key: "stat4Value", label: "Stat 4 Value" },
              { key: "stat4Label", label: "Stat 4 Label" },
            ]}
            toast={toast}
            apiRequest={apiRequest}
            queryClient={queryClient}
          />
        </TabsContent>

        <TabsContent value="contact">
          <PageSection
            title="Contact"
            icon={Mail}
            pageName="contact"
            defaults={DEFAULT_CONTACT}
            fields={[
              { key: "heroTitle", label: "Hero Title" },
              { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", rows: 2 },
              { key: "email", label: "Support Email" },
              { key: "phone", label: "Phone Number" },
              { key: "address", label: "Office Address(es)" },
              { key: "hoursTitle", label: "Hours Section Title" },
              { key: "hours", label: "Support Hours Text" },
              { key: "responseTime", label: "Response Time Note" },
            ]}
            toast={toast}
            apiRequest={apiRequest}
            queryClient={queryClient}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
