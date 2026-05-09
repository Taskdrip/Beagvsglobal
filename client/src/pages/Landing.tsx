import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import {
  Globe, Home, Ship, Store, Shield, Coins, Star,
  ArrowRight, CheckCircle, Lock, CreditCard, Truck,
  Zap, Award, DollarSign, ChevronLeft, ChevronRight,
  Network, Cpu, Database, TrendingUp, Users, Activity
} from "lucide-react";
import marketplaceHeroImage from "@assets/generated_images/Secure_crypto_marketplace_hero_6091395a.png";
import escrowSystemImage from "@assets/generated_images/Escrow_protection_system_illustration_d3a358c2.png";
import globalServicesImage from "@assets/generated_images/Global_marketplace_services_illustration_b30909d5.png";

const heroSlides = [
  {
    id: 0,
    badge: "🌐 Blockchain-Powered Marketplace",
    title: "Revolutionizing",
    titleAccent: "Global Commerce",
    subtitle:
      "Trade real estate, ship globally, and exchange premium products with secure crypto & fiat escrow protection across 180+ countries.",
    cta: { label: "Start Trading Now", href: "/signup" },
    secondary: { label: "Explore Marketplace", href: "/marketplace" },
    image: marketplaceHeroImage,
    imageAlt: "Secure Crypto Marketplace Platform",
    tag: "Military-Grade Security",
    tagIcon: <Shield className="w-4 h-4 text-green-400" />,
    accent: "from-blue-500 to-cyan-400",
    stats: [
      { value: "$50M+", label: "Total Volume" },
      { value: "25K+", label: "Verified Users" },
      { value: "180+", label: "Countries" },
      { value: "99.8%", label: "Success Rate" },
    ],
  },
  {
    id: 1,
    badge: "🏠 Real Estate On-Chain",
    title: "Buy & Sell Properties",
    titleAccent: "With Cryptocurrency",
    subtitle:
      "Luxury homes, commercial property, and land — all tradeable using Pi Network, USDT, and major blockchains with full escrow protection.",
    cta: { label: "Browse Real Estate", href: "/marketplace?type=REAL_ESTATE" },
    secondary: { label: "List Your Property", href: "/signup" },
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    imageAlt: "Luxury real estate property",
    tag: "847 Properties Available",
    tagIcon: <Home className="w-4 h-4 text-blue-400" />,
    accent: "from-purple-500 to-blue-400",
    stats: [
      { value: "847", label: "Properties" },
      { value: "$2M+", label: "Avg Deal Size" },
      { value: "62", label: "Countries" },
      { value: "100%", label: "Escrow Safe" },
    ],
  },
  {
    id: 2,
    badge: "🚢 Global Freight Network",
    title: "Ship Anything",
    titleAccent: "Anywhere On Earth",
    subtitle:
      "Connect with certified freight forwarders and shipping professionals worldwide. Book cargo, get quotes, and pay with crypto.",
    cta: { label: "Find Shipping Services", href: "/marketplace?type=SHIPPING_SERVICE" },
    secondary: { label: "Offer Your Service", href: "/signup" },
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&h=500&fit=crop&crop=center",
    imageAlt: "Global shipping containers",
    tag: "324 Shipping Services",
    tagIcon: <Ship className="w-4 h-4 text-cyan-400" />,
    accent: "from-cyan-500 to-teal-400",
    stats: [
      { value: "324", label: "Services" },
      { value: "180+", label: "Routes" },
      { value: "48h", label: "Avg Quote" },
      { value: "24/7", label: "Support" },
    ],
  },
  {
    id: 3,
    badge: "🔐 Zero-Risk Transactions",
    title: "Escrow Protection",
    titleAccent: "You Can Trust",
    subtitle:
      "Multi-signature smart contracts hold your funds safely until delivery is confirmed. Never lose money on international trades again.",
    cta: { label: "How Escrow Works", href: "/about" },
    secondary: { label: "Start Your First Trade", href: "/signup" },
    image: escrowSystemImage,
    imageAlt: "Escrow protection system",
    tag: "Zero Disputes Unresolved",
    tagIcon: <Shield className="w-4 h-4 text-green-400" />,
    accent: "from-green-500 to-teal-400",
    stats: [
      { value: "0", label: "Lost Funds" },
      { value: "24h", label: "Dispute Resolution" },
      { value: "256-bit", label: "Encryption" },
      { value: "100%", label: "Fund Safety" },
    ],
  },
];

function BlockchainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    for (let i = 0; i < 55; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connecting lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.18 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 300);
  };

  const prev = () => goTo((current - 1 + heroSlides.length) % heroSlides.length);
  const next = () => goTo((current + 1) % heroSlides.length);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % heroSlides.length);
    }, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const slide = heroSlides[current];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#050d1a]" data-testid="section-hero">
      {/* Animated blockchain network background */}
      <BlockchainBackground />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Dark gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a]/60 via-transparent to-[#050d1a]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050d1a]/70 via-transparent to-[#050d1a]/30 pointer-events-none" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-300 ${
            transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {/* Left: text */}
          <div className="text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium mb-6 backdrop-blur-sm">
              <span>{slide.badge}</span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-white" data-testid="text-hero-title">
              {slide.title} <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.accent}`}>
                {slide.titleAccent}
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
              {slide.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href={slide.cta.href}>
                <Button
                  size="lg"
                  className="hero-btn-primary text-base px-7 py-5 font-semibold shadow-lg shadow-blue-500/25"
                  data-testid="button-hero-cta"
                >
                  {slide.cta.label}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href={slide.secondary.href}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-200 bg-white/5 hover:bg-white/10 text-base px-7 py-5 font-semibold backdrop-blur-sm"
                  data-testid="button-hero-secondary"
                >
                  {slide.secondary.label}
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {slide.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-blue-900/40 blockchain-card">
              <img
                src={slide.image}
                alt={slide.imageAlt}
                className="w-full h-72 lg:h-96 object-cover"
                data-testid="img-hero"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=500&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a]/60 via-transparent to-transparent" />
            </div>

            {/* Float tag */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-[#050d1a]/80 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5">
              {slide.tagIcon}
              <span className="text-sm font-medium text-white">{slide.tag}</span>
            </div>

            {/* Chain indicator */}
            <div className="absolute -top-3 -right-3 flex gap-1.5">
              {["PI", "USDT", "BNB", "SOL"].map((chain) => (
                <div
                  key={chain}
                  className="w-8 h-8 rounded-full bg-[#0a1628] border border-cyan-500/40 flex items-center justify-center text-[9px] font-bold text-cyan-300"
                >
                  {chain.slice(0, 2)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slider controls */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-slate-600 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-all"
            data-testid="button-hero-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-8 h-2 bg-cyan-400"
                    : "w-2 h-2 bg-slate-600 hover:bg-slate-400"
                }`}
                data-testid={`button-slide-${i}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-slate-600 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-all"
            data-testid="button-hero-next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function FloatingToken({ symbol, delay, x, size = "md" }: { symbol: string; delay: string; x: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-14 h-14 text-sm" };
  return (
    <div
      className={`absolute ${sizes[size]} rounded-full border border-cyan-400/30 bg-[#0a1628]/80 backdrop-blur-sm flex items-center justify-center font-bold text-cyan-300 crypto-float`}
      style={{ left: x, animationDelay: delay }}
    >
      {symbol}
    </div>
  );
}

