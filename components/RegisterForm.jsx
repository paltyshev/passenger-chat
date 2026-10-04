'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TOPICS } from '@/lib/topics';
import { AGE_GROUPS } from '@/lib/ageGroups';
import { normalizePhoneInput, isValidRuPhone } from '@/lib/phone';
import AppHeader from './AppHeader';

export default function RegisterForm({ onRegistered }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topics, setTopics] = useState([]);
  const [ageGroup, setAgeGroup] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'call'
  const [verify, setVerify] = useState(null); // {token, callPhone, callPhonePretty}
  const [secondsLeft, setSecondsLeft] = useState(300);
  const finishing = useRef(false);

  function toggleTopic(t) {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handlePhoneChange(e) {
    const raw = e.target.value;
    setPhone((prev) => normalizePhoneInput(prev, raw));
  }

  // Шаг 1: валидируем форму и просим sms.ru выдать номер, на который надо позвонить
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Введите имя');
    if (!isValidRuPhone(phone)) return setError('Введите корректный номер телефона: +7 900 000-00-00');
    if (topics.length === 0) return setError('Выберите хотя бы одну тему');
    if (!ageGroup) return setError('Укажите возрастную группу');
    if (!consent) return setError('Нужно согласие на обработку персональных данных');

    setLoading(true);
    try {
      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError('Слишком много попыток. Попробуйте позже.');
        return;
      }
      if (!res.ok) {
        setError(
          data.error === 'invalid_phone'
            ? 'Проверьте номер телефона'
            : 'Не удалось запустить проверку номера, попробуйте ещё раз'
        );
        return;
      }
      finishing.current = false;
      setSecondsLeft(data.expiresInSec || 300);
      setVerify(data);
      setStep('call');
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
    } finally {
      setLoading(false);
    }
  }

  // Шаг 2: номер подтверждён звонком — создаём запись
  async function finishRegistration(token) {
    if (finishing.current) return;
    finishing.current = true;
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, topics, ageGroup, consent, verifyToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError('Не удалось начать поиск, попробуйте ещё раз');
        setStep('form');
        return;
      }
      onRegistered({ id: data.id, name: name.trim(), phone: phone.trim(), topics, ageGroup });
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
      setStep('form');
    }
  }

  // Пока открыт экран со звонком — опрашиваем статус и ведём обратный отсчёт
  useEffect(() => {
    if (step !== 'call' || !verify) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/status?token=${encodeURIComponent(verify.token)}`);
        const data = await res.json();
        if (data.status === 'confirmed') {
          clearInterval(poll);
          finishRegistration(verify.token);
        } else if (data.status === 'expired') {
          clearInterval(poll);
          setError('Время на звонок истекло. Попробуйте ещё раз.');
          setStep('form');
        }
      } catch {
        // временная ошибка сети — следующий опрос повторит
      }
    }, 3000);

    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);

    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, verify]);

  if (step === 'call' && verify) {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    return (
      <div>
        <AppHeader title="Подтвердите номер" />
        <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
          <p className="text-sm text-muted">
            Позвоните <b className="text-fg">со своего номера {phone}</b> на номер ниже. Звонок
            бесплатный — он сбросится сам, ничего говорить не нужно.
          </p>
          <a
            href={`tel:+${verify.callPhone}`}
            className="block rounded-2xl bg-gradient-to-br from-brand to-accent-strong py-5 text-center font-mono text-2xl text-white shadow-sm active:opacity-90"
          >
            {verify.callPhonePretty}
          </a>
          <div className="flex items-center justify-center gap-2 text-sm text-muted" aria-live="polite">
            <span className="spinner !h-4 !w-4" aria-hidden="true" />
            Ждём звонок… осталось {mm}:{ss}
          </div>
          <p className="text-center text-xs text-subtle">
            Номер проверяет сервис sms.ru (ООО «СМС.РУ»).
          </p>
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setVerify(null);
            }}
            className="btn btn-outline"
          >
            Изменить номер
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <AppHeader title="Ковер-самолет" subtitle="Найдите собеседника в аэропорту Геленджик" />

      <div className="flex flex-col gap-5 px-4 pb-8 pt-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pc-name" className="text-sm font-medium text-muted">
            Имя
          </label>
          <input
            id="pc-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="given-name"
            maxLength={60}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pc-phone" className="text-sm font-medium text-muted">
            Телефон
          </label>
          <input
            id="pc-phone"
            className="field"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+7 900 000-00-00"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={18}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-muted">Темы для общения</legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleTopic(t)}
                aria-pressed={topics.includes(t)}
                className="chip"
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-muted">
            Возраст <span className="font-normal text-subtle">(сервис доступен с 18 лет)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setAgeGroup(g)}
                aria-pressed={ageGroup === g}
                className="chip chip-age !px-3.5 !py-2 !text-sm"
              >
                {g}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface2 p-3.5 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Даю{' '}
            <Link
              href="/consent"
              scroll={false}
              className="text-link underline underline-offset-2"
            >
              согласие на обработку персональных данных
            </Link>
            : имя, телефон, возраст и темы показываются другим пользователям.
          </span>
        </label>

        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary !min-h-[52px] !text-base"
          >
            {loading ? 'Подождите...' : 'Подтвердить номер и начать поиск'}
          </button>
          <p className="text-center text-xs text-subtle">
            <Link
              href="/privacy"
              scroll={false}
              className="text-link underline underline-offset-2"
            >
              Политика обработки персональных данных
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
