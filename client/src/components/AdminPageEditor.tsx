import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Home,
  Info,
  Phone,
  Truck,
  Building2,
  Layout,
  Upload,
  Save,
  Loader2,
  ImagePlus,
  X,
  CheckCircle,
} from "lucide-react";

// ─── Field Definitions ────────────────────────────────────────────────────────

type FieldType = "text" | "textarea" | "image" | "url";

interface Field {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
}

interface Section {
  id: string;
  label: string;
  fields: Field[];
}

interface PageConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  sections: Section[];
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  landing: {
    label: "Landing Page",
    icon: Home,
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "heroTitle", label: "Main Headline", type: "text", placeholder: "Revolutionizing Global Commerce with Crypto" },
          { key: "heroSubtitle", label: "Subtitle", type: "textarea", placeholder: "Trade real estate, ship globally, and transact securely..." },
          { key: "heroImage", label: "Hero Background Image", type: "image" },
          { key: "heroCta1Text", label: "Primary Button Text", type: "text", placeholder: "Start Trading Now" },
          { key: "heroCta2Text", label: "Secondary Button Text", type: "text", placeholder: "Explore Marketplace" },
        ],
      },
      {
        id: "stats",
        label: "Statistics Bar",
        fields: [
          { key: "stat1Value", label: "Stat 1 — Value", type: "text", placeholder: "$50M+" },
          { key: "stat1Label", label: "Stat 1 — Label", type: "text", placeholder: "Total Volume" },
          { key: "stat2Value", label: "Stat 2 — Value", type: "text", placeholder: "25K+" },
          { key: "stat2Label", label: "Stat 2 — Label", type: "text", placeholder: "Verified Users" },
          { key: "stat3Value", label: "Stat 3 — Value", type: "text", placeholder: "180+" },
          { key: "stat3Label", label: "Stat 3 — Label", type: "text", placeholder: "Countries" },
          { key: "stat4Value", label: "Stat 4 — Value", type: "text", placeholder: "99.8%" },
          { key: "stat4Label", label: "Stat 4 — Label", type: "text", placeholder: "Success Rate" },
        ],
      },
      {
        id: "features",
        label: "Features Section",
        fields: [
          { key: "featuresTitle", label: "Section Title", type: "text", placeholder: "Everything You Need in One Platform" },
          { key: "featuresSubtitle", label: "Section Subtitle", type: "textarea", placeholder: "Comprehensive tools for real estate, shipping, and trading" },
          { key: "feature1Title", label: "Feature 1 — Title", type: "text", placeholder: "Real Estate Trading" },
          { key: "feature1Desc", label: "Feature 1 — Description", type: "textarea", placeholder: "Buy and sell properties with crypto" },
          { key: "feature2Title", label: "Feature 2 — Title", type: "text", placeholder: "Global Shipping" },
          { key: "feature2Desc", label: "Feature 2 — Description", type: "textarea", placeholder: "Cargo services across 180+ countries" },
          { key: "feature3Title", label: "Feature 3 — Title", type: "text", placeholder: "Escrow Protection" },
          { key: "feature3Desc", label: "Feature 3 — Description", type: "textarea", placeholder: "Secure crypto transactions for every deal" },
          { key: "feature4Title", label: "Feature 4 — Title", type: "text", placeholder: "Multi-Chain Support" },
          { key: "feature4Desc", label: "Feature 4 — Description", type: "textarea", placeholder: "Pi Network, USDT on TRON, BNB, TON and more" },
          { key: "feature5Title", label: "Feature 5 — Title", type: "text", placeholder: "Social Marketplace" },
          { key: "feature5Desc", label: "Feature 5 — Description", type: "textarea", placeholder: "Follow sellers, leave reviews, build trust" },
          { key: "feature6Title", label: "Feature 6 — Title", type: "text", placeholder: "KYC Verification" },
          { key: "feature6Desc", label: "Feature 6 — Description", type: "textarea", placeholder: "Verified users for safer transactions" },
        ],
      },
      {
        id: "cta",
        label: "Call-to-Action Banner",
        fields: [
          { key: "ctaTitle", label: "CTA Title", type: "text", placeholder: "Ready to Start Trading?" },
          { key: "ctaSubtitle", label: "CTA Subtitle", type: "textarea", placeholder: "Join thousands of traders on the platform" },
          { key: "ctaButtonText", label: "CTA Button Text", type: "text", placeholder: "Get Started Free" },
          { key: "ctaImage", label: "CTA Background Image", type: "image" },
        ],
      },
    ],
  },

  about: {
    label: "About Page",
    icon: Info,
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "heroTitle", label: "Page Title", type: "text", placeholder: "About Beagvs Global" },
          { key: "heroSubtitle", label: "Page Subtitle", type: "textarea", placeholder: "Empowering global trade with blockchain technology" },
          { key: "heroImage", label: "Hero Image", type: "image" },
        ],
      },
      {
        id: "mission",
        label: "Mission",
        fields: [
          { key: "missionTitle", label: "Mission Title", type: "text", placeholder: "Our Mission" },
          { key: "missionContent", label: "Mission Content", type: "textarea", placeholder: "We connect buyers and sellers across borders..." },
          { key: "missionImage", label: "Mission Image", type: "image" },
        ],
      },
      {
        id: "vision",
        label: "Vision",
        fields: [
          { key: "visionTitle", label: "Vision Title", type: "text", placeholder: "Our Vision" },
          { key: "visionContent", label: "Vision Content", type: "textarea", placeholder: "A world where anyone can trade anything anywhere..." },
        ],
      },
      {
        id: "stats",
        label: "Impact Statistics",
        fields: [
          { key: "stat1Value", label: "Stat 1 — Value", type: "text", placeholder: "5+" },
          { key: "stat1Label", label: "Stat 1 — Label", type: "text", placeholder: "Years Experience" },
          { key: "stat2Value", label: "Stat 2 — Value", type: "text", placeholder: "10K+" },
          { key: "stat2Label", label: "Stat 2 — Label", type: "text", placeholder: "Happy Clients" },
          { key: "stat3Value", label: "Stat 3 — Value", type: "text", placeholder: "50+" },
          { key: "stat3Label", label: "Stat 3 — Label", type: "text", placeholder: "Countries Served" },
          { key: "stat4Value", label: "Stat 4 — Value", type: "text", placeholder: "$100M+" },
          { key: "stat4Label", label: "Stat 4 — Label", type: "text", placeholder: "Cargo Shipped" },
        ],
      },
      {
        id: "team",
        label: "Team Section",
        fields: [
          { key: "teamTitle", label: "Team Section Title", type: "text", placeholder: "Meet Our Team" },
          { key: "teamSubtitle", label: "Team Section Subtitle", type: "textarea", placeholder: "Dedicated professionals committed to your success" },
          { key: "member1Name", label: "Team Member 1 — Name", type: "text", placeholder: "John Doe" },
          { key: "member1Role", label: "Team Member 1 — Role", type: "text", placeholder: "CEO & Founder" },
          { key: "member1Image", label: "Team Member 1 — Photo", type: "image" },
          { key: "member2Name", label: "Team Member 2 — Name", type: "text", placeholder: "Jane Smith" },
          { key: "member2Role", label: "Team Member 2 — Role", type: "text", placeholder: "Head of Operations" },
          { key: "member2Image", label: "Team Member 2 — Photo", type: "image" },
          { key: "member3Name", label: "Team Member 3 — Name", type: "text", placeholder: "Mike Johnson" },
          { key: "member3Role", label: "Team Member 3 — Role", type: "text", placeholder: "Technical Director" },
          { key: "member3Image", label: "Team Member 3 — Photo", type: "image" },
        ],
      },
    ],
  },

  contact: {
    label: "Contact Page",
    icon: Phone,
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "heroTitle", label: "Page Title", type: "text", placeholder: "Get in Touch" },
          { key: "heroSubtitle", label: "Page Subtitle", type: "textarea", placeholder: "We're here to help with any questions" },
        ],
      },
      {
        id: "info",
        label: "Contact Information",
        fields: [
          { key: "email", label: "Email Address", type: "text", placeholder: "info@beagvsglobal.com" },
          { key: "phone1", label: "Phone Number 1", type: "text", placeholder: "+234 803 723 2210" },
          { key: "phone2", label: "Phone Number 2", type: "text", placeholder: "+234 815 557 6539" },
          { key: "phone3", label: "Phone Number 3", type: "text", placeholder: "+234 802 752 9083" },
          { key: "whatsapp", label: "WhatsApp Number", type: "text", placeholder: "+2348037232210" },
          { key: "address1", label: "Head Office Address", type: "textarea", placeholder: "No 24, 1st Avenue Ottooba, Great Estate..." },
          { key: "address2", label: "Branch Address", type: "textarea", placeholder: "No 21, Nevis Street, off Mission Road, Benin City" },
          { key: "hours", label: "Business Hours", type: "text", placeholder: "Mon–Fri: 8am–6pm WAT" },
        ],
      },
    ],
  },

  shipping: {
    label: "Shipping Hub Page",
    icon: Truck,
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "heroTitle", label: "Hero Title", type: "text", placeholder: "Global Shipping Solutions" },
          { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", placeholder: "From Nigeria to anywhere in the world" },
          { key: "heroImage", label: "Hero Image", type: "image" },
        ],
      },
      {
        id: "services",
        label: "Services",
        fields: [
          { key: "servicesTitle", label: "Services Section Title", type: "text", placeholder: "Our Shipping Services" },
          { key: "service1Title", label: "Service 1 — Title", type: "text", placeholder: "Air Freight" },
          { key: "service1Desc", label: "Service 1 — Description", type: "textarea", placeholder: "Fast delivery by air across the globe" },
          { key: "service2Title", label: "Service 2 — Title", type: "text", placeholder: "Sea Freight" },
          { key: "service2Desc", label: "Service 2 — Description", type: "textarea", placeholder: "Cost-effective ocean freight solutions" },
          { key: "service3Title", label: "Service 3 — Title", type: "text", placeholder: "Door-to-Door Delivery" },
          { key: "service3Desc", label: "Service 3 — Description", type: "textarea", placeholder: "Complete logistics from pickup to delivery" },
          { key: "service4Title", label: "Service 4 — Title", type: "text", placeholder: "Customs Clearance" },
          { key: "service4Desc", label: "Service 4 — Description", type: "textarea", placeholder: "Expert handling of all customs documentation" },
        ],
      },
      {
        id: "why",
        label: "Why Choose Us",
        fields: [
          { key: "whyTitle", label: "Section Title", type: "text", placeholder: "Why Choose Beagvs Shipping?" },
          { key: "why1Title", label: "Reason 1 — Title", type: "text", placeholder: "Licensed & Certified" },
          { key: "why1Desc", label: "Reason 1 — Description", type: "textarea", placeholder: "Fully licensed freight forwarder..." },
          { key: "why2Title", label: "Reason 2 — Title", type: "text", placeholder: "Real-Time Tracking" },
          { key: "why2Desc", label: "Reason 2 — Description", type: "textarea", placeholder: "Track your shipment at every step..." },
          { key: "why3Title", label: "Reason 3 — Title", type: "text", placeholder: "Crypto Payments" },
          { key: "why3Desc", label: "Reason 3 — Description", type: "textarea", placeholder: "Pay with Pi, USDT, or bank transfer..." },
        ],
      },
    ],
  },

  "real-estate": {
    label: "Real Estate Page",
    icon: Building2,
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "heroTitle", label: "Hero Title", type: "text", placeholder: "Find Your Dream Property" },
          { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", placeholder: "Buy and sell real estate using cryptocurrency" },
          { key: "heroImage", label: "Hero Image", type: "image" },
        ],
      },
      {
        id: "features",
        label: "Features",
        fields: [
          { key: "featuresTitle", label: "Features Title", type: "text", placeholder: "Why Buy Real Estate on Beagvs?" },
          { key: "feature1Title", label: "Feature 1 — Title", type: "text", placeholder: "Crypto Payments" },
          { key: "feature1Desc", label: "Feature 1 — Description", type: "textarea", placeholder: "Pay for properties with Pi or USDT" },
          { key: "feature2Title", label: "Feature 2 — Title", type: "text", placeholder: "Escrow Protection" },
          { key: "feature2Desc", label: "Feature 2 — Description", type: "textarea", placeholder: "Funds held safely until transaction completes" },
          { key: "feature3Title", label: "Feature 3 — Title", type: "text", placeholder: "Verified Listings" },
          { key: "feature3Desc", label: "Feature 3 — Description", type: "textarea", placeholder: "All properties listed by verified sellers" },
          { key: "feature4Title", label: "Feature 4 — Title", type: "text", placeholder: "Nigeria-Focused" },
          { key: "feature4Desc", label: "Feature 4 — Description", type: "textarea", placeholder: "Specializing in Nigerian real estate market" },
        ],
      },
    ],
  },

  footer: {
    label: "Footer",
    icon: Layout,
    sections: [
      {
        id: "company",
        label: "Company Info",
        fields: [
          { key: "companyName", label: "Company Name", type: "text", placeholder: "Beagvs Marine Services" },
          { key: "companyTagline", label: "Company Tagline", type: "text", placeholder: "Nig Ltd" },
          { key: "companyDescription", label: "Company Description", type: "textarea", placeholder: "Licensed freight forwarder and customs agent..." },
          { key: "companyLogo", label: "Company Logo", type: "image" },
        ],
      },
      {
        id: "addresses",
        label: "Addresses",
        fields: [
          { key: "address1", label: "Head Office", type: "textarea", placeholder: "No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos" },
          { key: "address2", label: "Branch Office", type: "textarea", placeholder: "No 21, Nevis Street, off Mission Road, Benin City" },
        ],
      },
      {
        id: "contacts",
        label: "Contact Details",
        fields: [
          { key: "phone1", label: "Phone 1", type: "text", placeholder: "+234 803 723 2210" },
          { key: "phone2", label: "Phone 2", type: "text", placeholder: "+234 815 557 6539" },
          { key: "phone3", label: "Phone 3", type: "text", placeholder: "+234 802 752 9083" },
          { key: "email", label: "Email", type: "text", placeholder: "info@beagvsglobal.com" },
          { key: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+2348037232210" },
        ],
      },
      {
        id: "social",
        label: "Social Media Links",
        fields: [
          { key: "twitterUrl", label: "Twitter / X URL", type: "url", placeholder: "https://twitter.com/beagvsglobal" },
          { key: "linkedinUrl", label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/company/beagvsglobal" },
          { key: "instagramUrl", label: "Instagram URL", type: "url", placeholder: "https://instagram.com/beagvsglobal" },
          { key: "facebookUrl", label: "Facebook URL", type: "url", placeholder: "https://facebook.com/beagvsglobal" },
          { key: "whatsappUrl", label: "WhatsApp Chat URL", type: "url", placeholder: "https://wa.me/2348037232210" },
        ],
      },
      {
        id: "legal",
        label: "Legal & Copyright",
        fields: [
          { key: "copyrightText", label: "Copyright Text", type: "text", placeholder: "© 2025 Beagvs Marine Services Nig Ltd. All rights reserved." },
          { key: "termsUrl", label: "Terms of Service URL", type: "url", placeholder: "/terms" },
          { key: "privacyUrl", label: "Privacy Policy URL", type: "url", placeholder: "/privacy" },
        ],
      },
    ],
  },
};

// ─── Image Uploader ───────────────────────────────────────────────────────────

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
}

