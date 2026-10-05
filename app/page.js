'use client';

import { useEffect, useState } from 'react';
import RegisterForm from '@/components/RegisterForm';
import PeopleList from '@/components/PeopleList';
import ContactModal from '@/components/ContactModal';
import EditProfileModal from '@/components/EditProfileModal';

const STORAGE_KEY = 'pc_user';

export default function HomePage() {
  const [me, setMe] = useState(null); // {id, name, phone, topics}
  const [checking, setChecking] = useState(true);
  const [openedUser, setOpenedUser] = useState(null); // {id, name, phone}
  const [editingProfile, setEditingProfile] = useState(false);

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
          setMe({ ...saved, topics: data.user.topics, bio: data.user.bio || '', avatarV: data.user.avatarV || null });
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

  // patch: { topics, bio, avatar?: dataURL, removeAvatar?: true }
  async function handleSaveProfile(patch) {
    const res = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: me.id, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || 'failed' };
    const updated = { ...me, topics: patch.topics, bio: data.bio, avatarV: data.avatarV };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMe(updated);
    setEditingProfile(false);
    return {};
  }

  if (checking) {
    return (
      <div className="grid min-h-[100dvh] place-items-center" role="status" aria-label="Загрузка">
        <span className="spinner" />
      </div>
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
        onEditProfile={() => setEditingProfile(true)}
      />
      <ContactModal user={openedUser} onClose={() => setOpenedUser(null)} />
      {editingProfile && (
        <EditProfileModal
          me={me}
          onSave={handleSaveProfile}
          onClose={() => setEditingProfile(false)}
        />
      )}
    </>
  );
}
