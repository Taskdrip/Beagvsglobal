import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function AdminPaymentMethods() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    type: 'CRYPTO',
    currency: '',
    network: '',
    details: {},
    instructions: '',
    isActive: true
  });
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDetailsFor, setShowDetailsFor] = useState<string | null>(null);
  const [detailsInput, setDetailsInput] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: ''
  });

  // Check admin access
  if (!isAuthenticated || (user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">You need admin privileges to access this page.</p>
          <Link href="/"><Button>Go Home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { data: paymentMethods } = useQuery({
    queryKey: ["/api/admin/payment-methods"],
  });

  const createPaymentMethod = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/payment-methods", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method created successfully",
      });
      setShowPaymentDialog(false);
      setNewPaymentMethod({
        name: '',
        type: 'CRYPTO',
        currency: '',
        network: '',
        details: {},
        instructions: '',
        isActive: true
      });
      setDetailsInput('');
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePaymentMethod = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/admin/payment-methods/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
      setShowPaymentDialog(false);
      setEditingPayment(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/payment-methods/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const method = editingPayment || newPaymentMethod;
    let details = {};
    
    if (method.type === 'BANK_TRANSFER') {
      // Use structured bank details
      details = {
        bankName: bankDetails.bankName,
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.routingNumber
      };
      
      // Validate required bank fields
      if (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber) {
        toast({
          title: "Error",
          description: "Bank name, account name, and account number are required for bank transfers",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Use JSON for crypto details
      try {
        if (detailsInput) {
          details = JSON.parse(detailsInput);
        }
      } catch {
        toast({
          title: "Error",
          description: "Invalid JSON in details field",
          variant: "destructive",
        });
        return;
      }
    }

    const paymentMethodData = {
      ...method,
      details,
    };

    if (editingPayment) {
      updatePaymentMethod.mutate({ ...paymentMethodData, id: editingPayment.id });
    } else {
      createPaymentMethod.mutate(paymentMethodData);
    }
  };

  const openEditDialog = (method: any) => {
    setEditingPayment(method);
    setDetailsInput(JSON.stringify(method.details, null, 2));
    
    // Populate bank details if it's a bank transfer
    if (method.type === 'BANK_TRANSFER' && method.details) {
      setBankDetails({
        bankName: method.details.bankName || '',
        accountName: method.details.accountName || '',
        accountNumber: method.details.accountNumber || '',
        routingNumber: method.details.routingNumber || ''
      });
    } else {
      setBankDetails({
        bankName: '',
        accountName: '',
        accountNumber: '',
        routingNumber: ''
      });
    }
    
    setShowPaymentDialog(true);
  };

  const openCreateDialog = () => {
    setEditingPayment(null);
    setNewPaymentMethod({
      name: '',
      type: 'CRYPTO',
      currency: '',
      network: '',
      details: {},
      instructions: '',
      isActive: true
    });
    setDetailsInput('{}');
    setBankDetails({
      bankName: '',
      accountName: '',
      accountNumber: '',
      routingNumber: ''
    });
    setShowPaymentDialog(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="w-6 h-6 mr-3" />
              Configured Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {paymentMethods && (paymentMethods as any[]).length > 0 ? (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Currency/Network</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Details</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(paymentMethods as any[]).map((method: any) => (
                        <TableRow key={method.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium">{method.name}</TableCell>
                          <TableCell>
                            <Badge variant={method.type === 'CRYPTO' ? 'default' : 'secondary'} className="font-medium">
                              {method.type === 'CRYPTO' ? '💰 CRYPTO' : '🏦 BANK'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <span className="font-mono text-sm">
                                {method.currency && method.network ? 
                                  `${method.currency} (${method.network})` : 
                                  method.currency || method.network || '-'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={method.isActive ? 'default' : 'secondary'} className={method.isActive ? 'bg-green-100 text-green-800' : ''}>
                              {method.isActive ? '✅ Active' : '❌ Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowDetailsFor(showDetailsFor === method.id ? null : method.id)}
                              className="hover:bg-blue-50"
                            >
                              {showDetailsFor === method.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {showDetailsFor === method.id && (
                              <div className="absolute z-10 mt-2 text-xs bg-white p-3 rounded-lg shadow-lg border max-w-sm">
                                <p className="font-semibold text-gray-700 mb-2">Details:</p>
                                <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(method.details, null, 2)}
                                </pre>
                                <p className="font-semibold text-gray-700 mt-2 mb-1">Instructions:</p>
                                <p className="text-gray-600">{method.instructions}</p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditDialog(method)}
                                className="hover:bg-blue-50 text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deletePaymentMethod.mutate(method.id)}
                                className="hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-4">
                  {(paymentMethods as any[]).map((method: any) => (
                    <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{method.name}</h3>
                        <Badge variant={method.isActive ? 'default' : 'secondary'} className={method.isActive ? 'bg-green-100 text-green-800' : ''}>
                          {method.isActive ? '✅ Active' : '❌ Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Type:</span>
                          <Badge variant={method.type === 'CRYPTO' ? 'default' : 'secondary'} className="text-xs">
                            {method.type === 'CRYPTO' ? '💰 CRYPTO' : '🏦 BANK'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Currency:</span>
                          <span className="font-mono text-sm font-medium">
                            {method.currency && method.network ? 
                              `${method.currency} (${method.network})` : 
                              method.currency || method.network || '-'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDetailsFor(showDetailsFor === method.id ? null : method.id)}
                          className="text-xs"
                        >
                          {showDetailsFor === method.id ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </>
                          )}
                        </Button>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(method)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deletePaymentMethod.mutate(method.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {showDetailsFor === method.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 text-xs">
                          <p className="font-semibold text-gray-700 mb-2">Details:</p>
                          <div className="bg-gray-50 p-3 rounded text-xs overflow-x-auto mb-3">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(method.details, null, 2)}
                            </pre>
                          </div>
                          <p className="font-semibold text-gray-700 mb-1">Instructions:</p>
                          <p className="text-gray-600">{method.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-500 mb-2">No payment methods configured</p>
                <p className="text-sm text-gray-400">Add your first payment method to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
              <DialogDescription>
                Configure payment methods that users can use for transactions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingPayment ? editingPayment.name : newPaymentMethod.name}
                  onChange={(e) => {
                    if (editingPayment) {
                      setEditingPayment({ ...editingPayment, name: e.target.value });
                    } else {
                      setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value });
                    }
                  }}
                  placeholder="e.g., USDT Tron Network"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editingPayment ? editingPayment.type : newPaymentMethod.type}
                  onValueChange={(value) => {
                    if (editingPayment) {
                      setEditingPayment({ 
                        ...editingPayment, 
                        type: value,
                        network: value === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : editingPayment.network
                      });
                    } else {
                      setNewPaymentMethod({ 
                        ...newPaymentMethod, 
                        type: value,
                        currency: value === 'BANK_TRANSFER' ? '' : '',
                        network: value === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : ''
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                {(editingPayment?.type || newPaymentMethod.type) === 'BANK_TRANSFER' ? (
                  <Select
                    value={editingPayment ? editingPayment.currency : newPaymentMethod.currency}
                    onValueChange={(value) => {
                      if (editingPayment) {
                        setEditingPayment({ ...editingPayment, currency: value });
                      } else {
                        setNewPaymentMethod({ ...newPaymentMethod, currency: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                      <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="NGN">🇳🇬 NGN - Nigerian Naira</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="currency"
                    value={editingPayment ? editingPayment.currency : newPaymentMethod.currency}
                    onChange={(e) => {
                      if (editingPayment) {
                        setEditingPayment({ ...editingPayment, currency: e.target.value });
                      } else {
                        setNewPaymentMethod({ ...newPaymentMethod, currency: e.target.value });
                      }
                    }}
                    placeholder="e.g., USDT, PI"
                  />
                )}
              </div>
              
              <div>
                <Label htmlFor="network">Network</Label>
                <Input
                  id="network"
                  value={editingPayment ? editingPayment.network : newPaymentMethod.network}
                  onChange={(e) => {
                    if (editingPayment) {
                      setEditingPayment({ ...editingPayment, network: e.target.value });
                    } else {
                      setNewPaymentMethod({ ...newPaymentMethod, network: e.target.value });
                    }
                  }}
                  placeholder={(editingPayment?.type || newPaymentMethod.type) === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'e.g., TRON, TON, BNB'}
                  disabled={(editingPayment?.type || newPaymentMethod.type) === 'BANK_TRANSFER'}
                />
              </div>
            </div>
            
            {/* Conditional Details Section */}
            {(editingPayment?.type || newPaymentMethod.type) === 'BANK_TRANSFER' ? (
              <div className="col-span-1 sm:col-span-2 space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    🏦 Bank Transfer Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName" className="text-sm font-medium text-blue-800">
                        Bank Name *
                      </Label>
                      <Input
                        id="bankName"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        placeholder="e.g., Chase Bank, Access Bank"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountName" className="text-sm font-medium text-blue-800">
                        Account Name *
                      </Label>
                      <Input
                        id="accountName"
                        value={bankDetails.accountName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                        placeholder="e.g., RealShipEX LLC"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accountNumber" className="text-sm font-medium text-blue-800">
                        Account Number *
                      </Label>
                      <Input
                        id="accountNumber"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        placeholder="e.g., 1234567890"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="routingNumber" className="text-sm font-medium text-blue-800">
                        Routing/Sort Code
                      </Label>
                      <Input
                        id="routingNumber"
                        value={bankDetails.routingNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                        placeholder="e.g., 021000021, 12-34-56"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        For US: Routing Number, UK: Sort Code, others as applicable
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-span-1 sm:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <Label htmlFor="details" className="text-sm font-medium text-purple-800 mb-2 block">
                    🔗 Cryptocurrency Details (JSON)
                  </Label>
                  <Textarea
                    id="details"
                    value={detailsInput}
                    onChange={(e) => setDetailsInput(e.target.value)}
                    placeholder='{"walletAddress": "TXXXxxx..."}'
                    className="h-24 font-mono text-sm focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-purple-600 mt-2">
                    💡 Example: {"{"}"walletAddress": "TXXXxxx..."{"}"}
                  </p>
                </div>
              </div>
            )}
            
            <div className="col-span-1 sm:col-span-2">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                <Label htmlFor="instructions" className="text-sm font-medium text-green-800 mb-2 block">
                  📋 Payment Instructions
                </Label>
                <Textarea
                  id="instructions"
                  value={editingPayment ? editingPayment.instructions : newPaymentMethod.instructions}
                  onChange={(e) => {
                    if (editingPayment) {
                      setEditingPayment({ ...editingPayment, instructions: e.target.value });
                    } else {
                      setNewPaymentMethod({ ...newPaymentMethod, instructions: e.target.value });
                    }
                  }}
                  placeholder="Step-by-step instructions for users on how to make payment..."
                  className="h-20 focus:ring-green-500 focus:border-green-500"
                />
                <p className="text-xs text-green-600 mt-1">
                  💡 Include reference format, processing time, and any special notes
                </p>
              </div>
            </div>
            
            <div className="col-span-1 sm:col-span-2">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingPayment ? editingPayment.isActive : newPaymentMethod.isActive}
                    onChange={(e) => {
                      if (editingPayment) {
                        setEditingPayment({ ...editingPayment, isActive: e.target.checked });
                      } else {
                        setNewPaymentMethod({ ...newPaymentMethod, isActive: e.target.checked });
                      }
                    }}
                    className="w-4 h-4 text-yellow-600 bg-yellow-100 border-yellow-300 rounded focus:ring-yellow-500 focus:ring-2"
                  />
                  <Label htmlFor="isActive" className="text-sm font-medium text-yellow-800">
                    🟢 Set as Active Payment Method
                  </Label>
                </div>
                <p className="text-xs text-yellow-600 mt-2 ml-7">
                  💡 Only active payment methods will be available to users during checkout
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                ❌ Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createPaymentMethod.isPending || updatePaymentMethod.isPending}
                className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {createPaymentMethod.isPending || updatePaymentMethod.isPending ? (
                  <>⏳ Processing...</>
                ) : (
                  <>{editingPayment ? '✅ Update Payment Method' : '🚀 Create Payment Method'}</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}