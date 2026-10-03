import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import {
  getCallCheckStatus,
  CHECK_CONFIRMED,
  CHECK_EXPIRED,
} from '@/lib/smsru';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'no_token' }, { status: 400 });

  const raw = await redis.get(`vfy:${token}`);
  if (!raw) return NextResponse.json({ status: 'expired' });
  const rec = typeof raw === 'string' ? JSON.parse(raw) : raw;

  if (rec.status === 'confirmed') return NextResponse.json({ status: 'confirmed' });

  let code;
  try {
    code = await getCallCheckStatus(rec.checkId);
  } catch (e) {
    console.error('[verify/status]', e.message);
    // временный сбой провайдера — клиент просто опросит ещё раз
    return NextResponse.json({ status: 'pending' });
  }

  if (code === CHECK_CONFIRMED) {
    rec.status = 'confirmed';
    await redis.set(`vfy:${token}`, rec, { ex: 600 });
    return NextResponse.json({ status: 'confirmed' });
  }
  if (code === CHECK_EXPIRED) {
    await redis.del(`vfy:${token}`);
    return NextResponse.json({ status: 'expired' });
  }
  return NextResponse.json({ status: 'pending' });
}
