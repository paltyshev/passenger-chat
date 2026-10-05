import { redis } from '@/lib/redis';
import { ID_RE } from '@/lib/profile';

export const dynamic = 'force-dynamic';

// Отдаёт аватар как обычную картинку. Версия в ?v= меняется при смене фото,
// поэтому браузер кэширует его и не дёргает Redis при каждом опросе списка.
export async function GET(_req, { params }) {
  const { id } = params;
  if (!ID_RE.test(id)) return new Response(null, { status: 404 });

  const base64 = await redis.get(`photo:${id}`);
  if (!base64 || typeof base64 !== 'string') return new Response(null, { status: 404 });

  return new Response(Buffer.from(base64, 'base64'), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
