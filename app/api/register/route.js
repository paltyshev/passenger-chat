import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { redis } from '@/lib/redis';
import { nextMskMidnightMs, ttlSecondsUntilMskMidnight } from '@/lib/time';
import { isValidRuPhone } from '@/lib/phone';
import { AGE_GROUPS } from '@/lib/ageGroups';
import { toSmsRuPhone } from '@/lib/smsru';
import { CONSENT_VERSION } from '@/lib/legal';
import { cleanBio, parseAvatar } from '@/lib/profile';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const { id: clientId, name, phone, topics, ageGroup, consent, verifyToken, bio, avatar } = body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof phone !== 'string' ||
    !isValidRuPhone(phone) ||
    !Array.isArray(topics) ||
    topics.length === 0 ||
    typeof ageGroup !== 'string' ||
    !AGE_GROUPS.includes(ageGroup) ||
    consent !== true
  ) {
    return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
  }

  // Необязательные поля профиля: «о себе» и аватар
  const cleanedBio = cleanBio(bio);
  if (!cleanedBio.ok) {
    return NextResponse.json({ error: cleanedBio.error }, { status: 400 });
  }
  let photo = null;
  if (avatar !== undefined && avatar !== null && avatar !== '') {
    photo = parseAvatar(avatar);
    if (!photo.ok) return NextResponse.json({ error: 'invalid_avatar' }, { status: 400 });
  }

  // Номер должен быть подтверждён звонком (см. /api/verify/*).
  if (typeof verifyToken !== 'string' || !verifyToken) {
    return NextResponse.json({ error: 'phone_not_verified' }, { status: 403 });
  }
  const rawVerify = await redis.get(`vfy:${verifyToken}`);
  const verify = rawVerify && (typeof rawVerify === 'string' ? JSON.parse(rawVerify) : rawVerify);
  if (!verify || verify.status !== 'confirmed' || verify.phone !== toSmsRuPhone(phone)) {
    return NextResponse.json({ error: 'phone_not_verified' }, { status: 403 });
  }
  // токен одноразовый
  await redis.del(`vfy:${verifyToken}`);

  const id = clientId || randomUUID();
  const expiresAt = nextMskMidnightMs();
  const ttl = ttlSecondsUntilMskMidnight();

  const record = {
    id,
    name: name.trim().slice(0, 60),
    phone: phone.trim().slice(0, 20),
    topics: topics.slice(0, 20),
    ageGroup,
    bio: cleanedBio.value,
    avatarV: photo ? Date.now() : undefined,
    createdAt: Date.now(),
    // подтверждение согласия: когда и по какой редакции текста дано
    consentAt: Date.now(),
    consentVersion: CONSENT_VERSION,
  };

  if (photo) await redis.set(`photo:${id}`, photo.base64, { ex: ttl });
  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({ id, expiresAt, avatarV: record.avatarV || null });
}
