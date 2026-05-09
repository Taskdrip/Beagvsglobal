import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import EscrowProgress from "@/components/EscrowProgress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link, useLocation } from "wouter";
import { 
  Shield,
  DollarSign,
  Users,
  FileText,
  Wallet,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Package,
  Truck,
  Loader2,
  RotateCcw,
  MapPin,
  Percent,
  Sliders,
  Save
} from "lucide-react";

const platformWalletSchema = z.object({
  type: z.enum(["PI", "USDT_TRON", "USDT_TON", "USDT_BNB", "USDT_SOL", "USDT_AVAX"]),
  address: z.string().min(1, "Wallet address is required"),
});

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  contentMarkdown: z.string().min(1, "Content is required"),
  coverImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published: z.boolean().default(false),
});

type PlatformWalletFormData = z.infer<typeof platformWalletSchema>;
type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showBlogDialog, setShowBlogDialog] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<any>(null);

  // Check admin access
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-dark mb-4">Access Denied</h1>
          <p className="text-slate-medium mb-8">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Data queries
  const { data: escrows } = useQuery({
    queryKey: ["/api/escrows", { admin: true }],
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

  const { data: platformWallets } = useQuery({
    queryKey: ["/api/platform-wallets"],
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

  const { data: blogPosts } = useQuery({
    queryKey: ["/api/blog", { published: false }],
  });

  const { data: platformSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/platform-settings"],
  });

  const { data: allShipments } = useQuery({
    queryKey: ["/api/admin/shipments"],
  });

  const [feeEdits, setFeeEdits] = useState<Record<string, any>>({});

  // Form setup
  const walletForm = useForm<PlatformWalletFormData>({
    resolver: zodResolver(platformWalletSchema),
    defaultValues: {
      type: undefined,
      address: "",
    },
  });

  const blogForm = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      contentMarkdown: "",
      coverImageUrl: "",
      published: false,
    },
  });

  // Mutations
  const updateEscrowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PATCH", `/api/escrows/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Escrow updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      setSelectedEscrow(null);
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
        title: "Failed to update escrow",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createWalletMutation = useMutation({
    mutationFn: async (data: PlatformWalletFormData) => {
      await apiRequest("POST", "/api/platform-wallets", data);
    },
    onSuccess: () => {
      toast({
        title: "Platform wallet created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-wallets"] });
      setShowWalletDialog(false);
      walletForm.reset();
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
        title: "Failed to create wallet",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const blogMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      const endpoint = editingBlogPost ? `/api/blog/${editingBlogPost.id}` : "/api/blog";
      const method = editingBlogPost ? "PATCH" : "POST";
      await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingBlogPost ? "Blog post updated successfully" : "Blog post created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      setShowBlogDialog(false);
      setEditingBlogPost(null);
      blogForm.reset();
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
        title: editingBlogPost ? "Failed to update blog post" : "Failed to create blog post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/blog/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Blog post deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
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
        title: "Failed to delete blog post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleEscrowAction = (escrow: any, status: string) => {
    setSelectedEscrow({ ...escrow, newStatus: status });
  };

  const confirmEscrowAction = () => {
    if (!selectedEscrow) return;
    updateEscrowMutation.mutate({
      id: selectedEscrow.id,
      data: { status: selectedEscrow.newStatus }
    });
  };

  const handleCreateWallet = (data: PlatformWalletFormData) => {
    createWalletMutation.mutate(data);
  };

  const handleBlogSubmit = (data: BlogPostFormData) => {
    blogMutation.mutate(data);
  };

  // Fee management mutations
  const upsertSettingMutation = useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: any; description?: string }) =>
      apiRequest("PUT", `/api/platform-settings/${key}`, { value, description }),
    onSuccess: () => {
      toast({ title: "Setting saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
      setFeeEdits({});
    },
    onError: (err: any) => toast({ title: "Failed to save", description: err.message, variant: "destructive" }),
  });

  const updateShipmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/shipments/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Shipment status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments/all"] });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const DEFAULT_FEE_SETTINGS = [
    { key: "fee_product",          label: "Product / Goods",        description: "Platform fee % on product escrows",          defaultPct: 10 },
    { key: "fee_real_estate",      label: "Real Estate",            description: "Platform fee % on real estate escrows",      defaultPct: 5  },
    { key: "fee_shipping_service", label: "Shipping Services",      description: "Platform fee % on shipping service escrows", defaultPct: 8  },
    { key: "fee_service",          label: "General Services",       description: "Platform fee % on service escrows",          defaultPct: 10 },
  ];

  const getSettingValue = (key: string) => {
    const s = (platformSettings as any[])?.find((x: any) => x.key === key);
    return s?.value?.percentage ?? DEFAULT_FEE_SETTINGS.find(f => f.key === key)?.defaultPct ?? 10;
  };

  const handleEditBlogPost = (post: any) => {
    setEditingBlogPost(post);
    blogForm.reset({
      title: post.title,
      excerpt: post.excerpt,
      contentMarkdown: post.contentMarkdown,
      coverImageUrl: post.coverImageUrl || "",
      published: post.published,
    });
    setShowBlogDialog(true);
  };

  const handleDeleteBlogPost = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteBlogMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      CREATED: "bg-gray-100 text-gray-800",
      FUNDED: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-yellow-100 text-yellow-800",
      DELIVERED: "bg-purple-100 text-purple-800",
      RELEASED: "bg-green-100 text-green-800",
      DISPUTED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    };
    return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-slate-800 text-white rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Control Panel</h1>
                <p className="text-slate-300">Manage platform operations and settings</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-300">Welcome back, {user?.firstName || user?.username}</p>
              <p className="text-sm text-slate-400">Last login: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Active Escrows</p>
                  <p className="text-xl font-bold" data-testid="stat-active-escrows">
                    {escrows?.filter((e: any) => ['FUNDED', 'SHIPPED', 'DELIVERED'].includes(e.status))?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Completed Today</p>
                  <p className="text-xl font-bold" data-testid="stat-completed-today">
                    {escrows?.filter((e: any) => e.status === 'RELEASED' && 
                      new Date(e.updatedAt).toDateString() === new Date().toDateString())?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Pending Verification</p>
                  <p className="text-xl font-bold" data-testid="stat-pending-verification">
                    {escrows?.filter((e: any) => e.status === 'CREATED')?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-medium">Platform Wallets</p>
                  <p className="text-xl font-bold" data-testid="stat-platform-wallets">
                    {platformWallets?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="escrows" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-slate-100 rounded-lg">
            <TabsTrigger value="escrows" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-escrows">
              Escrows
            </TabsTrigger>
            <TabsTrigger value="wallets" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-wallets">
              Wallets
            </TabsTrigger>
            <TabsTrigger value="fees" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-fees">
              Fees &amp; Rates
            </TabsTrigger>
            <TabsTrigger value="shipments" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-shipments">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-blog">
              Blog
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm px-3 py-2 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-slate-900" data-testid="tab-settings">
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="escrows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Escrow Management</CardTitle>
              </CardHeader>
              <CardContent>
                {escrows && escrows.length > 0 ? (
                  <div className="space-y-4">
                    {escrows.map((escrow: any) => (
                      <div key={escrow.id} className="p-4 border rounded-lg" data-testid={`escrow-${escrow.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-dark">{escrow.listing?.title}</h4>
                            <p className="text-sm text-slate-medium">
                              {escrow.buyer?.username} ↔ {escrow.seller?.username}
                            </p>
                          </div>
                          <Badge className={getStatusBadge(escrow.status)}>
                            {escrow.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-medium">Amount</p>
                            <p className="font-semibold">{escrow.amount} {escrow.currency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-medium">Network</p>
                            <p className="font-medium">{escrow.network}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-medium">Created</p>
                            <p className="font-medium">{new Date(escrow.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <EscrowProgress status={escrow.status} className="mb-4" />

                        <div className="flex space-x-2">
                          {escrow.status === 'CREATED' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleEscrowAction(escrow, 'FUNDED')}
                              data-testid={`button-verify-${escrow.id}`}
                            >
                              Verify & Fund
                            </Button>
                          )}
                          {escrow.status === 'DELIVERED' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleEscrowAction(escrow, 'RELEASED')}
                              data-testid={`button-release-${escrow.id}`}
                            >
                              Release
                            </Button>
                          )}
                          {['FUNDED', 'SHIPPED', 'DELIVERED'].includes(escrow.status) && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleEscrowAction(escrow, 'DISPUTED')}
                              data-testid={`button-dispute-${escrow.id}`}
                            >
                              Dispute
                            </Button>
                          )}
                          {escrow.status === 'DISPUTED' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleEscrowAction(escrow, 'REFUNDED')}
                              data-testid={`button-refund-${escrow.id}`}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No escrow transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Platform Wallets</span>
                  <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-wallet">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Wallet
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Platform Wallet</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={walletForm.handleSubmit(handleCreateWallet)} className="space-y-4">
                        <div>
                          <Label>Wallet Type</Label>
                          <Select onValueChange={(value) => walletForm.setValue("type", value as any)}>
                            <SelectTrigger data-testid="select-wallet-type">
                              <SelectValue placeholder="Select wallet type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PI">Pi Network</SelectItem>
                              <SelectItem value="USDT_TRON">USDT (TRON)</SelectItem>
                              <SelectItem value="USDT_TON">USDT (TON)</SelectItem>
                              <SelectItem value="USDT_BNB">USDT (BNB Chain)</SelectItem>
                              <SelectItem value="USDT_SOL">USDT (Solana)</SelectItem>
                              <SelectItem value="USDT_AVAX">USDT (Avalanche)</SelectItem>
                            </SelectContent>
                          </Select>
                          {walletForm.formState.errors.type && (
                            <p className="text-sm text-red-600 mt-1">
                              {walletForm.formState.errors.type.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Wallet Address</Label>
                          <Input
                            {...walletForm.register("address")}
                            placeholder="Enter wallet address"
                            data-testid="input-wallet-address"
                          />
                          {walletForm.formState.errors.address && (
                            <p className="text-sm text-red-600 mt-1">
                              {walletForm.formState.errors.address.message}
                            </p>
                          )}
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setShowWalletDialog(false)}
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
                            {createWalletMutation.isPending ? "Creating..." : "Create Wallet"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformWallets && platformWallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {platformWallets.map((wallet: any) => (
                      <div key={wallet.id} className="p-4 border rounded-lg" data-testid={`wallet-${wallet.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-dark">
                            {wallet.type.replace('_', ' ').replace('USDT ', 'USDT on ')}
                          </h4>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <p className="text-sm text-slate-medium mb-2">Address:</p>
                        <p className="font-mono text-xs bg-slate-50 p-2 rounded border break-all">
                          {wallet.address}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Added {new Date(wallet.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No platform wallets configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Blog Management</span>
                  <Dialog open={showBlogDialog} onOpenChange={setShowBlogDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-blog-post">
                        <Plus className="w-4 h-4 mr-2" />
                        New Post
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingBlogPost ? "Edit Blog Post" : "Create New Blog Post"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={blogForm.handleSubmit(handleBlogSubmit)} className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input
                            {...blogForm.register("title")}
                            placeholder="Enter blog post title"
                            data-testid="input-blog-title"
                          />
                          {blogForm.formState.errors.title && (
                            <p className="text-sm text-red-600 mt-1">
                              {blogForm.formState.errors.title.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Excerpt</Label>
                          <Textarea
                            {...blogForm.register("excerpt")}
                            placeholder="Brief description of the post"
                            rows={2}
                            data-testid="input-blog-excerpt"
                          />
                          {blogForm.formState.errors.excerpt && (
                            <p className="text-sm text-red-600 mt-1">
                              {blogForm.formState.errors.excerpt.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Cover Image URL (optional)</Label>
                          <Input
                            {...blogForm.register("coverImageUrl")}
                            placeholder="https://example.com/image.jpg"
                            data-testid="input-blog-cover"
                          />
                          {blogForm.formState.errors.coverImageUrl && (
                            <p className="text-sm text-red-600 mt-1">
                              {blogForm.formState.errors.coverImageUrl.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label>Content (Markdown)</Label>
                          <Textarea
                            {...blogForm.register("contentMarkdown")}
                            placeholder="Write your content in Markdown format..."
                            rows={10}
                            data-testid="input-blog-content"
                          />
                          {blogForm.formState.errors.contentMarkdown && (
                            <p className="text-sm text-red-600 mt-1">
                              {blogForm.formState.errors.contentMarkdown.message}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="published"
                            {...blogForm.register("published")}
                            className="rounded"
                            data-testid="checkbox-blog-published"
                          />
                          <Label htmlFor="published">Publish immediately</Label>
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => {
                              setShowBlogDialog(false);
                              setEditingBlogPost(null);
                              blogForm.reset();
                            }}
                            data-testid="button-cancel-blog"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={blogMutation.isPending}
                            data-testid="button-save-blog"
                          >
                            {blogMutation.isPending ? "Saving..." : (editingBlogPost ? "Update Post" : "Create Post")}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blogPosts && blogPosts.length > 0 ? (
                  <div className="space-y-4">
                    {blogPosts.map((post: any) => (
                      <div key={post.id} className="p-4 border rounded-lg" data-testid={`blog-post-${post.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-slate-dark">{post.title}</h4>
                              <Badge variant={post.published ? "default" : "secondary"}>
                                {post.published ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-medium mb-2">{post.excerpt}</p>
                            <p className="text-xs text-slate-400">
                              Created {new Date(post.createdAt).toLocaleDateString()} by {post.author?.username}
                            </p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Link href={`/blog/${post.slug}`}>
                              <Button size="sm" variant="outline" data-testid={`button-view-blog-${post.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditBlogPost(post)}
                              data-testid={`button-edit-blog-${post.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteBlogPost(post.id)}
                              data-testid={`button-delete-blog-${post.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-medium">No blog posts found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Fees & Rates Tab ── */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-blue-600" />
                  Platform Fee Configuration
                </CardTitle>
                <p className="text-sm text-slate-500">Set the platform fee percentage charged per transaction category. Changes apply to new escrows only.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {DEFAULT_FEE_SETTINGS.map(fee => {
                  const currentVal = feeEdits[fee.key] !== undefined ? feeEdits[fee.key] : getSettingValue(fee.key);
                  return (
                    <div key={fee.key} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50" data-testid={`fee-row-${fee.key}`}>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{fee.label}</p>
                        <p className="text-sm text-slate-500">{fee.description}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-6">
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={currentVal}
                            onChange={e => setFeeEdits((prev: any) => ({ ...prev, [fee.key]: parseFloat(e.target.value) }))}
                            className="w-24 pr-7 text-right"
                            data-testid={`input-fee-${fee.key}`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                        </div>
                        <Button
                          size="sm"
                          disabled={upsertSettingMutation.isPending || feeEdits[fee.key] === undefined}
                          onClick={() => upsertSettingMutation.mutate({
                            key: fee.key,
                            value: { percentage: currentVal },
                            description: fee.description,
                          })}
                          data-testid={`button-save-fee-${fee.key}`}
                        >
                          {upsertSettingMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-600" />
                  Shipping Zone Rates (Base Rate per kg — Air Freight)
                </CardTitle>
                <p className="text-sm text-slate-500">Set base shipping rates per destination zone. Displayed to buyers in the shipping calculator.</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const zoneSetting = (platformSettings as any[])?.find((x: any) => x.key === "shipping_rates");
                  const zones = zoneSetting?.value?.zones ?? [
                    { name: "Zone 1 – West Africa", rate: 3.5 },
                    { name: "Zone 2 – East Africa", rate: 4.2 },
                    { name: "Zone 3 – Europe", rate: 6.8 },
                    { name: "Zone 4 – North America", rate: 8.5 },
                    { name: "Zone 5 – Asia Pacific", rate: 9.2 },
                    { name: "Zone 6 – Rest of World", rate: 12.0 },
                  ];
                  const editedZones = (feeEdits["shipping_rates"] ?? zones) as any[];
                  return (
                    <div className="space-y-3">
                      {editedZones.map((zone: any, idx: number) => (
                        <div key={zone.name} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                          <p className="flex-1 text-sm font-medium text-slate-800">{zone.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={zone.rate}
                              onChange={e => {
                                const updated = editedZones.map((z, i) =>
                                  i === idx ? { ...z, rate: parseFloat(e.target.value) } : z
                                );
                                setFeeEdits((prev: any) => ({ ...prev, "shipping_rates": updated }));
                              }}
                              className="w-24 text-right"
                              data-testid={`input-zone-rate-${idx}`}
                            />
                            <span className="text-slate-400 text-sm">/kg</span>
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() => upsertSettingMutation.mutate({
                          key: "shipping_rates",
                          value: { zones: editedZones },
                          description: "Shipping zone base rates per kg (air freight)",
                        })}
                        disabled={upsertSettingMutation.isPending || !feeEdits["shipping_rates"]}
                        className="mt-2"
                        data-testid="button-save-shipping-rates"
                      >
                        {upsertSettingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Shipping Rates
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Current Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {(platformSettings as any[])?.length ? (
                  <div className="space-y-2">
                    {(platformSettings as any[]).map((s: any) => (
                      <div key={s.key} className="flex items-center justify-between p-3 border rounded-lg text-sm" data-testid={`setting-row-${s.key}`}>
                        <div>
                          <span className="font-mono font-semibold text-slate-700">{s.key}</span>
                          {s.description && <p className="text-slate-400 text-xs">{s.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                            {JSON.stringify(s.value)}
                          </code>
                          <span className="text-xs text-slate-400">
                            {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No settings configured yet. Save a fee above to get started.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Shipments Tab ── */}
          <TabsContent value="shipments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-cyan-600" />
                    All Shipments ({(allShipments as any[])?.length ?? 0})
                  </span>
                  <Link href="/shipping">
                    <Button size="sm" variant="outline">View Public Hub</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!(allShipments as any[])?.length ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400">No shipments found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(allShipments as any[]).map((s: any) => {
                      const STATUS_COLORS: Record<string, string> = {
                        PENDING: "bg-yellow-100 text-yellow-800",
                        PICKED_UP: "bg-blue-100 text-blue-800",
                        IN_TRANSIT: "bg-cyan-100 text-cyan-800",
                        OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
                        DELIVERED: "bg-green-100 text-green-800",
                        FAILED: "bg-red-100 text-red-800",
                        RETURNED: "bg-orange-100 text-orange-800",
                      };
                      return (
                        <div key={s.id} className="p-4 border rounded-xl hover:shadow-sm transition-shadow" data-testid={`admin-shipment-${s.id}`}>
                          <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-mono font-bold text-slate-900 text-sm">{s.trackingNumber}</span>
                                <Badge className={`text-xs ${STATUS_COLORS[s.status] || "bg-slate-100 text-slate-800"}`}>{s.status}</Badge>
                              </div>
                              <p className="text-sm text-slate-500">{s.carrier}{s.serviceType ? ` · ${s.serviceType}` : ""}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                <MapPin className="w-3 h-3" />
                                {s.origin && s.destination ? `${s.origin} → ${s.destination}` : s.origin || s.destination || "Route not specified"}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Seller: {s.seller?.username ?? "—"} · Buyer: {s.buyer?.username ?? "—"}
                                {s.weightKg ? ` · ${s.weightKg}kg` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Select
                                defaultValue={s.status}
                                onValueChange={val => updateShipmentStatusMutation.mutate({ id: s.id, status: val })}
                              >
                                <SelectTrigger className="w-44 text-xs h-8" data-testid={`select-shipment-status-${s.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["PENDING","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED","RETURNED"].map(st => (
                                    <SelectItem key={st} value={st} className="text-xs">{st.replace(/_/g," ")}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Link href={`/shipments/${s.id}`}>
                                <Button size="sm" variant="outline" className="h-8 text-xs" data-testid={`button-view-shipment-${s.id}`}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Methods</span>
                  <Link href="/admin/payment-methods">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Platform Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Platform Fee:</p>
                        <p className="font-semibold text-blue-800">10%</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Supported Currencies:</p>
                        <p className="font-semibold text-blue-800">PI, USDT, USD (Bank Transfer)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Payment Methods Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Cryptocurrency Payments</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Bank Transfer</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-700">Escrow Protection</span>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Note</h4>
                    <p className="text-sm text-yellow-700">
                      Bank transfer details must be manually managed by admins. 
                      Click "Manage Payment Methods" above to configure bank account information for customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        {selectedEscrow && (
          <Dialog open={!!selectedEscrow} onOpenChange={() => setSelectedEscrow(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Escrow Action</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Are you sure you want to change the status of escrow for "{selectedEscrow.listing?.title}" 
                  to <strong>{selectedEscrow.newStatus}</strong>?
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedEscrow(null)}
                    data-testid="button-cancel-escrow-action"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={confirmEscrowAction}
                    disabled={updateEscrowMutation.isPending}
                    data-testid="button-confirm-escrow-action"
                  >
                    {updateEscrowMutation.isPending ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Footer />
    </div>
  );
}
