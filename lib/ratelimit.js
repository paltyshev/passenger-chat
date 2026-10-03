import { redis } from '@/lib/redis';

/**
 * Простой счётчик "не более max событий за windowSec секунд" по ключу.
 * Возвращает true, если лимит ещё не превышен.
 */
export async function allow(key, max, windowSec) {
  const n = await redis.incr(`rl:${key}`);
  if (n === 1) await redis.expire(`rl:${key}`, windowSec);
  return n <= max;
}

export function clientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '';
}
