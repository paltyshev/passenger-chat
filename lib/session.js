// Сессии участников: секретный токен устройства и индекс «телефон → id».
//
// Публичный id виден всем в /api/list, поэтому сам по себе он не даёт права
// менять или удалять запись. Для этого нужен токен, который сервер выдаёт при
// регистрации. В Redis хранятся только sha256-хеши токенов — по одному на
// устройство, не больше MAX_DEVICES.
//
// Один номер = одна запись: повторная регистрация с того же номера (другой
// браузер, другое устройство) подключается к уже существующей записи.

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { redis } from '@/lib/redis';
import { toSmsRuPhone } from '@/lib/smsru';
import { ID_RE } from '@/lib/profile';

export const MAX_DEVICES = 5;

export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

export function phoneKey(phone) {
  return `phone:${toSmsRuPhone(phone)}`;
}

export function parseRecord(raw) {
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getUser(id) {
  return parseRecord(await redis.get(`user:${id}`));
}

function tokenMatches(record, token) {
  if (typeof token !== 'string' || !token) return false;
  const given = Buffer.from(hashToken(token), 'hex');
  return record.tokenHashes.some((h) => {
    const stored = Buffer.from(String(h), 'hex');
    return stored.length === given.length && timingSafeEqual(stored, given);
  });
}

/**
 * Загружает запись и проверяет, что запрос пришёл от её владельца.
 * -> { record } | { error, status }
 *
 * Записи без tokenHashes созданы до появления токенов. Они истекают в ближайшую
 * полночь по МСК, а до тех пор проверяются по-старому — по одному id, чтобы
 * уже зарегистрированных людей не выкинуло при выкладке.
 * TODO: убрать эту ветку на следующий день после выкладки.
 */
export async function loadAuthorized(id, token) {
  if (typeof id !== 'string' || !ID_RE.test(id)) return { error: 'invalid_data', status: 400 };
  const record = await getUser(id);
  if (!record) return { error: 'not_found', status: 404 };
  if (!Array.isArray(record.tokenHashes)) return { record };
  if (!tokenMatches(record, token)) return { error: 'forbidden', status: 403 };
  return { record };
}

// Поля записи, которые можно отдать её владельцу (без хешей токенов).
export function ownView(record) {
  const { tokenHashes, ...rest } = record;
  return rest;
}
