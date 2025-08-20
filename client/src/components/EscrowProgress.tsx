import { CheckCircle, Circle, AlertCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface EscrowProgressProps {
  status: string;
  className?: string;
}

const escrowSteps = [
  { key: "CREATED", label: "Created", description: "Escrow initiated" },
  { key: "FUNDED", label: "Funded", description: "Payment verified" },
  { key: "SHIPPED", label: "Shipped", description: "Item shipped" },
  { key: "DELIVERED", label: "Delivered", description: "Buyer confirms" },
  { key: "RELEASED", label: "Released", description: "Payment released" },
];

const statusOrder = ["CREATED", "FUNDED", "SHIPPED", "DELIVERED", "RELEASED"];

export default function EscrowProgress({ status, className }: EscrowProgressProps) {
  const currentIndex = statusOrder.indexOf(status);
  const isDisputed = status === "DISPUTED";
  const isRefunded = status === "REFUNDED";

  const getStepStatus = (stepIndex: number) => {
    if (isDisputed || isRefunded) {
      return stepIndex <= currentIndex ? "completed" : "pending";
    }
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getStepIcon = (stepIndex: number, stepStatus: string) => {
    const iconClass = "w-5 h-5";
    
    if (isDisputed && stepIndex === currentIndex) {
      return <AlertCircle className={cn(iconClass, "text-red-500")} />;
    }
    
    if (isRefunded && stepIndex === currentIndex) {
      return <XCircle className={cn(iconClass, "text-orange-500")} />;
    }
    
    switch (stepStatus) {
      case "completed":
        return <CheckCircle className={cn(iconClass, "text-green-500")} />;
      case "current":
        return <Clock className={cn(iconClass, "text-crypto-blue")} />;
      default:
        return <Circle className={cn(iconClass, "text-slate-300")} />;
    }
  };

  const getStepColor = (stepIndex: number, stepStatus: string) => {
    if (isDisputed && stepIndex === currentIndex) {
      return "text-red-500";
    }
    
    if (isRefunded && stepIndex === currentIndex) {
      return "text-orange-500";
    }
    
    switch (stepStatus) {
      case "completed":
        return "text-green-600";
      case "current":
        return "text-crypto-blue";
      default:
        return "text-slate-400";
    }
  };

  const getConnectorColor = (stepIndex: number) => {
    const stepStatus = getStepStatus(stepIndex);
    return stepStatus === "completed" ? "bg-green-500" : "bg-slate-200";
  };

  if (isDisputed || isRefunded) {
    return (
      <div className={cn("p-4 rounded-lg", className)} data-testid="escrow-progress-special">
        <div className="flex items-center justify-center space-x-3">
          {isDisputed ? (
            <>
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div className="text-center">
                <p className="font-semibold text-red-600">Transaction Disputed</p>
                <p className="text-sm text-slate-medium">Being reviewed by admin</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 text-orange-500" />
              <div className="text-center">
                <p className="font-semibold text-orange-600">Transaction Refunded</p>
                <p className="text-sm text-slate-medium">Payment returned to buyer</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-4", className)} data-testid="escrow-progress">
      <div className="flex items-center justify-between">
        {escrowSteps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isLast = index === escrowSteps.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white",
                    stepStatus === "completed" 
                      ? "border-green-500" 
                      : stepStatus === "current"
                      ? "border-crypto-blue"
                      : "border-slate-300"
                  )}
                  data-testid={`escrow-step-${step.key.toLowerCase()}`}
                >
                  {getStepIcon(index, stepStatus)}
                </div>
                
                {/* Step Labels - Hidden on mobile, shown on larger screens */}
                <div className="mt-2 text-center hidden sm:block">
                  <p className={cn("text-xs font-medium", getStepColor(index, stepStatus))}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2">
                  <div 
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      getConnectorColor(index)
                    )}
                    data-testid={`escrow-connector-${index}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Labels */}
      <div className="mt-4 sm:hidden">
        <div className="text-center">
          <p className={cn("text-sm font-medium", getStepColor(currentIndex, "current"))}>
            {escrowSteps[currentIndex]?.label || "Unknown Status"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {escrowSteps[currentIndex]?.description || "Processing..."}
          </p>
        </div>
      </div>

      {/* Progress Bar for Mobile */}
      <div className="mt-3 sm:hidden">
        <div className="w-full bg-slate-200 rounded-full h-1">
          <div 
            className="bg-crypto-blue h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / escrowSteps.length) * 100}%` }}
            data-testid="escrow-progress-bar"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Start</span>
          <span>{Math.round(((currentIndex + 1) / escrowSteps.length) * 100)}%</span>
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}
