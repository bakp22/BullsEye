"use client";
import Header from "@/components/Header";
import StockPredictionForm from "@/components/stocks/StockPredictionForm";

export default function StockPredictionPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <Header />
      <div className="mt-8">
        <StockPredictionForm />
      </div>
    </div>
  );
} 