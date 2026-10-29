'use client';

import { useEffect, useRef } from 'react';
import { useBackClose } from '@/lib/useBackClose';

// Нижняя шторка фильтра списка (возраст, рейс). Выбор применяется сразу и закрывает шторку.
// options: [{ value, label, hint? }]
export default function FilterSheet({ title, options, value, onSelect, onClose }) {
  const dialogRef = useRef(null);
  const close = useBackClose(true, onClose);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80dvh] w-full animate-sheet-in overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 shadow-2xl outline-none sm:max-w-sm sm:rounded-2xl sm:border"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <h2 id="filter-title" className="mb-2 text-lg font-semibold">
          {title}
        </h2>
        <div role="radiogroup" aria-labelledby="filter-title" className="flex flex-col">
          {options.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(o.value)}
                className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-base transition-colors hover:bg-surface2 ${
                  selected ? 'font-medium text-link' : 'text-fg'
                }`}
              >
                <span className="min-w-0 truncate">{o.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {o.hint && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent-strong">
                      {o.hint}
                    </span>
                  )}
                  {selected && (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
