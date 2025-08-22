import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Settings, ShoppingBag, Store, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Link } from "wouter";

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
          <a href="/api/login"><Button>Sign In</Button></a>
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
      toast({
        title: "Account type updated!",
        description: "Your account type has been successfully changed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update account type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAccountTypeDescription = (type: string) => {
    switch (type) {
      case 'BUYER':
        return 'You can browse and purchase products/services from sellers.';
      case 'SELLER':
        return 'You can list and sell products/services to buyers.';
      case 'BOTH':
        return 'You have full access to both buying and selling features.';
      default:
        return 'Unknown account type.';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'BUYER':
        return <ShoppingBag className="w-5 h-5" />;
      case 'SELLER':
        return <Store className="w-5 h-5" />;
      case 'BOTH':
        return <Users className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Type Settings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Account Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {getAccountTypeIcon(user.accountType)}
                  <div className="flex-1">
                    <p className="font-medium">Current Account Type</p>
                    <p className="text-sm text-gray-600">{getAccountTypeDescription(user.accountType)}</p>
                  </div>
                  <Badge variant="default" className="capitalize">
                    {user.accountType.toLowerCase()}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Switch Account Type</h3>
                  <p className="text-gray-600 mb-4">
                    Choose the type of account that best fits your needs. You can change this at any time.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Account Type Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        user.accountType === 'BUYER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center mb-2">
                          <ShoppingBag className="w-5 h-5 mr-2" />
                          <p className="font-medium">Buyer</p>
                        </div>
                        <p className="text-sm text-gray-600">Browse and purchase products from sellers</p>
                      </div>
                      
                      <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        user.accountType === 'SELLER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center mb-2">
                          <Store className="w-5 h-5 mr-2" />
                          <p className="font-medium">Seller</p>
                        </div>
                        <p className="text-sm text-gray-600">List and sell your products/services</p>
                      </div>
                      
                      <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        user.accountType === 'BOTH' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center mb-2">
                          <Users className="w-5 h-5 mr-2" />
                          <p className="font-medium">Both</p>
                        </div>
                        <p className="text-sm text-gray-600">Full access to buying and selling</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Select
                        value={user.accountType}
                        onValueChange={(value) => updateAccountType.mutate(value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BUYER">Buyer</SelectItem>
                          <SelectItem value="SELLER">Seller</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        disabled={updateAccountType.isPending}
                        onClick={() => {
                          // The update happens automatically when selecting from dropdown
                        }}
                      >
                        {updateAccountType.isPending ? 'Updating...' : 'Update Account Type'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Features by Account Type */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Features Available to You:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {(user.accountType === 'BUYER' || user.accountType === 'BOTH') && (
                      <div>
                        <p className="font-medium text-blue-600 mb-1">Buyer Features:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Browse marketplace listings</li>
                          <li>• Create escrow transactions</li>
                          <li>• Secure payment processing</li>
                          <li>• Chat with sellers</li>
                          <li>• Leave reviews and ratings</li>
                        </ul>
                      </div>
                    )}
                    
                    {(user.accountType === 'SELLER' || user.accountType === 'BOTH') && (
                      <div>
                        <p className="font-medium text-green-600 mb-1">Seller Features:</p>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Create product/service listings</li>
                          <li>• Manage inventory and pricing</li>
                          <li>• Receive secure payments</li>
                          <li>• Chat with buyers</li>
                          <li>• Track sales and performance</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}