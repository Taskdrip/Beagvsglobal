import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  Globe,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  Ship,
  Youtube,
  Twitter,
  Instagram,
} from "lucide-react";
import { SiTelegram, SiTiktok, SiX } from "react-icons/si";

const SOCIAL_LINKS = [
  { href: "https://x.com/Beagvsglobal", icon: SiX, label: "X (Twitter)", color: "hover:text-white" },
  { href: "https://www.instagram.com/beagvsglobal/", icon: Instagram, label: "Instagram", color: "hover:text-pink-400" },
  { href: "https://t.me/beagvsglobal", icon: SiTelegram, label: "Telegram", color: "hover:text-blue-400" },
  { href: "https://www.youtube.com/@beagvsglobal", icon: Youtube, label: "YouTube", color: "hover:text-red-500" },
  { href: "https://www.tiktok.com/@beagvsglobal", icon: SiTiktok, label: "TikTok", color: "hover:text-white" },
];

const FOOTER_DEFAULTS = {
  companyName: "Beagvs Marine Services",
  companyTagline: "Nig Ltd",
  companyDescription: "Licensed freight forwarder and customs agent — and a real-world utility marketplace for the Pi Network ecosystem. Pay with Pi for real estate, shipping, and everyday goods, all protected by secure escrow.",
  address1: "Head Office: No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos",
  address2: "Branch: No 21, Nevis Street, off Mission Road, Benin City",
  phone1: "+234 803 723 2210",
  phone2: "+234 815 557 6539",
  phone3: "+234 802 752 9083",
  email: "info@beagvsglobal.com",
  whatsapp: "+2348037232210",
  whatsappUrl: "https://wa.me/2348037232210?text=Hello%20Beagvs%20Global%2C%20I%20would%20like%20to%20make%20an%20enquiry.",
  copyrightText: "© 2025 Beagvs Marine Services Nig Ltd. All rights reserved.",
};

