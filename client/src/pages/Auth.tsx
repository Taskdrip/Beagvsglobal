import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link, useLocation } from "wouter";
import { Globe, Eye, EyeOff } from "lucide-react";
import { isPiBrowser, authenticateWithPi } from "@/lib/pi";

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid WhatsApp number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().min(1, "Address is required"),
  location: z.string().min(1, "Location is required"),
  bio: z.string().optional(),
  accountType: z.enum(['BUYER', 'SELLER', 'BOTH']).default('BUYER'),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;

export default function Auth() {
  const [location] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = location.includes("sign-up");
  const { toast } = useToast();

  // Auto-scroll to form when in signup mode
  useEffect(() => {
    if (isSignUp) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const formElement = document.querySelector('[data-testid="form-sign-up"]') || 
                            document.querySelector('.auth-form-container');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll to top of page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isSignUp]);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      whatsapp: "",
      password: "",
      address: "",
      location: "",
      bio: "",
      accountType: "BUYER",
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      await apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully",
        description: "Redirecting to welcome page...",
      });
      window.location.href = "/welcome";
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    },
  });

  const handleSignUp = (data: SignUpFormData) => {
    signUpMutation.mutate(data);
  };

  const handleSignIn = (data: SignInFormData) => {
    signInMutation.mutate(data);
  };

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  const piAuthMutation = useMutation({
    mutationFn: async (piAuth: { accessToken: string; username?: string }) => {
      await apiRequest("POST", "/api/auth/pi", piAuth);
    },
    onSuccess: () => {
      toast({
        title: "Welcome!",
        description: "Signed in with Pi Network. Redirecting to dashboard...",
      });
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Pi sign-in failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handlePiAuth = async () => {
    if (!isPiBrowser()) {
      toast({
        title: "Pi Browser required",
        description: "Open Beagvs Global inside the Pi Browser app to sign in with Pi Network.",
        variant: "destructive",
      });
      return;
    }
    try {
      const auth = await authenticateWithPi(() => {
        // Incomplete payment found — server routes handle reconciliation on next payment attempt.
      });
      piAuthMutation.mutate({ accessToken: auth.accessToken, username: auth.user?.username });
    } catch (error: any) {
      toast({
        title: "Pi sign-in failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="w-8 h-8 text-crypto-blue" />
            <span className="text-2xl font-bold gradient-text">Beagvs Global</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-4">
{isSignUp ? "Join Beagvs Global" : "Welcome Back"}
          </h2>
          <p className="text-slate-medium">
            {isSignUp 
              ? "Start trading real estate and shipping services with cryptocurrency" 
              : "Sign in to continue to your dashboard"
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Auth Form */}
          <Card className="auth-form-container shadow-lg border border-slate-100">
            <CardHeader>
              <CardTitle className="text-xl font-semibold gradient-text">
                {isSignUp ? "Create Account" : "Sign In"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSignUp ? (
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4" data-testid="form-sign-up">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        {...signUpForm.register("firstName")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                        data-testid="input-first-name"
                      />
                      {signUpForm.formState.errors.firstName && (
                        <p className="text-sm text-red-600 mt-1">
                          {signUpForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        {...signUpForm.register("lastName")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                        data-testid="input-last-name"
                      />
                      {signUpForm.formState.errors.lastName && (
                        <p className="text-sm text-red-600 mt-1">
                          {signUpForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      {...signUpForm.register("username")}
                      className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      data-testid="input-username"
                    />
                    {signUpForm.formState.errors.username && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...signUpForm.register("email")}
                      className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      data-testid="input-email"
                    />
                    {signUpForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+1234567890"
                      {...signUpForm.register("whatsapp")}
                      className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      data-testid="input-whatsapp"
                    />
                    {signUpForm.formState.errors.whatsapp && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.whatsapp.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        {...signUpForm.register("password")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent pr-10"
                        data-testid="input-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {signUpForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        {...signUpForm.register("address")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                        data-testid="input-address"
                      />
                      {signUpForm.formState.errors.address && (
                        <p className="text-sm text-red-600 mt-1">
                          {signUpForm.formState.errors.address.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="New York, NY"
                        {...signUpForm.register("location")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                        data-testid="input-location"
                      />
                      {signUpForm.formState.errors.location && (
                        <p className="text-sm text-red-600 mt-1">
                          {signUpForm.formState.errors.location.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Profile Description</Label>
                    <Textarea
                      id="bio"
                      rows={3}
                      placeholder="Tell us about yourself..."
                      {...signUpForm.register("bio")}
                      className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      data-testid="input-bio"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select
                      value={signUpForm.watch("accountType")}
                      onValueChange={(value) => signUpForm.setValue("accountType", value as "BUYER" | "SELLER" | "BOTH")}
                    >
                      <SelectTrigger className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent" data-testid="select-account-type">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUYER">Buyer - I want to purchase items and services</SelectItem>
                        <SelectItem value="SELLER">Seller - I want to list items and services for sale</SelectItem>
                        <SelectItem value="BOTH">Both - I want to buy and sell</SelectItem>
                      </SelectContent>
                    </Select>
                    {signUpForm.formState.errors.accountType && (
                      <p className="text-sm text-red-600 mt-1">
                        {signUpForm.formState.errors.accountType.message}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full button-primary font-semibold"
                    disabled={signUpMutation.isPending}
                    data-testid="button-create-account"
                  >
                    {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4" data-testid="form-sign-in">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      {...signInForm.register("email")}
                      className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent"
                      data-testid="input-signin-email"
                    />
                    {signInForm.formState.errors.email && (
                      <p className="text-sm text-red-600 mt-1">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        {...signInForm.register("password")}
                        className="focus:ring-2 focus:ring-crypto-blue focus:border-transparent pr-10"
                        data-testid="input-signin-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-signin-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {signInForm.formState.errors.password && (
                      <p className="text-sm text-red-600 mt-1">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-slate-300 text-crypto-blue focus:ring-crypto-blue" />
                      <span className="ml-2 text-sm text-slate-medium">Remember me</span>
                    </label>
                    <Link href="#" className="text-sm text-crypto-blue hover:text-crypto-teal">
                      Forgot password?
                    </Link>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-crypto-blue hover:bg-crypto-teal font-semibold"
                    disabled={signInMutation.isPending}
                    data-testid="button-sign-in"
                  >
                    {signInMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-medium">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handlePiAuth}
                disabled={piAuthMutation.isPending}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold"
                data-testid="button-pi-auth"
              >
                {piAuthMutation.isPending ? "Connecting to Pi Network..." : `π ${isSignUp ? "Sign Up" : "Sign In"} with Pi Network`}
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-medium">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <Link
                    href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
                    className="text-crypto-blue hover:text-crypto-teal font-medium"
                    data-testid={isSignUp ? "link-sign-in" : "link-sign-up"}
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Demo Credentials */}
          <Card className="shadow-lg border border-slate-100">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-dark">Demo Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Platform Features</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Multi-cryptocurrency escrow system</p>
                    <p>• Real estate & shipping marketplace</p>
                    <p>• Social features (follow, DM, reviews)</p>
                    <p>• Admin dashboard for escrow management</p>
                    <p>• Blog and content management</p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">Supported Networks</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs">Pi</span>
                    <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">TRON</span>
                    <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-xs">TON</span>
                    <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs">BNB</span>
                    <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">SOL</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
