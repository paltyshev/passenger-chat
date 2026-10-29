'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackClose } from '@/lib/useBackClose';

// Открытие и закрытие — одно и то же движение, только в разные стороны
const MOTION_MS = 300;
const EASE_IN_OUT = 'cubic-bezier(.4, 0, .2, 1)';
const EASE_OUT = 'cubic-bezier(.2, .9, .25, 1)'; // «пружина» после короткого свайпа
const DISMISS_PX = 90; // насколько протянуть фото вверх/вниз, чтобы закрыть
const FINAL_RADIUS = '4%';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Сдвиг и масштаб, переводящие фото из итоговой рамки в рамку аватарки.
// Рамку меряем без transform — иначе после свайпа цель считалась бы от сдвинутого фото.
function toOrigin(frame, originEl) {
  const o = originEl?.getBoundingClientRect();
  if (!o || !o.width) return null;
  const prev = frame.style.transform;
  frame.style.transform = 'none';
  const f = frame.getBoundingClientRect();
  frame.style.transform = prev;
  const dx = o.left + o.width / 2 - (f.left + f.width / 2);
  const dy = o.top + o.height / 2 - (f.top + f.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${o.width / f.width})`;
}

// Просмотр аватарки во весь экран: фото «вырастает» из кружка аватарки
// и возвращается в него при закрытии. Закрыть — тап, свайп вверх/вниз,
// крестик, Esc или системная «Назад».
// placeholder — маленькая копия (уже в кэше), показывается, пока грузится src.
export default function PhotoViewer({ src, placeholder, alt, originRef, onClosed }) {
  const backdropRef = useRef(null);
  const frameRef = useRef(null);
  const chromeRef = useRef(null);
  const closingRef = useRef(false);
  const drag = useRef(null); // { y, dy, moved }
  const [loaded, setLoaded] = useState(false);

  const animateClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const frame = frameRef.current;
    const duration = reducedMotion() ? 1 : MOTION_MS;
    const from = getComputedStyle(frame).transform;
    // закрыли посреди открытия или «пружины» — продолжаем с текущего места
    frame.getAnimations().forEach((a) => a.cancel());
    const target = toOrigin(frame, originRef.current);
    const opts = { duration, easing: EASE_IN_OUT, fill: 'forwards' };

    chromeRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration / 2, fill: 'forwards' });
    backdropRef.current.animate(
      [{ opacity: getComputedStyle(backdropRef.current).opacity }, { opacity: 0 }],
      opts
    );
    const anim = frame.animate(
      target
        ? [
            { transform: from, borderRadius: FINAL_RADIUS },
            { transform: target, borderRadius: '50%' },
          ]
        : [
            { transform: from, opacity: 1 },
            { transform: `${from === 'none' ? '' : from} scale(.85)`, opacity: 0 },
          ],
      opts
    );
    anim.onfinish = () => onClosed();
  }, [originRef, onClosed]);

  const close = useBackClose(true, animateClose);

  // Открытие: до первой отрисовки ставим фото на место аватарки и растим его
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const origin = originRef.current;
    const duration = reducedMotion() ? 1 : MOTION_MS;
    const start = toOrigin(frame, origin);
    const opts = { duration, easing: EASE_IN_OUT };

    if (origin) origin.style.visibility = 'hidden'; // «оригинал» улетел в просмотр
    const backdropAnim = backdropRef.current.animate([{ opacity: 0 }, { opacity: 1 }], opts);
    // зеркально закрытию: при закрытии шапка гаснет в первой половине, здесь — появляется во второй
    const chromeAnim = chromeRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration / 2, delay: duration / 2, fill: 'backwards' });
    const frameAnim = frame.animate(
      start
        ? [
            { transform: start, borderRadius: '50%' },
            { transform: 'none', borderRadius: FINAL_RADIUS },
          ]
        : [
            { transform: 'scale(.85)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
      opts
    );
    return () => {
      // В StrictMode эффект запускается дважды: без отмены второй замер
      // попадал на уже уменьшенное первой анимацией фото, сдвиг получался
      // нулевым — и фото вырастало из центра, а не из аватарки.
      [backdropAnim, chromeAnim, frameAnim].forEach((a) => a?.cancel());
      if (origin) origin.style.visibility = '';
    };
  }, [originRef]);

  // Esc и блокировка прокрутки страницы под просмотром
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [close]);

  // Свайп вверх/вниз: фото едет за пальцем, фон бледнеет
  function onPointerDown(e) {
    if (closingRef.current || e.target.closest('button')) return;
    drag.current = { y: e.clientY, dy: 0, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    d.dy = e.clientY - d.y;
    if (Math.abs(d.dy) > 6) d.moved = true;
    if (!d.moved) return;
    const k = Math.min(Math.abs(d.dy) / 400, 1);
    frameRef.current.style.transform = `translateY(${d.dy}px) scale(${1 - k * 0.15})`;
    backdropRef.current.style.opacity = String(1 - k * 0.8);
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || closingRef.current) return;
    // тап без сдвига или достаточно длинный свайп — закрываем
    if (!d.moved || Math.abs(d.dy) > DISMISS_PX) {
      close();
      return;
    }
    // не дотянули — фото пружинит обратно
    const frame = frameRef.current;
    const backdrop = backdropRef.current;
    const opts = { duration: 220, easing: EASE_OUT };
    frame.animate([{ transform: frame.style.transform }, { transform: 'none' }], opts);
    backdrop.animate([{ opacity: backdrop.style.opacity }, { opacity: 1 }], opts);
    frame.style.transform = '';
    backdrop.style.opacity = '';
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Фото: ${alt}` : 'Фото'}
      className="fixed inset-0 z-[70] touch-none select-none"
      // портал не мешает событиям React всплывать к родительской модалке
      onClick={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={backdropRef} className="absolute inset-0 bg-black/90" aria-hidden="true" />

      <div className="absolute inset-0 grid place-items-center p-3">
        <div
          ref={frameRef}
          className="relative aspect-square w-full max-w-[min(42rem,calc(100dvh-10rem))] overflow-hidden bg-surface2 shadow-2xl will-change-transform"
          style={{ borderRadius: FINAL_RADIUS }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={placeholder} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt || ''}
            onLoad={() => setLoaded(true)}
            draggable={false}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      </div>

      <div
        ref={chromeRef}
        className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pb-6 pt-3 text-white"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
          background: 'linear-gradient(to bottom, rgba(0,0,0,.45), transparent)',
        }}
      >
        <p className="min-w-0 flex-1 truncate text-base font-medium">{alt}</p>
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть фото"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 active:bg-white/25"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
