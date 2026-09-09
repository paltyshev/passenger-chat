import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const selfId = searchParams.get('id') || '';
  const topic = searchParams.get('topic') || '';
  const ageGroup = searchParams.get('ageGroup') || '';

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

  if (ageGroup) {
    users = users.filter((u) => u.ageGroup === ageGroup);
  }

  // не отдаём телефон в общем списке — только имя, темы и возрастную группу
  const safeUsers = users.map(({ id, name, topics, ageGroup }) => ({ id, name, topics, ageGroup }));

  return NextResponse.json({ users: safeUsers });
}
