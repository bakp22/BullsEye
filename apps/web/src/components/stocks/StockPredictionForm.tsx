"use client";

import { useAction } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useState, useCallback } from "react";

// Market scenario definitions
const MARKET_SCENARIOS = [
  {
    id: "normal",
    name: "Normal Market",
    description: "Standard market conditions",
    color: "bg-gray-100 text-gray-800"
  },
  {
    id: "recession",
    name: "Economic Recession",
    description: "Downturn with reduced consumer spending",
    color: "bg-red-100 text-red-800"
  },
  {
    id: "tariff_war",
    name: "Trade War",
    description: "International trade tensions and tariffs",
    color: "bg-orange-100 text-orange-800"
  },
  {
    id: "presidential_change",
    name: "Presidential Transition",
    description: "Policy uncertainty during leadership change",
    color: "bg-blue-100 text-blue-800"
  },
  {
    id: "bull_market",
    name: "Bull Market",
    description: "Strong upward market momentum",
    color: "bg-green-100 text-green-800"
  },
  {
    id: "inflation",
    name: "High Inflation",
    description: "Rising prices and interest rates",
    color: "bg-purple-100 text-purple-800"
  },
  {
    id: "tech_bubble",
    name: "Tech Bubble",
    description: "Technology sector overvaluation",
    color: "bg-yellow-100 text-yellow-800"
  },
  {
    id: "crisis",
    name: "Market Crisis",
    description: "Severe market stress and volatility",
    color: "bg-red-200 text-red-900"
  }
];

