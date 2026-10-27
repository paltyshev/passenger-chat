import { NextResponse } from 'next/server';
import { loadAuthorized, ownView } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Своя запись — только владельцу. POST, чтобы токен не попадал в URL и логи nginx.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  const { id, token } = body || {};

  const auth = await loadAuthorized(id, token);
  if (auth.status === 404 || auth.status === 400) return NextResponse.json({ user: null });
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({ user: ownView(auth.record) });
}

// Старый клиент (страница, открытая до выкладки) спрашивает GET ?id=.
// Отвечаем только по записям без токена — они доживают до полуночи.
// TODO: убрать вместе с legacy-веткой в loadAuthorized.
export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const auth = await loadAuthorized(id, undefined);
  if (auth.error) return NextResponse.json({ user: null });
  return NextResponse.json({ user: ownView(auth.record) });
}
