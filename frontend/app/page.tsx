import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#040814] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans relative overflow-x-hidden">
      {/* Background grain noise for texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none z-50"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />
      
      <Navbar />
      <main>
        <Hero />
        <Features />
        <DashboardPreview />
      </main>
      <Footer />
    </div>
  );
}
