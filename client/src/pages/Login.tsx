import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { isPiBrowser, authenticateWithPi } from "@/lib/pi";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [isPiLoading, setIsPiLoading] = useState(false);

  const handlePiAuth = async () => {
    if (!isPiBrowser()) {
      toast({
        title: "Pi Browser required",
        description: "Open Beagvs Global inside the Pi Browser app to sign in with Pi Network.",
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
      });
      const user = await res.json();

      toast({
        title: "Welcome!",
        description: "Signed in with Pi Network.",
      });

      // Set auth cache directly so the router sees isAuthenticated = true
      // immediately — no page reload, no race condition with session cookies.
      const { needsOnboarding: _, ...cachedUser } = user;
      queryClient.setQueryData(["/api/auth/user"], cachedUser);

      if (user.role === "ADMIN") {
        setLocation("/admin");
      } else if (user.role === "DELIVERY_AGENT") {
        setLocation("/agent/dashboard");
      } else if (user.needsOnboarding) {
        // New Pi user OR returning Pi user who quit before finishing the
        // onboarding form — send them back to complete their profile.
        setLocation("/onboarding");
      } else {
        // Returning Pi user with a completed profile — route by account type.
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Pi sign-in failed",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPiLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const user = await res.json();

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (user.role === "ADMIN") {
        setLocation("/admin");
      } else if (user.role === "DELIVERY_AGENT") {
        setLocation("/agent/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your Beagvs Global account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    {...register("email")}
                    data-testid="input-email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    {...register("password")}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Signing In..." : "Sign In"}
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
                {isPiLoading ? "Connecting to Pi Network..." : "π Sign In with Pi Network"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>
              
              <Link href="/signup">
                <Button variant="outline" className="w-full" data-testid="link-signup">
                  Create New Account
                </Button>
              </Link>

            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}