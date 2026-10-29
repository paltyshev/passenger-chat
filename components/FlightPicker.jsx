'use client';

import { useTodayFlights } from '@/lib/flightClient';

// Выбор рейса из сегодняшнего табло вылетов — все рейсы за сутки, с любым статусом.
export default function FlightPicker({ value, onChange, labelId = 'pc-flight-label' }) {
  const { flights: options, status, reload } = useTodayFlights();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-muted" id={labelId}>
        Ваш рейс
      </legend>

      {status === 'loading' && (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Загрузка рейсов">
          {[0, 1].map((i) => (
            <div key={i} className="h-[60px] animate-pulse rounded-xl border border-line bg-surface2" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="alert-error flex items-center justify-between gap-3">
          <span>Не удалось загрузить табло вылетов</span>
          <button type="button" onClick={reload} className="shrink-0 font-medium underline underline-offset-2">
            Повторить
          </button>
        </div>
      )}

      {status === 'ready' && options.length === 0 && (
        <p className="rounded-xl border border-line bg-surface2 p-3 text-sm text-muted">
          Сегодня нет вылетов.
        </p>
      )}

      {status === 'ready' && options.length > 0 && (
        <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-2">
          {options.map((f) => {
            const selected = value === f.number;
            return (
              <button
                type="button"
                key={f.number}
                role="radio"
                aria-checked={selected}
                aria-label={`${f.time} ${f.city}, рейс ${f.number}`}
                onClick={() => onChange(f.number)}
                className={`flex min-h-[60px] w-full items-center gap-3 rounded-xl border px-3.5 py-2 text-left transition-colors ${
                  selected
                    ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                    : 'border-line bg-surface hover:border-brand/60 active:bg-surface2'
                }`}
              >
                <span className="w-12 shrink-0 font-mono text-base font-semibold">{f.time}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {f.city} {f.code && <span className="text-sm font-normal text-subtle">{f.code}</span>}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {f.number}
                    {f.airline && ` · ${f.airline}`}
                    {f.status && ` · ${f.status}`}
                  </span>
                </span>
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-link" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
