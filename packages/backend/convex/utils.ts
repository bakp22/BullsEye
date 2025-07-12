// Performance monitoring utilities
export const performanceMetrics = {
  apiCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  errors: 0,
};

export function trackPerformance(operation: string, startTime: number, success: boolean) {
  const duration = Date.now() - startTime;
  
  performanceMetrics.apiCalls++;
  performanceMetrics.totalResponseTime += duration;
  performanceMetrics.averageResponseTime = performanceMetrics.totalResponseTime / performanceMetrics.apiCalls;
  
  if (!success) {
    performanceMetrics.errors++;
  }
  
  console.log(`Performance: ${operation} took ${duration}ms, success: ${success}`);
}

export function getCacheStats() {
  return {
    hitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses),
    averageResponseTime: performanceMetrics.averageResponseTime,
    totalCalls: performanceMetrics.apiCalls,
    errorRate: performanceMetrics.errors / performanceMetrics.apiCalls,
  };
}

export function logCacheHit() {
  performanceMetrics.cacheHits++;
}

export function logCacheMiss() {
  performanceMetrics.cacheMisses++;
}

// Enhanced error handling
export function handleYahooFinanceError(error: any, symbol: string): string {
  if (error.message?.includes('rate limit')) {
    return `Rate limit exceeded for ${symbol}. Please try again in a few minutes.`;
  }
  
  if (error.message?.includes('not found')) {
    return `Stock symbol "${symbol}" not found. Please check the symbol and try again.`;
  }
  
  if (error.message?.includes('network')) {
    return `Network error while fetching ${symbol}. Please check your connection and try again.`;
  }
  
  return `Failed to fetch data for ${symbol}: ${error.message}`;
}

// Utility for missing environment variables
export function missingEnvVariableUrl(
  variableName: string,
  url: string,
): string {
  return `Missing environment variable: ${variableName}. Set it at ${url}`;
}

export function deploymentName() {
  const url = process.env.CONVEX_CLOUD_URL;
  if (!url) return undefined;
  const regex = new RegExp("https://(.+).convex.cloud");
  return regex.exec(url)?.[1];
}
