export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ 
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable in Vercel' 
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ status: 'alive (tracked on dashboard)', data }, { status: 200 });
  } catch (error: any) {
    console.error('Keepalive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query database' }, { status: 500 });
  }
}
