'use client';

import { useEffect, useState, useCallback } from 'react';
import AgeFilterSheet from './AgeFilterSheet';
import AppHeader from './AppHeader';
import BusinessLoungeAd from './BusinessLoungeAd';

// Высота нижней несворачиваемой панели (реклама + кнопки) с небольшим запасом.
// Используется как отступ снизу у списка, чтобы контент не прятался под панель.
const BOTTOM_BAR_RESERVED_PX = 152;

export default function PeopleList({ me, onOpenUser, onLeave, onEditTopics }) {
  const [activeTopic, setActiveTopic] = useState('Все');
  const [activeAge, setActiveAge] = useState('Все');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ageSheetOpen, setAgeSheetOpen] = useState(false);

  const topicTabs = ['Все', ...me.topics];
  const ageActive = activeAge !== 'Все';

  const load = useCallback(async () => {
    const params = new URLSearchParams({ id: me.id });
    if (activeTopic !== 'Все') params.set('topic', activeTopic);
    if (activeAge !== 'Все') params.set('ageGroup', activeAge);

    try {
      const res = await fetch(`/api/list?${params.toString()}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // молча игнорируем разовую ошибку сети, следующий тик обновит список
    } finally {
      setLoading(false);
    }
  }, [activeTopic, activeAge, me.id]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* Шапка + фильтры — единый sticky-блок сверху */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-line bg-surface/95 backdrop-blur">
        <AppHeader title="Собеседники рядом" subtitle={`Вы: ${me.name}`} />

        {/* Темы — табы с подчёркиванием; справа градиент как подсказка прокрутки */}
        <div className="relative border-b border-line">
          <div role="tablist" aria-label="Темы" className="no-scrollbar flex gap-5 overflow-x-auto pl-4 pr-10">
            {topicTabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={activeTopic === t}
                onClick={() => setActiveTopic(t)}
                className="tab"
              >
                {t}
              </button>
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Возраст — одна кнопка, варианты в нижней шторке */}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setAgeSheetOpen(true)}
            aria-haspopup="dialog"
            aria-pressed={ageActive}
            className="chip gap-1.5 !py-1.5"
          >
            Возраст: {ageActive ? activeAge : 'все'}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {ageActive && (
            <button
              type="button"
              onClick={() => setActiveAge('Все')}
              aria-label="Сбросить фильтр по возрасту"
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface2 hover:text-fg"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Список — обычный поток документа, скроллится вместе со страницей.
          Нижний отступ освобождает место под фиксированную панель. */}
      <div
        className="flex-1 px-4 py-4"
        style={{ paddingBottom: `calc(${BOTTOM_BAR_RESERVED_PX}px + env(safe-area-inset-bottom))` }}
      >
        {loading && (
          <ul className="flex flex-col gap-2.5" aria-busy="true" aria-label="Загрузка списка">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-[76px] animate-pulse rounded-2xl border border-line bg-surface2" />
            ))}
          </ul>
        )}

        {!loading && users.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-3 px-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent-strong" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.3A8 8 0 1 1 21 12z" />
              </svg>
            </span>
            <p className="font-medium">Пока никого нет</p>
            <p className="text-sm text-muted">Список обновляется автоматически.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onOpenUser(u)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left shadow-sm transition-colors hover:border-brand/50 active:bg-surface2"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/15 text-base font-semibold text-link"
                    aria-hidden="true"
                  >
                    {(u.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{u.name}</span>
                      {u.ageGroup && (
                        <span className="shrink-0 rounded-full bg-surface2 px-2 py-0.5 text-[11px] text-muted">
                          {u.ageGroup}
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {u.topics.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-link"
                        >
                          {t}
                        </span>
                      ))}
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" className="mt-2.5 h-4 w-4 shrink-0 text-subtle" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Нижняя несворачиваемая панель: реклама + кнопки. Всегда прибита к низу экрана,
          не участвует в прокрутке списка — стандартный паттерн bottom-nav. */}
      <div
        className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-line bg-surface/95 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <BusinessLoungeAd />
        <div className="flex gap-2 p-3">
          <button type="button" onClick={onLeave} className="btn btn-pill btn-danger-text">
            Завершить общение
          </button>
          <button type="button" onClick={onEditTopics} className="btn btn-pill btn-primary">
            Изменить темы
          </button>
        </div>
      </div>

      {ageSheetOpen && (
        <AgeFilterSheet
          value={activeAge}
          onSelect={(g) => {
            setActiveAge(g);
            setAgeSheetOpen(false);
          }}
          onClose={() => setAgeSheetOpen(false)}
        />
      )}
    </div>
  );
}
