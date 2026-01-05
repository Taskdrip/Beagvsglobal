import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  Globe,
  Twitter,
  Linkedin,
  Github,
  MessageCircle,
  Mail,
  MapPin
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-crypto-blue" />
              <span className="text-xl font-bold">Beagvs Global</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The world's first crypto-powered marketplace for real estate and global shipping services.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-slate-400 hover:text-crypto-blue"
                data-testid="social-twitter"
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-slate-400 hover:text-crypto-blue"
                data-testid="social-linkedin"
              >
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-slate-400 hover:text-crypto-blue"
                data-testid="social-telegram"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-slate-400 hover:text-crypto-blue"
                data-testid="social-github"
              >
                <Github className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link href="/marketplace?type=REAL_ESTATE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-real-estate">
                    Real Estate Trading
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/marketplace?type=SHIPPING_SERVICE">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-shipping">
                    Global Shipping
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
              <li>
                <Link href="/about">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-crypto-support">
                    Multi-Crypto Support
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link href="/about">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-about">
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/blog">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-blog">
                    Blog
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-careers">
                    Careers
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-contact">
                    Contact
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-3 text-slate-300">
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
              <li>
                <Link href="/api-docs">
                  <span className="hover:text-crypto-blue transition-colors cursor-pointer" data-testid="footer-link-api">
                    API Documentation
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter Section */}
        <div className="border-t border-slate-700 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
            <p className="text-slate-300 mb-4 text-sm">
              Get the latest news and updates from Beagvs Global
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
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <p className="text-slate-400 text-sm">
                © 2024 Beagvs Global. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>Global Operations</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <span className="text-slate-400 text-sm">Supported Networks:</span>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-pi">
                  Pi
                </span>
                <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-tron">
                  TRON
                </span>
                <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-ton">
                  TON
                </span>
                <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-bnb">
                  BNB
                </span>
                <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-sol">
                  SOL
                </span>
                <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded text-xs font-medium" data-testid="network-badge-avax">
                  AVAX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
