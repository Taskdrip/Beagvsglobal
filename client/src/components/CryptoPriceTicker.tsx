import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

const COINS = ["bitcoin", "ethereum", "tether", "binancecoin", "solana", "tron"];

export default function CryptoPriceTicker() {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  const fetchPrices = async () => {
    try {
      setError(false);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(",")}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) throw new Error("API error");
      const data: CoinPrice[] = await res.json();
      setPrices(data);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-slate-900/80 border-b border-slate-700/50 py-2 px-4 overflow-hidden">
        <div className="flex items-center gap-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="w-4 h-4 rounded-full bg-slate-700" />
              <div className="w-12 h-3 rounded bg-slate-700" />
              <div className="w-16 h-3 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || prices.length === 0) {
    return null;
  }

  const duplicated = [...prices, ...prices];

  return (
    <div className="w-full bg-slate-900/90 border-b border-cyan-500/20 py-1.5 overflow-hidden relative" data-testid="crypto-price-ticker">
      <div className="ticker-track flex items-center gap-8" style={{ animation: "ticker 40s linear infinite" }}>
        {duplicated.map((coin, i) => {
          const up = coin.price_change_percentage_24h >= 0;
          return (
            <div key={`${coin.id}-${i}`} className="flex items-center gap-2 shrink-0 px-2">
              <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full" />
              <span className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
                {coin.symbol}
              </span>
              <span className="text-white text-xs font-mono font-bold">
                ${coin.current_price >= 1
                  ? coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : coin.current_price.toFixed(4)}
              </span>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-400" : "text-red-400"}`}>
                {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {up ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
              </span>
              <span className="text-slate-600 text-xs">|</span>
            </div>
          );
        })}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-slate-900/90 pl-2">
        <button
          onClick={fetchPrices}
          className="text-slate-500 hover:text-cyan-400 transition-colors"
          title="Refresh prices"
          data-testid="button-refresh-prices"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
        {lastUpdated && (
          <span className="text-slate-600 text-[10px] hidden sm:block">
            Live
          </span>
        )}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
