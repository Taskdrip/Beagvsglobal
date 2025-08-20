import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
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
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Profile from "@/pages/Profile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth/sign-up" component={Auth} />
          <Route path="/auth/sign-in" component={Auth} />
          <Route path="/welcome" component={Welcome} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/listing/:slug" component={ListingDetail} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
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
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
