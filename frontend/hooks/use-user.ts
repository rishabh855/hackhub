'use client';

import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function getUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        }

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return {
        user,
        loading,
        session: user ? { user: { ...user, id: user.id, image: user.user_metadata?.avatar_url, name: user.user_metadata?.full_name || user.email } } : null,
        status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'
    };
}
