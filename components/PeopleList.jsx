'use client';

import { useEffect, useState, useCallback } from 'react';
import { AGE_GROUPS } from '@/lib/ageGroups';
import BusinessLoungeAd from './BusinessLoungeAd';

// Высота нижней несворачиваемой панели (реклама + кнопки).
// Используется как отступ снизу у списка, чтобы контент не прятался под панель.
const BOTTOM_BAR_RESERVED_PX = 176;

export default function PeopleList({ me, onOpenUser, onLeave, onEditTopics }) {
  const [activeTopic, setActiveTopic] = useState('Все');
  const [activeAge, setActiveAge] = useState('Все');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const topicTabs = ['Все', ...me.topics];
  const ageTabs = ['Все', ...AGE_GROUPS];

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
    <div className="min-h-[100dvh] flex flex-col">
      {/* Шапка + фильтры — единый sticky-блок сверху */}
      <div className="sticky top-0 z-10 bg-white border-b shrink-0">
        <div className="px-4 pt-4 pb-1">
          <h1 className="text-lg font-semibold mb-1">Собеседники рядом</h1>
          <p className="text-sm text-slate-500">Вы: {me.name}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-2">
          {topicTabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              className={
                'shrink-0 px-3 py-1.5 rounded-full text-sm border ' +
                (activeTopic === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300')
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-3">
          {ageTabs.map((g) => (
            <button
              key={g}
              onClick={() => setActiveAge(g)}
              className={
                'shrink-0 px-2.5 py-1 rounded-full text-xs border ' +
                (activeAge === g
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500 border-slate-200')
              }
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Список — обычный поток документа, скроллится вместе со страницей.
          Нижний отступ освобождает место под фиксированную панель. */}
      <div
        className="flex-1 px-4 py-3"
        style={{ paddingBottom: `calc(${BOTTOM_BAR_RESERVED_PX}px + env(safe-area-inset-bottom))` }}
      >
        {loading && <p className="text-sm text-slate-400">Загрузка...</p>}
        {!loading && users.length === 0 && (
          <p className="text-sm text-slate-400">
            Пока никого нет. Список обновляется автоматически.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => onOpenUser(u)}
                className="w-full text-left border rounded-xl p-3 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{u.name}</div>
                  {u.ageGroup && (
                    <span className="shrink-0 text-[11px] text-slate-400">{u.ageGroup}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {u.topics.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Нижняя несворачиваемая панель: реклама + кнопки. Всегда прибита к низу экрана,
          не участвует в прокрутке списка — стандартный паттерн bottom-nav. */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 bg-white border-t shadow-[0_-2px_8px_rgba(0,0,0,0.04)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-md">
          <BusinessLoungeAd />
          <div className="flex gap-2 p-4">
            <button
              onClick={onLeave}
              className="flex-1 border border-red-300 text-red-600 rounded-lg py-2.5 text-sm font-medium"
            >
              Завершить общение
            </button>
            <button
              onClick={onEditTopics}
              className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2.5 text-sm font-medium"
            >
              Изменить темы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
