"use client";
import StockFeed from "@/components/stocks/StockFeed";
import Header from "@/components/Header";
import Link from "next/link";

export default function StocksPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen">
        <Header />
        <div className="mt-8">
          <StockFeed />
        </div>
    </div>
  );
}
