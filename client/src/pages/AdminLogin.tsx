import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Eye, EyeOff, Lock, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@beagvsglobal.com", password: "Admin@2025!" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const user = await apiRequest("POST", "/api/auth/login", data);
      if (user.role !== "ADMIN") {
        toast({ title: "Access Denied", description: "This login is for admins only.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Check if must change password
      const check = await apiRequest("GET", "/api/auth/must-change-password");
      if (check.mustChangePassword) {
        window.location.href = "/admin/change-password";
      } else {
        window.location.href = "/admin";
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
          <p className="text-slate-400 text-sm">Beagvs Global — Secure Admin Access</p>
        </div>

        <Card className="bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Use your admin credentials to access the control panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300 text-sm">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@beagvsglobal.com"
                    className="pl-9 bg-slate-900/70 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    {...form.register("email")}
                    data-testid="input-admin-email"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-9 pr-10 bg-slate-900/70 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
                    {...form.register("password")}
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold h-11 mt-2"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? "Signing In..." : "Sign In to Admin Panel"}
              </Button>
            </form>

            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-400 text-xs text-center">
                Default credentials: <span className="font-mono font-semibold">admin@beagvsglobal.com</span> / <span className="font-mono font-semibold">Admin@2025!</span>
              </p>
              <p className="text-amber-400/70 text-xs text-center mt-0.5">You will be required to change the password on first login.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