function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only JPG, PNG, WebP, GIF accepted", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5 MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await apiRequest("POST", "/api/admin/upload-image", { base64, filename: file.name });
        const data = await res.json();
        if (data.url) {
          onChange(data.url);
          toast({ title: "Image uploaded" });
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className="border-2 border-dashed border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer relative"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        data-testid={`image-uploader-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover rounded"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white"
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                >
                  <Upload className="w-3 h-3 mr-1" /> Replace
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); onChange(""); }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            )}
            <p className="text-xs text-slate-500">
              {uploading ? "Uploading…" : "Click or drag to upload image"}
            </p>
            <p className="text-xs text-slate-400">PNG, JPG, WebP up to 5MB</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste an image URL"
        className="text-xs"
        data-testid={`image-url-${label.toLowerCase().replace(/\s+/g, "-")}`}
      />
    </div>
  );
}

// ─── Section Editor ───────────────────────────────────────────────────────────

interface SectionEditorProps {
  section: Section;
  data: Record<string, any>;
  onChange: (key: string, value: string) => void;
}

function SectionEditor({ section, data, onChange }: SectionEditorProps) {
  return (
    <div className="space-y-4">
      {section.fields.map((field) => {
        const val = data[field.key] ?? "";
        if (field.type === "image") {
          return (
            <ImageUploader
              key={field.key}
              label={field.label}
              value={val}
              onChange={(url) => onChange(field.key, url)}
            />
          );
        }
        if (field.type === "textarea") {
          return (
            <div key={field.key} className="space-y-1">
              <Label className="text-sm font-medium">{field.label}</Label>
              <Textarea
                value={val}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                data-testid={`field-${field.key}`}
              />
              {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
            </div>
          );
        }
        return (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Input
              value={val}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              type={field.type === "url" ? "url" : "text"}
              data-testid={`field-${field.key}`}
            />
            {field.hint && <p className="text-xs text-slate-400">{field.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminPageEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activePage, setActivePage] = useState("landing");
  const [activeSection, setActiveSection] = useState("hero");
  const [localData, setLocalData] = useState<Record<string, any>>({});
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  const pageConfig = PAGE_CONFIGS[activePage];
  const section = pageConfig.sections.find((s) => s.id === activeSection) || pageConfig.sections[0];

  const { data: pageContent, isLoading } = useQuery({
    queryKey: ["/api/page-content", activePage],
    queryFn: async () => {
      const res = await fetch(`/api/page-content/${activePage}`);
      return res.ok ? res.json() : null;
    },
  });

  const effectiveData = { ...(pageContent || {}), ...localData };

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("PUT", `/api/admin/page-content/${activePage}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/page-content", activePage] });
      setSavedSections((prev) => {
        const next = new Set(prev);
        next.add(`${activePage}:${activeSection}`);
        return next;
      });
      setLocalData({});
      toast({ title: "Page content saved", description: `${pageConfig.label} updated successfully` });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFieldChange = (key: string, value: string) => {
    setLocalData((prev) => ({ ...prev, [key]: value }));
    setSavedSections((prev) => {
      const next = new Set(prev);
      next.delete(`${activePage}:${activeSection}`);
      return next;
    });
  };

  const handleSave = () => {
    const merged = { ...(pageContent || {}), ...localData };
    saveMutation.mutate(merged);
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
    setActiveSection(PAGE_CONFIGS[page].sections[0].id);
    setLocalData({});
    setSavedSections(new Set());
  };

  const isDirty = Object.keys(localData).length > 0;
  const justSaved = savedSections.has(`${activePage}:${activeSection}`) && !isDirty;

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* ── Left Sidebar: page + section nav ── */}
      <div className="w-56 shrink-0 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2">Pages</p>
        {Object.entries(PAGE_CONFIGS).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = activePage === key;
          return (
            <div key={key}>
              <button
                onClick={() => handlePageChange(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                data-testid={`page-nav-${key}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{cfg.label}</span>
              </button>
              {isActive && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                  {cfg.sections.map((sec) => {
                    const secActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                          secActive
                            ? "text-blue-700 font-semibold bg-blue-50"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                        data-testid={`section-nav-${sec.id}`}
                      >
                        {sec.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Right Panel: section editor ── */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div>
                <span className="text-slate-900">{pageConfig.label}</span>
                <span className="text-slate-400 mx-2">/</span>
                <span className="text-slate-600">{section.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {justSaved && (
                  <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved
                  </Badge>
                )}
                {isDirty && (
                  <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-xs">
                    Unsaved changes
                  </Badge>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !isDirty}
                  data-testid="button-save-page-content"
                >
                  {saveMutation.isPending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving…</>
                  ) : (
                    <><Save className="w-3 h-3 mr-1" /> Save Page</>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-slate-50 border rounded-lg text-xs text-slate-500">
                  Editing <strong>{section.label}</strong> of the <strong>{pageConfig.label}</strong>.
                  Changes are saved for the entire page at once — clicking <strong>Save Page</strong> updates all sections.
                </div>
                <SectionEditor
                  section={section}
                  data={effectiveData}
                  onChange={handleFieldChange}
                />
                <div className="mt-6 pt-4 border-t flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !isDirty}
                    data-testid="button-save-page-content-bottom"
                  >
                    {saveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save {pageConfig.label}</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
