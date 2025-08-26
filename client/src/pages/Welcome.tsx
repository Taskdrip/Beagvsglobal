import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { Globe, Shield, Coins, Users, CheckCircle } from "lucide-react";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="w-12 h-12 text-crypto-blue" />
            <span className="text-3xl font-bold text-slate-dark">RealShipEX</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl font-bold text-slate-dark">Welcome to the Community!</h1>
          </div>
        </div>

        {/* Welcome Message */}
        <Card className="shadow-lg border border-slate-100 mb-8">
          <CardContent className="p-8">
            <div className="prose max-w-none" data-testid="welcome-content">
              <p className="text-lg text-slate-dark mb-6 leading-relaxed">
                Welcome to the RealShipEX community!
              </p>
              
              <p className="text-slate-medium mb-4 leading-relaxed">
                Here, selling or acquiring real estate with Pi and other cryptocurrencies is seamless. We also power global freight forwarding—shipping your products, cargo, goods, and parcels worldwide, with crypto-first escrow.
              </p>
              
              <p className="text-slate-medium mb-4 leading-relaxed">
                Explore the marketplace, list your properties or services, and trade goods/services for Pi or USDT across multiple networks. Your deals are protected by our built-in escrow and review system.
              </p>
              
              <p className="text-slate-medium font-medium">
                — Team RealShipEX
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center border border-slate-100" data-testid="card-escrow-protection">
            <CardContent className="p-6">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-dark mb-2">Escrow Protection</h3>
              <p className="text-sm text-slate-medium">
                Every transaction is secured with our comprehensive escrow system and manual verification.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-slate-100" data-testid="card-multi-crypto">
            <CardContent className="p-6">
              <Coins className="w-12 h-12 text-crypto-blue mx-auto mb-4" />
              <h3 className="font-semibold text-slate-dark mb-2">Multi-Crypto Support</h3>
              <p className="text-sm text-slate-medium">
                Trade with Pi, USDT across TRON, TON, BNB, Solana, and Avalanche networks.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-slate-100" data-testid="card-global-community">
            <CardContent className="p-6">
              <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-dark mb-2">Global Community</h3>
              <p className="text-sm text-slate-medium">
                Connect with buyers and sellers worldwide through our social marketplace features.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Steps */}
        <Card className="shadow-lg border border-slate-100 mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-dark mb-6 text-center">Get Started in 3 Steps</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <div>
                  <h3 className="font-semibold text-slate-dark mb-1">Set Up Your Wallet</h3>
                  <p className="text-slate-medium text-sm">Add your cryptocurrency wallet addresses to start receiving payments securely.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <div>
                  <h3 className="font-semibold text-slate-dark mb-1">Explore or List</h3>
                  <p className="text-slate-medium text-sm">Browse the marketplace for opportunities or create your first listing to start selling.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <div>
                  <h3 className="font-semibold text-slate-dark mb-1">Trade Safely</h3>
                  <p className="text-slate-medium text-sm">Use our escrow system for secure transactions and build your reputation with reviews.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard">
            <Button 
              size="lg" 
              className="bg-crypto-blue hover:bg-crypto-teal font-semibold"
              data-testid="button-go-to-dashboard"
            >
              Go to Dashboard
            </Button>
          </Link>
          
          <Link href="/marketplace">
            <Button 
              size="lg" 
              variant="outline" 
              className="border-crypto-blue text-crypto-blue hover:bg-crypto-blue hover:text-white font-semibold"
              data-testid="button-explore-marketplace"
            >
              Explore Marketplace
            </Button>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-slate-medium mb-4">Need help getting started?</p>
          <Link href="/contact">
            <Button 
              variant="ghost" 
              className="text-crypto-blue hover:text-crypto-teal"
              data-testid="button-contact-support"
            >
              Contact Support
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
