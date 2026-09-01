import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ user: null });

  const record = await redis.get(`user:${id}`);
  if (!record) return NextResponse.json({ user: null });

  const user = typeof record === 'string' ? JSON.parse(record) : record;
  return NextResponse.json({ user });
}
