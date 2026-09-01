import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nextMskMidnightMs, ttlSecondsUntilMskMidnight } from '@/lib/time';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, topics } = body || {};

  if (!id || !Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
  }

  const existing = await redis.get(`user:${id}`);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const record = typeof existing === 'string' ? JSON.parse(existing) : existing;
  record.topics = topics.slice(0, 20);

  const expiresAt = nextMskMidnightMs();
  const ttl = ttlSecondsUntilMskMidnight();

  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({ ok: true });
}
