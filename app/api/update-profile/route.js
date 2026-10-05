import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nextMskMidnightMs, ttlSecondsUntilMskMidnight } from '@/lib/time';
import { cleanBio, parseAvatar } from '@/lib/profile';

export const dynamic = 'force-dynamic';

// Правка профиля: темы, «о себе», аватар. Все поля необязательные —
// меняется только то, что пришло в запросе.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, topics, bio, avatar, removeAvatar } = body || {};
  if (!id || typeof id !== 'string') return NextResponse.json({ error: 'invalid_data' }, { status: 400 });

  const existing = await redis.get(`user:${id}`);
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const record = typeof existing === 'string' ? JSON.parse(existing) : existing;

  if (topics !== undefined) {
    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
    }
    record.topics = topics.slice(0, 20);
  }

  if (bio !== undefined) {
    const b = cleanBio(bio);
    if (!b.ok) return NextResponse.json({ error: b.error }, { status: 400 });
    record.bio = b.value;
  }

  const ttl = ttlSecondsUntilMskMidnight();
  const expiresAt = nextMskMidnightMs();

  if (avatar !== undefined && avatar !== null) {
    const a = parseAvatar(avatar);
    if (!a.ok) return NextResponse.json({ error: 'invalid_avatar' }, { status: 400 });
    await redis.set(`photo:${id}`, a.base64, { ex: ttl });
    record.avatarV = Date.now();
  } else if (removeAvatar === true) {
    await redis.del(`photo:${id}`);
    delete record.avatarV;
  }

  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({ ok: true, avatarV: record.avatarV || null, bio: record.bio || '' });
}
