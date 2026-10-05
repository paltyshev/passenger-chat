// Профиль: короткое «о себе» и аватар. Общая серверная валидация.

import { BIO_MAX } from '@/lib/bio';

// Аватар приходит с клиента уже уменьшенным (192x192 JPEG, обычно 8–15 КБ).
// Серверный лимит — защита от того, что кто-то зальёт в Redis что-то большое.
const AVATAR_PREFIX = 'data:image/jpeg;base64,';
const AVATAR_MAX_CHARS = 60_000;

export const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

// -> { ok: true, value } | { ok: false, error }
export function cleanBio(raw) {
  if (raw == null || raw === '') return { ok: true, value: '' };
  if (typeof raw !== 'string') return { ok: false, error: 'invalid_bio' };

  const value = raw
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (value.length > BIO_MAX) return { ok: false, error: 'invalid_bio' };

  // Контакты в «о себе» не нужны: телефон отдаётся только через карточку,
  // а ссылки/номера в публичном списке — это спам и обход согласия.
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 6 || /https?:|www\.|t\.me|\b[\w-]+\.(ru|com|net|org|me|io)\b/i.test(value)) {
    return { ok: false, error: 'bio_contacts' };
  }
  return { ok: true, value };
}

// -> { ok: true, base64 } | { ok: false }
export function parseAvatar(dataUrl) {
  if (typeof dataUrl !== 'string') return { ok: false };
  if (!dataUrl.startsWith(AVATAR_PREFIX) || dataUrl.length > AVATAR_MAX_CHARS) return { ok: false };
  const base64 = dataUrl.slice(AVATAR_PREFIX.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return { ok: false };
  // сигнатура JPEG: FF D8 FF
  const head = Buffer.from(base64.slice(0, 8), 'base64');
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) return { ok: false };
  return { ok: true, base64 };
}
