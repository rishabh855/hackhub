import Link from "next/link";
import { UserNav } from "@/components/ui/user-nav";

export default function TeamsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-[#040814] relative selection:bg-indigo-500/10 selection:text-indigo-900">
            {/* Background grain noise for texture */}
            <div 
              className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] mix-blend-overlay pointer-events-none z-0"
              style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
            />

            {/* Top Bar */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[1400px] z-50 h-[72px] rounded-2xl px-6 flex items-center justify-between backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-lg">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                            H
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">HackHub</span>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <UserNav />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 pt-32 pb-12 relative z-10">
                {children}
            </main>
        </div>
    );
}
