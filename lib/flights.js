// Вылеты за сегодня с табло аэропорта (gelaero.ru). Только серверный код.
//
// Разбор повторяет airport-api/parser.py: строки .flight-board__row.has-link,
// в каждой шесть ячеек .flight-board__item — время, город, рейс, авиакомпания,
// выход, статус. Зачёркнутые значения (.is-through) и дубли для мобильной
// вёрстки (.d-none ...) выбрасываем.
//
// Результат кэшируется в Redis на CACHE_SEC. Если табло недоступно, отдаём
// последний удачный список за эти же сутки — без рейса зарегистрироваться нельзя.

import { redis } from '@/lib/redis';
import { mskDateKey, ttlSecondsUntilMskMidnight } from '@/lib/time';

const BOARD_URL = 'https://gelaero.ru/departures/?day=today&time=all&airline=all';
const CACHE_KEY = 'flights:departures';
const CACHE_SEC = 300;
const FETCH_TIMEOUT_MS = 10_000;

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&');
}

// Аналог clean_element из parser.py: убираем зачёркнутое и мобильные дубли, берём текст.
function cleanText(html) {
  const stripped = html
    .replace(/<span[^>]*class="[^"]*\bis-through\b[^"]*"[^>]*>[\s\S]*?<\/span>/g, ' ')
    .replace(/<(\w+)[^>]*class="[^"]*\b(?:d-none|d-md-none|d-md-inline-block)\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

export function parseDepartures(html) {
  const flights = [];
  const rows = html.split(/class="flight-board__row has-link"/).slice(1);
  for (const rowRaw of rows) {
    const row = rowRaw.split(/<a\s+class="flight-board__link"/)[0];
    const items = row.split(/<div class="flight-board__item">/).slice(1);
    if (items.length < 6) continue;

    const number = cleanText(items[2]);
    if (!number) continue;
    // «Москва<span>SVO</span>» — город и код аэропорта отдельно
    const code = (items[1].match(/<span>\s*([A-ZА-Я]{3})\s*<\/span>/) || [])[1] || '';
    const city = cleanText(items[1].replace(/<span>[\s\S]*?<\/span>/, ''));
    const airline = decodeEntities((items[3].match(/alt="([^"]*)"/) || [])[1] || '');

    flights.push({
      number,
      time: cleanText(items[0]),
      city,
      code,
      airline,
      status: cleanText(items[5]),
    });
  }
  return flights;
}

async function fetchBoard() {
  const res = await fetch(BOARD_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`gelaero ${res.status}`);
  return parseDepartures(await res.text());
}

/**
 * Сегодняшние вылеты. -> { flights, updatedAt } | null (табло недоступно и кэша нет)
 */
export async function getTodayDepartures() {
  const today = mskDateKey();
  const cached = await redis.get(CACHE_KEY);
  const data = cached && (typeof cached === 'string' ? JSON.parse(cached) : cached);
  const sameDay = data && data.date === today;

  if (sameDay && Date.now() - data.fetchedAt < CACHE_SEC * 1000) {
    return { flights: data.flights, updatedAt: data.fetchedAt };
  }

  try {
    const flights = await fetchBoard();
    const fetchedAt = Date.now();
    await redis.set(CACHE_KEY, { date: today, fetchedAt, flights }, { ex: ttlSecondsUntilMskMidnight() });
    return { flights, updatedAt: fetchedAt };
  } catch (e) {
    console.warn('[flights] не удалось получить табло:', e.message);
    return sameDay ? { flights: data.flights, updatedAt: data.fetchedAt } : null;
  }
}

// Рейс, который пассажир выбрал, — в том виде, в каком он хранится в записи.
export function flightView(f) {
  return { number: f.number, time: f.time, city: f.city, code: f.code };
}

/**
 * Проверяет номер рейса по сегодняшнему табло.
 * -> { ok: true, flight } | { ok: false, error }
 */
export async function resolveFlight(number) {
  if (typeof number !== 'string' || !number.trim()) return { ok: false, error: 'invalid_flight' };
  const board = await getTodayDepartures();
  if (!board) return { ok: false, error: 'flights_unavailable' };
  const found = board.flights.find((f) => f.number === number.trim());
  if (!found) return { ok: false, error: 'invalid_flight' };
  return { ok: true, flight: flightView(found) };
}
