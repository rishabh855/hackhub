import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const data = await prisma.user.findFirst({
      select: { id: true },
    });

    return NextResponse.json({ status: 'alive', data }, { status: 200 });
  } catch (error: any) {
    console.error('Keepalive error:', error);
    return NextResponse.json({ error: error.message || 'Failed to query database' }, { status: 500 });
  }
}
