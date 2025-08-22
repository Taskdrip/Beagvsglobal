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

  // Check admin access
  if (!isAuthenticated || user?.role !== 'ADMIN') {
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Configured Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods && paymentMethods.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency/Network</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method: any) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">{method.name}</TableCell>
                      <TableCell>
                        <Badge variant={method.type === 'CRYPTO' ? 'default' : 'secondary'}>
                          {method.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {method.currency && method.network ? 
                          `${method.currency} (${method.network})` : 
                          method.currency || method.network || '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.isActive ? 'default' : 'secondary'}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowDetailsFor(showDetailsFor === method.id ? null : method.id)}
                        >
                          {showDetailsFor === method.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        {showDetailsFor === method.id && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-xs">
                            <p><strong>Details:</strong></p>
                            <pre className="whitespace-pre-wrap">{JSON.stringify(method.details, null, 2)}</pre>
                            <p><strong>Instructions:</strong></p>
                            <p>{method.instructions}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(method)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deletePaymentMethod.mutate(method.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">No payment methods configured</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Edit Payment Method' : 'Add Payment Method'}
              </DialogTitle>
              <DialogDescription>
                Configure payment methods that users can use for transactions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
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
                      setEditingPayment({ ...editingPayment, type: value });
                    } else {
                      setNewPaymentMethod({ ...newPaymentMethod, type: value });
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
                  placeholder="e.g., USDT, PI, USD"
                />
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
                  placeholder="e.g., TRON, TON, BNB, SOL, AVAX"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="details">Details (JSON)</Label>
              <Textarea
                id="details"
                value={detailsInput}
                onChange={(e) => setDetailsInput(e.target.value)}
                placeholder='{"walletAddress": "TXXXxxx...", "bankName": "Example Bank", "accountNumber": "1234567890"}'
                className="h-24 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                For crypto: {"{"}"walletAddress": "address"{"}"}, For bank: {"{"}"bankName": "name", "accountNumber": "number", "routingNumber": "routing"{"}"}
              </p>
            </div>
            
            <div>
              <Label htmlFor="instructions">Payment Instructions</Label>
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
                className="h-20"
              />
            </div>
            
            <div className="flex items-center space-x-2">
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
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createPaymentMethod.isPending || updatePaymentMethod.isPending}
              >
                {editingPayment ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}