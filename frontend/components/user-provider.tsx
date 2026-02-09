'use client';

import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

type UserContextType = {
    user: User | null;
    loading: boolean;
    session: any | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    refresh: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    const fetchSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setToken(session?.access_token ?? null);
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setToken(session?.access_token ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        loading,
        session: user ? {
            user: { ...user, id: user.id, image: user.user_metadata?.avatar_url, name: user.user_metadata?.full_name || user.email },
            access_token: token
        } : null,
        status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated',
        refresh: fetchSession,
    };

    return <UserContext.Provider value={value as any}>{children}</UserContext.Provider>;
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
