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
  Twitter
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="crypto-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Globe className="w-12 h-12" />
            <span className="text-3xl font-bold">Beagvs Global</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6" data-testid="text-about-title">
            Building the Future of<br />
            <span className="text-blue-200">Crypto Commerce</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            We're revolutionizing how people buy, sell, and ship globally with cryptocurrency, 
            creating a world-class SocialFi marketplace for real estate and logistics.
          </p>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="w-16 h-16 text-crypto-blue mx-auto mb-8" />
          <h2 className="text-3xl font-bold text-slate-dark mb-6" data-testid="text-mission-title">Our Mission</h2>
          <p className="text-xl text-slate-medium leading-relaxed" data-testid="text-mission-content">
            We're building a world-class SocialFi marketplace where crypto enthusiasts can acquire real estate, 
            ship globally, and exchange goods/services with crypto, protected by escrow. Our platform bridges 
            traditional commerce with the future of decentralized finance.
          </p>
        </div>
      </section>

      {/* Founders Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-dark mb-4">Meet Our Founders</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              Experienced leaders bringing decades of expertise in real estate, blockchain technology, and global commerce.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Founder */}
            <Card className="shadow-lg border border-slate-100" data-testid="card-founder-ceo">
              <CardContent className="p-8 text-center lg:text-left">
                <div className="mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400" 
                    alt="Mr. Godspower Asemota - Founder & CEO" 
                    className="w-48 h-48 rounded-2xl mx-auto lg:mx-0 object-cover shadow-lg"
                    data-testid="img-founder-ceo"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-dark mb-2">Mr. Godspower Asemota</h3>
                  <p className="text-crypto-blue font-semibold mb-4 text-lg">Founder & CEO</p>
                  <p className="text-slate-medium leading-relaxed mb-6" data-testid="text-founder-ceo-bio">
                    Real estate entrepreneur with over two decades in the industry and freight forwarding. 
                    Godspower brings extensive experience in international trade and property development 
                    to revolutionize how we transact with cryptocurrency. His vision drives our mission 
                    to make crypto-powered real estate accessible to everyone.
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
            
            {/* Co-Founder */}
            <Card className="shadow-lg border border-slate-100" data-testid="card-founder-cto">
              <CardContent className="p-8 text-center lg:text-left">
                <div className="mb-6">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400" 
                    alt="Abraham Tahbat - Co-Founder & CTO" 
                    className="w-48 h-48 rounded-2xl mx-auto lg:mx-0 object-cover shadow-lg"
                    data-testid="img-founder-cto"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-dark mb-2">Abraham Tahbat</h3>
                  <p className="text-crypto-blue font-semibold mb-4 text-lg">Co-Founder & CTO</p>
                  <p className="text-slate-medium leading-relaxed mb-6" data-testid="text-founder-cto-bio">
                    Lawyer and web developer with 12+ years in blockchain, tech-preneurship, and web3. 
                    Abraham leads our technical vision and ensures our platform meets the highest standards 
                    of security and compliance in the crypto space. His expertise in both law and technology 
                    ensures Beagvs Global operates within regulatory frameworks while pushing innovation.
                  </p>
                  <div className="flex justify-center lg:justify-start space-x-4">
                    <Button variant="ghost" size="sm" className="p-2" data-testid="button-cto-linkedin">
                      <Linkedin className="w-5 h-5 text-slate-400 hover:text-crypto-blue" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2" data-testid="button-cto-twitter">
                      <Twitter className="w-5 h-5 text-slate-400 hover:text-crypto-blue" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Our Core Values</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              The principles that guide everything we do at Beagvs Global
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border border-slate-100" data-testid="card-value-security">
              <CardContent className="p-8">
                <Shield className="w-16 h-16 text-green-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">Security First</h3>
                <p className="text-slate-medium">
                  Every transaction is protected by our comprehensive escrow system with manual verification, 
                  ensuring your funds and deals are always secure.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-slate-100" data-testid="card-value-innovation">
              <CardContent className="p-8">
                <TrendingUp className="w-16 h-16 text-crypto-blue mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">Innovation</h3>
                <p className="text-slate-medium">
                  We continuously push the boundaries of what's possible in crypto commerce, 
                  bringing cutting-edge solutions to traditional markets.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border border-slate-100" data-testid="card-value-community">
              <CardContent className="p-8">
                <Users className="w-16 h-16 text-purple-500 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-slate-dark mb-4">Global Community</h3>
                <p className="text-slate-medium">
                  Building bridges between crypto enthusiasts worldwide, fostering trust and 
                  enabling seamless international commerce.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Why Choose Beagvs Global?</h2>
            <p className="text-xl text-slate-medium max-w-3xl mx-auto">
              We offer unique advantages that set us apart in the crypto marketplace space
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-dark text-lg mb-2">Escrow Protection</h3>
                  <p className="text-slate-medium">
                    Every transaction is secured with our comprehensive escrow system, protecting both buyers and sellers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-crypto-blue rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-dark text-lg mb-2">Multi-Crypto Support</h3>
                  <p className="text-slate-medium">
                    Accept payments in Pi, USDT across multiple networks including TRON, TON, BNB, Solana, and Avalanche.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-dark text-lg mb-2">Global Reach</h3>
                  <p className="text-slate-medium">
                    Connect with buyers and sellers worldwide, breaking down geographical barriers in commerce.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-dark text-lg mb-2">Social Features</h3>
                  <p className="text-slate-medium">
                    Build your reputation, follow trusted sellers, and communicate directly through our integrated messaging system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Global crypto commerce" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="img-platform-features"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-dark mb-4">Our Impact</h2>
            <p className="text-xl text-slate-medium">
              Building trust and enabling commerce across the globe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="stat-transactions">
              <div className="text-4xl font-bold text-crypto-blue mb-2">$1.2M+</div>
              <p className="text-slate-medium">Total Transactions</p>
            </div>
            <div className="text-center" data-testid="stat-users">
              <div className="text-4xl font-bold text-crypto-blue mb-2">15,000+</div>
              <p className="text-slate-medium">Global Users</p>
            </div>
            <div className="text-center" data-testid="stat-countries">
              <div className="text-4xl font-bold text-crypto-blue mb-2">50+</div>
              <p className="text-slate-medium">Countries Served</p>
            </div>
            <div className="text-center" data-testid="stat-success-rate">
              <div className="text-4xl font-bold text-crypto-blue mb-2">99.8%</div>
              <p className="text-slate-medium">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="crypto-gradient rounded-2xl p-8 lg:p-12 text-white">
            <Award className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Ready to Join the Revolution?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start your journey in crypto-powered commerce today. Whether you're buying real estate, 
              shipping globally, or trading services, Beagvs Global has you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button 
                  size="lg" 
                  className="bg-white text-crypto-blue hover:bg-blue-50 font-semibold"
                  data-testid="button-get-started"
                >
                  Get Started Today
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-crypto-blue font-semibold"
                  data-testid="button-explore-marketplace"
                >
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
