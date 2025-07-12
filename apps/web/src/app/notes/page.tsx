import Header from "@/components/Header";
import StockFeed from "@/components/stocks/StockFeed";

export default function Home() {
  return (
    <main className="bg-[#EDEDED] h-screen">
      <Header />
      <div className="mt-8">
        <StockFeed />
      </div>
    </main>
  );
}
