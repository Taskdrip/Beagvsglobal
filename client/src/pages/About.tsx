import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { 
  Globe,
  Shield,
  Coins,
  Users,
  Target,
  Award,
  TrendingUp,
  Heart,
  Linkedin,
  Twitter,
  Ship,
  Package,
  MapPin,
  Phone,
  CheckCircle,
  Anchor,
  Truck,
  Youtube,
  Instagram,
  Wallet,
  LogIn,
  Store,
} from "lucide-react";
import { SiTelegram, SiTiktok, SiX } from "react-icons/si";

const SOCIAL_LINKS = [
  { href: "https://x.com/Beagvsglobal", icon: SiX, label: "X (Twitter)", color: "hover:bg-slate-700 hover:text-white", textColor: "text-slate-600" },
  { href: "https://www.instagram.com/beagvsglobal/", icon: Instagram, label: "Instagram", color: "hover:bg-pink-50 hover:text-pink-500", textColor: "text-slate-600" },
  { href: "https://t.me/beagvsglobal", icon: SiTelegram, label: "Telegram", color: "hover:bg-blue-50 hover:text-blue-500", textColor: "text-slate-600" },
  { href: "https://www.youtube.com/@beagvsglobal", icon: Youtube, label: "YouTube", color: "hover:bg-red-50 hover:text-red-500", textColor: "text-slate-600" },
  { href: "https://www.tiktok.com/@beagvsglobal", icon: SiTiktok, label: "TikTok", color: "hover:bg-slate-100 hover:text-slate-900", textColor: "text-slate-600" },
];