export default function Footer() {
  const { data: savedContent } = useQuery<any>({
    queryKey: ["/api/page-content/footer"],
  });
  const fc = { ...FOOTER_DEFAULTS, ...(savedContent || {}) };

  return (
    <footer className="bg-slate-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Ship className="w-8 h-8 text-crypto-blue" />
              <div>
                <div className="text-lg font-bold leading-tight">{fc.companyName}</div>
                <div className="text-xs text-slate-400">{fc.companyTagline}</div>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm">
              {fc.companyDescription}
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              {fc.address1 && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                  <span>{fc.address1}</span>
                </div>
              )}
              {fc.address2 && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                  <span>{fc.address2}</span>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              {fc.phone1 && (
                <a href={`tel:${fc.phone1.replace(/\s/g, "")}`} className="flex items-center gap-2 text-slate-400 hover:text-crypto-blue transition-colors">
                  <Phone className="w-4 h-4" /> {fc.phone1}
                </a>
              )}
              {fc.phone2 && (
                <a href={`tel:${fc.phone2.replace(/\s/g, "")}`} className="flex items-center gap-2 text-slate-400 hover:text-crypto-blue transition-colors">
                  <Phone className="w-4 h-4" /> {fc.phone2}
                </a>
              )}
              {fc.phone3 && (
                <a href={`tel:${fc.phone3.replace(/\s/g, "")}`} className="flex items-center gap-2 text-slate-400 hover:text-crypto-blue transition-colors">
                  <Phone className="w-4 h-4" /> {fc.phone3}
                </a>
              )}
            </div>
            {/* Social Media Links */}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-medium">Follow Us</p>
              <div className="flex gap-1 flex-wrap">
                {SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    data-testid={`social-${label.toLowerCase().replace(/[^a-z]/g, "")}`}
                    className={`w-9 h-9 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 ${color} hover:border-slate-500 hover:bg-slate-600 transition-all`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li>
                <Link href="/marketplace?type=SHIPPING_SERVICE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-cargo">
                    Cargo Services
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?type=SHIPPING_SERVICE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-consolidation">
                    Cargo Consolidation
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?type=SHIPPING_SERVICE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-door-to-door">
                    Door to Door Service
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?type=SHIPPING_SERVICE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-import-export">
                    Import to Export
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/real-estate">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-real-estate">
                    Real Estate Trading
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-escrow">
                    Escrow Protection
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Operations */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Operations Base</h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                <span>Nahco Cargo Shed</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                <span>Sahco Cargo Shed</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                <span>Tin-Can Island Port</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                <span>Apapa Port</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-crypto-blue" />
                <span>Port Harcourt Port</span>
              </li>
            </ul>
            <div className="pt-2 space-y-2">
              <h5 className="text-sm font-semibold text-slate-200">Company</h5>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li>
                  <Link href="/about">
                    <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-about">About Us</span>
                  </Link>
                </li>
                <li>
                  <Link href="/blog">
                    <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-blog">Blog</span>
                  </Link>
                </li>
                <li>
                  <Link href="/careers">
                    <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-careers">Careers</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-contact">Contact</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Support & Legal</h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li>
                <Link href="/help">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-help">
                    Help Center
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-privacy">
                    Privacy Policy
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-terms">
                    Terms of Service
                  </span>
                </Link>
              </li>
            </ul>

            <div className="pt-4 bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
              <h5 className="font-semibold text-slate-200">Get a Quote</h5>
              <p className="text-slate-400 text-xs">Contact us for cargo rates, consolidation pricing, and custom shipping solutions.</p>
              <Link href="/contact">
                <Button size="sm" className="w-full bg-crypto-blue hover:bg-crypto-teal text-white text-xs mt-2" data-testid="button-footer-get-quote">
                  Contact Us Today
                </Button>
              </Link>
            </div>

            {/* WhatsApp CTA */}
            <div className="pt-4 bg-green-900/30 border border-green-700/40 rounded-lg p-4 space-y-2 text-sm">
              <h5 className="font-semibold text-green-300 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </h5>
              <p className="text-slate-400 text-xs">Property enquiries, shipping quotes, and general support — chat with us instantly.</p>
              <a
                href={fc.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-footer-whatsapp"
              >
                <Button size="sm" className="w-full bg-green-600 hover:bg-green-500 text-white text-xs mt-2">
                  {fc.phone1}
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        {/* Newsletter Section */}
        <div className="border-t border-slate-700 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
            <p className="text-slate-300 mb-4 text-sm">
              Get the latest news and shipping updates from Beagvs Marine Services
            </p>
            <div className="flex space-x-2">
              <Input 
                placeholder="Enter your email" 
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-testid="input-newsletter-email"
              />
              <Button 
                className="bg-crypto-blue hover:bg-crypto-teal whitespace-nowrap"
                data-testid="button-newsletter-subscribe"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
              <p className="text-slate-400 text-sm text-center md:text-left">
                {fc.copyrightText}
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>Lagos · Benin City · Nigeria</span>
              </div>
            </div>

            {/* Social icons row at bottom too */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-xs hidden md:block">Connect:</span>
              <div className="flex gap-2">
                {SOCIAL_LINKS.map(({ href, icon: Icon, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`text-slate-500 ${color} transition-colors`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="text-slate-500 text-xs mr-1">Supported Networks:</span>
            {[
              { label: "Pi", cls: "bg-purple-900 text-purple-300", testid: "pi" },
              { label: "TRON", cls: "bg-red-900 text-red-300", testid: "tron" },
              { label: "TON", cls: "bg-blue-900 text-blue-300", testid: "ton" },
              { label: "BNB", cls: "bg-yellow-900 text-yellow-300", testid: "bnb" },
              { label: "SOL", cls: "bg-green-900 text-green-300", testid: "sol" },
              { label: "AVAX", cls: "bg-orange-900 text-orange-300", testid: "avax" },
            ].map(({ label, cls, testid }) => (
              <span key={label} className={`${cls} px-2 py-1 rounded text-xs font-medium`} data-testid={`network-badge-${testid}`}>
                {label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-center text-slate-500 text-xs max-w-2xl mx-auto" data-testid="text-footer-pi-solution">
            Real-world utility for the Pi Network ecosystem — sign in with Pi, pay natively from your Pi Wallet, and spend Pi on escrow-protected real estate, shipping, and marketplace goods.
          </p>
        </div>
      </div>
    </footer>
  );
}
