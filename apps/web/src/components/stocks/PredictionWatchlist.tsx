"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import MiniChart from "./MiniChart";

interface SavedPrediction {
  id: string;
  symbol: string;
  currentPrice: number;
  predictedPrice: number;
  targetDate: string;
  expectedChange: number;
  confidence: number;
  daysUntilTarget: number;
  trend: string;
  volatility: number;
  scenario: string;
  scenarioAdjustment: number;
  createdAt: string;
  technicalIndicators: {
    rsi: number;
    sma20: number;
    sma50: number;
    volumeRatio: number;
    momentum: number;
  };
  fundamentalFactors: {
    marketCap: number;
    peRatio: number;
    beta: number;
    sector: string;
    sectorPerformance: number;
  };
  supportResistance: {
    support: number;
    resistance: number;
    currentPosition: number;
  };
  modelDetails: {
    linear: number;
    exponential: number;
    technical: number;
    fundamental: number;
    momentum: number;
    volume: number;
    supportResistance: number;
    totalAdjustment: number;
  };
}

export default function PredictionWatchlist() {
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved predictions from localStorage
  useEffect(() => {
    const loadSavedPredictions = () => {
      try {
        const saved = localStorage.getItem("savedPredictions");
        if (saved) {
          const predictions = JSON.parse(saved);
          setSavedPredictions(predictions);
        }
      } catch (error) {
        console.error("Error loading saved predictions:", error);
        setError("Failed to load saved predictions");
      }
    };

    loadSavedPredictions();
  }, []);

  const removePrediction = (id: string) => {
    const updated = savedPredictions.filter(p => p.id !== id);
    setSavedPredictions(updated);
    localStorage.setItem("savedPredictions", JSON.stringify(updated));
  };

  const clearAllPredictions = () => {
    setSavedPredictions([]);
    localStorage.removeItem("savedPredictions");
  };

  const getScenarioColor = (scenario: string) => {
    const colors = {
      normal: "bg-gray-100 text-gray-800",
      recession: "bg-red-100 text-red-800",
      tariff_war: "bg-orange-100 text-orange-800",
      presidential_change: "bg-blue-100 text-blue-800",
      bull_market: "bg-green-100 text-green-800",
      inflation: "bg-purple-100 text-purple-800",
      tech_bubble: "bg-yellow-100 text-yellow-800",
      crisis: "bg-red-200 text-red-900"
    };
    return colors[scenario as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getScenarioName = (scenario: string) => {
    const names = {
      normal: "Normal Market",
      recession: "Economic Recession",
      tariff_war: "Trade War",
      presidential_change: "Presidential Transition",
      bull_market: "Bull Market",
      inflation: "High Inflation",
      tech_bubble: "Tech Bubble",
      crisis: "Market Crisis"
    };
    return names[scenario as keyof typeof names] || scenario;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-[#f1f5f9] min-h-screen px-4 sm:px-8 py-10 max-w-7xl mx-auto space-y-10 transition-colors duration-300 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.25)] border border-gray-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Saved Predictions ({savedPredictions.length})
        </h2>
        {savedPredictions.length > 0 && (
          <button
            onClick={clearAllPredictions}
            className="px-5 py-2 rounded-full bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors text-sm shadow-sm"
          >
            Clear All
          </button>
        )}
      </div>
      {savedPredictions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Predictions</h3>
          <p className="text-gray-600 mb-4">
            Save predictions from the prediction form to see them here.
          </p>
          <a
            href="/stocks/predict"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            Make a Prediction
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedPredictions.map((prediction) => (
            <div
              key={prediction.id}
              className="bg-[#f8fafc] rounded-3xl shadow-2xl border border-transparent hover:shadow-2xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-2 group"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{prediction.symbol}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(prediction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => removePrediction(prediction.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove prediction"
                >
                  ✕
                </button>
              </div>

              {/* Scenario Badge */}
              <div className="mb-4">
                <span className={`text-xs px-2 py-1 rounded ${getScenarioColor(prediction.scenario)}`}>
                  {getScenarioName(prediction.scenario)}
                </span>
              </div>

              {/* Price Analysis */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Current:</span>
                  <span className="font-medium">${prediction.currentPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Predicted:</span>
                  <span className="font-medium text-blue-600">${prediction.predictedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm">Change:</span>
                  <span className={prediction.expectedChange >= 0 ? "text-green-600" : "text-red-600"}>
                    {prediction.expectedChange >= 0 ? "+" : ""}{prediction.expectedChange.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Confidence</div>
                  <div className="font-semibold">{prediction.confidence}%</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Days Left</div>
                  <div className="font-semibold">{prediction.daysUntilTarget}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Trend</div>
                  <div className={`font-semibold ${prediction.trend === "upward" ? "text-green-600" : "text-red-600"}`}>
                    {prediction.trend}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Volatility</div>
                  <div className="font-semibold">{prediction.volatility}%</div>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Technical Indicators</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">RSI:</span>
                    <span>{prediction.technicalIndicators.rsi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SMA20:</span>
                    <span>${prediction.technicalIndicators.sma20}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volume Ratio:</span>
                    <span>{prediction.technicalIndicators.volumeRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Momentum:</span>
                    <span>{(prediction.technicalIndicators.momentum * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Fundamental Factors */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Fundamental Factors</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">P/E Ratio:</span>
                    <span>{prediction.fundamentalFactors.peRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beta:</span>
                    <span>{prediction.fundamentalFactors.beta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sector:</span>
                    <span>{prediction.fundamentalFactors.sector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sector Perf:</span>
                    <span>{prediction.fundamentalFactors.sectorPerformance}%</span>
                  </div>
                </div>
              </div>

              {/* Target Date */}
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xs text-blue-600 font-medium">Target Date</div>
                <div className="font-semibold text-blue-900">
                  {new Date(prediction.targetDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 