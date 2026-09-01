'use client';

import { useEffect, useState, useCallback } from 'react';

export default function PeopleList({ me, onOpenUser, onLeave, onEditTopics }) {
  const [activeTab, setActiveTab] = useState('Все');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['Все', ...me.topics];

  const load = useCallback(async () => {
    const topicParam = activeTab === 'Все' ? '' : `&topic=${encodeURIComponent(activeTab)}`;
    try {
      const res = await fetch(`/api/list?id=${encodeURIComponent(me.id)}${topicParam}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // молча игнорируем разовую ошибку сети, следующий тик обновит список
    } finally {
      setLoading(false);
    }
  }, [activeTab, me.id]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold mb-1">Собеседники рядом</h1>
        <p className="text-sm text-slate-500">Вы: {me.name}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={
              'shrink-0 px-3 py-1.5 rounded-full text-sm border ' +
              (activeTab === t
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300')
            }
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
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
                <div className="font-medium">{u.name}</div>
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

      <div className="p-4 border-t flex gap-2">
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
  );
}
