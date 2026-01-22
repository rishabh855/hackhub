import Link from "next/link";
import { UserNav } from "@/components/ui/user-nav";

export default function TeamsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-muted/10">
            {/* Top Bar */}
            <header className="px-6 h-16 flex items-center justify-between border-b bg-background sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/teams" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                        HackHub
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <UserNav />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
