import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const selfId = searchParams.get('id') || '';
  const topic = searchParams.get('topic') || '';

  const now = Date.now();
  // чистим протухшие записи из индекса
  await redis.zremrangebyscore('active_users', 0, now);
  const ids = await redis.zrange('active_users', 0, -1);

  if (!ids.length) {
    return NextResponse.json({ users: [] });
  }

  const raw = await redis.mget(...ids.map((i) => `user:${i}`));

  let users = raw
    .map((r) => (typeof r === 'string' ? JSON.parse(r) : r))
    .filter(Boolean)
    .filter((u) => u.id !== selfId);

  if (topic) {
    users = users.filter((u) => Array.isArray(u.topics) && u.topics.includes(topic));
  }

  // не отдаём телефон в общем списке — только имя и темы
  const safeUsers = users.map(({ id, name, topics }) => ({ id, name, topics }));

  return NextResponse.json({ users: safeUsers });
}
