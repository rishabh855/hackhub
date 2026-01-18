'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">HackHub</h1>
                <p className="text-sm text-gray-500">Sign in to manage your hackathon execution.</p>

                <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 justify-center"
                    onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
                >
                    <Github className="w-4 h-4" />
                    Sign in with GitHub
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Or</span>
                    </div>
                </div>

                <Button
                    className="w-full"
                    onClick={() => signIn('credentials', { callbackUrl: '/dashboard', username: 'dev' })}
                >
                    Bypass Login (Dev Mode)
                </Button>
            </div>
        </div>
    );
}
