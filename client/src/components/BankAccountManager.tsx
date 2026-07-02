import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Trash2, Star, StarOff, Loader2 } from "lucide-react";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  currency: string;
  country: string;
  isDefault: boolean;
};

export default function BankAccountManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    currency: "NGN",
    country: "Nigeria",
    isDefault: false,
  });

  const { data: accounts = [], isLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/bank-accounts", data),
    onSuccess: () => {
      toast({ title: "Bank account added" });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setOpen(false);
      setForm({ bankName: "", accountName: "", accountNumber: "", routingNumber: "", swiftCode: "", currency: "NGN", country: "Nigeria", isDefault: false });
    },
    onError: (e: any) => toast({ title: "Failed to add account", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bank-accounts/${id}`),
    onSuccess: () => {
      toast({ title: "Bank account removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
    onError: () => toast({ title: "Failed to remove account", variant: "destructive" }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/bank-accounts/${id}`, { isDefault: true }),
    onSuccess: () => {
      toast({ title: "Default bank account updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
    onError: () => toast({ title: "Failed to update default", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bankName || !form.accountName || !form.accountNumber) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-5 h-5 text-blue-600" />
          Bank Accounts
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div>
                <Label>Bank Name *</Label>
                <Input className="mt-1" placeholder="First Bank Nigeria" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
              </div>
              <div>
                <Label>Account Holder Name *</Label>
                <Input className="mt-1" placeholder="John Doe" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
              </div>
              <div>
                <Label>Account Number *</Label>
                <Input className="mt-1" placeholder="0123456789" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Routing Number</Label>
                  <Input className="mt-1" placeholder="Optional" value={form.routingNumber} onChange={e => setForm(f => ({ ...f, routingNumber: e.target.value }))} />
                </div>
                <div>
                  <Label>SWIFT/BIC Code</Label>
                  <Input className="mt-1" placeholder="Optional" value={form.swiftCode} onChange={e => setForm(f => ({ ...f, swiftCode: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country</Label>
                  <Input className="mt-1" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="rounded" />
                <label htmlFor="isDefault" className="text-sm text-slate-700">Set as default payout account</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Add Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No bank accounts added yet</p>
            <p className="text-slate-400 text-xs mt-1">Add an account to receive seller payouts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${acc.isDefault ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{acc.bankName}</span>
                    {acc.isDefault && <Badge className="text-xs bg-blue-600">Default</Badge>}
                    <Badge variant="outline" className="text-xs">{acc.currency}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5">{acc.accountName}</p>
                  <p className="text-xs text-slate-500 font-mono">{acc.accountNumber}</p>
                  {acc.swiftCode && <p className="text-xs text-slate-400">SWIFT: {acc.swiftCode}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!acc.isDefault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-yellow-500"
                      onClick={() => setDefaultMutation.mutate(acc.id)}
                      disabled={setDefaultMutation.isPending}
                      title="Set as default"
                    >
                      <StarOff className="w-4 h-4" />
                    </Button>
                  )}
                  {acc.isDefault && <Star className="w-4 h-4 text-yellow-500 mx-2" />}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => deleteMutation.mutate(acc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
