import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import BankAccountManager from "@/components/BankAccountManager";

export function PayoutAccountGuide({ userId, escrows }: { userId: string; escrows: any[] }) {
  const [showSetup, setShowSetup] = useState(false);
  const { data: bankAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/bank-accounts"] });
  const hasDeliveredAsSeller = escrows?.some(e => e.sellerId === userId && ["DELIVERED", "RELEASED"].includes(e.status));
  if (!hasDeliveredAsSeller) return null;
  const hasAccount = (bankAccounts as any[]).length > 0;
  if (hasAccount && !showSetup) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800 text-sm">Payout account set up</p>
          <p className="text-xs text-emerald-600">{(bankAccounts as any[]).length} account(s) saved. You're ready to receive payouts.</p>
        </div>
        <Button size="sm" variant="outline" className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => setShowSetup(v => !v)}>
          Manage
        </Button>
      </div>
    );
  }
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="font-semibold text-amber-800 text-sm">Set up your payout account</p>
      </div>
      <p className="text-xs text-amber-700">Add a bank account or crypto wallet so admin can send your earnings when funds are released.</p>
      {showSetup ? (
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <BankAccountManager />
          <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={() => setShowSetup(false)}>Done</Button>
        </div>
      ) : (
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowSetup(true)}>
          Add Payout Account
        </Button>
      )}
    </div>
  );
}
