import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { loadAuthorized, phoneKey } from '@/lib/session';

export const dynamic = 'force-dynamic';

// «Выйти» — перестать искать попутчика. Запись одна на номер, поэтому
// выход с одного устройства убирает человека из списка везде.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, token } = body || {};
  if (!id) return NextResponse.json({ error: 'no_id' }, { status: 400 });

  const auth = await loadAuthorized(id, token);
  // записи уже нет — для клиента это тот же результат, что и выход
  if (auth.status === 404) return NextResponse.json({ ok: true });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await redis.del(`user:${id}`);
  await redis.del(`photo:${id}`);
  await redis.del(`photoLg:${id}`);
  await redis.zrem('active_users', id);
  const pKey = phoneKey(auth.record.phone);
  if ((await redis.get(pKey)) === id) await redis.del(pKey);

  return NextResponse.json({ ok: true });
}
