import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
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

  const { id: clientId, name, phone, topics, consent } = body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof phone !== 'string' ||
    !phone.trim() ||
    !Array.isArray(topics) ||
    topics.length === 0 ||
    consent !== true
  ) {
    return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
  }

  const id = clientId || randomUUID();
  const expiresAt = nextMskMidnightMs();
  const ttl = ttlSecondsUntilMskMidnight();

  const record = {
    id,
    name: name.trim().slice(0, 60),
    phone: phone.trim().slice(0, 20),
    topics: topics.slice(0, 20),
    createdAt: Date.now(),
  };

  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({ id, expiresAt });
}
