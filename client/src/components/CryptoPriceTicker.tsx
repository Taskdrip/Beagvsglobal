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

const COINS = ["pi-network", "bitcoin", "ethereum", "tether", "binancecoin", "solana", "tron"];

const COIN_ORDER = ["pi-network", "bitcoin", "ethereum", "tether", "binancecoin", "solana", "tron"];

export default function CryptoPriceTicker() {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(",")}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) throw new Error("API error");
      const data: CoinPrice[] = await res.json();
      // Sort by our preferred order
      const sorted = COIN_ORDER
        .map(id => data.find(c => c.id === id))
        .filter(Boolean) as CoinPrice[];
      setPrices(sorted);
      setLastUpdated(new Date());
    } catch {
      // Keep existing prices on error, just don't update
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const duplicated = prices.length > 0 ? [...prices, ...prices] : [];

  return (
    <div
      className="w-full bg-[#050d1a] border-b border-cyan-500/15 py-1.5 overflow-hidden relative"
      style={{ minHeight: "28px" }}
      data-testid="crypto-price-ticker"
    >
      {loading && prices.length === 0 ? (
        <div className="flex items-center gap-6 px-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="w-4 h-4 rounded-full bg-slate-700" />
              <div className="w-10 h-2.5 rounded bg-slate-700" />
              <div className="w-14 h-2.5 rounded bg-slate-700" />
            </div>
          ))}
        </div>
      ) : duplicated.length > 0 ? (
        <>
          <div
            className="ticker-track flex items-center gap-8"
            style={{ animation: "tickerScroll 50s linear infinite", willChange: "transform" }}
          >
            {duplicated.map((coin, i) => {
              const up = coin.price_change_percentage_24h >= 0;
              return (
                <div key={`${coin.id}-${i}`} className="flex items-center gap-2 shrink-0 px-2">
                  <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full" loading="eager" />
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
                  <span className="text-slate-700 text-xs">|</span>
                </div>
              );
            })}
          </div>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#050d1a] pl-2">
            <button
              onClick={fetchPrices}
              className="text-slate-600 hover:text-cyan-400 transition-colors"
              title="Refresh prices"
              data-testid="button-refresh-prices"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <span className="text-cyan-500/60 text-[10px] font-medium hidden sm:block">LIVE</span>
          </div>
        </>
      ) : null}

      <style>{`
        @keyframes tickerScroll {
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
