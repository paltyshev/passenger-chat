import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 });

  const record = await redis.get(`user:${id}`);
  if (!record) return NextResponse.json({ user: null });

  const user = typeof record === 'string' ? JSON.parse(record) : record;
  return NextResponse.json({ user: { id: user.id, name: user.name, phone: user.phone } });
}
