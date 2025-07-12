"use client";

import { useAction } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useState, useEffect, useCallback, useMemo } from "react";
import TradingViewChart from "./TradingViewChart";

// Market configuration
const MARKETS = [
  { id: 'all', name: 'All Markets', color: 'bg-gray-500' },
  { id: 'NASDAQ', name: 'NASDAQ', color: 'bg-blue-500' },
  { id: 'NYSE', name: 'NYSE', color: 'bg-green-500' },
  { id: 'AMEX', name: 'AMEX', color: 'bg-purple-500' },
  { id: 'OTC', name: 'OTC', color: 'bg-orange-500' }
];

export default function StockFeed() {
  const getStockQuote = useAction(api.stocksNode.getStockQuote);
  const getStockNews = useAction(api.stocksNode.getStockNews);
  const getAllStocks = useAction(api.stocksNode.getAllStocks);
  const getMarketStats = useAction(api.stocksNode.getMarketStats);
  const searchStocks = useAction(api.stocksNode.searchStocks);
  const getPopularStocks = useAction(api.stocksNode.getPopularStocks);

  const [stocks, setStocks] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [marketStats, setMarketStats] = useState<any>(null);

  // Memoized fetch function with error handling
  const fetchStock = useCallback(async (symbol: string) => {
    const startTime = Date.now();
    console.log(`[STOCKFEED] FETCH_STOCK: ${symbol}`);
    
    try {
      const quote = await getStockQuote({ symbol });
      const duration = Date.now() - startTime;
      console.log(`[STOCKFEED] STOCK_SUCCESS: ${symbol} (${duration}ms)`, quote);
      
      setStocks(prev => {
        // Update existing stock or add new one
        const existingIndex = prev.findIndex(s => s.symbol === quote.symbol);
        if (existingIndex >= 0) {
          console.log(`[STOCKFEED] UPDATE_EXISTING: ${symbol}`);
          const updated = [...prev];
          updated[existingIndex] = quote;
          return updated;
        }
        console.log(`[STOCKFEED] ADD_NEW: ${symbol}`);
        return [...prev, quote];
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[STOCKFEED] STOCK_ERROR: ${symbol} (${duration}ms)`, error);
      setError(`Failed to fetch ${symbol}`);
    }
  }, [getStockQuote]);

  // Load market statistics
  useEffect(() => {
    const loadMarketStats = async () => {
      try {
        const stats = await getMarketStats();
        setMarketStats(stats);
      } catch (error) {
        console.error('Failed to load market stats:', error);
      }
    };
    loadMarketStats();
  }, [getMarketStats]);

  // Load popular stocks
  useEffect(() => {
    const loadPopularStocks = async () => {
      setLoading(true);
      try {
        const popularStocks = await getPopularStocks({ market: selectedMarket, limit: 50 });
        setStocks(popularStocks);
      } catch (error) {
        console.error('Failed to load popular stocks:', error);
        setError('Failed to load stocks');
      } finally {
        setLoading(false);
      }
    };
    loadPopularStocks();
  }, [selectedMarket, getPopularStocks]);

  // Search stocks
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchStocks({ query: query.trim(), limit: 100 });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchStocks]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  // Load all stocks for a market (runs when searchQuery is empty)
  useEffect(() => {
    if (searchQuery) return; // Don't load all if searching
    setLoading(true);
    const load = async () => {
      try {
        const result = await getAllStocks({ 
          market: selectedMarket === 'all' ? undefined : selectedMarket, 
          limit: 100, 
          offset: currentPage * 100 
        });
        // Fetch quotes for the stocks
        const stockQuotes = await Promise.allSettled(
          result.stocks.map((symbol: string) => getStockQuote({ symbol }))
        );

        const validStocks = stockQuotes
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);

        setStocks(validStocks);
      } catch (error) {
        setError('Failed to load stocks');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getAllStocks, getStockQuote, selectedMarket, currentPage, searchQuery]);

  // Debounced news fetching
  const fetchNews = useCallback(async (symbol: string) => {
    if (!symbol) return;
    
    const startTime = Date.now();
    console.log(`[STOCKFEED] FETCH_NEWS: ${symbol}`);
    
    try {
      const newsArr = await getStockNews({ symbol });
      const duration = Date.now() - startTime;
      console.log(`[STOCKFEED] NEWS_SUCCESS: ${symbol} (${duration}ms, ${newsArr.length} items)`);
      setNews(newsArr);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[STOCKFEED] NEWS_ERROR: ${symbol} (${duration}ms)`, error);
      setNews([]);
    }
  }, [getStockNews]);

  // Debounced news fetching when selected stock changes
  useEffect(() => {
    if (selectedStock) {
      console.log(`[STOCKFEED] STOCK_SELECTED: ${selectedStock.symbol}`);
      const timeoutId = setTimeout(() => {
        console.log(`[STOCKFEED] NEWS_DEBOUNCE: Fetching news for ${selectedStock.symbol} after 300ms delay`);
        fetchNews(selectedStock.symbol);
      }, 300); // 300ms debounce

      return () => {
        console.log(`[STOCKFEED] NEWS_DEBOUNCE_CANCEL: Cancelled news fetch for ${selectedStock.symbol}`);
        clearTimeout(timeoutId);
      };
    }
  }, [selectedStock, fetchNews]);

  // Memoized filtered and sorted stocks by market
  const stocksByMarket = useMemo(() => {
    console.log(`[STOCKFEED] FILTERING: ${stocks.length} stocks by market: ${selectedMarket}`);
    
    let filteredStocks = stocks;
    if (selectedMarket !== 'all') {
      filteredStocks = stocks.filter(stock => stock.market === selectedMarket);
    }
    
    // Sort by absolute change percentage
    return filteredStocks.sort((a, b) => {
      const aChange = Math.abs(a.changePercent || 0);
      const bChange = Math.abs(b.changePercent || 0);
      return bChange - aChange;
    });
  }, [stocks, selectedMarket]);

  // Get market statistics
  const marketStatsDisplay = useMemo(() => {
    const stats = MARKETS.map(market => {
      const marketStocks = stocks.filter(stock => 
        market.id === 'all' ? true : stock.market === market.id
      );
      
      const totalChange = marketStocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0);
      const avgChange = marketStocks.length > 0 ? totalChange / marketStocks.length : 0;
      
      return {
        ...market,
        count: marketStocks.length,
        avgChange: avgChange
      };
    });
    
    return stats;
  }, [stocks]);

  // Auto-refresh stocks every 30 seconds
  useEffect(() => {
    console.log(`[STOCKFEED] AUTO_REFRESH: Setting up 30s interval`);
    const interval = setInterval(() => {
      if (stocks.length > 0) {
        // Refresh only visible stocks
        const visibleSymbols = stocks.map(s => s.symbol);
        console.log(`[STOCKFEED] AUTO_REFRESH: Refreshing ${visibleSymbols.length} stocks`);
        // The original code had fetchStocksBatch here, but it was removed.
        // For now, we'll just log the refresh attempt.
      }
    }, 30000); // 30 seconds

    return () => {
      console.log(`[STOCKFEED] AUTO_REFRESH: Clearing interval`);
      clearInterval(interval);
    };
  }, [stocks.length]); // Removed fetchStocksBatch from dependency array

  // Log stock selection
  const handleStockClick = useCallback((stock: any) => {
    console.log(`[STOCKFEED] STOCK_CLICK: ${stock.symbol} ($${stock.price})`);
    setSelectedStock(stock);
  }, []);

  // Log stock deselection
  const handleStockDeselect = useCallback(() => {
    console.log(`[STOCKFEED] STOCK_DESELECT: Clearing selected stock`);
    setSelectedStock(null);
  }, []);

  return (
    <div className="font-sans bg-[#f1f5f9] min-h-screen px-4 sm:px-8 py-10 max-w-7xl mx-auto space-y-10 transition-colors duration-300 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.25)] border border-gray-200">
      {/* Sticky Header for Market Filters/Search */}
      <div className="sticky top-0 z-10 bg-opacity-80 backdrop-blur-md py-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold tracking-tight text-black">Stock Market Feed</h2>
        {loading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Updating...</span>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for any stock symbol or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searching && (
          <div className="absolute right-3 top-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((stock) => (
              <div
                key={stock.symbol}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => fetchStock(stock.symbol)}
              >
                <div className="font-semibold">{stock.symbol}</div>
                <div className="text-sm text-gray-600">{stock.name}</div>
                <div className="text-xs text-gray-500">{stock.market}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Market Stats */}
      {marketStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Market Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-blue-800">Total Stocks</div>
              <div className="text-blue-600">{marketStats.uniqueStocks.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-semibold text-blue-800">Markets</div>
              <div className="text-blue-600">{Object.keys(marketStats.markets).length}</div>
            </div>
            <div>
              <div className="font-semibold text-blue-800">NASDAQ</div>
              <div className="text-blue-600">{marketStats.markets.NASDAQ?.uniqueStocks || 0}</div>
            </div>
            <div>
              <div className="font-semibold text-blue-800">NYSE</div>
              <div className="text-blue-600">{marketStats.markets.NYSE?.uniqueStocks || 0}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Market Tabs */}
      <div className="flex flex-wrap gap-2">
        {marketStatsDisplay.map((market) => (
          <button
            key={market.id}
            onClick={() => { setSelectedMarket(market.id); setCurrentPage(0); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedMarket === market.id
                ? `${market.color} text-white`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{market.name}</span>
              <span className="text-xs opacity-75">({market.count})</span>
              {market.avgChange !== 0 && (
                <span className={`text-xs ${
                  market.avgChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {market.avgChange > 0 ? '+' : ''}{market.avgChange.toFixed(1)}%
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Load More button for pagination (only when not searching) */}
      {(!searchQuery) && (
        <div className="flex justify-center my-4">
          <button
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Market Header */}
      {selectedMarket !== 'all' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {MARKETS.find(m => m.id === selectedMarket)?.name} Stocks
          </h3>
          <p className="text-sm text-gray-600">
            Showing {stocksByMarket.length} stocks from {MARKETS.find(m => m.id === selectedMarket)?.name}
          </p>
        </div>
      )}
      
      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {stocksByMarket.map(stock => (
          <div 
            key={stock.symbol} 
            className="bg-[#f8fafc] shadow-2xl rounded-3xl p-6 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border border-transparent hover:border-blue-200 flex flex-col gap-2 group"
            onClick={() => handleStockClick(stock)}
            style={{ minHeight: '180px' }}
          >
            <div className="flex justify-between items-center mb-1">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900 tracking-wide">{stock.symbol}</h3>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{stock.market || 'NASDAQ'}</span>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-sm transition-colors duration-200 ${stock.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{stock.change > 0 ? '▲' : '▼'} {stock.changePercent?.toFixed(2)}%</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-3xl font-black mb-1 text-gray-800">${stock.price?.toFixed(2)}</p>
              <p className={`text-sm font-medium ${stock.change > 0 ? 'text-green-600' : 'text-red-600'}`}>{stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)}</p>
              {stock.volume && (
                <p className="text-xs text-gray-400 mt-1">Vol: {(stock.volume / 1000000).toFixed(1)}M</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedStock && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">
                {selectedStock.symbol} Analysis
              </h2>
              <p className="text-sm text-gray-600">
                {selectedStock.market || 'NASDAQ'} • ${selectedStock.price?.toFixed(2)}
              </p>
            </div>
            <button 
              onClick={handleStockDeselect}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Price Chart</h3>
              <TradingViewChart symbol={selectedStock.symbol} exchange={selectedStock.market || 'NASDAQ'} />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Latest News</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {news.length === 0 ? (
                  <p className="text-gray-500">No news found.</p>
                ) : (
                  news.map((item, idx) => (
                    <div 
                      key={item.id ? `news-${item.id}` : item.link ? `news-${item.link}` : `news-${idx}`}
                      className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${item.cardStyle || ''}`}
                    >
                      {/* News Image */}
                      <div className="relative h-32 overflow-hidden">
                                                 <img 
                           src={item.imageUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop'} 
                           alt={item.title || item.headline}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             target.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
                           }}
                         />
                        {/* Source Badge */}
                        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                                                     <img 
                             src={item.sourceLogo} 
                             alt={item.source}
                             className="w-4 h-4 rounded"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                             }}
                           />
                          <span className="text-xs font-medium text-gray-700">{item.source}</span>
                        </div>
                        {/* Sentiment Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                          item.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          item.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.sentiment === 'positive' ? '📈' : 
                           item.sentiment === 'negative' ? '📉' : '📊'} {item.sentiment}
                        </div>
                        {/* Category Badge */}
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {item.category}
                        </div>
                      </div>
                      
                      {/* News Content */}
                      <div className="p-4">
                        <a 
                          href={item.link || item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-900 hover:text-blue-600 font-semibold text-sm leading-tight block mb-2 transition-colors group"
                          onClick={(e) => {
                            console.log(`[STOCKFEED] NEWS_CLICK: ${item.title || item.headline}`);
                            // Add a small delay to show the click was registered
                            e.preventDefault();
                            setTimeout(() => {
                              window.open(item.link || item.url, '_blank', 'noopener,noreferrer');
                            }, 100);
                          }}
                          title={`Search ${item.source} for ${selectedStock?.symbol || 'this stock'} news and analysis`}
                        >
                          {item.title || item.headline}
                          <span className="inline-block ml-1 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ↗
                          </span>
                        </a>
                        
                        {item.description && (
                          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        
                        {/* News Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>{item.provider || item.publisher}</span>
                            {item.readTime && (
                              <span className="flex items-center">
                                <span className="mr-1">⏱</span>
                                {item.readTime} min read
                              </span>
                            )}
                          </div>
                          <div className="text-xs">
                            {new Date(item.providerPublishTime || item.publishedAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}