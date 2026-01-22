import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[size:400%_400%] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" /> {/* Subtle overlay for text readability */}

      {/* Top Bar with Minimal Navigation */}
      <header className="px-6 h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="glass-card px-6 py-2 flex items-center gap-2">
          <Link href="/" className="font-bold text-2xl tracking-tighter text-white drop-shadow-md">
            HackHub
          </Link>
        </div>

        <div className="flex gap-4">
          <Link href="/login">
            <button className="glass-button px-6 py-2 rounded-full font-medium text-sm text-white hover:scale-105 active:scale-95 transition-all">
              Sign In
            </button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 relative z-10">
        {/* Floating Abstract Shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000" />

        {/* Hero Section */}
        <section className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="glass-card p-12 md:p-16 border-white/20 shadow-2xl backdrop-blur-2xl bg-white/5">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 drop-shadow-lg">
              Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-pink-200">Better</span> <br /> Together.
            </h1>

            <p className="mx-auto max-w-2xl text-lg md:text-2xl text-white/90 font-light leading-relaxed mb-10 drop-shadow-sm">
              The all-in-one workspace for high-velocity hackathon teams using <br className="hidden md:inline" />
              <span className="font-semibold text-white">Kanban, Chat, and Decisions.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center font-medium">
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-purple-900 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                  Launch Workspace
                </Button>
              </Link>
              <Link href="/login" className="text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors">
                Watch Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights using Glass Cards */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl w-full px-4">
          {[
            { title: "Organize", desc: "Drag & Drop Kanban" },
            { title: "Collaborate", desc: "Real-time Chat" },
            { title: "Decide", desc: "Consensus Log" },
            { title: "Deploy", desc: "Code Snippets" }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 flex flex-col items-center justify-center hover:bg-white/10 transition-colors cursor-default">
              <div className="font-bold text-xl text-white mb-1">{feature.title}</div>
              <div className="text-sm text-white/70">{feature.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 w-full text-center text-xs text-white/50 relative z-10">
        <p>© 2026 HackHub. Crafted for Builders.</p>
      </footer>
    </div>
  );
}
