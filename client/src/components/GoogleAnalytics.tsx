import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_GA4_ID = "G-JSCKFS7853";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function GoogleAnalytics() {
  const { data: settings } = useQuery<any[]>({
    queryKey: ["/api/platform-settings"],
  });

  const overrideId = settings?.find((s: any) => s.key === "seo_ga4_id")?.value;
  const measurementId = overrideId || DEFAULT_GA4_ID;
  const gscCode = settings?.find((s: any) => s.key === "seo_gsc_verification")?.value;

  // If an override ID is configured in admin settings and differs from the default,
  // load it as an additional config (the default is already loaded in index.html).
  useEffect(() => {
    if (!overrideId || overrideId === DEFAULT_GA4_ID) return;
    if (typeof window === "undefined" || !window.gtag) return;
    window.gtag("config", overrideId, { anonymize_ip: true });
  }, [overrideId]);

  // Inject Google Search Console verification meta tag dynamically
  useEffect(() => {
    if (!gscCode || typeof document === "undefined") return;
    const existingTag = document.querySelector('meta[name="google-site-verification"]');
    if (existingTag) {
      existingTag.setAttribute("content", gscCode);
      return;
    }
    const meta = document.createElement("meta");
    meta.name = "google-site-verification";
    meta.content = gscCode;
    document.head.appendChild(meta);
  }, [gscCode]);

  return null;
}
