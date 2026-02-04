

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden relative">

      {/* Top Bar */}
      <header className="px-6 h-20 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-2xl tracking-tighter drop-shadow-sm">
            HackHub
          </Link>
        </div>

        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center text-center px-4 relative z-10 pt-20 pb-32">
        {/* Subtle Background Elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />

        {/* Hero Section */}
        <section className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6">
            Build <span className="text-primary">Better</span> <br /> Together.
          </h1>

          <p className="mx-auto max-w-2xl text-lg md:text-2xl text-muted-foreground font-light leading-relaxed mb-10">
            The all-in-one workspace for high-velocity hackathon teams using <br className="hidden md:inline" />
            <span className="font-semibold text-foreground">Kanban, Chat, and Decisions.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center font-medium">
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                Launch Workspace
              </Button>
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">
              Watch Demo
            </Link>
          </div>
        </section>

        {/* Feature Highlights */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl w-full px-4">
          {[
            { title: "Organize", desc: "Drag & Drop Kanban" },
            { title: "Collaborate", desc: "Real-time Chat" },
            { title: "Decide", desc: "Consensus Log" },
            { title: "Deploy", desc: "Code Snippets" }
          ].map((feature, i) => (
            <div key={i} className="p-6 flex flex-col items-center justify-center bg-card border rounded-xl shadow-sm hover:shadow-md transition-all cursor-default">
              <div className="font-bold text-xl mb-1">{feature.title}</div>
              <div className="text-sm text-muted-foreground">{feature.desc}</div>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-8 w-full text-center text-xs text-muted-foreground border-t">
        <p>© 2026 HackHub. Crafted for Builders.</p>
      </footer>
    </div>
  );
}
