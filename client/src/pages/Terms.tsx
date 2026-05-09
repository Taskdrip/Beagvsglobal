import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function Terms() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <section className="crypto-gradient text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-blue-100 text-lg">Effective Date: January 1, 2025 · Beagvs Marine Services Nig Ltd</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border border-slate-100 shadow-sm">
          <CardContent className="p-8 space-y-8">

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">1. Acceptance of Terms</h2>
              <p className="text-slate-medium leading-relaxed">
                By accessing or using the Beagvs Marine Services Nig Ltd platform (beagvs.global), creating an account, or engaging any of our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our platform or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">2. Company Information</h2>
              <p className="text-slate-medium leading-relaxed">
                Beagvs Marine Services Nig Ltd is a licensed freight forwarder and customs agent incorporated in Nigeria. We operate from our head office in Ikorodu, Lagos, and branch office in Benin City, with operational presence at Nahco Cargo Shed, Sahco Cargo Shed, Tin-Can Island Port, Apapa Port, and Port Harcourt Port.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">3. Services Provided</h2>
              <p className="text-slate-medium leading-relaxed mb-3">Our platform facilitates:</p>
              <ul className="list-disc pl-6 text-slate-medium space-y-2">
                <li><strong>Cargo Services:</strong> Air and sea freight handling for all cargo types</li>
                <li><strong>Cargo Consolidation:</strong> LCL groupage and consolidation services</li>
                <li><strong>Door-to-Door Delivery:</strong> Complete logistics from origin pickup to destination delivery</li>
                <li><strong>Import/Export Services:</strong> Customs clearance, documentation, and compliance</li>
                <li><strong>Real Estate Listings:</strong> Property trading facilitated through our marketplace</li>
                <li><strong>Escrow Protection:</strong> Secure cryptocurrency and fiat payment holding pending transaction completion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">4. User Accounts</h2>
              <p className="text-slate-medium leading-relaxed mb-3">
                You must create an account to access platform features. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-slate-medium space-y-2">
                <li>Providing accurate, current, and complete registration information</li>
                <li>Maintaining the confidentiality of your account password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorised account access</li>
                <li>Completing KYC (Know Your Customer) verification when required for transacting on the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">5. Escrow System</h2>
              <p className="text-slate-medium leading-relaxed mb-3">Our escrow service operates as follows:</p>
              <ul className="list-disc pl-6 text-slate-medium space-y-2">
                <li>Buyer funds are held in escrow upon transaction initiation</li>
                <li>Funds are released to the seller only upon confirmed delivery/completion</li>
                <li>Disputes must be raised within 48 hours of the expected delivery date</li>
                <li>Our team will mediate disputes; decisions are binding on both parties</li>
                <li>A platform fee of 10% applies to all completed escrow transactions</li>
                <li>Cryptocurrency transactions are irreversible once confirmed on-chain; escrow prevents premature release</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">6. Cryptocurrency Payments</h2>
              <p className="text-slate-medium leading-relaxed mb-3">
                We support Pi Network, USDT on TRON/TON/BNB/Solana/Avalanche, and other approved cryptocurrencies. By using crypto payments, you acknowledge:
              </p>
              <ul className="list-disc pl-6 text-slate-medium space-y-2">
                <li>Cryptocurrency values can fluctuate; prices are locked at the time of escrow funding</li>
                <li>Blockchain transactions are irreversible once confirmed</li>
                <li>You are responsible for ensuring you send to the correct wallet address</li>
                <li>We are not liable for losses from user error in cryptocurrency transfers</li>
                <li>Anti-money laundering (AML) checks apply to all transactions above regulatory thresholds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">7. Customs & Regulatory Compliance</h2>
              <p className="text-slate-medium leading-relaxed">
                All import and export transactions are subject to Nigerian Customs Service (NCS) regulations, NAFDAC requirements where applicable, SON standards, and international trade laws including ECOWAS protocols. Users must provide accurate cargo descriptions and valuations. Providing false declarations is a criminal offence. We are not liable for delays, fines, or seizures resulting from inaccurate user-provided documentation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">8. Prohibited Uses</h2>
              <p className="text-slate-medium leading-relaxed mb-3">You may not use our platform to:</p>
              <ul className="list-disc pl-6 text-slate-medium space-y-2">
                <li>Ship prohibited or restricted goods (narcotics, weapons, counterfeit goods, etc.)</li>
                <li>Launder money or facilitate financial crime</li>
                <li>Provide false customs declarations or shipping documentation</li>
                <li>Engage in fraudulent transactions or impersonate others</li>
                <li>Circumvent our escrow system through off-platform payments</li>
                <li>Use our platform for any unlawful purpose under Nigerian law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">9. Limitation of Liability</h2>
              <p className="text-slate-medium leading-relaxed">
                Beagvs Marine Services Nig Ltd is not liable for: delays caused by port congestion or force majeure events; losses resulting from inaccurate documentation provided by the user; market fluctuations in cryptocurrency value; actions of third-party carriers or port authorities; or indirect, incidental, or consequential damages. Our maximum liability for any claim is limited to the amount paid for the specific service in question.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">10. Governing Law</h2>
              <p className="text-slate-medium leading-relaxed">
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of Nigerian courts. For cross-border matters, the ECOWAS Trade Liberalisation Scheme and applicable bilateral trade treaties shall apply.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">11. Changes to Terms</h2>
              <p className="text-slate-medium leading-relaxed">
                We reserve the right to modify these Terms at any time. Material changes will be communicated via email or platform notice at least 14 days before taking effect. Continued use of the platform after the effective date constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-dark mb-3">12. Contact</h2>
              <div className="bg-slate-50 rounded-lg p-5 text-slate-medium text-sm space-y-1">
                <p className="font-semibold text-slate-dark">Beagvs Marine Services Nig Ltd</p>
                <p>Head Office: No 24, 1st Avenue Ottooba, Great Estate, Bagidan Ijede, Ikorodu, Lagos</p>
                <p>Branch Office: No 21, Nevis Street, off Mission Road, Benin City, Edo State</p>
                <p>Phone: +234 803 723 2210 · +234 815 557 6539 · +234 802 752 9083</p>
              </div>
            </section>

          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
