import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Settings, ShoppingBag, Store, Users, Shield, Key, QrCode, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";

function TwoFactorSection() {
  const { toast } = useToast();
  const [status, setStatus] = useState<{ enabled: boolean; hasSecret: boolean } | null>(null);
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [disableToken, setDisableToken] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSetupData(data);
      setStep("verify");
    } catch (err: any) {
      toast({ title: "Failed to start 2FA setup", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleEnable = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      toast({ title: "Enter the 6-digit code from your authenticator app", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "2FA enabled successfully!" });
      setStep("idle");
      setSetupData(null);
      setVerifyToken("");
      await fetchStatus();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleDisable = async () => {
    if (!disableToken || disableToken.length !== 6) {
      toast({ title: "Enter the 6-digit code from your authenticator app", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: disableToken, password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "2FA disabled" });
      setShowDisable(false);
      setDisableToken("");
      setDisablePassword("");
      await fetchStatus();
    } catch (err: any) {
      toast({ title: "Failed to disable 2FA", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Two-Factor Authentication (2FA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {status?.enabled ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="font-medium text-green-700">2FA is enabled</p>
                <p className="text-sm text-gray-500">Your account is protected with an authenticator app.</p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-700 border-green-200">Active</Badge>
            </>
          ) : (
            <>
              <XCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-amber-700">2FA is not enabled</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <Badge variant="outline" className="ml-auto text-amber-600 border-amber-300">Inactive</Badge>
            </>
          )}
        </div>

        {/* Setup flow */}
        {!status?.enabled && step === "idle" && (
          <Button onClick={handleSetup} disabled={loading} className="w-full sm:w-auto" data-testid="button-setup-2fa">
            <QrCode className="w-4 h-4 mr-2" />
            {loading ? "Setting up..." : "Set Up 2FA"}
          </Button>
        )}

        {step === "verify" && setupData && (
          <div className="space-y-4 border rounded-xl p-4 bg-blue-50/50">
            <div>
              <p className="font-medium text-slate-800 mb-1">Step 1 — Scan this QR code</p>
              <p className="text-sm text-slate-500 mb-3">
                Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app and scan:
              </p>
              <img src={setupData.qrCode} alt="2FA QR Code" className="w-44 h-44 border rounded-lg bg-white p-2 mx-auto" data-testid="img-2fa-qr" />
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Or enter manually:</p>
              <code className="text-xs bg-white border rounded px-3 py-2 block text-center font-mono tracking-widest break-all">
                {setupData.secret}
              </code>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-2">Step 2 — Enter the 6-digit code to confirm</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyToken}
                  onChange={e => setVerifyToken(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest font-mono w-36"
                  data-testid="input-2fa-verify-token"
                />
                <Button onClick={handleEnable} disabled={loading} data-testid="button-enable-2fa">
                  {loading ? "Verifying..." : "Enable 2FA"}
                </Button>
                <Button variant="outline" onClick={() => { setStep("idle"); setSetupData(null); }}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Disable flow */}
        {status?.enabled && !showDisable && (
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowDisable(true)} data-testid="button-show-disable-2fa">
            Disable 2FA
          </Button>
        )}

        {status?.enabled && showDisable && (
          <div className="border border-red-200 rounded-xl p-4 bg-red-50/40 space-y-3">
            <p className="text-sm font-medium text-red-700">Confirm your password and enter the 2FA code to disable:</p>
            <Input
              type="password"
              placeholder="Current password"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              data-testid="input-disable-2fa-password"
            />
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={disableToken}
                onChange={e => setDisableToken(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono tracking-widest w-36"
                data-testid="input-disable-2fa-token"
              />
              <Button variant="destructive" onClick={handleDisable} disabled={loading} data-testid="button-confirm-disable-2fa">
                {loading ? "Disabling..." : "Disable"}
              </Button>
              <Button variant="outline" onClick={() => { setShowDisable(false); setDisableToken(""); setDisablePassword(""); }}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangePasswordSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [data, setData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.newPassword !== data.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (data.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast({ title: "Password changed successfully!" });
      setData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: "Failed to change password", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5 text-slate-600" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          {([
            { label: "Current Password", key: "currentPassword", show: showCurrent, toggle: () => setShowCurrent(!showCurrent), testId: "input-current-password" },
            { label: "New Password", key: "newPassword", show: showNew, toggle: () => setShowNew(!showNew), testId: "input-new-password" },
            { label: "Confirm New Password", key: "confirmPassword", show: showConfirm, toggle: () => setShowConfirm(!showConfirm), testId: "input-confirm-password" },
          ] as const).map(({ label, key, show, toggle, testId }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700">{label}</label>
              <div className="relative mt-1">
                <Input
                  type={show ? "text" : "password"}
                  className="pr-10"
                  value={data[key]}
                  onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
                  required
                  data-testid={testId}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={toggle}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button type="submit" disabled={isLoading} data-testid="button-change-password">
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AccountSettings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-8">Please sign in to access your account settings.</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const updateAccountType = useMutation({
    mutationFn: async (accountType: string) => {
      return await apiRequest("PATCH", "/api/user/account-type", { accountType });
    },
    onSuccess: () => {
      toast({ title: "Account type updated!", description: "Your account type has been successfully changed." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update account type", description: error.message, variant: "destructive" });
    },
  });

  const getAccountTypeDescription = (type: string) => {
    switch (type) {
      case 'BUYER': return 'You can browse and purchase products/services from sellers.';
      case 'SELLER': return 'You can list and sell products/services to buyers.';
      case 'BOTH': return 'You have full access to both buying and selling features.';
      default: return 'Unknown account type.';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'BUYER': return <ShoppingBag className="w-5 h-5" />;
      case 'SELLER': return <Store className="w-5 h-5" />;
      case 'BOTH': return <Users className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">← Back to Dashboard</Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security settings</p>
        </div>

        <div className="space-y-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium truncate">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>{user.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Account Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {getAccountTypeIcon(user.accountType)}
                <div className="flex-1">
                  <p className="font-medium">Current Account Type</p>
                  <p className="text-sm text-gray-600">{getAccountTypeDescription(user.accountType)}</p>
                </div>
                <Badge className="capitalize">{user.accountType.toLowerCase()}</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={user.accountType} onValueChange={(value) => updateAccountType.mutate(value)}>
                  <SelectTrigger className="w-48" data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUYER">Buyer</SelectItem>
                    <SelectItem value="SELLER">Seller</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
                <Button disabled={updateAccountType.isPending} data-testid="button-update-account-type">
                  {updateAccountType.isPending ? 'Updating...' : 'Update Account Type'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <ChangePasswordSection />

          {/* 2FA */}
          <TwoFactorSection />
        </div>
      </div>
      <Footer />
    </div>
  );
}
