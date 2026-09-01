import { Redis } from '@upstash/redis';

const url =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  // Не бросаем исключение на этапе сборки — только при реальном обращении к redis,
  // чтобы `next build` не падал без переменных окружения.
  console.warn(
    '[redis] KV_REST_API_URL/TOKEN (или UPSTASH_REDIS_REST_URL/TOKEN) не заданы'
  );
}

export const redis = new Redis({ url, token });
