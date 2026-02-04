import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = {
    name: string
    value: string
    options?: {
        path?: string
        domain?: string
        maxAge?: number
        expires?: Date
        httpOnly?: boolean
        secure?: boolean
        sameSite?: 'lax' | 'strict' | 'none'
    }
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/teams'

    if (code) {
        const cookieStore = await cookies() // ✅ FIX IS HERE

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: CookieToSet[]) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch {
                            // Safe to ignore in server components
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
