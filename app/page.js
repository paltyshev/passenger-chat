'use client';

import { useEffect, useState } from 'react';
import RegisterForm from '@/components/RegisterForm';
import PeopleList from '@/components/PeopleList';
import ContactModal from '@/components/ContactModal';
import EditTopicsModal from '@/components/EditTopicsModal';

const STORAGE_KEY = 'pc_user';

export default function HomePage() {
  const [me, setMe] = useState(null); // {id, name, phone, topics}
  const [checking, setChecking] = useState(true);
  const [openedUser, setOpenedUser] = useState(null); // {id, name, phone}
  const [editingTopics, setEditingTopics] = useState(false);

  // При загрузке страницы проверяем, есть ли ещё активная сессия
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setChecking(false);
      return;
    }
    const saved = JSON.parse(raw);
    fetch(`/api/me?id=${encodeURIComponent(saved.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setMe({ ...saved, topics: data.user.topics });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  function handleRegistered(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setMe(user);
  }

  async function handleLeave() {
    if (!me) return;
    try {
      await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: me.id }),
      });
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      setMe(null);
    }
  }

  async function handleOpenUser(u) {
    try {
      const res = await fetch(`/api/reveal?id=${encodeURIComponent(u.id)}`);
      const data = await res.json();
      if (data.user) setOpenedUser(data.user);
    } catch {
      // если не получилось — просто не открываем модалку
    }
  }

  async function handleSaveTopics(topics) {
    await fetch('/api/update-topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: me.id, topics }),
    });
    const updated = { ...me, topics };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMe(updated);
    setEditingTopics(false);
  }

  if (checking) {
    return (
      <div className="p-6 text-sm text-slate-400">Загрузка...</div>
    );
  }

  if (!me) {
    return <RegisterForm onRegistered={handleRegistered} />;
  }

  return (
    <>
      <PeopleList
        me={me}
        onOpenUser={handleOpenUser}
        onLeave={handleLeave}
        onEditTopics={() => setEditingTopics(true)}
      />
      <ContactModal user={openedUser} onClose={() => setOpenedUser(null)} />
      {editingTopics && (
        <EditTopicsModal
          currentTopics={me.topics}
          onSave={handleSaveTopics}
          onClose={() => setEditingTopics(false)}
        />
      )}
    </>
  );
}
