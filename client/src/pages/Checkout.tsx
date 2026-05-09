import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, Copy, CheckCircle, MessageCircle, Shield, AlertCircle, Package, MapPin, Truck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Checkout() {
  const [, params] = useRoute("/checkout/:escrowId");
  const escrowId = params?.escrowId;
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    recipientName: "",
    recipientPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const { data: escrow, isLoading } = useQuery<any>({
    queryKey: ["/api/escrows", escrowId],
    enabled: !!escrowId && isAuthenticated,
  });

  const { data: paymentMethods } = useQuery<any[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: platformWallet } = useQuery<any>({
    queryKey: ["/api/platform-wallets/currency", escrow?.currency, "network", escrow?.network],
    enabled: !!(escrow && escrow.currency && escrow.network && !["USD","EUR","GBP","CAD","NGN"].includes(escrow.currency)),
  });

  // Countdown timer effect
  useEffect(() => {
    if (paymentConfirmed) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentConfirmed]);

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/escrows/${escrowId}`, { status: "FUNDED" });
    },
    onSuccess: () => {
      setPaymentConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/escrows"] });
      toast({
        title: "Payment confirmed!",
        description: "Chat is now available with all parties. Redirecting...",
      });
      setTimeout(() => {
        if (escrow) {
          apiRequest("POST", "/api/chat/threads", {
            listingId: escrow.listingId,
            sellerId: escrow.sellerId,
            escrowId: escrow.id,
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
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

  const isFiatCurrency = ["USD", "EUR", "GBP", "CAD", "NGN"].includes(escrow?.currency || "");
  const isLoaded = !isLoading && escrow && (isFiatCurrency || platformWallet);

  if (isLoading || !escrow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p>Loading checkout details...</p>
        </div>
      </div>
    );
  }

  const isGoodsEscrow = escrow && ['PRODUCT', 'SHIPPING_SERVICE'].includes(escrow.listing?.type);

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-5">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Confirmed!</h1>
              <p className="text-gray-600 mb-6">
                Your escrow transaction is now active. Chat is available between all parties.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Secure Chat Activated</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  You can now communicate securely with the seller and escrow admin.
                </p>
              </div>
              <p className="text-sm text-gray-500">Redirecting to chat…</p>
            </CardContent>
          </Card>

          {/* Shipping address form — for goods/product escrows */}
          {isGoodsEscrow && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-base">
                  <Package className="w-5 h-5" />
                  Provide Your Shipping Address
                </CardTitle>
                <p className="text-sm text-blue-600">
                  Share your delivery address so the seller can prepare your shipment and generate a tracking number.
                </p>
              </CardHeader>
              <CardContent>
                {!showShippingForm ? (
                  <Button
                    onClick={() => setShowShippingForm(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-add-shipping-address"
                  >
                    <MapPin className="w-4 h-4 mr-2" /> Add Shipping Address
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Recipient Name *</label>
                        <Input
                          value={shippingAddress.recipientName}
                          onChange={e => setShippingAddress(p => ({ ...p, recipientName: e.target.value }))}
                          placeholder="Full name"
                          data-testid="input-recipient-name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Phone Number</label>
                        <Input
                          value={shippingAddress.recipientPhone}
                          onChange={e => setShippingAddress(p => ({ ...p, recipientPhone: e.target.value }))}
                          placeholder="+1 555 000 0000"
                          data-testid="input-recipient-phone"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Address Line 1 *</label>
                        <Input
                          value={shippingAddress.addressLine1}
                          onChange={e => setShippingAddress(p => ({ ...p, addressLine1: e.target.value }))}
                          placeholder="Street address, P.O. Box"
                          data-testid="input-address-line1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Address Line 2</label>
                        <Input
                          value={shippingAddress.addressLine2}
                          onChange={e => setShippingAddress(p => ({ ...p, addressLine2: e.target.value }))}
                          placeholder="Apartment, suite, unit, building (optional)"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">City *</label>
                        <Input
                          value={shippingAddress.city}
                          onChange={e => setShippingAddress(p => ({ ...p, city: e.target.value }))}
                          placeholder="City"
                          data-testid="input-shipping-city"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Country *</label>
                        <Input
                          value={shippingAddress.country}
                          onChange={e => setShippingAddress(p => ({ ...p, country: e.target.value }))}
                          placeholder="Country"
                          data-testid="input-shipping-country"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Postal / ZIP Code</label>
                        <Input
                          value={shippingAddress.postalCode}
                          onChange={e => setShippingAddress(p => ({ ...p, postalCode: e.target.value }))}
                          placeholder="e.g. 10001"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => setShowShippingForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country) {
                            toast({ title: "Please fill in required fields", variant: "destructive" });
                            return;
                          }
                          try {
                            await apiRequest("PATCH", `/api/escrows/${escrowId}`, {
                              metadata: { shippingAddress }
                            });
                            toast({
                              title: "Shipping address saved!",
                              description: "The seller has been notified and can now prepare your shipment.",
                            });
                            setShowShippingForm(false);
                          } catch (e: any) {
                            toast({ title: "Failed to save address", description: e.message, variant: "destructive" });
                          }
                        }}
                        disabled={!shippingAddress.recipientName || !shippingAddress.city || !shippingAddress.country}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-save-shipping-address"
                      >
                        <Truck className="w-4 h-4 mr-2" /> Save Address & Notify Seller
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Track shipment link if escrow is already shipped */}
          {escrow?.status === 'SHIPPED' && (
            <Card className="border-cyan-200 bg-cyan-50/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-cyan-600" />
                  <div>
                    <p className="font-semibold text-cyan-800 text-sm">Shipment In Progress</p>
                    <p className="text-xs text-cyan-600">Your package is on its way — track it in real time.</p>
                  </div>
                </div>
                <Link href="/tracking">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white" data-testid="button-track-shipment">
                    Track Now →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(escrow.amount || "0") + parseFloat(escrow.amount || "0") * 0.1;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">Secure Escrow Payment</h1>
          </div>
          <p className="text-gray-600">Complete your payment — funds are held safely until delivery</p>
        </div>

        {/* Payment Timer */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock
                  className={`w-6 h-6 ${
                    timeRemaining > 300 ? "text-green-500" : timeRemaining > 60 ? "text-yellow-500" : "text-red-500"
                  }`}
                />
                <span className="text-lg font-semibold">Time Remaining</span>
              </div>
              <div
                className={`text-4xl font-bold mb-2 ${
                  timeRemaining > 300 ? "text-green-600" : timeRemaining > 60 ? "text-yellow-600" : "text-red-600"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500">
                {timeRemaining > 0
                  ? "Please complete your payment within the time limit"
                  : "Time window has expired — please contact support if you already sent payment"}
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
                <span className="font-semibold">
                  {parseFloat(escrow.amount || "0").toLocaleString()} {escrow.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (10%):</span>
                <span className="font-semibold">
                  {(parseFloat(escrow.amount || "0") * 0.1).toLocaleString()} {escrow.currency}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold">
                  {totalAmount.toLocaleString()} {escrow.currency}
                </span>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3">Payment Instructions</h4>

              {isFiatCurrency ? (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        💳 Bank Transfer — {escrow.currency}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 text-center">
                      Transfer funds to the bank account below:
                    </p>
                  </div>

                  {paymentMethods && (() => {
                    const bankTransfer = paymentMethods.find(
                      (m) => m.type === "BANK_TRANSFER" && m.currency === escrow.currency
                    );
                    if (bankTransfer?.details) {
                      return (
                        <div className="bg-white p-4 rounded-lg border space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bankTransfer.details.bankName && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bank Name</label>
                                <p className="font-semibold mt-0.5">{bankTransfer.details.bankName}</p>
                              </div>
                            )}
                            {bankTransfer.details.accountName && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Name</label>
                                <p className="font-semibold mt-0.5">{bankTransfer.details.accountName}</p>
                              </div>
                            )}
                            {bankTransfer.details.accountNumber && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Number</label>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="font-mono text-sm">{bankTransfer.details.accountNumber}</p>
                                  <button
                                    onClick={() => copyToClipboard(bankTransfer.details.accountNumber, "Account number")}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                            {bankTransfer.details.routingNumber && (
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Routing Number</label>
                                <p className="font-mono text-sm mt-0.5">{bankTransfer.details.routingNumber}</p>
                              </div>
                            )}
                          </div>
                          {bankTransfer.instructions && (
                            <div className="bg-blue-50 p-3 rounded border border-blue-200">
                              <p className="text-sm text-blue-700">
                                <strong>Important:</strong> {bankTransfer.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                        Bank transfer details not configured for {escrow.currency}. Please contact support.
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          escrow.currency === "PI"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {escrow.currency === "PI" ? "π PI Network" : `USDT — ${escrow.network}`}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 text-center">
                      Send exactly{" "}
                      <strong>
                        {totalAmount.toFixed(8)} {escrow.currency}
                      </strong>{" "}
                      to this wallet address:
                    </p>
                  </div>

                  {platformWallet ? (
                    <div className="bg-white p-3 rounded-lg border">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                        Wallet Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <p
                          className="font-mono text-sm flex-1 break-all text-gray-800"
                          data-testid="text-wallet-address"
                        >
                          {platformWallet.address}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(platformWallet.address, "Wallet address")}
                          className="flex-shrink-0"
                          data-testid="button-copy-wallet"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Wallet address not configured for this network. Please contact support.
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirm Payment Section — always visible (not locked behind timer) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Confirm Your Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700 mb-1">
                <span className="font-semibold">Have you already sent the payment?</span>
              </p>
              <p className="text-xs text-blue-600">
                By confirming, you acknowledge that you have sent{" "}
                <strong>
                  {totalAmount.toLocaleString()} {escrow.currency}
                </strong>{" "}
                to the provided {isFiatCurrency ? "bank account" : "wallet address"}. Chat will be activated for secure communication.
              </p>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
              onClick={() => confirmPaymentMutation.mutate()}
              disabled={confirmPaymentMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {confirmPaymentMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Yes, I've Sent the Payment
                </span>
              )}
            </Button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Only click this after you have completed the transfer. False confirmations may result in account suspension.
            </p>
          </CardContent>
        </Card>

        {/* Back to listing */}
        <div className="mt-4 text-center">
          <a href={`/listing/${escrow.listing?.slug || escrow.listingId}`}>
            <Button variant="outline">← Back to Listing</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
