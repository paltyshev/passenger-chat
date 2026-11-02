import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { loadAuthorized } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Список видят только зарегистрированные: имя, фото и рейс — персональные данные.
// POST, чтобы токен не попадал в URL и логи nginx.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, token } = body || {};
  const str = (v) => (typeof v === 'string' ? v : '');
  const topic = str(body?.topic);
  const ageGroup = str(body?.ageGroup);
  const flight = str(body?.flight);

  const auth = await loadAuthorized(id, token);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const selfId = id;

  const now = Date.now();
  // чистим протухшие записи из индекса
  await redis.zremrangebyscore('active_users', 0, now);
  // score — срок записи (регистрация + неделя), поэтому по убыванию: свежие сверху
  const ids = await redis.zrange('active_users', 0, -1, { rev: true });

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

// Старый клиент (страница, открытая до выкладки) опрашивает GET без токена.
export async function GET() {
  return NextResponse.json({ error: 'auth_required', users: [], flights: [] }, { status: 401 });
}
