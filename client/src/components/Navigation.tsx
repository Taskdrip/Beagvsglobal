import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  Globe, Menu, User, LogOut, Bell, Settings, Package, Zap
} from "lucide-react";

interface NavigationProps {
  dark?: boolean;
}

export default function Navigation({ dark = false }: NavigationProps) {
  const { user, isAuthenticated } = useAuth() as { user: any; isAuthenticated: boolean };
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Shipping", href: "/shipping" },
    { label: "Real Estate", href: "/real-estate" },
    { label: "Track", href: "/tracking" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
  ];

  const authenticatedNavItems = [
    ...navItems,
    { label: "Dashboard", href: "/dashboard" },
  ];

  const currentNavItems = isAuthenticated ? authenticatedNavItems : navItems;

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) window.location.href = "/";
    } catch {
      window.location.href = "/api/logout";
    }
  };

  const handleSignIn = () => { window.location.href = "/login"; };

  const isDark = dark;

  const navBg = isDark
    ? "bg-[#050d1a]/80 backdrop-blur-md border-b border-cyan-500/10"
    : "bg-white shadow-sm border-b border-slate-200";

  const logoText = isDark ? "text-white" : "text-slate-900";
  const linkBase = isDark
    ? "text-slate-400 hover:text-cyan-300"
    : "text-slate-600 hover:text-blue-600";
  const linkActive = isDark ? "text-cyan-300" : "text-blue-600";

  return (
    <nav className={`${navBg} sticky top-0 z-50 transition-all duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              {isDark ? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Globe className="w-8 h-8 text-crypto-blue" />
              )}
              <span className={`text-xl font-bold ${logoText}`}>Beagvs Global</span>
              {isDark && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                  <Zap className="w-2.5 h-2.5" /> Web3
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {currentNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive(item.href) ? linkActive : linkBase
                    }`}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {user?.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={isDark ? "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10" : "text-slate-500 hover:text-blue-600"}
                      data-testid="button-admin"
                    >
                      <Settings className="w-4 h-4 mr-1.5" />
                      Admin
                    </Button>
                  </Link>
                )}

                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`relative ${isDark ? "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10" : "text-slate-500 hover:text-blue-600"}`}
                    data-testid="button-notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                </Link>

                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isDark ? "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10" : "text-slate-600 hover:text-blue-600"}
                    data-testid="button-dashboard"
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    {user?.username || "Profile"}
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className={isDark ? "text-slate-400 hover:text-red-400 hover:bg-red-500/10" : "text-slate-500 hover:text-red-600"}
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
                  className={isDark ? "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 font-medium" : "text-slate-600 hover:text-blue-600 font-medium"}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Link href="/signup">
                  <Button
                    className={isDark ? "hero-btn-primary text-sm px-4 py-2" : "bg-crypto-blue hover:bg-crypto-teal text-white font-medium"}
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
                  className={isDark ? "text-slate-300 hover:text-white" : "text-slate-500"}
                  data-testid="button-mobile-menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className={`w-80 ${isDark ? "bg-[#0a1628] border-l border-cyan-500/10" : "bg-white"}`}
              >
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Logo */}
                  <div className={`flex items-center space-x-2 pb-4 border-b ${isDark ? "border-cyan-500/10" : "border-slate-200"}`}>
                    {isDark ? (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <Globe className="w-6 h-6 text-crypto-blue" />
                    )}
                    <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Beagvs Global</span>
                  </div>

                  {/* Mobile Navigation Links */}
                  <div className="space-y-1">
                    {currentNavItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-sm ${
                            isDark
                              ? isActive(item.href)
                                ? "bg-cyan-500/10 text-cyan-300"
                                : "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/8"
                              : isActive(item.href)
                              ? "bg-blue-50 text-blue-600"
                              : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {item.label === "Marketplace" && <Package className="w-4 h-4 mr-2" />}
                          {item.label === "Dashboard" && <User className="w-4 h-4 mr-2" />}
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Auth Section */}
                  <div className={`pt-4 border-t space-y-2 ${isDark ? "border-cyan-500/10" : "border-slate-200"}`}>
                    {isAuthenticated ? (
                      <>
                        <div className={`px-3 py-2 rounded-lg ${isDark ? "bg-cyan-500/8 border border-cyan-500/15" : "bg-slate-50"}`}>
                          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>@{user?.username}</p>
                        </div>

                        {user?.role === "ADMIN" && (
                          <Link href="/admin">
                            <Button
                              variant="ghost"
                              className={`w-full justify-start text-sm ${isDark ? "text-slate-300 hover:text-cyan-300" : "text-slate-600 hover:text-blue-600"}`}
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
                          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm"
                          onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
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
                          className={`w-full justify-start text-sm ${isDark ? "text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10" : "text-slate-600 hover:text-blue-600"}`}
                          onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
                          data-testid="mobile-button-sign-in"
                        >
                          Sign In
                        </Button>
                        <Link href="/signup">
                          <Button
                            className={`w-full text-sm ${isDark ? "hero-btn-primary" : "bg-crypto-blue hover:bg-crypto-teal text-white"}`}
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid="mobile-button-get-started"
                          >
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className={`pt-4 border-t ${isDark ? "border-cyan-500/10" : "border-slate-200"}`}>
                    <p className={`text-xs text-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                      © 2025 Beagvs Global
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