const LANDING_DEFAULTS = {
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

export default function Landing() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const { data: savedContent } = useQuery<any>({ queryKey: ["/api/page-content/landing"] });
  const c = { ...LANDING_DEFAULTS, ...(savedContent || {}) };

  return (
    <div className="min-h-screen bg-[#050d1a]">
      <Navigation dark />

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* LIVE STATS TICKER */}
      <section className="bg-[#0a1628] border-y border-cyan-500/10 py-4 overflow-hidden">
        <div className="flex items-center gap-10 animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[
            { label: "PI Network", price: "42.50", change: "+3.2%" },
            { label: "USDT/TRON", price: "1.00", change: "0.0%" },
            { label: "USDT/BNB", price: "1.00", change: "0.0%" },
            { label: "USDT/SOL", price: "1.00", change: "+0.1%" },
            { label: "USDT/TON", price: "1.00", change: "-0.1%" },
            { label: "USDT/AVAX", price: "1.00", change: "0.0%" },
            { label: "PI Network", price: "42.50", change: "+3.2%" },
            { label: "USDT/TRON", price: "1.00", change: "0.0%" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-400 text-sm font-medium">{t.label}</span>
              <span className="text-white text-sm font-bold">${t.price}</span>
              <span className={`text-xs font-medium ${t.change.startsWith("+") ? "text-green-400" : t.change === "0.0%" ? "text-slate-400" : "text-red-400"}`}>
                {t.change}
              </span>
              <span className="text-slate-700">|</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="py-24 bg-[#060f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-4">
              <Network className="w-3.5 h-3.5" /> Multi-Chain Marketplace
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Explore Our Marketplace</h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Trade real estate, ship globally, and exchange goods with multi-network cryptocurrency protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                href: "/marketplace?type=REAL_ESTATE",
                img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
                imgAlt: "Luxury property",
                icon: <Home className="w-5 h-5 text-blue-400" />,
                title: "Real Estate",
                desc: "Buy and sell properties worldwide with cryptocurrency. From residential to commercial investments.",
                count: "847 Properties",
                accent: "blue",
                testId: "card-real-estate",
              },
              {
                href: "/marketplace?type=SHIPPING_SERVICE",
                img: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=300&fit=crop",
                imgAlt: "Shipping containers",
                icon: <Ship className="w-5 h-5 text-cyan-400" />,
                title: "Global Shipping",
                desc: "Freight forwarding and shipping services worldwide. Move cargo, goods, and parcels globally.",
                count: "324 Services",
                accent: "cyan",
                testId: "card-shipping",
              },
              {
                href: "/marketplace?type=PRODUCT",
                img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
                imgAlt: "Marketplace products",
                icon: <Store className="w-5 h-5 text-purple-400" />,
                title: "Products & Services",
                desc: "Trade goods and services with cryptocurrency. From electronics to consulting services.",
                count: "1,676 Items",
                accent: "purple",
                testId: "card-products",
              },
            ].map((cat) => (
              <Link key={cat.href} href={cat.href}>
                <div
                  className="group cursor-pointer blockchain-card rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1"
                  data-testid={cat.testId}
                >
                  <div className="overflow-hidden relative">
                    <img
                      src={cat.img}
                      alt={cat.imgAlt}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060f1e]/80 to-transparent" />
                  </div>
                  <div className="p-6 bg-[#0a1628]">
                    <div className="flex items-center gap-2 mb-3">
                      {cat.icon}
                      <h3 className="text-lg font-semibold text-white">{cat.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">{cat.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">{cat.count}</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCKCHAIN NETWORK VISUALIZATION */}
      <section className="py-20 bg-[#050d1a] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-cyan-500/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-blue-500/8" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-cyan-400/12" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" /> Supported Networks
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Multi-Chain Payment Support</h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Accept payments in multiple cryptocurrencies and traditional currencies — maximum flexibility, global reach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Crypto */}
            <div className="blockchain-card rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Cryptocurrency</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Pi Network", tag: "π PI", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
                  { name: "USDT (TRON)", tag: "TRC20", color: "bg-red-500/20 text-red-300 border-red-500/30" },
                  { name: "USDT (TON)", tag: "TON", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                  { name: "USDT (BNB)", tag: "BEP20", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
                  { name: "USDT (Solana)", tag: "SOL", color: "bg-green-500/20 text-green-300 border-green-500/30" },
                  { name: "USDT (Avalanche)", tag: "AVAX", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>{c.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fiat */}
            <div className="blockchain-card rounded-xl border border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Traditional Payments</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "US Dollar", tag: "USD" },
                  { name: "Euro", tag: "EUR" },
                  { name: "British Pound", tag: "GBP" },
                  { name: "Canadian Dollar", tag: "CAD" },
                  { name: "Nigerian Naira", tag: "NGN" },
                  { name: "Bank Transfer", tag: "✓" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{c.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-green-500/30 bg-green-500/20 text-green-300 font-medium">{c.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="blockchain-card rounded-xl border border-amber-500/20 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Security Features</h3>
              </div>
              <div className="space-y-3">
                {[
                  "KYC Verification",
                  "2FA Authentication",
                  "Smart Contract Audits",
                  "Insurance Protection",
                  "24/7 Monitoring",
                  "Cold Storage",
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-slate-300 text-sm">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESCROW TRUST SECTION */}
      <section className="py-24 bg-[#060f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 text-xs font-medium mb-4">
                  <Shield className="w-3.5 h-3.5" /> Military-Grade Security
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Escrow Protection You Can Count On</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Every transaction on Beagvs Global is secured with bank-level encryption and our advanced escrow system. Your funds are protected until delivery confirmation.
                </p>
              </div>

              {[
                { icon: <Shield className="w-6 h-6 text-green-400" />, title: "Multi-Signature Escrow", desc: "Funds held in secure multi-signature wallets requiring buyer, seller, and platform confirmation before release." },
                { icon: <Lock className="w-6 h-6 text-blue-400" />, title: "AES-256 Encryption", desc: "All transactions and personal data protected with bank-level encryption and SSL technology." },
                { icon: <Award className="w-6 h-6 text-purple-400" />, title: "Dispute Resolution", desc: "Professional arbitration team available 24/7 to resolve disputes fairly and efficiently." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0a1628] border border-white/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-blue-900/30 blockchain-card">
                <img
                  src={escrowSystemImage}
                  alt="Escrow Protection System"
                  className="w-full h-auto"
                  data-testid="img-escrow-system"
                />
              </div>
              {/* Floating metrics */}
              <div className="absolute -bottom-4 -left-4 blockchain-card rounded-xl border border-white/10 p-4 bg-[#0a1628]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">$50M+ Protected</div>
                    <div className="text-slate-400 text-xs">Total Escrow Volume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#050d1a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-4">
              <Database className="w-3.5 h-3.5" /> Blockchain Verified
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">How Our Escrow System Works</h2>
            <p className="text-slate-400 text-lg">Simple, secure, and transparent — protects both buyers and sellers</p>
          </div>

          <div className="space-y-4">
            {[
              { num: "01", title: "Escrow Created", desc: "Buyer initiates secure escrow with platform protection and smart contract deployment", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
              { num: "02", title: "Payment Funded", desc: "Buyer sends cryptocurrency to platform escrow wallet — verified on-chain", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
              { num: "03", title: "Goods Shipped", desc: "Seller ships goods and provides tracking information through the platform", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30" },
              { num: "04", title: "Delivery Confirmed", desc: "Buyer confirms receipt and satisfaction with the goods or services received", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30" },
              { num: "05", title: "Funds Released", desc: "Payment automatically released to seller minus platform fee — transaction complete", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
            ].map((step, i) => (
              <div key={step.num} className="flex items-start gap-6">
                <div className={`shrink-0 w-12 h-12 rounded-xl border ${step.bg} flex items-center justify-center`}>
                  <span className={`text-sm font-bold ${step.color}`}>{step.num}</span>
                </div>
                <div className="flex-1 min-h-[48px] flex items-center">
                  <div>
                    <h3 className="text-white font-semibold mb-0.5">{step.title}</h3>
                    <p className="text-slate-400 text-sm">{step.desc}</p>
                  </div>
                </div>
                {i < 4 && (
                  <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500/30 to-transparent mt-12 absolute left-[62px] ml-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL SERVICES */}
      <section className="py-24 bg-[#060f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-blue-900/30 blockchain-card">
                <img
                  src={globalServicesImage}
                  alt="Global Marketplace Services"
                  className="w-full h-auto"
                  data-testid="img-global-services"
                />
              </div>
              {/* Floating stat */}
              <div className="absolute -top-4 -right-4 blockchain-card rounded-xl border border-white/10 p-4 bg-[#0a1628]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-bold">180+ Countries</div>
                    <div className="text-slate-400 text-xs">Global Reach</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-4">
                  <Globe className="w-3.5 h-3.5" /> Global Categories
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Global Marketplace Categories</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  From luxury real estate to international shipping services — discover opportunities across industries with secure transactions.
                </p>
              </div>

              {[
                { icon: <Home className="w-6 h-6 text-blue-400" />, title: "Premium Real Estate", desc: "Luxury properties, commercial real estate, and land investments available for crypto and traditional payments." },
                { icon: <Truck className="w-6 h-6 text-green-400" />, title: "Global Shipping Services", desc: "Professional freight forwarding, cargo shipping, and logistics services connecting worldwide markets." },
                { icon: <Globe className="w-6 h-6 text-purple-400" />, title: "International Trade", desc: "Products and services from verified sellers worldwide, with secure payment processing and escrow protection." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0a1628] border border-white/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS / TRUST SIGNALS */}
      <section className="py-24 bg-[#050d1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Trusted By Traders Worldwide</h2>
            <p className="text-slate-400 text-lg">Real people, real transactions, real protection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Emmanuel O.", country: "Nigeria", text: "Bought a property in Dubai using Pi Network. The escrow held everything until I had the keys. Absolutely seamless.", rating: 5 },
              { name: "Sarah K.", country: "Canada", text: "Shipped electronics worth $50K from China. Payment was held safely until delivery. Couldn't be easier.", rating: 5 },
              { name: "Michael T.", country: "United Kingdom", text: "Sold real estate in Lagos and received USDT. The KYC process was fast and the funds released instantly.", rating: 5 },
            ].map((t) => (
              <div key={t.name} className="blockchain-card rounded-xl border border-white/8 p-6 bg-[#0a1628]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-[#050d1a] to-cyan-600/20 border-y border-cyan-500/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">
            Ready to Trade on the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Blockchain?
            </span>
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Join {c.stat2Value} verified traders across {c.stat3Value} countries. Create your free account and start trading with crypto escrow protection today.
          </p>
          {/* Dynamic stat pills */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {[
              { value: c.stat1Value, label: c.stat1Label },
              { value: c.stat2Value, label: c.stat2Label },
              { value: c.stat3Value, label: c.stat3Label },
              { value: c.stat4Value, label: c.stat4Label },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="hero-btn-primary text-base px-8 py-5 font-semibold" data-testid="button-final-cta">
                {c.heroCta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 bg-white/5 hover:bg-white/10 text-base px-8 py-5 font-semibold">
                {c.heroSecondaryCta}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
