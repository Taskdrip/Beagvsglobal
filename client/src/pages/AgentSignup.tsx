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
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Truck, Building2, User, Eye, EyeOff, Mail, Lock, Phone, MapPin, CheckCircle } from "lucide-react";

const agentSignupSchema = z.object({
  agentType: z.enum(["INDIVIDUAL", "COMPANY"], { required_error: "Please select agent type" }),
  firstName: z.string().min(2, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  companyName: z.string().min(2, "Company name is required").optional(),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  password: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string(),
  whatsapp: z.string().optional(),
  location: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] })
  .refine(d => d.agentType === "COMPANY" ? !!d.companyName : true, { message: "Company name is required", path: ["companyName"] })
  .refine(d => d.agentType === "INDIVIDUAL" ? !!d.firstName : true, { message: "First name is required", path: ["firstName"] });

type AgentSignupData = z.infer<typeof agentSignupSchema>;

const BENEFITS = [
  "Access all available pickup orders instantly",
  "Real-time notifications for new shipments near you",
  "Track and update deliveries from your phone",
  "Get paid per successful delivery",
  "Manage your fleet (company accounts)",
];

export default function AgentSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AgentSignupData>({
    resolver: zodResolver(agentSignupSchema),
  });

  const agentType = watch("agentType");

  const onSubmit = async (data: AgentSignupData) => {
    setIsLoading(true);
    try {
      const payload = {
        agentType: data.agentType,
        email: data.email,
        username: data.username,
        password: data.password,
        firstName: data.agentType === "INDIVIDUAL" ? data.firstName : data.companyName,
        lastName: data.agentType === "INDIVIDUAL" ? data.lastName : "",
        companyName: data.agentType === "COMPANY" ? data.companyName : undefined,
        whatsapp: data.whatsapp,
        location: data.location,
      };
      await apiRequest("POST", "/api/auth/signup/agent", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Agent account created!", description: "Welcome! You can now start accepting deliveries." });
      setLocation("/agent/dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: benefits */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Become a Delivery Agent</h1>
                <p className="text-slate-500 text-sm">Join the Beagvs Global logistics network</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Why join as an agent?</h2>
              <ul className="space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <User className="w-7 h-7 text-blue-600 mx-auto mb-1" />
                <p className="font-semibold text-blue-900 text-sm">Individual Agent</p>
                <p className="text-xs text-blue-600 mt-0.5">Solo rider / driver</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <Building2 className="w-7 h-7 text-purple-600 mx-auto mb-1" />
                <p className="font-semibold text-purple-900 text-sm">Company / Fleet</p>
                <p className="text-xs text-purple-600 mt-0.5">Logistics business</p>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Already have an agent account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          {/* Right: form */}
          <Card className="shadow-md border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Create Agent Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Agent type */}
                <div>
                  <Label>Agent Type</Label>
                  <Select onValueChange={(v) => setValue("agentType", v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Are you an individual or company?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <span>Individual Agent (solo rider/driver)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="COMPANY">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span>Company / Logistics Fleet</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.agentType && <p className="text-red-500 text-xs mt-1">{errors.agentType.message}</p>}
                </div>

                {/* Conditional name fields */}
                {agentType === "INDIVIDUAL" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First Name</Label>
                      <Input className="mt-1" placeholder="John" {...register("firstName")} />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input className="mt-1" placeholder="Doe" {...register("lastName")} />
                    </div>
                  </div>
                )}
                {agentType === "COMPANY" && (
                  <div>
                    <Label>Company Name</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input className="pl-9" placeholder="Speedy Logistics Ltd." {...register("companyName")} />
                    </div>
                    {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                  </div>
                )}

                {/* Email */}
                <div>
                  <Label>Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type="email" className="pl-9" placeholder="you@example.com" {...register("email")} />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Username */}
                <div>
                  <Label>Username</Label>
                  <Input className="mt-1" placeholder="agent_john" {...register("username")} />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                </div>

                {/* WhatsApp + Location (optional) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>WhatsApp (optional)</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input className="pl-9" placeholder="+2348012345678" {...register("whatsapp")} />
                    </div>
                  </div>
                  <div>
                    <Label>Base Location (optional)</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input className="pl-9" placeholder="Lagos, Nigeria" {...register("location")} />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label>Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type={showPassword ? "text" : "password"} className="pl-9 pr-10" placeholder="Create a password" {...register("password")} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type={showConfirm ? "text" : "password"} className="pl-9 pr-10" placeholder="Repeat password" {...register("confirmPassword")} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Agent Account"}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  By signing up you agree to our{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>{" "}and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
