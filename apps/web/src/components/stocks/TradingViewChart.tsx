import { useEffect, useRef } from "react";

function normalizeExchange(exchange?: string) {
  if (!exchange) return 'NASDAQ';
  if (exchange.toUpperCase().startsWith('NASDAQ')) return 'NASDAQ';
  if (exchange.toUpperCase().startsWith('NYSE')) return 'NYSE';
  if (exchange.toUpperCase().startsWith('AMEX')) return 'AMEX';
  if (exchange.toUpperCase().startsWith('OTC')) return 'OTC';
  return exchange.toUpperCase();
}

export default function TradingViewChart({ symbol, exchange }: { symbol: string, exchange?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== "undefined") {
        const prefix = normalizeExchange(exchange);
        new (window as any).TradingView.widget({
          width: "100%",
          height: 400,
          symbol: `${prefix}:${symbol}`,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: `tradingview_${symbol}`,
        });
      }
    };
    document.head.appendChild(script);
  }, [symbol, exchange]);

  return <div id={`tradingview_${symbol}`} ref={containerRef} />;
}
