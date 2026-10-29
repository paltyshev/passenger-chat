import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { nextMskMidnightMs, ttlSecondsUntilMskMidnight } from '@/lib/time';
import { AVATAR_LARGE_MAX_CHARS, cleanBio, parseAvatar } from '@/lib/profile';
import { loadAuthorized } from '@/lib/session';
import { resolveFlight } from '@/lib/flights';

export const dynamic = 'force-dynamic';

// Правка профиля: темы, рейс, «о себе», аватар. Все поля необязательные —
// меняется только то, что пришло в запросе.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, token, topics, flight, bio, avatar, avatarLarge, removeAvatar } = body || {};

  const auth = await loadAuthorized(id, token);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { record } = auth;

  if (topics !== undefined) {
    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
    }
    record.topics = topics.slice(0, 20);
  }

  if (flight !== undefined) {
    const f = await resolveFlight(flight);
    if (!f.ok) {
      return NextResponse.json({ error: f.error }, { status: f.error === 'flights_unavailable' ? 503 : 400 });
    }
    record.flight = f.flight;
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
    const lg = avatarLarge ? parseAvatar(avatarLarge, AVATAR_LARGE_MAX_CHARS) : null;
    if (lg && !lg.ok) return NextResponse.json({ error: 'invalid_avatar' }, { status: 400 });
    await redis.set(`photo:${id}`, a.base64, { ex: ttl });
    if (lg) await redis.set(`photoLg:${id}`, lg.base64, { ex: ttl });
    else await redis.del(`photoLg:${id}`);
    record.avatarV = Date.now();
  } else if (removeAvatar === true) {
    await redis.del(`photo:${id}`);
    await redis.del(`photoLg:${id}`);
    delete record.avatarV;
  }

  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({
    ok: true,
    avatarV: record.avatarV || null,
    bio: record.bio || '',
    flight: record.flight || null,
  });
}
