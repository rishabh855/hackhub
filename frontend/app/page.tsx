import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Layout, Database, MessageSquare, Terminal } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <Link className="flex items-center justify-center p-2" href="#">
          <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">HackHub</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-indigo-600 transition-colors flex items-center" href="/login">
            Sign In
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-white dark:bg-slate-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500 pb-2">
                  Build Better Together.
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  The all-in-one collaboration platform for hackathons and dev teams. Manage tasks, chat in real-time, and share code snippets seamlessly.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/login">
                  <Button className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
                    Start Hacking <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" className="h-12 px-8 text-lg">Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-950">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-2 border-slate-200 p-4 rounded-lg bg-white shadow-sm dark:bg-slate-900 border">
                <div className="p-2 bg-indigo-100 rounded-full dark:bg-indigo-900">
                  <Layout className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold">Kanban Boards</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Visualize your workflow with drag-and-drop task management.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-slate-200 p-4 rounded-lg bg-white shadow-sm dark:bg-slate-900 border">
                <div className="p-2 bg-green-100 rounded-full dark:bg-green-900">
                  <MessageSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Real-time Chat</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Communicate instantaneously with your team members.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-slate-200 p-4 rounded-lg bg-white shadow-sm dark:bg-slate-900 border">
                <div className="p-2 bg-amber-100 rounded-full dark:bg-amber-900">
                  <Terminal className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">Snippet Sharing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Share and reuse code snippets with syntax highlighting.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 border-slate-200 p-4 rounded-lg bg-white shadow-sm dark:bg-slate-900 border">
                <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900">
                  <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">AI Assistance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Get intelligent task suggestions and code explanations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-slate-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 HackHub. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
