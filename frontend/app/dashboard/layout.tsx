"use client";

import { UserNav } from "@/components/ui/user-nav";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b">
                <div className="flex h-16 items-center px-4 md:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        HackHub
                    </Link>
                    <div className="ml-auto flex items-center space-x-4">
                        <UserNav />
                    </div>
                </div>
            </header>
            <main className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </main>
        </div>
    );
}
