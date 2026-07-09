import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient, setPiSessionToken, clearPiSessionToken } from "@/lib/queryClient";
import { isPiBrowser, authenticateWithPi } from "@/lib/pi";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Eye, EyeOff, Mail, Lock, User, UserCheck,
  ShoppingCart, Store, Users, Truck, Building2, MapPin, Phone,
  CheckCircle,
} from "lucide-react";

const baseSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  accountType: z.enum(["BUYER", "SELLER", "BOTH", "SHIPPING_AGENT"], {
    required_error: "Please select an account type",
  }),
  agentType: z.enum(["INDIVIDUAL", "COMPANY"]).optional(),
  companyName: z.string().optional(),
  whatsapp: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.accountType === "SHIPPING_AGENT" && !data.agentType) return false;
  return true;
}, {
  message: "Please select your agent type (Individual or Company)",
  path: ["agentType"],
}).refine((data) => {
  if (data.accountType === "SHIPPING_AGENT" && data.agentType === "COMPANY" && !data.companyName) return false;
  return true;
}, {
  message: "Company name is required for company accounts",
  path: ["companyName"],
});

type SignupFormData = z.infer<typeof baseSchema>;

const ACCOUNT_TYPES = [
  {
    value: "BUYER",
    label: "Buyer",
    description: "Browse and purchase items",
    icon: ShoppingCart,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    value: "SELLER",
    label: "Seller",
    description: "List and sell your items",
    icon: Store,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    value: "BOTH",
    label: "Buyer & Seller",
    description: "Buy and sell (recommended)",
    icon: Users,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    recommended: true,
  },
  {
    value: "SHIPPING_AGENT",
    label: "Shipping Agent",
    description: "Deliver packages & earn per shipment",
    icon: Truck,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
];

export default function Signup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPiLoading, setIsPiLoading] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<string>("");
  const [selectedAgentType, setSelectedAgentType] = useState<string>("");

  const handlePiAuth = async () => {
    if (!isPiBrowser()) {
      toast({
        title: "Pi Browser required",
        description:
          "Signing up with Pi on Beagvs Global is only for Pi Network pioneers with a Pi account, using the official Pi Browser app. Please open Beagvs Global inside Pi Browser and try again.",
        variant: "destructive",
      });
      return;
    }
    setIsPiLoading(true);
    try {
      const auth = await authenticateWithPi(() => {
        // Incomplete payment found — reconciled on next payment attempt.
      });
      const res = await apiRequest("POST", "/api/auth/pi", {
        accessToken: auth.accessToken,
        username: auth.user?.username,
        // This button is "Sign Up with Pi" — create the account if one
        // doesn't exist yet. If a Beagvs account already exists for this Pi
        // account, the server just logs them in instead of erroring.
        intent: "signup",
      });
      const user = await res.json();

      // Store the Pi session token so every subsequent API request can send it
      // as "Authorization: Bearer <token>", bypassing Pi Browser's unreliable
      // session-cookie behaviour.
      if (user.piSessionToken) {
        setPiSessionToken(user.piSessionToken);
      }

      // Set auth cache directly — no page reload, no race with session cookies.
      // Keep needsOnboarding in the cache: App.tsx's OnboardingGate reads it
      // directly from this cache to decide whether to redirect to /onboarding.
      queryClient.setQueryData(["/api/auth/user"], user);

      toast({
        title: "Welcome to Beagvs Global!",
        description: user.needsOnboarding
          ? "Let's set up your account — choose how you'll use Beagvs."
          : "Signed in with Pi Network.",
      });

      if (user.role === "ADMIN") {
        setLocation("/admin");
      } else if (user.role === "DELIVERY_AGENT") {
        setLocation("/agent/dashboard");
      } else if (user.needsOnboarding) {
        // New Pi sign-up OR returning user who quit mid-onboarding — pick
        // buyer/seller/shipping agent before reaching any dashboard.
        setLocation("/onboarding");
      } else {
        // Already has a completed account — just route to their dashboard.
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Pi sign-up failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPiLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(baseSchema),
  });

  const isShippingAgent = selectedAccountType === "SHIPPING_AGENT";
  const isCompany = selectedAgentType === "COMPANY";

  const handleAccountTypeSelect = (value: string) => {
    setSelectedAccountType(value);
    setValue("accountType", value as any);
    if (value !== "SHIPPING_AGENT") {
      setSelectedAgentType("");
      setValue("agentType", undefined);
    }
  };

  const handleAgentTypeSelect = (value: string) => {
    setSelectedAgentType(value);
    setValue("agentType", value as any);
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...signupData } = data;

      // Clear any stale Pi session token so the new cookie-based session is
      // the sole auth credential after a non-Pi signup.
      clearPiSessionToken();

      if (data.accountType === "SHIPPING_AGENT") {
        await apiRequest("POST", "/api/auth/signup/agent", {
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          agentType: data.agentType,
          companyName: data.companyName,
          whatsapp: data.whatsapp,
          location: data.location,
        });
        toast({
          title: "Agent account created!",
          description: "Welcome to Beagvs Global Logistics Network.",
        });
        // Full page reload so the new session cookie is picked up correctly
        window.location.href = "/agent/dashboard";
      } else {
        await apiRequest("POST", "/api/auth/signup", {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          username: data.username,
          password: data.password,
          accountType: data.accountType,
        });
        toast({
          title: "Account created successfully!",
          description: "Welcome to Beagvs Global. You can now start trading.",
        });
        // Full page reload so the new session cookie is picked up correctly
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Beagvs Global</h1>
          <p className="text-gray-600">Create your account and start trading</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input id="firstName" placeholder="John" className="pl-10" {...register("firstName")} data-testid="input-firstname" />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input id="lastName" placeholder="Doe" className="pl-10" {...register("lastName")} data-testid="input-lastname" />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input id="email" type="email" placeholder="john@example.com" className="pl-10" {...register("email")} data-testid="input-email" />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input id="username" placeholder="johndoe123" className="pl-10" {...register("username")} data-testid="input-username" />
                </div>
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>

              {/* Account Type — card picker */}
              <div>
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedAccountType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleAccountTypeSelect(type.value)}
                        data-testid={`account-type-${type.value.toLowerCase()}`}
                        className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? `${type.bg} border-current ${type.color} ring-2 ring-offset-1 ring-current/30`
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {type.recommended && (
                          <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 bg-green-500 text-white border-0">
                            Popular
                          </Badge>
                        )}
                        {isSelected && (
                          <CheckCircle className={`absolute top-2 right-2 w-4 h-4 ${type.color}`} />
                        )}
                        <Icon className={`w-5 h-5 ${isSelected ? type.color : "text-slate-400"}`} />
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? type.color : "text-slate-700"}`}>{type.label}</p>
                          <p className="text-xs text-slate-500 leading-tight">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.accountType && <p className="text-red-500 text-xs mt-1">{errors.accountType.message}</p>}
              </div>

              {/* Shipping Agent sub-section */}
              {isShippingAgent && (
                <div className="rounded-xl border-2 border-orange-200 bg-orange-50/50 p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-semibold text-orange-800">Shipping Agent Details</p>
                  </div>

                  {/* Individual vs Company */}
                  <div>
                    <Label className="text-slate-700">Agent Type</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { value: "INDIVIDUAL", label: "Individual Agent", sub: "Solo rider / driver", icon: User },
                        { value: "COMPANY", label: "Company / Fleet", sub: "Logistics business like DHL", icon: Building2 },
                      ].map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = selectedAgentType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleAgentTypeSelect(opt.value)}
                            data-testid={`agent-type-${opt.value.toLowerCase()}`}
                            className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? "border-orange-500 bg-orange-100 ring-2 ring-offset-1 ring-orange-400/30"
                                : "border-slate-200 bg-white hover:border-orange-300"
                            }`}
                          >
                            {isSelected && <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-orange-500" />}
                            <Icon className={`w-5 h-5 ${isSelected ? "text-orange-600" : "text-slate-400"}`} />
                            <p className={`text-sm font-semibold ${isSelected ? "text-orange-800" : "text-slate-700"}`}>{opt.label}</p>
                            <p className="text-xs text-slate-500">{opt.sub}</p>
                          </button>
                        );
                      })}
                    </div>
                    {errors.agentType && <p className="text-red-500 text-xs mt-1">{errors.agentType.message}</p>}
                  </div>

                  {/* Company name — only for COMPANY */}
                  {isCompany && (
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <div className="relative mt-1">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input id="companyName" placeholder="e.g. Swift Logistics Ltd" className="pl-10 bg-white" {...register("companyName")} data-testid="input-company-name" />
                      </div>
                      {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                    </div>
                  )}

                  {/* WhatsApp */}
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input id="whatsapp" placeholder="+2348012345678" className="pl-10 bg-white" {...register("whatsapp")} data-testid="input-whatsapp" />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Operating Location <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input id="location" placeholder="e.g. Lagos, Nigeria" className="pl-10 bg-white" {...register("location")} data-testid="input-location" />
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10"
                    {...register("password")}
                    data-testid="input-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10"
                    {...register("confirmPassword")}
                    data-testid="input-confirm-password"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit">
                {isLoading ? "Creating Account..." : isShippingAgent ? "Create Agent Account" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handlePiAuth}
                disabled={isPiLoading}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white"
                data-testid="button-pi-auth"
              >
                {isPiLoading ? "Connecting to Pi Network..." : "π Sign Up with Pi Network"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full" data-testid="link-login">Sign In Instead</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
