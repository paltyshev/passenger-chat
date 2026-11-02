import { redis } from '@/lib/redis';

/**
 * Простой счётчик "не более max событий за windowSec секунд" по ключу.
 * Возвращает true, если лимит ещё не превышен.
 *
 * Ключ создаётся сразу с TTL (SET NX EX), поэтому сбой между INCR и EXPIRE
 * не оставит вечный счётчик, который навсегда заблокирует номер или IP.
 * Повторный EXPIRE на первом событии закрывает гонку, когда ключ истёк
 * между SET и INCR.
 */
export async function allow(key, max, windowSec) {
  const k = `rl:${key}`;
  await redis.set(k, 0, { nx: true, ex: windowSec });
  const n = await redis.incr(k);
  if (n === 1) await redis.expire(k, windowSec);
  return n <= max;
}

// IP клиента. nginx (proxy-common.conf) сам выставляет X-Real-IP = $remote_addr,
// а в X-Forwarded-For только дописывает адрес в конец — первые значения там
// присылает клиент, им верить нельзя. Поэтому X-Real-IP, а из XFF — последний.
export function clientIp(req) {
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',').pop().trim();
  return '';
}
