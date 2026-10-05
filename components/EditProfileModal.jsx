'use client';

import { useEffect, useRef, useState } from 'react';
import { TOPICS } from '@/lib/topics';
import { avatarUrl } from '@/lib/avatarClient';
import AvatarPicker from './AvatarPicker';
import BioField from './BioField';

// «Мой профиль»: фото, «о себе» и темы в одной шторке.
// onSave(patch) -> { error? }
export default function EditProfileModal({ me, onSave, onClose }) {
  const [topics, setTopics] = useState(me.topics);
  const [bio, setBio] = useState(me.bio || '');
  const [avatar, setAvatar] = useState(''); // новое фото (data URL)
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const currentSrc = removeAvatar ? '' : avatar || avatarUrl(me.id, me.avatarV);

  function toggle(t) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function handleSave() {
    if (topics.length === 0) return;
    setError('');
    setSaving(true);
    try {
      const patch = { topics, bio };
      if (avatar) patch.avatar = avatar;
      else if (removeAvatar) patch.removeAvatar = true;
      const { error: err } = await onSave(patch);
      if (err) {
        setError(
          err === 'bio_contacts'
            ? 'В «О себе» нельзя указывать ссылки и номера телефонов'
            : err === 'invalid_avatar'
              ? 'Не удалось загрузить фото, выберите другое'
              : 'Не удалось сохранить, попробуйте ещё раз'
        );
      }
    } catch {
      setError('Ошибка сети, попробуйте ещё раз');
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
        aria-labelledby="profile-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full animate-sheet-in overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 shadow-2xl outline-none sm:max-w-sm sm:rounded-2xl sm:border"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <h2 id="profile-title" className="mb-4 text-lg font-semibold">
          Мой профиль
        </h2>

        <div className="mb-5">
          <AvatarPicker
            src={currentSrc}
            onPick={(d) => {
              setAvatar(d);
              setRemoveAvatar(false);
            }}
            onRemove={() => {
              setAvatar('');
              setRemoveAvatar(true);
            }}
          />
        </div>

        <div className="mb-5">
          <BioField id="pc-bio-edit" value={bio} onChange={setBio} />
        </div>

        <p className="mb-2 text-sm font-medium text-muted">Темы для общения</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button key={t} type="button" onClick={() => toggle(t)} aria-pressed={topics.includes(t)} className="chip">
              {t}
            </button>
          ))}
        </div>
        {topics.length === 0 && <p className="mb-3 text-xs text-danger">Выберите хотя бы одну тему.</p>}
        {error && (
          <p role="alert" className="alert-error mb-3">
            {error}
          </p>
        )}

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-outline">
            Отмена
          </button>
          <button type="button" onClick={handleSave} disabled={saving || topics.length === 0} className="btn btn-primary">
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
