import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id } = body || {};
  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 });

  await redis.del(`user:${id}`);
  await redis.zrem('active_users', id);

  return NextResponse.json({ ok: true });
}
