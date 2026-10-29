'use client';

import { useCallback, useEffect, useState } from 'react';

// «SU-1149 · Москва, 12:30»
export function flightLabel(f) {
  if (!f) return '';
  return `${f.number} · ${f.city}${f.time ? `, ${f.time}` : ''}`;
}

// Сегодняшние вылеты с /api/flights. status: 'loading' | 'ready' | 'error'
export function useTodayFlights() {
  const [flights, setFlights] = useState([]);
  const [status, setStatus] = useState('loading');

  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/flights');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlights(data.flights || []);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { flights, status, reload };
}
