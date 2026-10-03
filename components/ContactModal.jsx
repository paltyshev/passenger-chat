'use client';

import { useEffect, useRef } from 'react';

const STEPS = [
  'Сохраните этот номер в контакты телефона.',
  'Откройте MAX, Telegram или другой мессенджер — контакт появится там автоматически.',
  'Напишите первым, представьтесь и укажите тему для разговора.',
];

export default function ContactModal({ user, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, onClose]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-sheet-in rounded-t-3xl border-t border-line bg-surface p-5 shadow-2xl outline-none sm:max-w-sm sm:rounded-2xl sm:border"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <h2 id="contact-title" className="mb-2 text-lg font-semibold">
          {user.name}
        </h2>
        <a
          href={`tel:${user.phone.replace(/[^\d+]/g, '')}`}
          className="mb-5 block rounded-xl border border-line bg-surface2 py-3 text-center font-mono text-2xl text-link transition-colors hover:border-brand/50"
        >
          {user.phone}
        </a>

        <p className="mb-3 text-sm font-medium text-muted">Чтобы начать общение:</p>
        <ol className="mb-5 flex flex-col gap-3 text-sm">
          {STEPS.map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-strong text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5 text-muted">{text}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className="btn btn-primary">
          Закрыть
        </button>
      </div>
    </div>
  );
}
