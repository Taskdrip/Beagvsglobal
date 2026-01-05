import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { 
  Globe,
  Menu,
  User,
  LogOut,
  Bell,
  Settings,
  Package,
  DollarSign
} from "lucide-react";

export default function Navigation() {
  const { user, isAuthenticated } = useAuth() as { user: any, isAuthenticated: boolean };
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Shipping", href: "/marketplace?type=SHIPPING_SERVICE" },
    { label: "Real Estate", href: "/marketplace?type=REAL_ESTATE" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const authenticatedNavItems = [
    ...navItems,
    { label: "Dashboard", href: "/dashboard" },
  ];

  const currentNavItems = isAuthenticated ? authenticatedNavItems : navItems;

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      window.location.href = "/api/logout"; // Fallback to Replit auth logout
    }
  };

  const handleSignIn = () => {
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <Globe className="w-8 h-8 text-crypto-blue" />
              <span className="text-xl font-bold text-slate-dark">Beagvs Global</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {currentNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span 
                    className={`font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-crypto-blue"
                        : "text-slate-medium hover:text-crypto-blue"
                    }`}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-slate-medium hover:text-crypto-blue"
                      data-testid="button-admin"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                
                <Link href="/notifications">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-medium hover:text-crypto-blue relative"
                    data-testid="button-notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-red-500" />
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-slate-medium hover:text-crypto-blue"
                    data-testid="button-dashboard"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {user?.username || 'Profile'}
                  </Button>
                </Link>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-slate-medium hover:text-red-600"
                  data-testid="button-sign-out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  onClick={handleSignIn}
                  className="text-slate-medium hover:text-crypto-blue font-medium"
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Link href="/signup">
                  <Button 
                    className="bg-crypto-blue hover:bg-crypto-teal text-white font-medium"
                    data-testid="button-get-started"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-slate-medium"
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-2 pb-4 border-b border-slate-200">
                    <Globe className="w-6 h-6 text-crypto-blue" />
                    <span className="font-bold text-slate-dark">Beagvs Global</span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="space-y-2">
                    {currentNavItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start ${
                            isActive(item.href)
                              ? "bg-crypto-blue/10 text-crypto-blue"
                              : "text-slate-medium hover:text-crypto-blue hover:bg-crypto-blue/5"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item.label === "Marketplace" && <Package className="w-4 h-4 mr-2" />}
                          {item.label === "Dashboard" && <User className="w-4 h-4 mr-2" />}
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-dark">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-slate-medium">@{user?.username}</p>
                        </div>

                        {user?.role === 'ADMIN' && (
                          <Link href="/admin">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-slate-medium hover:text-crypto-blue"
                              onClick={() => setMobileMenuOpen(false)}
                              data-testid="mobile-button-admin"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignOut();
                          }}
                          data-testid="mobile-button-sign-out"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-slate-medium hover:text-crypto-blue"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            handleSignIn();
                          }}
                          data-testid="mobile-button-sign-in"
                        >
                          Sign In
                        </Button>
                        <Link href="/auth/sign-up">
                          <Button
                            className="w-full bg-crypto-blue hover:bg-crypto-teal"
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid="mobile-button-get-started"
                          >
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Mobile Footer */}
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-400 text-center">
                      © 2024 Beagvs Global
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
