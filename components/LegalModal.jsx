'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Оверлей для перехваченных маршрутов /consent и /privacy.
// Закрытие = router.back(): то же, что системная кнопка «Назад».
export default function LegalModal({ children }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && router.back();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={() => router.back()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex justify-end bg-surface/95 px-3 py-2 backdrop-blur">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg px-3 py-1.5 text-sm text-link"
            aria-label="Закрыть"
          >
            Закрыть ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
