import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { 
  Globe,
  Home,
  Ship,
  Store,
  Shield,
  Users,
  Coins,
  Star,
  MapPin,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import luxuryHomeImage from "@assets/generated_images/Luxury_home_exterior_dceccac4.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="crypto-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left" data-testid="hero-content">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Crypto-Powered<br />
                <span className="text-blue-200">Real Estate</span> &<br />
                <span className="text-teal-200">Global Shipping</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl">
                Seamlessly buy, sell, and ship with Pi and other cryptocurrencies. Protected by built-in escrow and backed by our global network.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/marketplace">
                  <Button 
                    size="lg" 
                    className="button-primary font-semibold"
                    data-testid="button-explore-marketplace"
                  >
                    Explore Marketplace
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="button-white font-semibold"
                    data-testid="button-start-selling"
                  >
                    Start Selling
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-8 mt-12">
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-listings">2,847</div>
                  <div className="text-blue-200 text-sm">Active Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-escrow">$1.2M+</div>
                  <div className="text-blue-200 text-sm">In Escrow</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-users">15K+</div>
                  <div className="text-blue-200 text-sm">Global Users</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={luxuryHomeImage} 
                alt="Modern luxury real estate property" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="img-hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-slate-dark">Escrow Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Explore Our Marketplace</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Trade real estate, ship globally, and exchange goods with cryptocurrency protection
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Real Estate Category */}
            <Link href="/marketplace?type=REAL_ESTATE">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-crypto-blue/30" data-testid="card-real-estate">
                <div className="overflow-hidden rounded-t-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Luxury residential property with pool" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Home className="w-5 h-5 text-crypto-blue" />
                    <h3 className="text-xl font-semibold text-slate-dark">Real Estate</h3>
                  </div>
                  <p className="text-slate-medium mb-4">
                    Buy and sell properties worldwide with cryptocurrency. From residential to commercial investments.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-medium">847 Properties</span>
                    <ArrowRight className="w-4 h-4 text-crypto-blue group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Shipping Services Category */}
            <Link href="/marketplace?type=SHIPPING_SERVICE">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-crypto-blue/30" data-testid="card-shipping">
                <div className="overflow-hidden rounded-t-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=300&fit=crop&crop=center" 
                    alt="Modern shipping containers and cargo logistics" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&h=300&fit=crop&crop=center";
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Ship className="w-5 h-5 text-crypto-blue" />
                    <h3 className="text-xl font-semibold text-slate-dark">Global Shipping</h3>
                  </div>
                  <p className="text-slate-medium mb-4">
                    Freight forwarding and shipping services worldwide. Move cargo, goods, and parcels globally.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-medium">324 Services</span>
                    <ArrowRight className="w-4 h-4 text-crypto-blue group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Marketplace Products Category */}
            <Link href="/marketplace?type=PRODUCT">
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-100 hover:border-crypto-blue/30" data-testid="card-products">
                <div className="overflow-hidden rounded-t-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300" 
                    alt="Diverse marketplace products and goods" 
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Store className="w-5 h-5 text-crypto-blue" />
                    <h3 className="text-xl font-semibold text-slate-dark">Products & Services</h3>
                  </div>
                  <p className="text-slate-medium mb-4">
                    Trade goods and services with cryptocurrency. From electronics to consulting services.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-medium">1,676 Items</span>
                    <ArrowRight className="w-4 h-4 text-crypto-blue group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Escrow Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Secure Escrow Protection</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Every transaction is protected by our comprehensive escrow system with manual verification
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-dark text-lg mb-2">100% Escrow Protection</h3>
                  <p className="text-slate-medium">Your funds are held safely until the transaction is complete. Full refund if terms aren't met.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-crypto-blue rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-dark text-lg mb-2">Manual Verification</h3>
                  <p className="text-slate-medium">Our team manually verifies every transaction and blockchain payment for maximum security.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-dark text-lg mb-2">Multi-Crypto Support</h3>
                  <p className="text-slate-medium">Accept Pi, USDT on multiple networks (TRON, TON, BNB, SOL, AVAX) with transparent fees.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <div>
                  <h3 className="font-semibold text-slate-dark">Escrow Created</h3>
                  <p className="text-slate-medium text-sm">Buyer initiates secure escrow with platform protection</p>
                </div>
              </div>
              <div className="ml-5 h-8 w-0.5 bg-slate-200"></div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <div>
                  <h3 className="font-semibold text-slate-dark">Funds Deposited</h3>
                  <p className="text-slate-medium text-sm">Payment sent to platform wallet and verified by admin</p>
                </div>
              </div>
              <div className="ml-5 h-8 w-0.5 bg-slate-200"></div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-crypto-blue text-white rounded-full flex items-center justify-center font-semibold">3</div>
                <div>
                  <h3 className="font-semibold text-slate-dark">Service Delivered</h3>
                  <p className="text-slate-medium text-sm">Seller provides service/product, buyer confirms receipt</p>
                </div>
              </div>
              <div className="ml-5 h-8 w-0.5 bg-slate-200"></div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">4</div>
                <div>
                  <h3 className="font-semibold text-slate-dark">Escrow Released</h3>
                  <p className="text-slate-medium text-sm">Admin releases payment to seller (10% platform fee)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="crypto-gradient rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="text-2xl lg:text-3xl font-bold mb-6">Ready to get started?</h3>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Join thousands of users trading real estate and shipping services with cryptocurrency protection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6" />
                <span className="font-semibold">Secure Escrow</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-6 h-6" />
                <span className="font-semibold">Global Reach</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coins className="w-6 h-6" />
                <span className="font-semibold">Multi-Crypto</span>
              </div>
            </div>
            <div className="mt-8">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="button-primary font-semibold"
                  data-testid="button-create-account"
                >
                  Create Free Account
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
