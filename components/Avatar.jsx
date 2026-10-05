'use client';

import { useState } from 'react';

// Круглый аватар: фото, если есть, иначе первая буква имени.
export default function Avatar({ name, src, className = 'h-11 w-11 text-lg' }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full bg-surface2 object-cover`}
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className={`${className} grid shrink-0 place-items-center rounded-full bg-brand/15 font-semibold text-link`}
      aria-hidden="true"
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
