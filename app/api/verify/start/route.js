import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { redis } from '@/lib/redis';
import { isValidRuPhone } from '@/lib/phone';
import { startCallCheck, toSmsRuPhone } from '@/lib/smsru';
import { allow, clientIp } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

const VERIFY_TTL_SEC = 600; // sms.ru даёт 5 минут на звонок, держим запас

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const { phone } = body || {};
  if (typeof phone !== 'string' || !isValidRuPhone(phone)) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  }

  const digits = toSmsRuPhone(phone);
  const ip = clientIp(req);

  // Каждая проверка — платный запрос к sms.ru, поэтому лимитируем.
  // За IP лимит выше: в зале ожидания у многих общий NAT/Wi-Fi.
  const okPhone = await allow(`vfy:phone:${digits}`, 3, 3600);
  const okIp = !ip || (await allow(`vfy:ip:${ip}`, 30, 3600));
  if (!okPhone || !okIp) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let check;
  try {
    check = await startCallCheck(phone, ip);
  } catch (e) {
    console.error('[verify/start]', e.message);
    if (e.code === 202) return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
    return NextResponse.json({ error: 'provider_error' }, { status: 502 });
  }

  const token = randomUUID();
  await redis.set(
    `vfy:${token}`,
    { phone: digits, checkId: check.checkId, status: 'pending' },
    { ex: VERIFY_TTL_SEC }
  );

  return NextResponse.json({
    token,
    callPhone: check.callPhone,
    callPhonePretty: check.callPhonePretty,
    expiresInSec: 300,
  });
}