const ABOUT_DEFAULTS = {
  heroTitle: "Your Trusted Partner in Global Cargo & Freight",
  heroSubtitle: "A licensed freight forwarder and customs agent providing comprehensive cargo services, consolidation, door-to-door delivery, and import/export solutions across Nigeria and beyond — and a real-world utility marketplace where Pi Network pioneers can spend Pi on real estate, shipping, and everyday goods.",
  missionTitle: "Our Mission",
  missionContent: "Beagvs Marine Services Nig Ltd is dedicated to providing seamless, reliable, and cost-effective freight forwarding and customs clearance services. We handle cargo with the utmost care — from consolidation at major Nigerian ports to final door-to-door delivery — while giving the Pi Network community a genuine, escrow-protected marketplace to put their Pi to work.",
  stat1Value: "5,000+",
  stat1Label: "Shipments Cleared",
  stat2Value: "20+",
  stat2Label: "Years Experience",
  stat3Value: "5",
  stat3Label: "Port Locations",
  stat4Value: "99%",
  stat4Label: "On-Time Clearance",
};

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: savedContent } = useQuery<any>({ queryKey: ["/api/page-content/about"] });
  const c = { ...ABOUT_DEFAULTS, ...(savedContent || {}) };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="crypto-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Ship className="w-12 h-12" />
            <div className="text-left">
              <div className="text-3xl font-bold leading-tight">Beagvs Marine Services Nig Ltd</div>
              <div className="text-blue-200 text-sm">Licensed Freight Forwarder & Customs Agent</div>
            </div>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6" data-testid="text-about-title">
            {c.heroTitle}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {c.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="w-16 h-16 text-crypto-blue mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-slate-dark mb-6" data-testid="text-mission-title">{c.missionTitle}</h2>
          <p className="text-xl text-slate-medium leading-relaxed" data-testid="text-mission-content">
            {c.missionContent}
          </p>
        </div>
      </section>

      {/* Pi Network Solution */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(168,85,247,0.4), transparent 40%), radial-gradient(circle at 80% 60%, rgba(59,130,246,0.35), transparent 45%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-4">
              <Coins className="w-4 h-4" /> Our Pi Network Solution
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" data-testid="text-pi-solution-title">
              Real-World Utility for Pi Pioneers
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Beagvs Global gives the Pi Network community a genuine marketplace to spend and earn Pi — buying real estate,
              booking shipping services, and trading everyday products, with every transaction held safely in escrow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur p-6" data-testid="card-pi-native-checkout">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <Wallet className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Native Pi Payments</h3>
              <p className="text-slate-400 text-sm">
                Pay directly from your Pi Wallet inside the Pi Browser using the official Pi SDK — no manual transfers, no third-party exchanges.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur p-6" data-testid="card-pi-escrow">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <Shield className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Escrow-Protected Pi</h3>
              <p className="text-slate-400 text-sm">
                Every Pi payment is held in escrow until delivery is confirmed, so pioneers can trade with confidence on every order.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur p-6" data-testid="card-pi-signin">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <LogIn className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sign In With Pi</h3>
              <p className="text-slate-400 text-sm">
                Pioneers can create an account or check out using their Pi Network identity — no separate email signup required.
              </p>
            </div>
            <div className="rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur p-6" data-testid="card-pi-marketplace">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-5">
                <Store className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Spend Pi On Real Goods</h3>
              <p className="text-slate-400 text-sm">
                From real estate and shipping services to everyday products via our Pi Merchant storefront — real utility for real Pi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Our Values & Services</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Comprehensive logistics solutions tailored for Nigerian and international trade
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border border-slate-100" data-testid="card-value-cargo">
              <CardContent className="p-6">
                <Package className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-dark mb-3">Cargo Services</h3>
                <p className="text-slate-medium text-sm">
                  Full range of air and sea cargo handling, from small parcels to full container loads.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border border-slate-100" data-testid="card-value-consolidation">
              <CardContent className="p-6">
                <Anchor className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-dark mb-3">Cargo Consolidation</h3>
                <p className="text-slate-medium text-sm">
                  LCL consolidation services that reduce shipping costs by grouping smaller shipments together.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border border-slate-100" data-testid="card-value-door">
              <CardContent className="p-6">
                <Truck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-dark mb-3">Door to Door</h3>
                <p className="text-slate-medium text-sm">
                  Complete door-to-door delivery service from origin to your final destination, hassle-free.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border border-slate-100" data-testid="card-value-import-export">
              <CardContent className="p-6">
                <Globe className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-dark mb-3">Import to Export</h3>
                <p className="text-slate-medium text-sm">
                  Full customs clearance, documentation, and compliance support for both import and export trade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Meet Our Founder</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Decades of expertise in freight forwarding, customs clearance, and international trade.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border border-slate-100" data-testid="card-founder-ceo">
              <CardContent className="p-8 text-center lg:text-left flex flex-col lg:flex-row gap-8 items-start">
                <div className="shrink-0 mx-auto lg:mx-0">
                  <img 
                    src="/uploads/ceo-photo.jpeg" 
                    alt="Mr. Godspower Asemota - Founder & CEO" 
                    className="w-48 h-48 rounded-2xl object-cover shadow-lg"
                    data-testid="img-founder-ceo"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-dark mb-2">Mr. Godspower Asemota</h3>
                  <p className="text-crypto-blue font-semibold mb-4 text-lg">Founder & CEO</p>
                  <p className="text-slate-medium leading-relaxed mb-6" data-testid="text-founder-ceo-bio">
                    A seasoned freight forwarding and customs clearance professional with over two decades of hands-on experience at Nigeria's busiest ports — including Apapa, Tin-Can Island, and Port Harcourt. Godspower founded Beagvs Marine Services Nig Ltd to bring reliable, transparent, and tech-forward logistics solutions to Nigerian businesses and individuals. His deep knowledge of NCS (Nigeria Customs Service) regulations and international trade law ensures every shipment clears smoothly.
                  </p>
                  <div className="flex justify-center lg:justify-start space-x-4">
                    <Button variant="ghost" size="sm" className="p-2" data-testid="button-ceo-linkedin">
                      <Linkedin className="w-5 h-5 text-slate-400 hover:text-crypto-blue" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2" data-testid="button-ceo-twitter">
                      <Twitter className="w-5 h-5 text-slate-400 hover:text-crypto-blue" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Operations Base */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Our Operations Base</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Strategically positioned at Nigeria's key cargo and port facilities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { name: "Nahco Cargo Shed", desc: "Air cargo handling and consolidation at one of Nigeria's premier cargo terminals." },
              { name: "Sahco Cargo Shed", desc: "Full cargo services including handling, warehousing, and documentation at Sahco." },
              { name: "Tin-Can Island Port", desc: "Sea freight clearance and operations at Lagos's major container terminal." },
              { name: "Apapa Port", desc: "Customs clearance and cargo services at Nigeria's largest and busiest port." },
              { name: "Port Harcourt Port", desc: "Southern Nigeria operations covering sea freight and export documentation." },
            ].map((base) => (
              <Card key={base.name} className="border border-slate-100">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-6 h-6 text-crypto-blue shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-slate-dark mb-2">{base.name}</h3>
                      <p className="text-slate-medium text-sm">{base.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border border-slate-100 bg-crypto-blue/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-crypto-blue shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-dark mb-1">Head Office — Lagos</h3>
                    <p className="text-slate-medium text-sm">No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch Office */}
          <Card className="max-w-md mx-auto border border-slate-100">
            <CardContent className="p-6 text-center">
              <MapPin className="w-8 h-8 text-crypto-blue mx-auto mb-3" />
              <h3 className="font-bold text-slate-dark mb-1">Branch Office — Benin City</h3>
              <p className="text-slate-medium text-sm">No 21, Nevis Street, off Mission Road, Benin City, Edo State</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Why Choose Us</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              The principles and advantages that set Beagvs Marine Services apart
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border border-slate-100" data-testid="card-value-security">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">Licensed & Trusted</h3>
                <p className="text-slate-medium">
                  Fully licensed freight forwarder and certified customs agent operating under Nigerian Customs Service regulations with years of proven track record.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border border-slate-100" data-testid="card-value-innovation">
              <CardContent className="p-8">
                <Coins className="w-16 h-16 text-crypto-blue mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">Pi Network & Crypto-Powered</h3>
                <p className="text-slate-medium">
                  Sign in, pay, and transact natively with Pi Network — plus USDT and other major cryptocurrencies — for secure, borderless commerce.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border border-slate-100" data-testid="card-value-community">
              <CardContent className="p-8">
                <CheckCircle className="w-16 h-16 text-purple-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">End-to-End Service</h3>
                <p className="text-slate-medium">
                  From first-mile pickup and documentation to customs clearance and last-mile delivery — we handle every step of your shipment's journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Our Impact</h2>
            <p className="text-xl text-slate-medium">Building trust and enabling commerce across Nigeria and the world</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="stat-transactions">
              <div className="text-4xl font-bold text-crypto-blue mb-2">{c.stat1Value}</div>
              <p className="text-slate-medium">{c.stat1Label}</p>
            </div>
            <div className="text-center" data-testid="stat-users">
              <div className="text-4xl font-bold text-crypto-blue mb-2">{c.stat2Value}</div>
              <p className="text-slate-medium">{c.stat2Label}</p>
            </div>
            <div className="text-center" data-testid="stat-countries">
              <div className="text-4xl font-bold text-crypto-blue mb-2">{c.stat3Value}</div>
              <p className="text-slate-medium">{c.stat3Label}</p>
            </div>
            <div className="text-center" data-testid="stat-success-rate">
              <div className="text-4xl font-bold text-crypto-blue mb-2">{c.stat4Value}</div>
              <p className="text-slate-medium">{c.stat4Label}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-dark mb-2">Follow Beagvs Global</h2>
          <p className="text-slate-medium mb-8">Stay connected for shipping updates, real estate listings, and platform news.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`social-about-${label.toLowerCase().replace(/[^a-z]/g, "")}`}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-sm shadow-sm ${color} transition-all`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="crypto-gradient rounded-2xl p-8 lg:p-12 text-white">
            <Award className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Ready to Ship?</h2>
            <p className="text-xl text-blue-100 mb-4 max-w-2xl mx-auto">
              Contact Beagvs Marine Services today for a free quote on cargo services, consolidation, or customs clearance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <a href="tel:+2348037232210" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                <Phone className="w-4 h-4" /> +234 803 723 2210
              </a>
              <a href="tel:+2348155576539" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                <Phone className="w-4 h-4" /> +234 815 557 6539
              </a>
              <a href="tel:+2348027529083" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
                <Phone className="w-4 h-4" /> +234 802 752 9083
              </a>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-crypto-blue hover:bg-blue-50 font-semibold" data-testid="button-contact-us">
                  Send Us a Message
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-crypto-blue font-semibold" data-testid="button-explore-marketplace">
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
