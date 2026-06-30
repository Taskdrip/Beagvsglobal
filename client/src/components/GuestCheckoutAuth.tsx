import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Eye, EyeOff, Loader2, Lock, UserPlus, LogIn, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-z0-9_]+$/i, "Only letters, numbers and underscores"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignUpData = z.infer<typeof signUpSchema>;
type SignInData = z.infer<typeof signInSchema>;

// ─── Password Input ───────────────────────────────────────────────────────────

function PasswordInput({ placeholder, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} placeholder={placeholder || "Password"} {...props} className="pr-10" />
      <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

function SignUpForm({ onSuccess, ctaLabel }: { onSuccess: (user: any) => void; ctaLabel?: string }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      const res = await apiRequest("POST", "/api/auth/signup", { ...data, accountType: "BUYER" });
      return res.json();
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Account created!", description: `Welcome to Beagvs, ${user.firstName}!` });
      onSuccess(user);
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message || "Please try again", variant: "destructive" });
    },
  });

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3" data-testid="form-signup">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input {...register("firstName")} placeholder="First name" data-testid="input-first-name" />
          {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Input {...register("lastName")} placeholder="Last name" data-testid="input-last-name" />
          {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <Input {...register("username")} placeholder="Username (e.g. johntrader)" data-testid="input-username" />
        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <Input {...register("email")} type="email" placeholder="Email address" data-testid="input-email" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <PasswordInput {...register("password")} placeholder="Create a password (min 8 chars)" data-testid="input-password" />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>
      <p className="text-xs text-slate-400">By creating an account you agree to our Terms of Service and Privacy Policy.</p>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold" disabled={mutation.isPending} data-testid="button-create-account">
        {mutation.isPending ? (
          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</span>
        ) : (
          <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" />{ctaLabel || "Create Account & Continue"}</span>
        )}
      </Button>
    </form>
  );
}

// ─── Sign In Form ─────────────────────────────────────────────────────────────

function SignInForm({ onSuccess, ctaLabel }: { onSuccess: (user: any) => void; ctaLabel?: string }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: SignInData) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Signed in!", description: `Welcome back, ${user.firstName || user.username}!` });
      onSuccess(user);
    },
    onError: (err: any) => {
      toast({ title: "Sign in failed", description: err.message || "Invalid email or password", variant: "destructive" });
    },
  });

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-3" data-testid="form-signin">
      <div>
        <Input {...register("email")} type="email" placeholder="Email address" data-testid="input-signin-email" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <PasswordInput {...register("password")} placeholder="Your password" data-testid="input-signin-password" />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-semibold" disabled={mutation.isPending} data-testid="button-signin">
        {mutation.isPending ? (
          <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</span>
        ) : (
          <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />{ctaLabel || "Sign In & Continue"}</span>
        )}
      </Button>
    </form>
  );
}

// ─── Main Export: GuestCheckoutAuth ──────────────────────────────────────────

interface GuestCheckoutAuthProps {
  onAuthSuccess: (user: any) => void;
  ctaContext?: string;
  defaultTab?: "signup" | "signin";
}

export default function GuestCheckoutAuth({ onAuthSuccess, ctaContext, defaultTab = "signup" }: GuestCheckoutAuthProps) {
  return (
    <div className="space-y-4">
      {/* Trust banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
        <ShieldCheck className="w-8 h-8 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Secure checkout — account required</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {ctaContext || "Create a free account or sign in to complete your purchase. Takes less than 60 seconds."}
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="signup" className="text-sm font-medium" data-testid="tab-signup">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> New Account
          </TabsTrigger>
          <TabsTrigger value="signin" className="text-sm font-medium" data-testid="tab-signin">
            <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signup">
          <SignUpForm onSuccess={onAuthSuccess} ctaLabel="Create Account & Continue" />
        </TabsContent>

        <TabsContent value="signin">
          <SignInForm onSuccess={onAuthSuccess} ctaLabel="Sign In & Continue" />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
        <Lock className="w-3 h-3" />
        <span>Your details are encrypted and never shared</span>
      </div>
    </div>
  );
}
