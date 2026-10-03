'use client';

import { useEffect, useRef, useState } from 'react';
import { TOPICS } from '@/lib/topics';

export default function EditTopicsModal({ currentTopics, onSave, onClose }) {
  const [topics, setTopics] = useState(currentTopics);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggle(t) {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSave() {
    if (topics.length === 0) return;
    setSaving(true);
    try {
      await onSave(topics);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="topics-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full animate-sheet-in rounded-t-3xl border-t border-line bg-surface p-5 shadow-2xl outline-none sm:max-w-sm sm:rounded-2xl sm:border"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <h2 id="topics-title" className="mb-3 text-lg font-semibold">
          Изменить темы
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              aria-pressed={topics.includes(t)}
              className="chip"
            >
              {t}
            </button>
          ))}
        </div>
        {topics.length === 0 && (
          <p className="mb-3 text-xs text-danger">Выберите хотя бы одну тему.</p>
        )}

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || topics.length === 0}
            className="btn btn-primary"
          >
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
