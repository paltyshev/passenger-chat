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

/**
 * TTL в секундах до конца текущих суток по МСК (минимум 1 секунда).
 */
export function ttlSecondsUntilMskMidnight(now = Date.now()) {
  const expiresAt = nextMskMidnightMs(now);
  return Math.max(1, Math.floor((expiresAt - now) / 1000));
}
