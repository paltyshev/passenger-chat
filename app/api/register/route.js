import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { redis } from '@/lib/redis';
import { nextMskMidnightMs, ttlSecondsUntilMskMidnight } from '@/lib/time';
import { isValidRuPhone } from '@/lib/phone';
import { AGE_GROUPS } from '@/lib/ageGroups';
import { toSmsRuPhone } from '@/lib/smsru';
import { CONSENT_VERSION } from '@/lib/legal';
import { resolveFlight } from '@/lib/flights';
import { AVATAR_LARGE_MAX_CHARS, cleanBio, parseAvatar } from '@/lib/profile';
import { MAX_DEVICES, getUser, hashToken, newSessionToken, phoneKey } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  // id клиент не передаёт: его выбирает сервер (новый или по номеру телефона)
  const { name, phone, topics, ageGroup, flight, consent, verifyToken, bio, avatar, avatarLarge } = body || {};

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
  let photoLarge = null;
  if (avatar !== undefined && avatar !== null && avatar !== '') {
    photo = parseAvatar(avatar);
    if (!photo.ok) return NextResponse.json({ error: 'invalid_avatar' }, { status: 400 });
    // большая копия необязательна: без неё просмотр покажет маленькую
    if (avatarLarge) {
      photoLarge = parseAvatar(avatarLarge, AVATAR_LARGE_MAX_CHARS);
      if (!photoLarge.ok) return NextResponse.json({ error: 'invalid_avatar' }, { status: 400 });
    }
  }

  // Рейс обязателен и должен быть в сегодняшнем табло вылетов.
  // Проверяем до одноразового токена звонка, чтобы ошибка не сжигала проверку номера.
  const resolved = await resolveFlight(flight);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.error === 'flights_unavailable' ? 503 : 400 });
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

  const expiresAt = nextMskMidnightMs();
  const ttl = ttlSecondsUntilMskMidnight();
  const pKey = phoneKey(phone);

  // Номер уже зарегистрирован сегодня (другой браузер или устройство) —
  // подключаемся к его записи, а не заводим вторую.
  let id = await redis.get(pKey);
  let existing = id ? await getUser(id) : null;
  if (!existing) {
    id = randomUUID();
    // NX: из двух одновременных регистраций одного номера индекс займёт одна
    const claimed = await redis.set(pKey, id, { nx: true, ex: ttl });
    if (!claimed) {
      const otherId = await redis.get(pKey);
      const other = otherId ? await getUser(otherId) : null;
      if (other) {
        id = otherId;
        existing = other;
      } else {
        await redis.set(pKey, id, { ex: ttl });
      }
    }
  }

  const token = newSessionToken();
  const now = Date.now();

  const record = {
    ...existing,
    id,
    name: name.trim().slice(0, 60),
    phone: phone.trim().slice(0, 20),
    topics: topics.slice(0, 20),
    ageGroup,
    flight: resolved.flight,
    // пустые «о себе» и фото в новой форме не стирают заполненные раньше
    bio: cleanedBio.value || existing?.bio || '',
    avatarV: photo ? now : existing?.avatarV,
    createdAt: existing?.createdAt || now,
    // подтверждение согласия: когда и по какой редакции текста дано
    consentAt: now,
    consentVersion: CONSENT_VERSION,
    tokenHashes: [...(existing?.tokenHashes || []), hashToken(token)].slice(-MAX_DEVICES),
  };

  if (photo) {
    await redis.set(`photo:${id}`, photo.base64, { ex: ttl });
    if (photoLarge) await redis.set(`photoLg:${id}`, photoLarge.base64, { ex: ttl });
    else await redis.del(`photoLg:${id}`);
  }
  await redis.set(`user:${id}`, record, { ex: ttl });
  await redis.set(pKey, id, { ex: ttl });
  await redis.zadd('active_users', { score: expiresAt, member: id });

  return NextResponse.json({
    id,
    token,
    expiresAt,
    bio: record.bio,
    avatarV: record.avatarV || null,
    flight: record.flight,
    rejoined: Boolean(existing),
  });
}