export default function StockPredictionForm() {
  const predictStockPrice = useAction(api.stocksNode.predictStockPrice);
  
  const [symbol, setSymbol] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("normal");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Optimistic prediction for instant feedback
  const [optimisticPrediction, setOptimisticPrediction] = useState<any>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    console.log(`[FRONTEND] PREDICTION_REQUEST: ${symbol} -> ${targetDate} (Scenario: ${selectedScenario})`);
    if (!symbol.trim() || !targetDate) {
      console.log(`[FRONTEND] VALIDATION_ERROR: Missing symbol or date`);
      setError("Please enter both stock symbol and target date");
      return;
    }
    setLoading(true);
    setError("");
    setPrediction(null);
    // Create optimistic prediction for instant feedback
    const optimistic = {
      symbol: symbol.toUpperCase().trim(),
      currentPrice: 0,
      predictedPrice: 0,
      targetDate,
      expectedChange: 0,
      confidence: 75,
      daysUntilTarget: 0,
      trend: "upward",
      volatility: 2.5,
      smaTrend: "upward",
      modelDetails: {
        linear: 0,
        exponential: 0,
        technical: 0,
        fundamental: 0,
        momentum: 0,
        volume: 0,
        supportResistance: 0,
        totalAdjustment: 0
      },
      isOptimistic: true
    };
    setOptimisticPrediction(optimistic);
    console.log(`[FRONTEND] OPTIMISTIC_UI: Showing optimistic prediction for ${symbol}`);
    try {
      console.log(`[FRONTEND] API_CALL: Calling predictStockPrice for ${symbol} with scenario ${selectedScenario}`);
      const result = await predictStockPrice({
        symbol: symbol.toUpperCase().trim(),
        targetDate: targetDate,
        scenario: selectedScenario
      });
      const duration = Date.now() - startTime;
      console.log(`[FRONTEND] SUCCESS: ${symbol} prediction received (${duration}ms)`);
      console.log(`[FRONTEND] RESULT:`, result);
      setPrediction(result);
      setOptimisticPrediction(null);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.log(`[FRONTEND] ERROR: ${symbol} prediction failed (${duration}ms)`, err);
      setError(err.message || "Failed to get prediction");
      setOptimisticPrediction(null);
    } finally {
      setLoading(false);
      console.log(`[FRONTEND] COMPLETE: ${symbol} request finished`);
    }
  }, [symbol, targetDate, selectedScenario, predictStockPrice]);

  // Show optimistic prediction while loading
  const displayPrediction = optimisticPrediction || prediction;

  // Log symbol changes for debugging
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSymbol = e.target.value;
    console.log(`[FRONTEND] SYMBOL_CHANGE: "${symbol}" -> "${newSymbol}"`);
    setSymbol(newSymbol);
  };

  // Log date changes for debugging
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    console.log(`[FRONTEND] DATE_CHANGE: "${targetDate}" -> "${newDate}"`);
    setTargetDate(newDate);
  };

  // Log scenario changes
  const handleScenarioChange = (scenarioId: string) => {
    console.log(`[FRONTEND] SCENARIO_CHANGE: "${selectedScenario}" -> "${scenarioId}"`);
    setSelectedScenario(scenarioId);
  };

  return (
    <div className="font-sans bg-[#f1f5f9] min-h-screen px-4 sm:px-8 py-10 max-w-3xl mx-auto space-y-10 transition-colors duration-300 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.25)] border border-gray-200">
      <form onSubmit={handleSubmit} className="bg-[#f8fafc] shadow-2xl rounded-3xl p-8 space-y-6 border border-transparent hover:shadow-2xl transition-all duration-200">
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Symbol
          </label>
          <input
            type="text"
            id="symbol"
            value={symbol}
            onChange={handleSymbolChange}
            placeholder="e.g., AAPL, GOOGL, MSFT"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
            Target Date
          </label>
          <input
            type="date"
            id="targetDate"
            value={targetDate}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        {/* Market Scenario Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Market Scenario
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MARKET_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => handleScenarioChange(scenario.id)}
                className={`px-3 py-2 text-xs rounded-md border transition-all duration-150 ${
                  selectedScenario === scenario.id
                    ? `${scenario.color} border-current`
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                title={scenario.description}
              >
                {scenario.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {MARKET_SCENARIOS.find(s => s.id === selectedScenario)?.description}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
          onClick={() => console.log(`[FRONTEND] BUTTON_CLICK: Submit prediction for ${symbol} with scenario ${selectedScenario}`)}
        >
          {loading ? "Analyzing..." : "Get Instant Prediction"}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
      </form>
      {loading && !optimisticPrediction && (
        <div className="mt-6 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-blue-600 font-medium">Fetching data...</p>
        </div>
      )}
      {displayPrediction && (
        <div className={`mt-6 bg-[#f8fafc] rounded-3xl shadow-2xl border border-transparent hover:shadow-2xl p-8 transition-all duration-300 ${optimisticPrediction ? 'opacity-75' : 'opacity-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Prediction for {displayPrediction.symbol}
            </h2>
            <div className="flex items-center space-x-2">
              {!optimisticPrediction && (
                <span className={`text-xs px-2 py-1 rounded ${
                  MARKET_SCENARIOS.find(s => s.id === selectedScenario)?.color || "bg-gray-100 text-gray-800"
                }`}>
                  {MARKET_SCENARIOS.find(s => s.id === selectedScenario)?.name}
                </span>
              )}
              {optimisticPrediction && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Loading...
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Price Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Price:</span>
                    <span className="font-medium">
                      {optimisticPrediction ? "..." : `$${displayPrediction.currentPrice}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Predicted Price:</span>
                    <span className="font-medium text-blue-600">
                      {optimisticPrediction ? "..." : `$${displayPrediction.predictedPrice}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Change:</span>
                    <span className={displayPrediction.expectedChange >= 0 ? "text-green-600" : "text-red-600"}>
                      {optimisticPrediction ? "..." : `${displayPrediction.expectedChange >= 0 ? "+" : ""}${displayPrediction.expectedChange.toFixed(2)}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Until Target:</span>
                    <span className="font-medium">
                      {optimisticPrediction ? "..." : displayPrediction.daysUntilTarget}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Market Indicators</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trend:</span>
                    <span className={displayPrediction.trend === "upward" ? "text-green-600" : "text-red-600"}>
                      {displayPrediction.trend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SMA Trend:</span>
                    <span className={displayPrediction.smaTrend === "upward" ? "text-green-600" : "text-red-600"}>
                      {displayPrediction.smaTrend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatility:</span>
                    <span className="font-medium">
                      {optimisticPrediction ? "..." : `${displayPrediction.volatility}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Confidence:</span>
                    <span className="font-medium">
                      {optimisticPrediction ? "..." : `${displayPrediction.confidence}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Model Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Linear Model:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `$${displayPrediction.modelDetails?.linear}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exponential Model:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `$${displayPrediction.modelDetails?.exponential}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Technical Adjustment:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.technical * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fundamental Adjustment:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.fundamental * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Momentum Adjustment:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.momentum * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume Adjustment:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.volume * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Support/Resistance:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.supportResistance * 100).toFixed(2)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Adjustment:</span>
                  <span className="font-medium">
                    {optimisticPrediction ? "..." : `${(displayPrediction.modelDetails?.totalAdjustment * 100).toFixed(2)}%`}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Analysis:</strong> {optimisticPrediction ? 
                    "Calculating prediction based on multiple factors..." :
                    `This enhanced prediction uses technical indicators (RSI, moving averages), fundamental factors (P/E, market cap, beta), momentum analysis, volume trends, and support/resistance levels. The confidence level reflects market volatility and trend consistency.`
                  }
                </p>
              </div>
            </div>
          </div>
          {/* Save to Watchlist Button */}
          {!optimisticPrediction && prediction && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  const savedPrediction = {
                    id: `${prediction.symbol}_${Date.now()}`,
                    ...prediction,
                    createdAt: new Date().toISOString()
                  };
                  
                  // Get existing saved predictions
                  const existing = localStorage.getItem("savedPredictions");
                  const savedPredictions = existing ? JSON.parse(existing) : [];
                  
                  // Add new prediction
                  savedPredictions.push(savedPrediction);
                  localStorage.setItem("savedPredictions", JSON.stringify(savedPredictions));
                  
                  console.log(`[FRONTEND] SAVED_PREDICTION: ${prediction.symbol} to watchlist`);
                  alert("Prediction saved to watchlist!");
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-150 flex items-center space-x-2"
              >
                <span>💾</span>
                <span>Save to Watchlist</span>
              </button>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This prediction is for informational purposes only and should not be considered 
              as financial advice. Stock prices are influenced by many factors and past performance does not guarantee future results.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 