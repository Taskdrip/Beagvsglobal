import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Lock,
  CreditCard,
  Truck,
  Zap,
  Award,
  DollarSign
} from "lucide-react";
import marketplaceHeroImage from "@assets/generated_images/Secure_crypto_marketplace_hero_6091395a.png";
import escrowSystemImage from "@assets/generated_images/Escrow_protection_system_illustration_d3a358c2.png";
import globalServicesImage from "@assets/generated_images/Global_marketplace_services_illustration_b30909d5.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 crypto-gradient text-white overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
                The World's Premier <br />
                <span className="text-blue-200">Crypto & Fiat</span> <br />
                Marketplace
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Buy, sell, and trade real estate, shipping services, and products with advanced cryptocurrency and traditional payment options. Every transaction is protected by our military-grade escrow system.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="bg-white text-crypto-blue hover:bg-blue-50 font-semibold px-8 py-4"
                    data-testid="button-get-started"
                  >
                    Start Trading Now
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-crypto-blue font-semibold px-8 py-4 transition-all duration-300"
                    data-testid="button-explore-marketplace"
                  >
                    Explore Marketplace
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-volume">$50M+</div>
                  <div className="text-blue-200 text-sm">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-users">25K+</div>
                  <div className="text-blue-200 text-sm">Verified Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-countries">180+</div>
                  <div className="text-blue-200 text-sm">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" data-testid="stats-success">99.8%</div>
                  <div className="text-blue-200 text-sm">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={marketplaceHeroImage} 
                alt="Secure Crypto Marketplace Platform" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="img-hero"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-slate-dark">Military-Grade Security</span>
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

      {/* Payment Methods Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Comprehensive Payment Solutions</h2>
            <p className="text-xl text-slate-medium max-w-4xl mx-auto">
              Accept payments in multiple cryptocurrencies and traditional currencies, giving you maximum flexibility and global reach.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Cryptocurrency Options */}
            <Card className="border-2 border-crypto-blue/20 hover:border-crypto-blue/40 transition-all duration-300">
              <CardHeader className="text-center">
                <Coins className="w-12 h-12 text-crypto-blue mx-auto mb-4" />
                <CardTitle className="text-xl">Cryptocurrency Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">Pi Network</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">π</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">USDT (TRON)</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">TRC20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">USDT (TON)</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">TON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">USDT (BNB)</span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">BEP20</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">USDT (Solana)</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">SOL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">USDT (Avalanche)</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">AVAX</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fiat Currency Options */}
            <Card className="border-2 border-green-200 hover:border-green-400 transition-all duration-300">
              <CardHeader className="text-center">
                <CreditCard className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Traditional Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">US Dollar</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">USD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">Euro</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">EUR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">British Pound</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">GBP</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">Canadian Dollar</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">CAD</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">Nigerian Naira</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">NGN</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-medium">Bank Transfer</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card className="border-2 border-amber-200 hover:border-amber-400 transition-all duration-300">
              <CardHeader className="text-center">
                <Lock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                <CardTitle className="text-xl">Security Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">KYC Verification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">2FA Authentication</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">Smart Contract Audits</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">Insurance Protection</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">24/7 Monitoring</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-slate-medium">Cold Storage</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-6">Military-Grade Security & Escrow Protection</h2>
            <p className="text-xl text-slate-medium max-w-4xl mx-auto leading-relaxed">
              Every transaction on RealShipEX is secured with bank-level encryption and our advanced escrow system. 
              Your funds are protected until delivery confirmation, ensuring complete peace of mind for all parties.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src={escrowSystemImage} 
                alt="Advanced Escrow Protection System" 
                className="rounded-2xl shadow-xl w-full h-auto"
                data-testid="img-escrow-system"
              />
            </div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <Shield className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">Multi-Signature Escrow</h3>
                  <p className="text-slate-medium">
                    Funds are held in secure multi-signature wallets requiring buyer, seller, and platform confirmation before release.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Lock className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">Bank-Level Encryption</h3>
                  <p className="text-slate-medium">
                    All transactions and personal data are protected with AES-256 encryption and secure socket layer (SSL) technology.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Award className="w-8 h-8 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">Dispute Resolution</h3>
                  <p className="text-slate-medium">
                    Professional arbitration team available 24/7 to resolve disputes fairly and efficiently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Marketplace Services */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Global Marketplace Categories</h2>
            <p className="text-xl text-slate-medium max-w-4xl mx-auto">
              From luxury real estate to international shipping services, discover opportunities across multiple industries with secure transactions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <img 
                src={globalServicesImage} 
                alt="Global Marketplace Services" 
                className="rounded-2xl shadow-xl w-full h-auto"
                data-testid="img-global-services"
              />
            </div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <Home className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">Premium Real Estate</h3>
                  <p className="text-slate-medium">
                    Luxury properties, commercial real estate, and land investments available for cryptocurrency and traditional payments.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Truck className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">Global Shipping Services</h3>
                  <p className="text-slate-medium">
                    Professional freight forwarding, cargo shipping, and logistics services connecting you to worldwide markets.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <Globe className="w-8 h-8 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-dark mb-3">International Trade</h3>
                  <p className="text-slate-medium">
                    Products and services from verified sellers worldwide, with secure payment processing and escrow protection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow Process */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">How Our Escrow System Works</h2>
            <p className="text-xl text-slate-medium">
              Simple, secure, and transparent process that protects both buyers and sellers
            </p>
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
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-6">Trusted by Thousands Worldwide</h2>
            <p className="text-xl text-slate-medium">Join a growing community of verified traders and businesses</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-crypto-blue mb-2" data-testid="stat-transactions">$50M+</div>
              <p className="text-slate-medium">Total Volume Traded</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2" data-testid="stat-users">25,000+</div>
              <p className="text-slate-medium">Verified Users</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2" data-testid="stat-countries">180+</div>
              <p className="text-slate-medium">Countries Served</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2" data-testid="stat-success">99.8%</div>
              <p className="text-slate-medium">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose RealShipEX */}
      <section className="py-20 bg-gradient-to-r from-crypto-blue to-crypto-teal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Why Choose RealShipEX?</h2>
            <p className="text-xl text-blue-100 max-w-4xl mx-auto">
              We're revolutionizing global commerce with cutting-edge technology, unmatched security, and exceptional service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-6 text-yellow-300" />
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-blue-100">
                Instant crypto transactions and rapid fiat processing. Experience the fastest marketplace in the industry.
              </p>
            </div>
            
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-6 text-green-300" />
              <h3 className="text-xl font-semibold mb-4">Global Community</h3>
              <p className="text-blue-100">
                Connect with verified buyers and sellers from 180+ countries. Expand your business globally with confidence.
              </p>
            </div>
            
            <div className="text-center">
              <Star className="w-12 h-12 mx-auto mb-6 text-purple-300" />
              <h3 className="text-xl font-semibold mb-4">Premium Support</h3>
              <p className="text-blue-100">
                24/7 customer support, dedicated account managers, and comprehensive dispute resolution services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Start Trading?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of successful traders and businesses who trust RealShipEX for their global commerce needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-crypto-blue hover:bg-crypto-teal text-white font-semibold px-8 py-4"
                data-testid="button-cta-signup"
              >
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-slate-900 font-semibold px-8 py-4"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}