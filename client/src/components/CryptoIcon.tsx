interface CryptoIconProps {
  currency: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const CRYPTO_CONFIG: Record<string, { symbol: string; bg: string; text: string; label: string }> = {
  PI: {
    symbol: "π",
    bg: "bg-purple-100",
    text: "text-purple-700",
    label: "Pi",
  },
  USDT: {
    symbol: "₮",
    bg: "bg-teal-100",
    text: "text-teal-700",
    label: "USDT",
  },
  BTC: {
    symbol: "₿",
    bg: "bg-orange-100",
    text: "text-orange-600",
    label: "BTC",
  },
  ETH: {
    symbol: "Ξ",
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    label: "ETH",
  },
  USD: {
    symbol: "$",
    bg: "bg-green-100",
    text: "text-green-700",
    label: "USD",
  },
  EUR: {
    symbol: "€",
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "EUR",
  },
  GBP: {
    symbol: "£",
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "GBP",
  },
  CAD: {
    symbol: "$",
    bg: "bg-red-100",
    text: "text-red-700",
    label: "CAD",
  },
  NGN: {
    symbol: "₦",
    bg: "bg-green-100",
    text: "text-green-800",
    label: "NGN",
  },
};

const SIZE_CLASSES = {
  sm: { icon: "w-5 h-5 text-xs", label: "text-xs" },
  md: { icon: "w-6 h-6 text-sm", label: "text-sm" },
  lg: { icon: "w-8 h-8 text-base", label: "text-base" },
};

export default function CryptoIcon({
  currency,
  size = "md",
  showLabel = true,
  className = "",
}: CryptoIconProps) {
  const config = CRYPTO_CONFIG[currency?.toUpperCase()] ?? {
    symbol: currency?.charAt(0) ?? "?",
    bg: "bg-gray-100",
    text: "text-gray-700",
    label: currency ?? "",
  };

  const sizeClass = SIZE_CLASSES[size];

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClass.icon} ${config.bg} ${config.text}`}
        title={config.label}
        data-testid={`crypto-icon-${currency}`}
      >
        {config.symbol}
      </span>
      {showLabel && (
        <span className={`font-medium ${sizeClass.label} ${config.text}`}>
          {config.label}
        </span>
      )}
    </span>
  );
}

export function CurrencyAmount({
  amount,
  currency,
  className = "",
}: {
  amount: string | number;
  currency: string;
  className?: string;
}) {
  const value = typeof amount === "number" ? amount : parseFloat(amount || "0");
  const formatted = isNaN(value) ? "0" : value.toLocaleString();

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} data-testid={`currency-amount-${currency}`}>
      <CryptoIcon currency={currency} showLabel={false} size="sm" />
      <span className="font-semibold">{formatted}</span>
      <span className="text-xs font-medium opacity-70">{currency}</span>
    </span>
  );
}
