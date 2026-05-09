import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  HelpCircle, Package, Ship, FileText, CreditCard, Shield,
  ChevronDown, ChevronUp, Phone, Mail, MessageCircle, MapPin
} from "lucide-react";

const faqs = [
  {
    category: "Cargo & Shipping",
    icon: <Ship className="w-5 h-5 text-crypto-blue" />,
    items: [
      {
        q: "What types of cargo do you handle?",
        a: "Beagvs Marine Services handles all categories of cargo including general merchandise, electronics, vehicles, perishables, dangerous goods (with special permits), and bulk commodities — via both air and sea freight."
      },
      {
        q: "How does cargo consolidation (LCL) work?",
        a: "Less-than-Container-Load (LCL) consolidation groups your cargo with other shipments into one full container. This dramatically reduces costs for smaller shipments. We handle all groupage at our Nahco, Sahco, Tin-Can Island, and Apapa locations."
      },
      {
        q: "Do you offer door-to-door delivery?",
        a: "Yes. Our door-to-door service covers collection from the origin, all port/customs procedures, and final delivery to the destination address anywhere in Nigeria. Just provide us the pickup and delivery addresses."
      },
      {
        q: "How long does customs clearance take?",
        a: "Standard clearance typically takes 2–5 working days depending on cargo type, documentation completeness, and port congestion. With all papers in order, we often clear within 24–48 hours at Apapa and Tin-Can Island ports."
      },
    ]
  },
  {
    category: "Payments & Pricing",
    icon: <CreditCard className="w-5 h-5 text-crypto-blue" />,
    items: [
      {
        q: "How do I get a shipping quote?",
        a: "Contact us via phone (+234 803 723 2210, +234 815 557 6539, or +234 802 752 9083) or use the contact form on this site. Provide cargo type, weight/volume, origin, and destination for an accurate quote within 24 hours."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept bank transfers, cash, and cryptocurrency payments including Pi Network, USDT (TRON, TON, BNB, Solana, Avalanche), and other major cryptocurrencies — all secured through our escrow system."
      },
      {
        q: "What does escrow protection mean for my payment?",
        a: "Escrow holds your payment securely until both parties confirm the service is delivered as agreed. Funds are only released to the service provider once you confirm satisfactory completion — protecting both buyers and sellers."
      },
      {
        q: "Are there hidden fees?",
        a: "No. We provide a clear, itemised quote before any work begins. Freight charges, customs duties, handling fees, and our service commission are all disclosed upfront. Duties and levies are government charges outside our control."
      },
    ]
  },
  {
    category: "Documentation & Customs",
    icon: <FileText className="w-5 h-5 text-crypto-blue" />,
    items: [
      {
        q: "What documents do I need for import clearance?",
        a: "Typically: Bill of Lading or Airway Bill, Commercial Invoice, Packing List, Form M (for imports above ₦2 million), NAFDAC approval (for food/drugs), SONCAP certificate (for regulated goods), and SON product registration where applicable."
      },
      {
        q: "Can you help with export documentation?",
        a: "Yes. We prepare and process all export documentation including the Combined Certificate of Value and Origin (CCVO), NXP Form, phytosanitary certificates, and SON/NAFDAC export waivers where required."
      },
      {
        q: "What happens if my goods are seized at the port?",
        a: "Our experienced customs team works swiftly to resolve any holds — whether due to documentation gaps, duty disputes, or prohibited item queries. We liaise directly with Nigeria Customs Service (NCS) officers on your behalf."
      },
    ]
  },
  {
    category: "Account & Platform",
    icon: <Shield className="w-5 h-5 text-crypto-blue" />,
    items: [
      {
        q: "How do I create an account?",
        a: "Click 'Get Started' or 'Sign Up' on any page. Fill in your name, email, and create a password. No Replit or third-party account is needed — just your email and password."
      },
      {
        q: "How do I track my shipment?",
        a: "After booking, you'll receive a tracking number. Visit the Track page and enter your tracking number for real-time status updates on your shipment."
      },
      {
        q: "I forgot my password. What do I do?",
        a: "On the login page, click 'Forgot password?' to request a password reset link sent to your registered email address."
      },
      {
        q: "How do I list a service on the marketplace?",
        a: "After creating an account and completing your profile (including KYC verification for sellers), click 'Sell' in the navigation and follow the listing wizard to add your cargo or shipping service."
      },
    ]
  },
];

export default function Help() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* Hero */}
      <section className="crypto-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Find answers to common questions about Beagvs Marine Services — cargo, customs, payments, and your account.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* FAQ Sections */}
        {faqs.map((section) => (
          <div key={section.category} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-slate-dark">{section.category}</h2>
            </div>
            <Card className="border border-slate-100 shadow-sm">
              <CardContent className="p-0 divide-y divide-slate-100">
                {section.items.map((item, i) => {
                  const key = `${section.category}-${i}`;
                  const isOpen = openItems[key];
                  return (
                    <div key={key} className="p-5">
                      <button
                        className="w-full flex items-center justify-between text-left gap-4"
                        onClick={() => toggle(key)}
                        data-testid={`faq-toggle-${key}`}
                      >
                        <span className="font-semibold text-slate-dark">{item.q}</span>
                        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                      </button>
                      {isOpen && (
                        <p className="text-slate-medium text-sm mt-3 leading-relaxed">{item.a}</p>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Still need help */}
        <Card className="crypto-gradient text-white mt-12">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
            <p className="text-blue-100 mb-6">Our team is available Monday–Friday 8 AM–6 PM and Saturday 9 AM–3 PM.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <a href="tel:+2348037232210" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium">
                <Phone className="w-4 h-4" /> +234 803 723 2210
              </a>
              <a href="tel:+2348155576539" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium">
                <Phone className="w-4 h-4" /> +234 815 557 6539
              </a>
              <a href="tel:+2348027529083" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-lg font-medium">
                <Phone className="w-4 h-4" /> +234 802 752 9083
              </a>
            </div>
            <Link href="/contact">
              <Button className="bg-white text-crypto-blue hover:bg-blue-50 font-semibold" data-testid="button-help-contact">
                Send a Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
