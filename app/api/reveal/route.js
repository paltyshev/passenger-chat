import { NextResponse } from 'next/server';
import { getUser, loadAuthorized } from '@/lib/session';
import { ID_RE } from '@/lib/profile';
import { allow, clientIp } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// Сколько чужих карточек (с телефоном) можно открыть. Обычно человек открывает
// единицы; лимит не даёт выкачать номера всех пассажиров скриптом.
const REVEAL_PER_USER = 30;
const REVEAL_PER_IP = 120; // за IP выше: в зале ожидания у многих общий NAT/Wi-Fi
const REVEAL_WINDOW_SEC = 3600;

// Контактная карточка с телефоном — только зарегистрированному пассажиру
// (так сказано в согласии). POST, чтобы токен не попадал в URL и логи nginx.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, token, targetId } = body || {};
  if (typeof targetId !== 'string' || !ID_RE.test(targetId)) {
    return NextResponse.json({ error: 'invalid_data' }, { status: 400 });
  }

  const auth = await loadAuthorized(id, token);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const ip = clientIp(req);
  const okUser = await allow(`reveal:user:${id}`, REVEAL_PER_USER, REVEAL_WINDOW_SEC);
  const okIp = !ip || (await allow(`reveal:ip:${ip}`, REVEAL_PER_IP, REVEAL_WINDOW_SEC));
  if (!okUser || !okIp) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const user = await getUser(targetId);
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      flight: user.flight || null,
      bio: user.bio || '',
      avatarV: user.avatarV || null,
    },
  });
}

// Старый клиент (страница, открытая до выкладки) спрашивает GET ?id= без токена.
export async function GET() {
  return NextResponse.json({ error: 'auth_required' }, { status: 401 });
}
