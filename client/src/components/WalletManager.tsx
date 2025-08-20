import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Wallet,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";

const walletSchema = z.object({
  type: z.enum(["PI", "USDT_TRON", "USDT_TON", "USDT_BNB", "USDT_SOL", "USDT_AVAX"], {
    required_error: "Please select a wallet type",
  }),
  address: z.string().min(1, "Wallet address is required").min(10, "Invalid wallet address"),
  label: z.string().optional(),
});

type WalletFormData = z.infer<typeof walletSchema>;

const walletTypes = [
  { value: "PI", label: "Pi Network", color: "bg-purple-100 text-purple-800", icon: "π" },
  { value: "USDT_TRON", label: "USDT (TRON)", color: "bg-red-100 text-red-800", icon: "T" },
  { value: "USDT_TON", label: "USDT (TON)", color: "bg-blue-100 text-blue-800", icon: "💎" },
  { value: "USDT_BNB", label: "USDT (BNB Chain)", color: "bg-yellow-100 text-yellow-800", icon: "B" },
  { value: "USDT_SOL", label: "USDT (Solana)", color: "bg-green-100 text-green-800", icon: "S" },
  { value: "USDT_AVAX", label: "USDT (Avalanche)", color: "bg-orange-100 text-orange-800", icon: "A" },
];

export default function WalletManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { data: wallets, isLoading } = useQuery({
    queryKey: ["/api/wallets"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const form = useForm<WalletFormData>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      type: undefined,
      address: "",
      label: "",
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: async (data: WalletFormData) => {
      await apiRequest("POST", "/api/wallets", data);
    },
    onSuccess: () => {
      toast({
        title: "Wallet added successfully",
        description: "Your cryptocurrency wallet has been added to your account",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to add wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wallets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Wallet removed",
        description: "The wallet has been removed from your account",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Failed to remove wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: WalletFormData) => {
    createWalletMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this wallet?")) {
      deleteWalletMutation.mutate(id);
    }
  };

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getWalletTypeInfo = (type: string) => {
    return walletTypes.find(wt => wt.value === type) || walletTypes[0];
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getExplorerUrl = (type: string, address: string) => {
    const explorers = {
      PI: null, // Pi Network doesn't have a public explorer yet
      USDT_TRON: `https://tronscan.org/#/address/${address}`,
      USDT_TON: `https://tonscan.org/address/${address}`,
      USDT_BNB: `https://bscscan.com/address/${address}`,
      USDT_SOL: `https://solscan.io/account/${address}`,
      USDT_AVAX: `https://snowtrace.io/address/${address}`,
    };
    return explorers[type as keyof typeof explorers];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>My Wallets</span>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-wallet">
                <Plus className="w-4 h-4 mr-2" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Cryptocurrency Wallet</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <Label>Wallet Type</Label>
                  <Select 
                    value={form.watch("type") || ""} 
                    onValueChange={(value) => form.setValue("type", value as any)}
                  >
                    <SelectTrigger data-testid="select-wallet-type">
                      <SelectValue placeholder="Select cryptocurrency wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Wallet Address</Label>
                  <Input
                    {...form.register("address")}
                    placeholder="Enter your wallet address"
                    className="font-mono text-sm"
                    data-testid="input-wallet-address"
                  />
                  {form.formState.errors.address && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Label (Optional)</Label>
                  <Input
                    {...form.register("label")}
                    placeholder="e.g., My Trading Wallet"
                    data-testid="input-wallet-label"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Important:</p>
                      <p>Make sure you own this wallet address. You'll receive payments here when selling items.</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowAddDialog(false)}
                    data-testid="button-cancel-wallet"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createWalletMutation.isPending}
                    data-testid="button-save-wallet"
                  >
                    {createWalletMutation.isPending ? "Adding..." : "Add Wallet"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : wallets && wallets.length > 0 ? (
          <div className="space-y-4">
            {wallets.map((wallet: any) => {
              const typeInfo = getWalletTypeInfo(wallet.type);
              const explorerUrl = getExplorerUrl(wallet.type, wallet.address);
              
              return (
                <div 
                  key={wallet.id} 
                  className="border border-slate-200 rounded-lg p-4 hover:border-crypto-blue transition-colors"
                  data-testid={`wallet-${wallet.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-lg font-bold">
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-slate-dark">{typeInfo.label}</h4>
                          <Badge className={typeInfo.color}>
                            Connected
                          </Badge>
                        </div>
                        {wallet.label && (
                          <p className="text-sm text-slate-medium mb-2">{wallet.label}</p>
                        )}
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-slate-50 px-2 py-1 rounded border font-mono text-slate-700">
                            {formatAddress(wallet.address)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.address)}
                            className="p-1 h-6 w-6"
                            data-testid={`button-copy-${wallet.id}`}
                          >
                            {copiedAddress === wallet.address ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </Button>
                          {explorerUrl && (
                            <a 
                              href={explorerUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1"
                              data-testid={`link-explorer-${wallet.id}`}
                            >
                              <ExternalLink className="w-3 h-3 text-slate-400 hover:text-crypto-blue" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Added {new Date(wallet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(wallet.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${wallet.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-dark mb-2">No wallets added</h3>
            <p className="text-slate-medium mb-6">
              Add your cryptocurrency wallets to start receiving payments
            </p>
            <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-first-wallet">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Wallet
            </Button>
          </div>
        )}

        {/* Supported Networks Info */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="font-medium text-slate-dark mb-4">Supported Networks</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {walletTypes.map((type) => (
              <div 
                key={type.value} 
                className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg"
                data-testid={`supported-network-${type.value}`}
              >
                <span className="font-mono text-lg">{type.icon}</span>
                <div>
                  <p className="text-sm font-medium text-slate-dark">
                    {type.label.split(' ')[0]}
                  </p>
                  <p className="text-xs text-slate-medium">
                    {type.label.includes('(') ? type.label.match(/\((.*?)\)/)?.[1] : 'Mainnet'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
