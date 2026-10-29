import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const selfId = searchParams.get('id') || '';
  const topic = searchParams.get('topic') || '';
  const ageGroup = searchParams.get('ageGroup') || '';
  const flight = searchParams.get('flight') || '';

  const now = Date.now();
  // чистим протухшие записи из индекса
  await redis.zremrangebyscore('active_users', 0, now);
  const ids = await redis.zrange('active_users', 0, -1);

  if (!ids.length) {
    return NextResponse.json({ users: [], flights: [] });
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

  // Варианты фильтра по рейсу — рейсы тех, кто сейчас в списке (с учётом темы и
  // возраста, но до фильтра по самому рейсу), с числом пассажиров.
  const byFlight = new Map();
  for (const u of users) {
    if (!u.flight?.number) continue;
    const f = byFlight.get(u.flight.number);
    if (f) f.count += 1;
    else byFlight.set(u.flight.number, { ...u.flight, count: 1 });
  }
  const flights = [...byFlight.values()].sort(
    (a, b) => String(a.time).localeCompare(String(b.time)) || a.number.localeCompare(b.number)
  );

  if (flight) {
    users = users.filter((u) => u.flight?.number === flight);
  }

  // не отдаём телефон в общем списке — имя, темы, возраст, рейс, «о себе» и версию аватара
  // (саму картинку браузер берёт отдельно из /api/avatar/<id>?v=<avatarV> и кэширует)
  const safeUsers = users.map(({ id, name, topics, ageGroup, flight, bio, avatarV }) => ({
    id,
    name,
    topics,
    ageGroup,
    flight: flight || null,
    bio: bio || '',
    avatarV: avatarV || null,
  }));

  return NextResponse.json({ users: safeUsers, flights });
}
