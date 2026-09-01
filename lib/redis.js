import { Redis } from '@upstash/redis';

// Vercel Marketplace (Upstash) может добавлять произвольный префикс к именам
// переменных окружения, если стандартное имя уже занято (например,
// CHAT_KV_REST_API_URL вместо KV_REST_API_URL). Поэтому ищем по паттерну,
// а не по жёстко заданному имени.
function findEnvValue(suffixes) {
  for (const suffix of suffixes) {
    // точное совпадение без префикса
    if (process.env[suffix]) return process.env[suffix];
  }
  const keys = Object.keys(process.env);
  for (const suffix of suffixes) {
    const found = keys.find((k) => k.endsWith(suffix));
    if (found) return process.env[found];
  }
  return undefined;
}

const url = findEnvValue(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL']);
const token = findEnvValue(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN']);

if (!url || !token) {
  // Не бросаем исключение на этапе сборки — только при реальном обращении к redis,
  // чтобы `next build` не падал без переменных окружения.
  console.warn(
    '[redis] не найдены переменные *_KV_REST_API_URL/TOKEN или *_UPSTASH_REDIS_REST_URL/TOKEN'
  );
}

export const redis = new Redis({ url, token });
