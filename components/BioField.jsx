'use client';

import { BIO_MAX } from '@/lib/bio';

export default function BioField({ id = 'pc-bio', value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-muted">
        О себе <span className="font-normal text-subtle">(необязательно)</span>
      </label>
      <textarea
        id={id}
        className="field resize-none"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, BIO_MAX))}
        placeholder="Например: лечу в Москву, люблю путешествия и хорошие фильмы"
        maxLength={BIO_MAX}
      />
      <p className="text-right text-xs text-subtle">
        {value.length}/{BIO_MAX} · без ссылок и номеров телефонов
      </p>
    </div>
  );
}
