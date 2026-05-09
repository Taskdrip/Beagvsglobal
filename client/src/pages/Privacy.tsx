import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Privacy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <section className="crypto-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-blue-100 text-lg">Effective Date: January 1, 2025 · Beagvs Marine Services Nig Ltd</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border border-slate-100 shadow-sm">
          <CardContent className="p-8 prose prose-slate max-w-none">

            <h2 className="text-xl font-bold text-slate-dark mb-3">1. Introduction</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              Beagvs Marine Services Nig Ltd ("we", "our", or "us"), a licensed freight forwarder and customs agent registered in Nigeria, is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our platform at beagvs.global or contact our offices.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">2. Information We Collect</h2>
            <p className="text-slate-medium leading-relaxed mb-3">We may collect the following categories of personal information:</p>
            <ul className="list-disc pl-6 text-slate-medium space-y-2 mb-6">
              <li><strong>Identity Data:</strong> Full name, username, date of birth, government-issued ID (for KYC verification)</li>
              <li><strong>Contact Data:</strong> Email address, phone/WhatsApp number, postal address</li>
              <li><strong>Transaction Data:</strong> Shipment details, payment records, escrow history, wallet addresses</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device identifiers, cookies and usage data</li>
              <li><strong>Profile Data:</strong> Account settings, preferences, reviews, and communications on our platform</li>
              <li><strong>KYC Data:</strong> Facial verification images and government-issued identity documents required for regulatory compliance</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-dark mb-3">3. How We Use Your Information</h2>
            <p className="text-slate-medium leading-relaxed mb-3">We use your data to:</p>
            <ul className="list-disc pl-6 text-slate-medium space-y-2 mb-6">
              <li>Process and manage freight, cargo, and shipping service bookings</li>
              <li>Perform customs clearance and comply with Nigerian Customs Service (NCS) requirements</li>
              <li>Verify your identity under Anti-Money Laundering (AML) and Know Your Customer (KYC) obligations</li>
              <li>Process cryptocurrency and fiat payments through our secure escrow system</li>
              <li>Communicate service updates, tracking information, and notifications</li>
              <li>Improve our platform, prevent fraud, and ensure platform security</li>
              <li>Comply with legal and regulatory obligations in Nigeria and applicable international trade law</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-dark mb-3">4. Legal Basis for Processing</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              We process your data on the following legal grounds: (a) performance of a contract — to provide the services you have requested; (b) legal obligation — to comply with Nigerian customs, tax, and financial regulations; (c) legitimate interests — to operate, maintain, and improve our platform; and (d) consent — where you have explicitly agreed, such as for marketing communications.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">5. Sharing Your Information</h2>
            <p className="text-slate-medium leading-relaxed mb-3">We may share your information with:</p>
            <ul className="list-disc pl-6 text-slate-medium space-y-2 mb-6">
              <li><strong>Nigeria Customs Service (NCS):</strong> As required for import/export compliance and cargo clearance</li>
              <li><strong>Shipping & Port Authorities:</strong> Including NAHCO, SAHCO, Apapa, Tin-Can Island, and Port Harcourt Port operations</li>
              <li><strong>Payment Processors:</strong> Blockchain networks and payment infrastructure providers</li>
              <li><strong>Service Providers:</strong> Third-party vendors who assist in platform operations under strict data processing agreements</li>
              <li><strong>Law Enforcement:</strong> When legally required by Nigerian law or court order</li>
            </ul>
            <p className="text-slate-medium leading-relaxed mb-6">We do not sell your personal data to third parties for marketing purposes.</p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">6. Cryptocurrency & Blockchain Data</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              Cryptocurrency wallet addresses and blockchain transaction records are inherently public on the respective blockchain networks (e.g., TRON, BNB Chain, Solana, TON, Avalanche, Pi Network). By using our crypto payment features, you acknowledge that on-chain transactions are publicly visible and immutable. We do not control blockchain data once a transaction is confirmed.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">7. Data Retention</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              We retain personal data for as long as necessary to provide our services and comply with legal obligations. Customs and shipping records are kept for a minimum of 7 years as required by Nigerian trade regulations. KYC documents are retained for 5 years after the last transaction per AML/CFT regulations. Account data is retained until account deletion plus 12 months.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">8. Your Rights</h2>
            <p className="text-slate-medium leading-relaxed mb-3">Under applicable data protection laws, you have the right to:</p>
            <ul className="list-disc pl-6 text-slate-medium space-y-2 mb-6">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal retention obligations)</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
              <li>Data portability — receive your data in a structured, machine-readable format</li>
            </ul>
            <p className="text-slate-medium mb-6">To exercise these rights, contact us at the details below.</p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">9. Cookies & Tracking</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              We use essential cookies for platform functionality (session management, authentication) and analytics cookies to understand how our platform is used. You may disable non-essential cookies through your browser settings, though this may affect platform functionality.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">10. Security</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              We implement industry-standard security measures including HTTPS encryption, secure session management, database encryption, and access controls. Our escrow system uses cryptographic verification for all transactions. However, no system is completely secure and we cannot guarantee absolute data security.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">11. Changes to This Policy</h2>
            <p className="text-slate-medium leading-relaxed mb-6">
              We may update this Privacy Policy from time to time. Material changes will be notified by email or prominent notice on our platform. Continued use of our services after such notice constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-xl font-bold text-slate-dark mb-3">12. Contact Us</h2>
            <div className="bg-slate-50 rounded-lg p-5 text-slate-medium text-sm space-y-1">
              <p className="font-semibold text-slate-dark">Beagvs Marine Services Nig Ltd</p>
              <p>Head Office: No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos</p>
              <p>Branch Office: No 21, Nevis Street, off Mission Road, Benin City, Edo State</p>
              <p>Phone: +234 803 723 2210 · +234 815 557 6539 · +234 802 752 9083</p>
            </div>

          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
