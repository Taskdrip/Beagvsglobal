import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Globe, ShoppingBag, Store, Users, Truck, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";

const ACCOUNT_TYPES = [
  {
    value: "BUYER",
    title: "Buyer",
    description: "Browse and purchase real estate, products, and services from sellers.",
    icon: ShoppingBag,
  },
  {
    value: "SELLER",
    title: "Seller",
    description: "List and sell your properties, products, or services to buyers.",
    icon: Store,
  },
  {
    value: "BOTH",
    title: "Buyer & Seller",
    description: "Get full access — buy from others and sell your own listings.",
    icon: Users,
  },
];

export default function PiOnboarding() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);

  const updateAccountType = useMutation({
    mutationFn: async (accountType: string) => {
      return await apiRequest("PATCH", "/api/user/account-type", { accountType });
    },
    onSuccess: () => {
      toast({ title: "You're all set!", description: "Taking you to your dashboard..." });
      // Full page reload so auth/session state is freshly picked up by the router.
      window.location.href = "/dashboard";
    },
    onError: (error: any) => {
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (value: string) => {
    setSelected(value);
    updateAccountType.mutate(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Globe className="w-10 h-10 text-crypto-blue" />
            <span className="text-2xl font-bold text-slate-dark">Beagvs Global</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <CheckCircle className="w-7 h-7 text-green-500" />
            <h1 className="text-3xl font-bold text-slate-dark">Welcome! One quick step.</h1>
          </div>
          <p className="text-slate-medium">
            Choose how you'd like to use Beagvs Global. You can change this anytime in Account Settings.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selected === type.value;
            const isPending = updateAccountType.isPending && isSelected;
            return (
              <Card
                key={type.value}
                className={`cursor-pointer transition-all border-2 hover:shadow-lg ${
                  isSelected ? "border-crypto-blue shadow-lg" : "border-slate-100"
                } ${updateAccountType.isPending ? "pointer-events-none opacity-70" : ""}`}
                onClick={() => handleSelect(type.value)}
                data-testid={`card-account-type-${type.value.toLowerCase()}`}
              >
                <CardHeader className="text-center pb-2">
                  <Icon className="w-10 h-10 text-crypto-blue mx-auto mb-2" />
                  <CardTitle className="text-lg">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-medium text-center">{type.description}</p>
                  <Button
                    className="w-full mt-4 bg-crypto-blue hover:bg-crypto-teal"
                    disabled={updateAccountType.isPending}
                    data-testid={`button-select-${type.value.toLowerCase()}`}
                  >
                    {isPending ? "Setting up..." : "Choose"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-medium mb-2">Want to work as a shipping agent instead?</p>
          <Link href="/signup/agent">
            <Button variant="outline" className="border-crypto-blue text-crypto-blue" data-testid="button-agent-signup">
              <Truck className="w-4 h-4 mr-2" />
              Apply as a Shipping Agent
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
