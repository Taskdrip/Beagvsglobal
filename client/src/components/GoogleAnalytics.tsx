import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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

  const measurementId = settings?.find((s: any) => s.key === "seo_ga4_id")?.value;
  const gscCode = settings?.find((s: any) => s.key === "seo_gsc_verification")?.value;

  // Inject GA4 script
  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return;
    if (document.getElementById("ga4-script")) return;

    const script1 = document.createElement("script");
    script1.id = "ga4-script";
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) { window.dataLayer.push(args); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurementId, { anonymize_ip: true });
  }, [measurementId]);

  // Inject Google Search Console verification meta tag
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
