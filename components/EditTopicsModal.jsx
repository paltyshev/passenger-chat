'use client';

import { useState } from 'react';
import { TOPICS } from '@/lib/topics';

export default function EditTopicsModal({ currentTopics, onSave, onClose }) {
  const [topics, setTopics] = useState(currentTopics);
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-3">Изменить темы</h2>
        <div className="flex flex-wrap gap-2 mb-5">
          {TOPICS.map((t) => {
            const active = topics.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className={
                  'px-3 py-1.5 rounded-full text-sm border ' +
                  (active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-300')
                }
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 rounded-lg py-2.5 text-sm font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving || topics.length === 0}
            className="flex-1 bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
