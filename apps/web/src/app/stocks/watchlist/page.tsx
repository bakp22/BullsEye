"use client";
import Header from "@/components/Header";
import PredictionWatchlist from "@/components/stocks/PredictionWatchlist";

export default function WatchlistPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Header />
      <div className="mt-8">
        <PredictionWatchlist />
      </div>
    </div>
  );
} 