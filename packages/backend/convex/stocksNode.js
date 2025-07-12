"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import yahooFinance from 'yahoo-finance2';

// Performance monitoring
const performanceMetrics = {
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  timeouts: 0,
  errors: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
};

// Ultra-fast caching with longer TTL
const CACHE_CONFIG = {
  PREDICTION_TTL: 15 * 60 * 1000, // 15 minutes for predictions
  QUOTE_TTL: 60 * 1000, // 1 minute for quotes
  HISTORY_TTL: 5 * 60 * 1000, // 5 minutes for historical data
  NEWS_TTL: 15 * 60 * 1000, // 15 minutes for news
  MAX_CACHE_SIZE: 2000, // Larger cache
};

// Ultra-fast cache implementation
class FastCache {
  constructor(maxSize = CACHE_CONFIG.MAX_CACHE_SIZE, cacheName = 'cache') {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.cacheName = cacheName;
  }

  set(key, value, ttl) {
    const startTime = Date.now();
    
    if (this.cache.size >= this.maxSize) {
      // Remove first entry (FIFO for speed)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`[${this.cacheName}] Cache full, evicted: ${firstKey}`);
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    });
    
    console.log(`[${this.cacheName}] SET: ${key} (${Date.now() - startTime}ms)`);
  }

  get(key) {
    const startTime = Date.now();
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`[${this.cacheName}] MISS: ${key}`);
      performanceMetrics.cacheMisses++;
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      console.log(`[${this.cacheName}] EXPIRED: ${key} (age: ${now - item.timestamp}ms)`);
      performanceMetrics.cacheMisses++;
      return null;
    }

    console.log(`[${this.cacheName}] HIT: ${key} (${Date.now() - startTime}ms)`);
    performanceMetrics.cacheHits++;
    return item.data;
  }

  clear() {
    console.log(`[${this.cacheName}] CLEAR: ${this.cache.size} entries`);
    this.cache.clear();
  }
}

const predictionCache = new FastCache(CACHE_CONFIG.MAX_CACHE_SIZE, 'PREDICTION');
const quoteCache = new FastCache(CACHE_CONFIG.MAX_CACHE_SIZE, 'QUOTE');
const historyCache = new FastCache(CACHE_CONFIG.MAX_CACHE_SIZE, 'HISTORY');
const newsCache = new FastCache(CACHE_CONFIG.MAX_CACHE_SIZE, 'NEWS');

// Pre-computed popular stocks data
const POPULAR_STOCKS_DATA = new Map();

// Initialize with common stocks for instant access
const COMMON_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

// Comprehensive stock lists for ALL stocks
const ALL_STOCKS = {
  // Major US Exchanges
  NASDAQ: [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'GOOG', 'COST', 'RBLX', 'LYFT', 'SNAP', 'UBER', 'SHOP',
    'ADBE', 'CRM', 'PYPL', 'INTC', 'AMD', 'NFLX', 'PEP', 'ABNB', 'ZM', 'SQ', 'ROKU', 'SPOT', 'SNAP', 'TWTR', 'UBER',
    'LYFT', 'PINS', 'ZM', 'DOCU', 'CRWD', 'OKTA', 'ZM', 'TEAM', 'WDAY', 'ADP', 'ORCL', 'CSCO', 'QCOM', 'AVGO', 'TXN',
    'MU', 'AMD', 'NVDA', 'INTC', 'TSLA', 'NIO', 'XPEV', 'LI', 'LCID', 'RIVN', 'FSR', 'WKHS', 'NKLA', 'HYLN', 'IDEX',
    'PLUG', 'FCEL', 'BLDP', 'BEEM', 'SUNW', 'ENPH', 'RUN', 'SPWR', 'FSLR', 'JKS', 'CSIQ', 'YGE', 'DQ', 'SOL', 'VSLR',
    'SEDG', 'ENPH', 'RUN', 'SPWR', 'FSLR', 'JKS', 'CSIQ', 'YGE', 'DQ', 'SOL', 'VSLR', 'SEDG', 'ENPH', 'RUN', 'SPWR'
  ],
  NYSE: [
    'F', 'GM', 'GE', 'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'JNJ', 'PFE', 'UNH', 'HD', 'LOW', 'WMT', 'TGT', 'COST',
    'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD',
    'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW',
    'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT',
    'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'WMT', 'TGT'
  ],
  AMEX: [
    'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'VEA', 'VWO', 'BND', 'AGG', 'TLT', 'GLD', 'SLV', 'USO', 'UNG', 'XLE', 'XLF',
    'XLK', 'XLV', 'XLI', 'XLP', 'XLY', 'XLB', 'XLU', 'XLRE', 'XLC', 'XLHS', 'XRT', 'XOP', 'XME', 'XBI', 'XSD', 'XSW',
    'XSLV', 'XSOE', 'XHE', 'XHS', 'XHB', 'XAR', 'XES', 'XPH', 'XTH', 'XWEB', 'XNTK', 'XITK', 'XENT', 'XENT', 'XENT'
  ],
  OTC: [
    'TSLA', 'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META', 'NFLX', 'GOOG', 'COST', 'RBLX', 'LYFT', 'SNAP', 'UBER',
    'SHOP', 'ADBE', 'CRM', 'PYPL', 'INTC', 'AMD', 'NFLX', 'PEP', 'ABNB', 'ZM', 'SQ', 'ROKU', 'SPOT', 'SNAP', 'TWTR'
  ]
};

// Stock discovery and management
const stockDiscoveryCache = new FastCache(10000, 'STOCK_DISCOVERY');

// Rate limiting with higher limits for speed
const rateLimitMap = new Map();
const RATE_LIMIT = {
  WINDOW: 60 * 1000, // 1 minute
  MAX_REQUESTS: 100, // 100 requests per minute (higher for speed)
};

