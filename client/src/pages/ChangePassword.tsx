import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Shield, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ChangePassword() {
  const { toast } = useToast();
  const { user } = useAuth() as any;
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setDone(true);
      toast({ title: "Password changed!", description: "Your password has been updated successfully." });
      setTimeout(() => { window.location.href = "/admin"; }, 2000);
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Could not change password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Password Changed!</h2>
          <p className="text-slate-400">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Shield className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Change Password Required</h1>
          <p className="text-slate-400 text-sm">For security, you must set a new password before continuing.</p>
        </div>

        <Card className="bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Set New Password</CardTitle>
            <CardDescription className="text-slate-400">
              Choose a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: "currentPassword" as const, label: "Current Password", show: showCurrent, toggle: () => setShowCurrent(!showCurrent), testId: "input-current-password" },
                { name: "newPassword" as const, label: "New Password", show: showNew, toggle: () => setShowNew(!showNew), testId: "input-new-password" },
                { name: "confirmPassword" as const, label: "Confirm New Password", show: showConfirm, toggle: () => setShowConfirm(!showConfirm), testId: "input-confirm-password" },
              ].map(({ name, label, show, toggle, testId }) => (
                <div key={name}>
                  <Label className="text-slate-300 text-sm">{label}</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type={show ? "text" : "password"}
                      placeholder={`Enter ${label.toLowerCase()}`}
                      className="pl-9 pr-10 bg-slate-900/70 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
                      {...form.register(name)}
                      data-testid={testId}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" onClick={toggle}>
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors[name] && (
                    <p className="text-red-400 text-xs mt-1">{form.formState.errors[name]?.message}</p>
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-white font-semibold h-11 mt-2"
                disabled={isLoading}
                data-testid="button-change-password"
              >
                {isLoading ? "Updating..." : "Update Password & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
