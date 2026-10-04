'use client';

import { useEffect, useRef } from 'react';
import { AGE_GROUPS } from '@/lib/ageGroups';

const OPTIONS = ['Все', ...AGE_GROUPS];

// Нижняя шторка выбора возрастной группы. Выбор применяется сразу и закрывает шторку.
export default function AgeFilterSheet({ value, onSelect, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-sheet-in rounded-t-3xl border-t border-line bg-surface p-5 shadow-2xl outline-none sm:max-w-sm sm:rounded-2xl sm:border"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <h2 id="age-title" className="mb-2 text-lg font-semibold">
          Возраст собеседника
        </h2>
        <div role="radiogroup" aria-labelledby="age-title" className="flex flex-col">
          {OPTIONS.map((g) => {
            const selected = value === g;
            return (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(g)}
                className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 text-left text-base transition-colors hover:bg-surface2 ${
                  selected ? 'font-medium text-link' : 'text-fg'
                }`}
              >
                <span>{g}</span>
                {selected && (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
