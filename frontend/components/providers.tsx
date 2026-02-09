'use client';

import { UserProvider } from './user-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}
