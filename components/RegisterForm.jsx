'use client';

import { useState } from 'react';
import { TOPICS } from '@/lib/topics';

function normalizePhoneInput(value) {
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  if (digits.startsWith('79')) {
    return `+79${digits.slice(2)}`;
  }

  if (digits.startsWith('8') || digits.startsWith('7')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.startsWith('9')) {
    return `+79${digits.slice(1)}`;
  }

  return value.replace(/[^\d+]/g, '').slice(0, 20);
}

export default function RegisterForm({ onRegistered }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topics, setTopics] = useState([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleTopic(t) {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Введите имя');
    if (!phone.trim()) return setError('Введите телефон');
    if (topics.length === 0) return setError('Выберите хотя бы одну тему');
    if (!consent) return setError('Нужно согласие на обработку персональных данных');

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, topics, consent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('Не удалось начать поиск, попробуйте ещё раз');
        return;
      }
      onRegistered({ id: data.id, name: name.trim(), phone: phone.trim(), topics });
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Найти собеседника</h1>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Имя</label>
        <input
          className="border rounded-lg px-3 py-2 text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          maxLength={60}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Телефон</label>
        <input
          className="border rounded-lg px-3 py-2 text-base"
          value={phone}
          onChange={(e) => setPhone(normalizePhoneInput(e.target.value))}
          placeholder="+7 900 000-00-00"
          type="tel"
          inputMode="numeric"
          maxLength={20}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-slate-600">Темы для общения</label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const active = topics.includes(t);
            return (
              <button
                type="button"
                key={t}
                onClick={() => toggleTopic(t)}
                className={
                  'px-3 py-1.5 rounded-full text-sm border transition ' +
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
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          Согласен(на) на обработку персональных данных (имя, телефон) для
          организации общения с другими пассажирами. См.{' '}
          <a href="/privacy" target="_blank" className="underline">
            политику обработки
          </a>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-slate-900 text-white rounded-lg py-3 text-base font-medium disabled:opacity-50"
      >
        {loading ? 'Ищем...' : 'Начать поиск собеседников'}
      </button>
    </form>
  );
}
