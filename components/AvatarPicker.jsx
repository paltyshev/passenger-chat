'use client';

import { useRef, useState } from 'react';
import { fileToAvatarDataUrl } from '@/lib/avatarClient';

// Выбор фото: на телефоне системный диалог предложит камеру или галерею.
export default function AvatarPicker({ src, onPick, onRemove }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // чтобы можно было выбрать тот же файл повторно
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onPick(await fileToAvatarDataUrl(file));
    } catch {
      setError('Не удалось обработать фото, попробуйте другое');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={src ? 'Изменить фото' : 'Добавить фото'}
        className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-dashed border-line bg-surface2 text-muted transition-colors hover:border-brand/60"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-surface/70">
            <span className="spinner !h-5 !w-5" />
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="flex items-center gap-4 text-sm">
        <button type="button" onClick={() => inputRef.current?.click()} className="text-link underline underline-offset-2">
          {src ? 'Изменить фото' : 'Добавить фото'}
        </button>
        {src && (
          <button type="button" onClick={onRemove} className="text-muted underline underline-offset-2">
            Убрать
          </button>
        )}
      </div>
      {/* <p className="text-center text-xs text-subtle">Необязательно. Лучше своё фото — так проще узнать друг друга.</p> */}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
