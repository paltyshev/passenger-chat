const MSK_OFFSET_MS = 3 * 60 * 60 * 1000; // МСК = UTC+3, без перехода на летнее время

/**
 * Возвращает timestamp (мс, UTC epoch) ближайшей полуночи по московскому времени,
 * которая наступит позже текущего момента.
 */
export function nextMskMidnightMs(now = Date.now()) {
  const shifted = new Date(now + MSK_OFFSET_MS); // "переодеваем" текущий момент в MSK wall-clock
  const nextMidnightWallClockUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
  return nextMidnightWallClockUtc - MSK_OFFSET_MS;
}

// Сколько живёт запись пассажира с момента регистрации. Зимой рейсов мало,
// поэтому неделя. Чтобы вернуть «до полуночи», recordExpiresAtFromNow должна
// вернуть nextMskMidnightMs(now).
const RECORD_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Срок жизни новой записи (мс, UTC epoch). Хранится в записи как expiresAt.
 */
export function recordExpiresAtFromNow(now = Date.now()) {
  return now + RECORD_LIFETIME_MS;
}

/**
 * Срок жизни существующей записи. У записей, созданных до появления expiresAt,
 * его нет — они живут до ближайшей полуночи МСК, как при регистрации.
 */
export function recordExpiresAt(record, now = Date.now()) {
  return Number(record?.expiresAt) || nextMskMidnightMs(now);
}

/**
 * TTL в секундах до момента expiresAt (минимум 1 секунда).
 */
export function ttlSecondsUntil(expiresAt, now = Date.now()) {
  return Math.max(1, Math.ceil((expiresAt - now) / 1000));
}

/**
 * Текущая дата по МСК в виде 'YYYY-MM-DD'.
 */
export function mskDateKey(now = Date.now()) {
  return new Date(now + MSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * TTL в секундах до конца текущих суток по МСК (минимум 1 секунда).
 */
export function ttlSecondsUntilMskMidnight(now = Date.now()) {
  const expiresAt = nextMskMidnightMs(now);
  return Math.max(1, Math.floor((expiresAt - now) / 1000));
}
