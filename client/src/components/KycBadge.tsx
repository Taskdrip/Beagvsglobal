import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KycBadgeProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: "w-3.5 h-3.5", text: "text-xs", wrapper: "gap-0.5 px-1.5 py-0.5" },
  md: { icon: "w-4 h-4",   text: "text-xs", wrapper: "gap-1 px-2 py-0.5" },
  lg: { icon: "w-5 h-5",   text: "text-sm", wrapper: "gap-1.5 px-2.5 py-1" },
};

export default function KycBadge({ size = "md", showLabel = true, className = "" }: KycBadgeProps) {
  const s = sizes[size];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center ${s.wrapper} rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium select-none ${className}`}
          >
            <ShieldCheck className={`${s.icon} text-emerald-500 flex-shrink-0`} />
            {showLabel && <span className={s.text}>Verified</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">KYC Identity Verified</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
