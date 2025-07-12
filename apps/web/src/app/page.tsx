"use client";

import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import Testimonials from "@/components/home/Testimonials";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Benefits />
      <Testimonials />
      <Footer />
    </main>
  );
}
