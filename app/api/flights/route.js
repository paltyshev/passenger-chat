import { NextResponse } from 'next/server';
import { getTodayDepartures } from '@/lib/flights';

export const dynamic = 'force-dynamic';

// Сегодняшние вылеты для выбора рейса при регистрации и фильтра списка.
export async function GET() {
  const board = await getTodayDepartures();
  if (!board) return NextResponse.json({ error: 'flights_unavailable' }, { status: 503 });

  return NextResponse.json({ flights: board.flights, updatedAt: board.updatedAt });
}
