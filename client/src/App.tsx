import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ChatWidget from "@/components/ChatWidget";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { initPiSdk, isPiBrowser } from "@/lib/pi";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import Marketplace from "@/pages/Marketplace";
import ListingDetail from "@/pages/ListingDetail";
import CreateListing from "@/pages/CreateListing";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import ChangePassword from "@/pages/ChangePassword";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Profile from "@/pages/Profile";
import Checkout from "@/pages/Checkout";
import Chat from "@/pages/Chat";
import AdminPaymentMethods from "@/pages/AdminPaymentMethods";
import AccountSettings from "@/pages/AccountSettings";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import KycVerification from "@/pages/KycVerification";
import ShippingTracker from "@/pages/ShippingTracker";
import ShippingHub from "@/pages/ShippingHub";
import RealEstate from "@/pages/RealEstate";
import GuestCheckout from "@/pages/GuestCheckout";
import Help from "@/pages/Help";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Careers from "@/pages/Careers";
import Notifications from "@/pages/Notifications";
import DeliveryAgentDashboard from "@/pages/DeliveryAgentDashboard";
import AgentSignup from "@/pages/AgentSignup";
import PiOnboarding from "@/pages/PiOnboarding";

// Full-screen loader shown while the session is being resolved.
function AuthLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-crypto-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // While we don't yet know whether the user is logged in, show a neutral
  // loader so authenticated-only routes (like /dashboard, /onboarding) are
  // never incorrectly matched against the public route tree → 404.
  if (isLoading) {
    return <AuthLoader />;
  }

  return (
    <Switch>
      {/* Admin login & change-password are always accessible */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/change-password" component={ChangePassword} />

      {/* Delivery agent portal — always reachable (component handles auth guard internally) */}
      <Route path="/agent/dashboard" component={DeliveryAgentDashboard} />

      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={PiOnboarding} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/listing/:slug" component={ListingDetail} />
          <Route path="/sell/new" component={CreateListing} />
          <Route path="/sell/:id/edit" component={CreateListing} />
          <Route path="/admin" component={Admin} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/checkout/:escrowId" component={Checkout} />
          <Route path="/buy/:slug" component={GuestCheckout} />
          <Route path="/chat/:listingId" component={Chat} />
          <Route path="/admin/payment-methods" component={AdminPaymentMethods} />
          <Route path="/account/settings" component={AccountSettings} />
          <Route path="/kyc" component={KycVerification} />
          <Route path="/tracking" component={ShippingTracker} />
          <Route path="/tracking/:trackingNumber" component={ShippingTracker} />
          <Route path="/shipping" component={ShippingHub} />
          <Route path="/shipments/:id" component={ShippingHub} />
          <Route path="/real-estate" component={RealEstate} />
          <Route path="/help" component={Help} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/careers" component={Careers} />
          <Route path="/notifications" component={Notifications} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route path="/signup/agent" component={AgentSignup} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/listing/:slug" component={ListingDetail} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/checkout/:escrowId" component={Checkout} />
          <Route path="/buy/:slug" component={GuestCheckout} />
          <Route path="/tracking" component={ShippingTracker} />
          <Route path="/tracking/:trackingNumber" component={ShippingTracker} />
          <Route path="/shipping" component={ShippingHub} />
          <Route path="/real-estate" component={RealEstate} />
          <Route path="/help" component={Help} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/careers" component={Careers} />
          {/* Catch-all: any authenticated-only path redirects to login */}
          <Route path="/dashboard">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/onboarding">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/admin">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/sell/new">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/sell/:id/edit">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/account/settings">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/kyc">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/notifications">{() => { window.location.replace("/login"); return null; }}</Route>
          <Route path="/chat/:id">{() => { window.location.replace("/login"); return null; }}</Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize the Pi SDK as early as possible (rather than lazily right
    // before the user clicks "Sign in with Pi") so the native Pi Browser
    // bridge has time to finish its handshake before authenticate() is ever
    // called — this avoids the common "works on the 2nd click" failure.
    if (isPiBrowser()) {
      try {
        initPiSdk();
      } catch {
        // Non-fatal — authenticateWithPi() will retry init on first use.
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <GoogleAnalytics />
        <Router />
        <ChatWidget />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
