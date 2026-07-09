import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  ShoppingBag,
  Store,
  Users,
  Truck,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Building2,
  User,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const ACCOUNT_TYPES = [
  {
    value: "BUYER",
    title: "Buyer",
    description: "Browse and purchase real estate, products, and services.",
    icon: ShoppingBag,
  },
  {
    value: "SELLER",
    title: "Seller",
    description: "List and sell your properties, products, or services.",
    icon: Store,
  },
  {
    value: "BOTH",
    title: "Buyer & Seller",
    description: "Full access — buy from others and sell your own listings.",
    icon: Users,
  },
  {
    value: "SHIPPING_AGENT",
    title: "Shipping Agent",
    description: "Deliver shipments and earn fees fulfilling orders.",
    icon: Truck,
  },
];

const AGENT_TYPES = [
  {
    value: "INDIVIDUAL",
    title: "Individual",
    description: "Register as an independent delivery agent.",
    icon: User,
  },
  {
    value: "COMPANY",
    title: "Company",
    description: "Register a logistics company with multiple drivers.",
    icon: Building2,
  },
];

export default function PiOnboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [agentType, setAgentType] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isShippingAgent = accountType === "SHIPPING_AGENT";
  const isCompany = agentType === "COMPANY";

  const saveProfile = useMutation({
    mutationFn: async (payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      password: string;
      accountType: string;
      agentType?: string;
      companyName?: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/user/pi-profile", payload);
      return await res.json();
    },
    onSuccess: (updatedUser: any) => {
      toast({
        title: "You're all set!",
        description: "Taking you to your dashboard…",
      });

      // Explicitly clear needsOnboarding in the cache BEFORE navigating.
      // Without this, the OnboardingGate sees needsOnboarding:true while
      // location changes to /dashboard, briefly sets blocked:true, and
      // redirects back to /onboarding. The background /api/auth/user refetch
      // will confirm this from the server (firstName + passwordHash now set).
      queryClient.setQueryData(["/api/auth/user"], {
        ...updatedUser,
        needsOnboarding: false,
      });

      if (updatedUser.accountType === "SHIPPING_AGENT" || updatedUser.role === "DELIVERY_AGENT") {
        setLocation("/agent/dashboard");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  function validate() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Enter a valid email address.";
    }
    if (!phone.trim()) e.phone = "Phone number is required.";
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    if (!accountType) e.accountType = "Please choose an account type.";
    if (isShippingAgent && !agentType) {
      e.agentType = "Please select Individual or Company.";
    }
    if (isShippingAgent && agentType === "COMPANY" && !companyName.trim()) {
      e.companyName = "Company name is required.";
    }
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload: Parameters<typeof saveProfile.mutate>[0] = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      accountType: accountType!,
    };
    if (isShippingAgent && agentType) {
      payload.agentType = agentType;
      if (agentType === "COMPANY") payload.companyName = companyName.trim();
    }
    saveProfile.mutate(payload);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-start justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe className="w-9 h-9 text-crypto-blue" />
            <span className="text-2xl font-bold text-white">Beagvs Global</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h1 className="text-2xl font-bold text-white">
              Welcome, {(user as any)?.piUsername || "Pi user"}!
            </h1>
          </div>
          <p className="text-slate-400">
            Finish setting up your account to get started.
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-200">First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs">{errors.firstName}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-200">Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-slate-200">Email Address *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label className="text-slate-200">Phone / WhatsApp Number *</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-slate-200">Password *</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-200">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Account type */}
              <div className="space-y-2">
                <Label className="text-slate-200">Account Type *</Label>
                {errors.accountType && (
                  <p className="text-red-400 text-xs">{errors.accountType}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = accountType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => {
                          setAccountType(type.value);
                          // Reset agent sub-selection when switching away
                          if (type.value !== "SHIPPING_AGENT") {
                            setAgentType(null);
                            setCompanyName("");
                          }
                        }}
                        className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg ${
                          isSelected
                            ? "border-crypto-blue bg-crypto-blue/10"
                            : "border-slate-600 bg-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <Icon
                          className={`w-7 h-7 mb-2 ${
                            isSelected ? "text-crypto-blue" : "text-slate-400"
                          }`}
                        />
                        <p
                          className={`font-semibold text-sm ${
                            isSelected ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {type.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Agent type — only shown when Shipping Agent is selected */}
              {isShippingAgent && (
                <div className="space-y-2">
                  <Label className="text-slate-200">Agent Type *</Label>
                  <p className="text-xs text-slate-400">
                    Are you registering as an individual driver or a logistics company?
                  </p>
                  {errors.agentType && (
                    <p className="text-red-400 text-xs">{errors.agentType}</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {AGENT_TYPES.map((at) => {
                      const Icon = at.icon;
                      const isSelected = agentType === at.value;
                      return (
                        <button
                          key={at.value}
                          type="button"
                          onClick={() => {
                            setAgentType(at.value);
                            if (at.value !== "COMPANY") setCompanyName("");
                          }}
                          className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-lg ${
                            isSelected
                              ? "border-crypto-blue bg-crypto-blue/10"
                              : "border-slate-600 bg-slate-700 hover:border-slate-500"
                          }`}
                        >
                          <Icon
                            className={`w-7 h-7 mb-2 ${
                              isSelected ? "text-crypto-blue" : "text-slate-400"
                            }`}
                          />
                          <p
                            className={`font-semibold text-sm ${
                              isSelected ? "text-white" : "text-slate-300"
                            }`}
                          >
                            {at.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{at.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Company name — only shown when COMPANY is selected */}
                  {isCompany && (
                    <div className="space-y-1 mt-2">
                      <Label className="text-slate-200">Company Name *</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Swift Logistics Ltd"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      />
                      {errors.companyName && (
                        <p className="text-red-400 text-xs">{errors.companyName}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={saveProfile.isPending}
                className="w-full bg-crypto-blue hover:bg-crypto-teal text-white font-semibold py-3 text-base"
              >
                {saveProfile.isPending ? (
                  "Setting up your account…"
                ) : (
                  <>
                    Complete Setup <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