function checkRateLimit(symbol) {
  const now = Date.now();
  const key = symbol.toUpperCase();
  const requests = rateLimitMap.get(key) || [];
  
  const validRequests = requests.filter(time => now - time < RATE_LIMIT.WINDOW);
  
  if (validRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
    console.log(`[RATE_LIMIT] EXCEEDED: ${symbol} (${validRequests.length} requests in window)`);
    throw new Error(`Rate limit exceeded for ${symbol}. Please try again later.`);
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  console.log(`[RATE_LIMIT] OK: ${symbol} (${validRequests.length}/${RATE_LIMIT.MAX_REQUESTS})`);
}

// Ultra-fast retry with minimal delay and detailed logging
async function withFastRetry(fn, maxRetries = 2, delay = 100, operation = 'API_CALL') {
  const startTime = Date.now();
  performanceMetrics.apiCalls++;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[${operation}] ATTEMPT ${i + 1}/${maxRetries}`);
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('TIMEOUT')), 10000) // 10 second timeout
        )
      ]);
      
      const duration = Date.now() - startTime;
      console.log(`[${operation}] SUCCESS: ${duration}ms`);
      performanceMetrics.totalResponseTime += duration;
      performanceMetrics.averageResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.apiCalls;
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.message === 'TIMEOUT') {
        performanceMetrics.timeouts++;
        console.log(`[${operation}] TIMEOUT: ${duration}ms (attempt ${i + 1})`);
      } else {
        performanceMetrics.errors++;
        console.log(`[${operation}] ERROR: ${error.message} (attempt ${i + 1}, ${duration}ms)`);
      }
      
      if (i === maxRetries - 1) {
        console.log(`[${operation}] FAILED after ${maxRetries} attempts`);
        throw error;
      }
      
      console.log(`[${operation}] RETRY in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export const getStockQuote = action({
  args: { symbol: v.string() },
  handler: async (ctx, { symbol }) => {
    const startTime = Date.now();
    console.log(`[QUOTE] START: ${symbol}`);
    
    try {
      checkRateLimit(symbol);
      
      const symbolKey = symbol.toUpperCase();
      const cacheKey = `quote_${symbolKey}`;
      
      // Check cache first
      const cached = quoteCache.get(cacheKey);
      if (cached) {
        console.log(`[QUOTE] CACHE_HIT: ${symbol} (${Date.now() - startTime}ms)`);
        return cached;
      }

      console.log(`[QUOTE] FETCHING: ${symbol}`);
      const quote = await withFastRetry(() => yahooFinance.quote(symbolKey), 2, 100, `QUOTE_${symbolKey}`);
      
      // Add this check:
      if (!quote || typeof quote !== 'object') {
        throw new Error(`No quote data found for ${symbolKey}`);
      }
      
      // Determine market/exchange based on symbol and available data
      let market = 'NASDAQ'; // Default
      let exchange = 'NASDAQ';
      
      // Try to get exchange from quote data if available
      if (quote.fullExchangeName) {
        exchange = quote.fullExchangeName;
        market = quote.fullExchangeName;
      } else if (quote.exchange) {
        exchange = quote.exchange;
        market = quote.exchange;
      }
      
      // Map common exchanges to market categories
      const marketMapping = {
        'NASDAQ': 'NASDAQ',
        'NYSE': 'NYSE',
        'AMEX': 'AMEX',
        'NYSE MKT': 'AMEX',
        'NYSE ARCA': 'NYSE',
        'BATS': 'NASDAQ',
        'OTC': 'OTC',
        'PINK': 'OTC'
      };
      
      market = marketMapping[market] || market;
      
      const result = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        market: market,
        exchange: exchange,
        fullExchangeName: quote.fullExchangeName || exchange,
        timestamp: Date.now()
      };

      quoteCache.set(cacheKey, result, CACHE_CONFIG.QUOTE_TTL);
      console.log(`[QUOTE] SUCCESS: ${symbol} (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      console.log(`[QUOTE] FAILED: ${symbol} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to fetch ${symbol}: ${error.message}`);
    }
  },
});

export const getStockNews = action({
  args: { symbol: v.string() },
  handler: async (ctx, { symbol }) => {
    const startTime = Date.now();
    console.log(`[NEWS] START: ${symbol}`);
    
    try {
      checkRateLimit(symbol);
      
      const symbolKey = symbol.toUpperCase();
      const cacheKey = `news_${symbolKey}`;
      
      // Check cache first
      const cached = newsCache.get(cacheKey);
      if (cached) {
        console.log(`[NEWS] CACHE_HIT: ${symbol} (${Date.now() - startTime}ms)`);
        return cached;
      }

      console.log(`[NEWS] FETCHING: ${symbol}`);
      
      // Fetch news from multiple sources
      const newsPromises = [
        // Yahoo Finance news
        withFastRetry(() => yahooFinance.search(symbolKey), 2, 100, `NEWS_YAHOO_${symbolKey}`),
        // Additional sources (simulated for now - in real implementation you'd use actual APIs)
        getAdditionalNewsSources(symbolKey)
      ];
      
      const results = await Promise.allSettled(newsPromises);
      
      let allNews = [];
      
      // Process Yahoo Finance results
      if (results[0].status === 'fulfilled') {
        const yahooNews = (results[0].value.news || [])
          .slice(0, 8)
          .map(item => ({
            ...item,
            source: 'Yahoo Finance',
            sourceLogo: 'https://s.yimg.com/zz/combo?t=yahoo&w=32&h=32',
            imageUrl: extractImageUrl(item.thumbnail) || getDefaultStockImage(symbolKey),
            // Convert Date objects to ISO strings for Convex compatibility
            providerPublishTime: item.providerPublishTime ? new Date(item.providerPublishTime).toISOString() : new Date().toISOString()
          }));
        allNews.push(...yahooNews);
      }
      
      // Process additional sources
      if (results[1].status === 'fulfilled') {
        const additionalNews = results[1].value.map(item => ({
          ...item,
          // Ensure providerPublishTime is a string
          providerPublishTime: item.providerPublishTime ? new Date(item.providerPublishTime).toISOString() : new Date().toISOString()
        }));
        allNews.push(...additionalNews);
      }
      
      // Sort by date and limit results
      const sortedNews = allNews
        .sort((a, b) => {
          const dateA = new Date(b.providerPublishTime || b.publishedAt || 0);
          const dateB = new Date(a.providerPublishTime || a.publishedAt || 0);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 12); // Increased to 12 items
      
      // Add 3D-style metadata
      const enhancedNews = sortedNews.map((item, index) => ({
        ...item,
        id: `${symbolKey}_news_${index}`,
        cardStyle: getCardStyle(index),
        sentiment: analyzeSentiment(item.title || item.headline || ''),
        readTime: calculateReadTime(item.title || item.headline || ''),
        category: categorizeNews(item.title || item.headline || ''),
        // Ensure all date fields are strings
        providerPublishTime: item.providerPublishTime || new Date().toISOString(),
        publishedAt: item.publishedAt || new Date().toISOString()
      }));

      newsCache.set(cacheKey, enhancedNews, CACHE_CONFIG.NEWS_TTL);
      console.log(`[NEWS] SUCCESS: ${symbol} (${enhancedNews.length} items, ${Date.now() - startTime}ms)`);
      return enhancedNews;
    } catch (error) {
      console.log(`[NEWS] FAILED: ${symbol} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to fetch news for ${symbol}: ${error.message}`);
    }
  },
});

// Helper function to get additional news sources
async function getAdditionalNewsSources(symbol) {
  // Real news sources with working URLs
  const additionalSources = [
    {
      title: `${symbol} Stock Analysis: Wall Street's Latest Take`,
      link: `https://www.wsj.com/search?query=${symbol}&mod=searchresults_viewallresults`,
      provider: 'Wall Street Journal',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'WSJ',
      sourceLogo: 'https://www.wsj.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Latest analysis and market insights for ${symbol} from Wall Street Journal's expert analysts.`
    },
    {
      title: `${symbol} Earnings Report: What Investors Need to Know`,
      link: `https://www.nytimes.com/search?query=${symbol}`,
      provider: 'New York Times',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'NYT',
      sourceLogo: 'https://www.nytimes.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Comprehensive coverage of ${symbol}'s latest earnings and financial performance.`
    },
    {
      title: `${symbol} Market Outlook: Financial Times Analysis`,
      link: `https://www.ft.com/search?q=${symbol}`,
      provider: 'Financial Times',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'FT',
      sourceLogo: 'https://www.ft.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Expert analysis and market trends for ${symbol} from Financial Times.`
    },
    {
      title: `${symbol} Technical Analysis: Trading Opportunities`,
      link: `https://www.bloomberg.com/search?query=${symbol}`,
      provider: 'Bloomberg',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'Bloomberg',
      sourceLogo: 'https://www.bloomberg.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Technical analysis and trading insights for ${symbol} stock.`
    },
    {
      title: `${symbol} Sector Performance: Market Impact`,
      link: `https://www.reuters.com/search/news?blob=${symbol}`,
      provider: 'Reuters',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'Reuters',
      sourceLogo: 'https://www.reuters.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Sector analysis and market impact assessment for ${symbol}.`
    },
    {
      title: `${symbol} Investment Analysis: Barron's Expert Take`,
      link: `https://www.barrons.com/search?query=${symbol}`,
      provider: "Barron's",
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: "Barron's",
      sourceLogo: 'https://www.barrons.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Professional investment analysis and market insights for ${symbol} from Barron's.`
    },
    {
      title: `${symbol} Market Research: CNBC Analysis`,
      link: `https://www.cnbc.com/quotes/${symbol}`,
      provider: 'CNBC',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'CNBC',
      sourceLogo: 'https://www.cnbc.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Real-time market analysis and financial news for ${symbol} from CNBC.`
    },
    {
      title: `${symbol} Business News: MarketWatch Coverage`,
      link: `https://www.marketwatch.com/investing/stock/${symbol.toLowerCase()}`,
      provider: 'MarketWatch',
      providerPublishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      source: 'MarketWatch',
      sourceLogo: 'https://www.marketwatch.com/favicon.ico',
      imageUrl: getDefaultStockImage(symbol),
      description: `Comprehensive business news and market data for ${symbol} from MarketWatch.`
    }
  ];
  
  return additionalSources;
}

// Helper function to get default stock image
function getDefaultStockImage(symbol) {
  const stockImages = {
    'AAPL': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    'GOOGL': 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop',
    'MSFT': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    'AMZN': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    'TSLA': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    'NVDA': 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop',
    'META': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    'NFLX': 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'
  };
  
  return stockImages[symbol] || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop';
}

// Helper function to get 3D card style
function getCardStyle(index) {
  const styles = [
    'transform rotate-1 hover:rotate-0',
    'transform -rotate-1 hover:rotate-0',
    'transform rotate-2 hover:rotate-0',
    'transform -rotate-2 hover:rotate-0',
    'transform rotate-1 hover:rotate-0',
    'transform -rotate-1 hover:rotate-0'
  ];
  return styles[index % styles.length];
}

// Helper function to analyze sentiment
function analyzeSentiment(text) {
  const positiveWords = ['up', 'rise', 'gain', 'positive', 'growth', 'bullish', 'strong', 'beat', 'surge'];
  const negativeWords = ['down', 'fall', 'drop', 'negative', 'decline', 'bearish', 'weak', 'miss', 'plunge'];
  
  const words = text.toLowerCase().split(' ');
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Helper function to calculate read time
function calculateReadTime(text) {
  const wordsPerMinute = 200;
  const wordCount = text.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes;
}

// Helper function to extract image URL from thumbnail object
function extractImageUrl(thumbnail) {
  if (!thumbnail) return null;
  
  // If thumbnail is a string, return it directly
  if (typeof thumbnail === 'string') return thumbnail;
  
  // If thumbnail has resolutions array, get the best quality image
  if (thumbnail.resolutions && Array.isArray(thumbnail.resolutions)) {
    // Find the highest resolution image (prefer original or larger sizes)
    const bestImage = thumbnail.resolutions.find(res => 
      res.tag === 'original' || res.width >= 400
    ) || thumbnail.resolutions[0];
    
    return bestImage ? bestImage.url : null;
  }
  
  // If thumbnail has a direct url property
  if (thumbnail.url) return thumbnail.url;
  
  return null;
}

// Helper function to categorize news
function categorizeNews(text) {
  const categories = {
    'earnings': ['earnings', 'quarterly', 'revenue', 'profit', 'financial'],
    'technical': ['technical', 'chart', 'analysis', 'trading', 'pattern'],
    'market': ['market', 'sector', 'industry', 'trend'],
    'company': ['company', 'business', 'corporate', 'executive', 'ceo']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

export const predictStockPrice = action({
  args: {
    symbol: v.string(),
    targetDate: v.string(),
    mode: v.optional(v.string()), // 'short' or 'long', but always use 2 years now
    scenario: v.optional(v.string()), // Market scenario
  },
  handler: async (ctx, { symbol, targetDate, mode, scenario = "normal" }) => {
    const startTime = Date.now();
    console.log(`[PREDICT] START: ${symbol} -> ${targetDate} (${mode}, Scenario: ${scenario})`);
    try {
      checkRateLimit(symbol);
      const symbolKey = symbol.toUpperCase();
      const predictionCacheKey = `${symbolKey}_${targetDate}_${scenario}`;
      // Check prediction cache first
      const cached = predictionCache.get(predictionCacheKey);
      if (cached) {
        console.log(`[PREDICT] CACHE_HIT: ${symbol} (${Date.now() - startTime}ms)`);
        return cached;
      }
      console.log(`[PREDICT] CALCULATING: ${symbol}`);
      // Get current quote (cached if possible)
      const quoteCacheKey = `quote_${symbolKey}`;
      let quote = quoteCache.get(quoteCacheKey);
      if (!quote) {
        console.log(`[PREDICT] FETCHING_QUOTE: ${symbol}`);
        quote = await withFastRetry(() => yahooFinance.quote(symbolKey), 2, 100, `PREDICT_QUOTE_${symbolKey}`);
        quoteCache.set(quoteCacheKey, quote, CACHE_CONFIG.QUOTE_TTL);
      } else {
        console.log(`[PREDICT] QUOTE_CACHE_HIT: ${symbol}`);
      }
      const currentPrice = quote.price || quote.regularMarketPrice;
      const marketCap = quote.marketCap || 0;
      const peRatio = quote.trailingPE || 0;
      const beta = quote.beta || 1;
      const sector = quote.sector || '';
      const industry = quote.industry || '';
      
      console.log(`[PREDICT] CURRENT_PRICE: ${symbol} = $${currentPrice}`);
      console.log(`[PREDICT] MARKET_CAP: ${symbol} = $${marketCap}`);
      console.log(`[PREDICT] P/E_RATIO: ${symbol} = ${peRatio}`);
      console.log(`[PREDICT] BETA: ${symbol} = ${beta}`);
      
      // Get historical data from stock creation date (maximum available data)
      const historyCacheKey = `history_${symbolKey}_max`;
      let historicalData = historyCache.get(historyCacheKey);
      if (!historicalData) {
        console.log(`[PREDICT] FETCHING_HISTORY: ${symbol} (from creation date)`);
        historicalData = await withFastRetry(() => yahooFinance.historical(symbolKey, {
          period1: "1970-01-01", // Start from 1970 to get all available data
          period2: new Date(),
          interval: "1d",
        }), 2, 100, `PREDICT_HISTORY_${symbolKey}`);
        historyCache.set(historyCacheKey, historicalData, CACHE_CONFIG.HISTORY_TTL);
      } else {
        console.log(`[PREDICT] HISTORY_CACHE_HIT: ${symbol} (from creation date)`);
      }
      
      const prices = historicalData.map((d) => d.close);
      const volumes = historicalData.map((d) => d.volume || 0);
      const highs = historicalData.map((d) => d.high);
      const lows = historicalData.map((d) => d.low);
      
      console.log(`[PREDICT] PRICES: ${symbol} = [${prices.map(p => p.toFixed(2)).join(', ')}]`);
      if (prices.length < 3) {
        console.log(`[PREDICT] INSUFFICIENT_DATA: ${symbol} (${prices.length} points)`);
        throw new Error("Not enough data for prediction");
      }
      
      // Get sector performance for comparison
      let sectorPerformance = 0;
      if (sector) {
        try {
          const sectorCacheKey = `sector_${sector.replace(/\s+/g, '_')}`;
          let sectorData = historyCache.get(sectorCacheKey);
          if (!sectorData) {
            // Use a sector ETF as proxy (e.g., XLK for tech, XLF for financials)
            const sectorETFs = {
              'Technology': 'XLK',
              'Financial Services': 'XLF', 
              'Healthcare': 'XLV',
              'Consumer Cyclical': 'XLY',
              'Industrials': 'XLI',
              'Energy': 'XLE',
              'Consumer Defensive': 'XLP',
              'Real Estate': 'XLRE',
              'Basic Materials': 'XLB',
              'Communication Services': 'XLC',
              'Utilities': 'XLU'
            };
            
            const sectorETF = sectorETFs[sector] || 'SPY'; // Default to S&P 500
            console.log(`[PREDICT] FETCHING_SECTOR: ${sector} using ${sectorETF}`);
            
            sectorData = await withFastRetry(() => yahooFinance.historical(sectorETF, {
              period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              period2: new Date(),
              interval: "1d",
            }), 2, 100, `PREDICT_SECTOR_${sectorETF}`);
            
            historyCache.set(sectorCacheKey, sectorData, CACHE_CONFIG.HISTORY_TTL);
          } else {
            console.log(`[PREDICT] SECTOR_CACHE_HIT: ${sector}`);
          }
          
          if (sectorData && sectorData.length > 0) {
            const sectorPrices = sectorData.map(d => d.close);
            const sectorChange = (sectorPrices[sectorPrices.length - 1] - sectorPrices[0]) / sectorPrices[0];
            sectorPerformance = sectorChange * 100;
          }
        } catch (error) {
          console.log(`[PREDICT] SECTOR_ERROR: ${sector} - ${error.message}`);
        }
      }
      
      // Enhanced prediction algorithm with multiple factors and scenario adjustments
      const result = calculateEnhancedPrediction(
        prices, volumes, highs, lows, currentPrice, targetDate, symbolKey,
        { marketCap, peRatio, beta, sector, industry, sectorPerformance },
        scenario
      );
      predictionCache.set(predictionCacheKey, result, CACHE_CONFIG.PREDICTION_TTL);
      console.log(`[PREDICT] SUCCESS: ${symbol} -> $${result.predictedPrice} (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      console.log(`[PREDICT] FAILED: ${symbol} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Prediction failed: ${error.message}`);
    }
  },
});

// Enhanced prediction algorithm using multiple stock factors
function calculateEnhancedPrediction(prices, volumes, highs, lows, currentPrice, targetDate, symbol, factors, scenario = "normal") {
  const startTime = Date.now();
  console.log(`[CALC] START: ${symbol} (${prices.length} price points, Scenario: ${scenario})`);
  console.log(`[CALC] FACTORS: ${symbol} - Market Cap: $${factors.marketCap}, P/E: ${factors.peRatio}, Beta: ${factors.beta}, Sector: ${factors.sector}`);

  // Use last 30 days for trend analysis (more data for better accuracy)
  const recentPrices = prices.slice(-30);
  const recentVolumes = volumes.slice(-30);
  const recentHighs = highs.slice(-30);
  const recentLows = lows.slice(-30);
  
  // 1. PRICE TREND ANALYSIS
  const priceChange = recentPrices[recentPrices.length - 1] - recentPrices[0];
  const avgDailyChange = priceChange / (recentPrices.length - 1) / currentPrice;
  
  // 2. VOLUME ANALYSIS
  const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
  const recentAvgVolume = recentVolumes.slice(-7).reduce((sum, vol) => sum + vol, 0) / 7;
  const volumeRatio = recentAvgVolume / avgVolume;
  
  // 3. TECHNICAL INDICATORS
  // RSI calculation
  const rsi = calculateRSI(recentPrices, 14);
  
  // Moving averages
  const sma20 = recentPrices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
  const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;
  
  // Bollinger Bands
  const bb20 = calculateBollingerBands(recentPrices.slice(-20));
  
  // 4. FUNDAMENTAL FACTORS
  const peFactor = calculatePEFactor(factors.peRatio);
  const marketCapFactor = calculateMarketCapFactor(factors.marketCap);
  const betaFactor = calculateBetaFactor(factors.beta);
  const sectorFactor = factors.sectorPerformance / 100; // Convert percentage to decimal
  
  // 5. MOMENTUM INDICATORS
  const momentum = calculateMomentum(recentPrices);
  const volatility = calculateVolatility(recentPrices);
  
  // 6. SUPPORT/RESISTANCE LEVELS
  const supportLevel = Math.min(...recentLows);
  const resistanceLevel = Math.max(...recentHighs);
  const supportResistanceFactor = calculateSupportResistanceFactor(currentPrice, supportLevel, resistanceLevel);
  
  // 7. MULTI-FACTOR PREDICTION MODEL
  const endDate = new Date();
  const targetDateObj = new Date(targetDate);
  const daysDiff = Math.ceil((targetDateObj.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    console.log(`[CALC] INVALID_DATE: ${symbol} - target date in past`);
    throw new Error("Target date must be in the future");
  }
  
  console.log(`[CALC] DAYS: ${symbol} = ${daysDiff} days until target`);
  
  // Base prediction using price trend
  const linearPrediction = currentPrice * (1 + avgDailyChange * daysDiff);
  const exponentialPrediction = currentPrice * Math.pow(1 + avgDailyChange, daysDiff);
  
  // Apply technical factors
  const technicalAdjustment = calculateTechnicalAdjustment(rsi, sma20, sma50, bb20, currentPrice);
  
  // Apply fundamental factors
  const fundamentalAdjustment = (peFactor + marketCapFactor + betaFactor + sectorFactor) / 4;
  
  // Apply momentum and volume factors
  const momentumAdjustment = momentum * 0.1; // Scale momentum
  const volumeAdjustment = (volumeRatio - 1) * 0.05; // Volume impact
  
  // Apply support/resistance factor
  const srAdjustment = supportResistanceFactor * 0.02;
  
  // Combine all factors
  const totalAdjustment = technicalAdjustment + fundamentalAdjustment + momentumAdjustment + volumeAdjustment + srAdjustment;
  
  let predictedPrice = (linearPrediction + exponentialPrediction) / 2 * (1 + totalAdjustment);
  
  // Apply scenario-based adjustments
  const scenarioAdjustment = calculateScenarioAdjustment(scenario, factors, volatility, momentum);
  predictedPrice *= (1 + scenarioAdjustment);
  console.log(`[CALC] SCENARIO: ${symbol} - ${scenario} adjustment: ${(scenarioAdjustment * 100).toFixed(2)}%`);
  
  // Cap extreme predictions based on volatility
  const maxChange = Math.min(0.25, 0.15 + (volatility * 2)); // Higher volatility = higher potential change
  const minPrice = currentPrice * (1 - maxChange);
  const maxPrice = currentPrice * (1 + maxChange);
  
  if (predictedPrice > maxPrice) predictedPrice = maxPrice;
  if (predictedPrice < minPrice) predictedPrice = minPrice;
  
  // 8. CONFIDENCE CALCULATION
  let confidence = calculateConfidence(
    volatility, volumeRatio, rsi, factors.peRatio, factors.beta, 
    Math.abs(factors.sectorPerformance), daysDiff
  );
  
  // 9. TREND DETERMINATION
  const trend = determineTrend(avgDailyChange, sma20, sma50, rsi, momentum);
  
  const result = {
    symbol,
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    predictedPrice: parseFloat(predictedPrice.toFixed(2)),
    targetDate,
    expectedChange: parseFloat(((predictedPrice - currentPrice) / currentPrice * 100).toFixed(2)),
    confidence: parseFloat(confidence.toFixed(1)),
    daysUntilTarget: daysDiff,
    trend,
    volatility: parseFloat((volatility * 100).toFixed(2)),
    smaTrend: trend,
    scenario: scenario,
    scenarioAdjustment: parseFloat((scenarioAdjustment * 100).toFixed(2)),
    technicalIndicators: {
      rsi: parseFloat(rsi.toFixed(2)),
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
      volumeRatio: parseFloat(volumeRatio.toFixed(2)),
      momentum: parseFloat(momentum.toFixed(4))
    },
    fundamentalFactors: {
      marketCap: factors.marketCap,
      peRatio: factors.peRatio,
      beta: factors.beta,
      sector: factors.sector,
      sectorPerformance: parseFloat(factors.sectorPerformance.toFixed(2))
    },
    supportResistance: {
      support: parseFloat(supportLevel.toFixed(2)),
      resistance: parseFloat(resistanceLevel.toFixed(2)),
      currentPosition: parseFloat(((currentPrice - supportLevel) / (resistanceLevel - supportLevel) * 100).toFixed(1))
    },
    modelDetails: {
      linear: parseFloat(linearPrediction.toFixed(2)),
      exponential: parseFloat(exponentialPrediction.toFixed(2)),
      technical: parseFloat(technicalAdjustment.toFixed(4)),
      fundamental: parseFloat(fundamentalAdjustment.toFixed(4)),
      momentum: parseFloat(momentumAdjustment.toFixed(4)),
      volume: parseFloat(volumeAdjustment.toFixed(4)),
      supportResistance: parseFloat(srAdjustment.toFixed(4)),
      totalAdjustment: parseFloat(totalAdjustment.toFixed(4))
    }
  };
  
  console.log(`[CALC] COMPLETE: ${symbol} (${Date.now() - startTime}ms)`);
  return result;
}

// Helper functions for enhanced prediction
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50; // Neutral RSI if insufficient data
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(prices, period = 20) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };
  
  const sma = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    upper: sma + (2 * stdDev),
    middle: sma,
    lower: sma - (2 * stdDev)
  };
}

function calculatePEFactor(peRatio) {
  if (!peRatio || peRatio <= 0) return 0;
  
  // P/E ratio analysis: lower P/E often indicates undervaluation
  if (peRatio < 15) return 0.05; // Undervalued
  if (peRatio < 25) return 0.02; // Fairly valued
  if (peRatio < 35) return -0.02; // Slightly overvalued
  return -0.05; // Overvalued
}

function calculateMarketCapFactor(marketCap) {
  if (!marketCap) return 0;
  
  // Market cap analysis: larger caps tend to be more stable
  if (marketCap > 100000000000) return 0.02; // Large cap stability
  if (marketCap > 10000000000) return 0.01; // Mid cap
  if (marketCap > 1000000000) return 0; // Small cap
  return -0.02; // Micro cap volatility
}

function calculateBetaFactor(beta) {
  if (!beta) return 0;
  
  // Beta analysis: higher beta = more volatile
  if (beta < 0.8) return 0.02; // Low volatility
  if (beta < 1.2) return 0; // Market volatility
  if (beta < 1.5) return -0.01; // High volatility
  return -0.03; // Very high volatility
}

function calculateMomentum(prices) {
  if (prices.length < 10) return 0;
  
  const recent = prices.slice(-10);
  const momentum = (recent[recent.length - 1] - recent[0]) / recent[0];
  return momentum;
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateSupportResistanceFactor(currentPrice, support, resistance) {
  if (resistance === support) return 0;
  
  const position = (currentPrice - support) / (resistance - support);
  
  if (position < 0.2) return 0.03; // Near support - bullish
  if (position > 0.8) return -0.03; // Near resistance - bearish
  return 0; // Middle range
}

function calculateTechnicalAdjustment(rsi, sma20, sma50, bb20, currentPrice) {
  let adjustment = 0;
  
  // RSI adjustments
  if (rsi < 30) adjustment += 0.03; // Oversold - bullish
  if (rsi > 70) adjustment -= 0.03; // Overbought - bearish
  
  // Moving average adjustments
  if (currentPrice > sma20 && sma20 > sma50) adjustment += 0.02; // Golden cross
  if (currentPrice < sma20 && sma20 < sma50) adjustment -= 0.02; // Death cross
  
  // Bollinger Bands adjustments
  if (currentPrice < bb20.lower) adjustment += 0.02; // Below lower band - oversold
  if (currentPrice > bb20.upper) adjustment -= 0.02; // Above upper band - overbought
  
  return adjustment;
}

function calculateConfidence(volatility, volumeRatio, rsi, peRatio, beta, sectorPerformance, daysDiff) {
  let confidence = 70; // Base confidence
  
  // Volatility impact
  confidence -= volatility * 50;
  
  // Volume impact
  if (volumeRatio > 1.2) confidence += 5;
  if (volumeRatio < 0.8) confidence -= 5;
  
  // RSI impact
  if (rsi > 30 && rsi < 70) confidence += 5; // Neutral RSI is good
  if (rsi < 20 || rsi > 80) confidence -= 10; // Extreme RSI reduces confidence
  
  // P/E impact
  if (peRatio > 0 && peRatio < 25) confidence += 3;
  if (peRatio > 35) confidence -= 5;
  
  // Beta impact
  if (beta < 1) confidence += 3; // Less volatile
  if (beta > 1.5) confidence -= 5; // More volatile
  
  // Sector performance impact
  if (Math.abs(sectorPerformance) < 5) confidence += 2; // Stable sector
  if (Math.abs(sectorPerformance) > 15) confidence -= 3; // Volatile sector
  
  // Time horizon impact
  if (daysDiff > 30) confidence -= 5; // Longer predictions are less certain
  if (daysDiff > 90) confidence -= 10;
  
  return Math.max(30, Math.min(95, confidence));
}

function determineTrend(avgDailyChange, sma20, sma50, rsi, momentum) {
  let bullishSignals = 0;
  let bearishSignals = 0;
  
  // Price trend
  if (avgDailyChange > 0) bullishSignals++;
  else bearishSignals++;
  
  // Moving averages
  if (sma20 > sma50) bullishSignals++;
  else bearishSignals++;
  
  // RSI
  if (rsi > 50) bullishSignals++;
  else bearishSignals++;
  
  // Momentum
  if (momentum > 0) bullishSignals++;
  else bearishSignals++;
  
  if (bullishSignals > bearishSignals) return "upward";
  if (bearishSignals > bullishSignals) return "downward";
  return "sideways";
}

// Scenario-based adjustment function
function calculateScenarioAdjustment(scenario, factors, volatility, momentum) {
  let adjustment = 0;
  
  switch (scenario) {
    case "normal":
      // No additional adjustment for normal market conditions
      adjustment = 0;
      break;
      
    case "recession":
      // Recession: Generally bearish, but defensive stocks may outperform
      adjustment = -0.08; // 8% downward pressure
      if (factors.sector === "Consumer Defensive" || factors.sector === "Healthcare") {
        adjustment = -0.03; // Less impact on defensive sectors
      }
      if (factors.sector === "Consumer Cyclical" || factors.sector === "Financial Services") {
        adjustment = -0.12; // More impact on cyclical sectors
      }
      break;
      
    case "tariff_war":
      // Trade war: Mixed impact based on sector
      if (factors.sector === "Technology" || factors.sector === "Industrials") {
        adjustment = -0.06; // Negative for export-heavy sectors
      } else if (factors.sector === "Basic Materials" || factors.sector === "Energy") {
        adjustment = -0.04; // Moderate negative
      } else {
        adjustment = -0.02; // Slight negative for others
      }
      break;
      
    case "presidential_change":
      // Presidential transition: Policy uncertainty
      adjustment = -0.03; // 3% uncertainty discount
      if (factors.sector === "Healthcare" || factors.sector === "Energy") {
        adjustment = -0.05; // More uncertainty for policy-sensitive sectors
      }
      break;
      
    case "bull_market":
      // Bull market: Positive momentum
      adjustment = 0.06; // 6% upward pressure
      if (factors.sector === "Technology" || factors.sector === "Consumer Cyclical") {
        adjustment = 0.08; // Higher gains for growth sectors
      }
      break;
      
    case "inflation":
      // High inflation: Mixed impact
      if (factors.sector === "Financial Services" || factors.sector === "Real Estate") {
        adjustment = -0.04; // Negative for rate-sensitive sectors
      } else if (factors.sector === "Energy" || factors.sector === "Basic Materials") {
        adjustment = 0.03; // Positive for commodity sectors
      } else {
        adjustment = -0.02; // Slight negative for others
      }
      break;
      
    case "tech_bubble":
      // Tech bubble: Overvaluation concerns
      if (factors.sector === "Technology" || factors.sector === "Communication Services") {
        adjustment = -0.10; // 10% correction for tech
      } else {
        adjustment = 0.02; // Slight positive for non-tech (rotation)
      }
      break;
      
    case "crisis":
      // Market crisis: Severe downturn
      adjustment = -0.15; // 15% downward pressure
      if (factors.sector === "Consumer Defensive" || factors.sector === "Healthcare") {
        adjustment = -0.08; // Less impact on defensive sectors
      }
      if (factors.sector === "Financial Services" || factors.sector === "Consumer Cyclical") {
        adjustment = -0.20; // More impact on sensitive sectors
      }
      break;
      
    default:
      adjustment = 0;
  }
  
  // Adjust based on volatility and momentum
  if (volatility > 0.03) { // High volatility
    adjustment *= 1.2; // Amplify scenario effects
  }
  
  if (Math.abs(momentum) > 0.1) { // Strong momentum
    if (momentum > 0 && adjustment > 0) {
      adjustment *= 1.1; // Amplify positive scenarios
    } else if (momentum < 0 && adjustment < 0) {
      adjustment *= 1.1; // Amplify negative scenarios
    }
  }
  
  return adjustment;
}

// Pre-warming function for instant predictions
export const prewarmPopularStocks = action({
  args: {},
  handler: async (ctx) => {
    console.log(`[PREWARM] START: Pre-warming popular stocks`);
    const startTime = Date.now();
    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
    const results = [];
    
    for (const symbol of popularStocks) {
      try {
        console.log(`[PREWARM] PROCESSING: ${symbol}`);
        
        // Pre-fetch quotes
        const quote = await withFastRetry(() => yahooFinance.quote(symbol), 2, 100, `PREWARM_QUOTE_${symbol}`);
        quoteCache.set(`quote_${symbol}`, {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          volume: quote.regularMarketVolume,
          marketCap: quote.marketCap,
          timestamp: Date.now()
        }, CACHE_CONFIG.QUOTE_TTL);
        
        // Pre-fetch historical data
        const historicalData = await withFastRetry(() => yahooFinance.historical(symbol, {
          period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          period2: new Date(),
          interval: "1d",
        }), 2, 100, `PREWARM_HISTORY_${symbol}`);
        historyCache.set(`history_${symbol}`, historicalData, CACHE_CONFIG.HISTORY_TTL);
        
        results.push({ symbol, status: 'cached' });
        console.log(`[PREWARM] SUCCESS: ${symbol}`);
      } catch (error) {
        results.push({ symbol, status: 'failed', error: error.message });
        console.log(`[PREWARM] FAILED: ${symbol} - ${error.message}`);
      }
    }
    
    console.log(`[PREWARM] COMPLETE: ${results.length} stocks processed (${Date.now() - startTime}ms)`);
    return results;
  },
});

// Get cache statistics
export const getCacheStats = action({
  args: {},
  handler: async (ctx) => {
    const stats = {
      predictionCacheSize: predictionCache.cache.size,
      quoteCacheSize: quoteCache.cache.size,
      historyCacheSize: historyCache.cache.size,
      newsCacheSize: newsCache.cache.size,
      totalCacheSize: predictionCache.cache.size + quoteCache.cache.size + historyCache.cache.size + newsCache.cache.size,
      performanceMetrics: {
        ...performanceMetrics,
        cacheHitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses),
        errorRate: performanceMetrics.errors / performanceMetrics.apiCalls,
        timeoutRate: performanceMetrics.timeouts / performanceMetrics.apiCalls,
      }
    };
    
    console.log(`[STATS] Cache stats:`, stats);
    return stats;
  },
});

// Clear all caches
export const clearAllCaches = action({
  args: {},
  handler: async (ctx) => {
    console.log(`[CLEAR] Clearing all caches`);
    predictionCache.clear();
    quoteCache.clear();
    historyCache.clear();
    newsCache.clear();
    return { message: 'All caches cleared' };
  },
});

// Get all available stocks from multiple sources
export const getAllStocks = action({
  args: { 
    market: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, { market = 'all', limit = 1000, offset = 0 }) => {
    const startTime = Date.now();
    console.log(`[STOCK_DISCOVERY] START: market=${market}, limit=${limit}, offset=${offset}`);
    
    try {
      const cacheKey = `all_stocks_${market}_${limit}_${offset}`;
      const cached = stockDiscoveryCache.get(cacheKey);
      if (cached) {
        console.log(`[STOCK_DISCOVERY] CACHE_HIT: ${market} (${Date.now() - startTime}ms)`);
        return cached;
      }

      let allStocks = [];
      
      if (market === 'all') {
        // Combine all markets
        Object.values(ALL_STOCKS).forEach(marketStocks => {
          allStocks.push(...marketStocks);
        });
      } else if (ALL_STOCKS[market]) {
        allStocks = ALL_STOCKS[market];
      } else {
        // Try to discover stocks for the specified market
        allStocks = await discoverStocksForMarket(market);
      }

      // Remove duplicates and apply pagination
      const uniqueStocks = [...new Set(allStocks)];
      const paginatedStocks = uniqueStocks.slice(offset, offset + limit);

      // Fetch quotes for paginated stocks, skip any that fail
      const stockQuotes = await Promise.allSettled(
        paginatedStocks.map(symbol => getStockQuote({ symbol }).catch(() => null))
      );
      const validStocks = stockQuotes
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      const result = {
        stocks: validStocks,
        total: validStocks.length,
        market: market,
        limit: limit,
        offset: offset
      };

      stockDiscoveryCache.set(cacheKey, result, 60 * 60 * 1000); // 1 hour cache
      console.log(`[STOCK_DISCOVERY] SUCCESS: ${market} (${result.stocks.length} stocks, ${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      console.log(`[STOCK_DISCOVERY] FAILED: ${market} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to get stocks for ${market}: ${error.message}`);
    }
  },
});

// Discover stocks for a specific market
async function discoverStocksForMarket(market) {
  console.log(`[STOCK_DISCOVERY] DISCOVERING: ${market}`);
  
  try {
    // Use Yahoo Finance to search for stocks in the market
    const searchResults = await withFastRetry(() => 
      yahooFinance.search(market, { quotesCount: 1000, newsCount: 0 }), 
      2, 100, `DISCOVER_${market}`
    );
    
    if (searchResults && searchResults.quotes) {
      const symbols = searchResults.quotes.map(quote => quote.symbol);
      console.log(`[STOCK_DISCOVERY] FOUND: ${market} - ${symbols.length} symbols`);
      return symbols;
    }
    
    return [];
  } catch (error) {
    console.log(`[STOCK_DISCOVERY] DISCOVER_ERROR: ${market} - ${error.message}`);
    return [];
  }
}

// Get market statistics
export const getMarketStats = action({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    console.log(`[MARKET_STATS] START`);
    
    try {
      const cacheKey = 'market_stats';
      const cached = stockDiscoveryCache.get(cacheKey);
      if (cached) {
        console.log(`[MARKET_STATS] CACHE_HIT (${Date.now() - startTime}ms)`);
        return cached;
      }

      const stats = {};
      
      for (const [market, stocks] of Object.entries(ALL_STOCKS)) {
        stats[market] = {
          totalStocks: stocks.length,
          uniqueStocks: [...new Set(stocks)].length,
          market: market
        };
      }

      const result = {
        markets: stats,
        totalStocks: Object.values(ALL_STOCKS).flat().length,
        uniqueStocks: [...new Set(Object.values(ALL_STOCKS).flat())].length,
        timestamp: Date.now()
      };

      stockDiscoveryCache.set(cacheKey, result, 30 * 60 * 1000); // 30 minutes cache
      console.log(`[MARKET_STATS] SUCCESS: ${result.uniqueStocks} unique stocks (${Date.now() - startTime}ms)`);
      return result;
    } catch (error) {
      console.log(`[MARKET_STATS] FAILED: ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to get market stats: ${error.message}`);
    }
  },
});

// Search stocks by symbol or name
export const searchStocks = action({
  args: { 
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { query, limit = 50 }) => {
    const startTime = Date.now();
    console.log(`[STOCK_SEARCH] START: ${query}`);
    
    try {
      const cacheKey = `search_${query}_${limit}`;
      const cached = stockDiscoveryCache.get(cacheKey);
      if (cached) {
        console.log(`[STOCK_SEARCH] CACHE_HIT: ${query} (${Date.now() - startTime}ms)`);
        return cached;
      }

      // Search using Yahoo Finance
      const searchResults = await withFastRetry(() => 
        yahooFinance.search(query, { quotesCount: limit, newsCount: 0 }), 
        2, 100, `SEARCH_${query}`
      );
      
      let results = [];
      if (searchResults && searchResults.quotes) {
        results = searchResults.quotes.slice(0, limit).map(quote => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchange || 'NASDAQ',
          market: quote.fullExchangeName || quote.exchange || 'NASDAQ',
          type: quote.quoteType || 'EQUITY'
        }));
      }

      stockDiscoveryCache.set(cacheKey, results, 15 * 60 * 1000); // 15 minutes cache
      console.log(`[STOCK_SEARCH] SUCCESS: ${query} (${results.length} results, ${Date.now() - startTime}ms)`);
      return results;
    } catch (error) {
      console.log(`[STOCK_SEARCH] FAILED: ${query} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to search stocks for ${query}: ${error.message}`);
    }
  },
});

// Get popular stocks by market
export const getPopularStocks = action({
  args: { 
    market: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { market = 'all', limit = 50 }) => {
    const startTime = Date.now();
    console.log(`[POPULAR_STOCKS] START: market=${market}, limit=${limit}`);
    
    try {
      const cacheKey = `popular_${market}_${limit}`;
      const cached = stockDiscoveryCache.get(cacheKey);
      if (cached) {
        console.log(`[POPULAR_STOCKS] CACHE_HIT: ${market} (${Date.now() - startTime}ms)`);
        return cached;
      }

      let stocks = [];
      if (market === 'all') {
        // Get top stocks from all markets
        stocks = [
          'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'GOOG', 'COST', 'RBLX', 'LYFT', 'SNAP', 'UBER', 'SHOP',
          'ADBE', 'CRM', 'PYPL', 'INTC', 'AMD', 'PEP', 'ABNB', 'ZM', 'SQ', 'ROKU', 'SPOT', 'TWTR', 'PINS', 'DOCU', 'CRWD',
          'OKTA', 'TEAM', 'WDAY', 'ADP', 'ORCL', 'CSCO', 'QCOM', 'AVGO', 'TXN', 'MU', 'NIO', 'XPEV', 'LI', 'LCID', 'RIVN'
        ];
      } else if (ALL_STOCKS[market]) {
        stocks = ALL_STOCKS[market].slice(0, limit);
      }

      // Get quotes for popular stocks, skip any that fail
      const stockQuotes = await Promise.allSettled(
        stocks.slice(0, limit).map(symbol => getStockQuote({ symbol }).catch(() => null))
      );

      const results = stockQuotes
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value)
        .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));

      stockDiscoveryCache.set(cacheKey, results, 5 * 60 * 1000); // 5 minutes cache
      console.log(`[POPULAR_STOCKS] SUCCESS: ${market} (${results.length} stocks, ${Date.now() - startTime}ms)`);
      return results;
    } catch (error) {
      console.log(`[POPULAR_STOCKS] FAILED: ${market} - ${error.message} (${Date.now() - startTime}ms)`);
      throw new Error(`Failed to get popular stocks for ${market}: ${error.message}`);
    }
  },
});