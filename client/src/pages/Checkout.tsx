import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, Copy, CheckCircle, MessageCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Checkout() {
  const [, params] = useRoute("/checkout/:escrowId");
  const escrowId = params?.escrowId;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes in seconds
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  const { data: escrow, isLoading } = useQuery<any>({
    queryKey: ["/api/escrows", escrowId],
    enabled: !!escrowId && isAuthenticated,
  });

  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: platformWallet } = useQuery<any>({
    queryKey: ["/api/platform-wallets/currency", escrow?.currency, "network", escrow?.network],
    enabled: !!(escrow && escrow.currency && escrow.network),
  });

  const getPaymentDetails = (currency: string, network: string) => {
    if (!paymentMethods) return null;
    
    return paymentMethods.find(method => 
      method.currency === currency && 
      method.network === network &&
      method.isActive
    );
  };

  // Countdown timer effect
  useEffect(() => {
    if (paymentConfirmed) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentConfirmed]);

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/escrows/${escrowId}`, {
        status: "FUNDED"
      });
    },
    onSuccess: () => {
      setPaymentConfirmed(true);
      toast({
        title: "Payment confirmed!",
        description: "Chat is now available with all parties. Redirecting...",
      });
      
      // Create chat thread and redirect
      setTimeout(() => {
        if (escrow) {
          apiRequest('POST', '/api/chat/threads', {
            listingId: escrow.listingId,
            sellerId: escrow.sellerId,
            escrowId: escrow.id
          }).then(() => {
            window.location.href = `/chat/${escrow.listingId}`;
          });
        }
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to confirm payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to access the checkout page.</p>
            <a href="/api/login">
              <Button className="w-full">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !escrow || !platformWallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Confirmed!</h1>
            <p className="text-gray-600 mb-6">
              Your escrow transaction is now active. Chat is available between all parties.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Secure Chat Activated</span>
              </div>
              <p className="text-sm text-green-600 mt-2">
                You can now communicate securely with the seller and escrow admin.
              </p>
            </div>
            <p className="text-sm text-gray-500">Redirecting to chat...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = parseFloat(escrow.amount) + (parseFloat(escrow.amount) * 0.1);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Escrow Payment</h1>
          <p className="text-gray-600">Complete your payment within the time limit</p>
        </div>

        {/* Payment Timer */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className={`w-6 h-6 ${timeRemaining > 300 ? 'text-green-500' : timeRemaining > 60 ? 'text-yellow-500' : 'text-red-500'}`} />
                <span className="text-lg font-semibold">Time Remaining</span>
              </div>
              <div className={`text-4xl font-bold mb-2 ${timeRemaining > 300 ? 'text-green-600' : timeRemaining > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500">
                {timeRemaining > 0 ? "Complete payment before time expires" : "Payment window has expired"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Price:</span>
                <span className="font-semibold">{parseFloat(escrow.amount).toLocaleString()} {escrow.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (10%):</span>
                <span className="font-semibold">{(parseFloat(escrow.amount) * 0.1).toLocaleString()} {escrow.currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">{totalAmount.toLocaleString()} {escrow.currency}</span>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3">Payment Instructions</h4>
              
              {['USD', 'EUR', 'GBP', 'CAD', 'NGN'].includes(escrow.currency) ? (
                // Bank Transfer Instructions
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        💳 Bank Transfer - {escrow.currency}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 text-center">Transfer funds to the bank account below:</p>
                  </div>

                  {paymentMethods && (() => {
                    const bankTransfer = paymentMethods.find(method => method.type === 'BANK_TRANSFER' && method.currency === escrow.currency);
                    if (bankTransfer?.details) {
                      return (
                        <div className="bg-white p-4 rounded-lg border space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Bank Name:</label>
                              <p className="font-semibold">{bankTransfer.details.bankName}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Account Name:</label>
                              <p className="font-semibold">{bankTransfer.details.accountName}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Account Number:</label>
                              <p className="font-mono text-sm">{bankTransfer.details.accountNumber}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Routing Number:</label>
                              <p className="font-mono text-sm">{bankTransfer.details.routingNumber}</p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <p className="text-sm text-blue-700">
                              <strong>Important:</strong> {bankTransfer.instructions}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : (
                // Cryptocurrency Instructions
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        escrow.currency === 'PI' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {escrow.currency === 'PI' ? 'π PI Network' : `USDT - ${escrow.network}`}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 text-center">Send payment to this wallet address:</p>
                  </div>

                  {platformWallet && (
                    <div className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <p className="font-mono text-sm flex-1 break-all" data-testid="text-wallet-address">
                          {platformWallet.address}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(platformWallet.address);
                            toast({
                              title: "Copied!",
                              description: "Wallet address copied to clipboard",
                            });
                          }}
                          className="flex-shrink-0"
                          data-testid="button-copy-wallet"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirm Payment Section */}
        {timeRemaining === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700 mb-2">
                  <span className="font-semibold">Have you sent the payment?</span>
                </p>
                <p className="text-xs text-blue-600">
                  By confirming, you acknowledge that you have sent {totalAmount.toLocaleString()} {escrow.currency} to the provided wallet address.
                  Chat will be activated for secure communication with all parties.
                </p>
              </div>
              
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => confirmPaymentMutation.mutate()}
                disabled={confirmPaymentMutation.isPending}
                data-testid="button-confirm-payment"
              >
                {confirmPaymentMutation.isPending ? "Confirming..." : "Yes, I've Sent the Payment"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Back to listing */}
        <div className="mt-6 text-center">
          <a href={`/listing/${escrow.listing?.slug || escrow.listingId}`}>
            <Button variant="outline">Back to Listing</Button>
          </a>
        </div>
      </div>
    </div>
  );
}