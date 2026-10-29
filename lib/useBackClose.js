'use client';

import { useCallback, useEffect, useRef } from 'react';

// Оверлей (модалка, шторка, просмотр фото) как запись в истории браузера:
// системная «Назад» — кнопка или жест Android, свайп от края на iPhone —
// закрывает оверлей, а не уводит со страницы и не закрывает приложение.
//
// Вложенные оверлеи различаются глубиной в history.state: «Назад» закрывает
// только верхний. Состояние Next.js (__NA и т.п.) копируем, иначе роутер
// на popstate перезагрузит страницу.
//
// Возвращает close() — им закрывают оверлей из интерфейса (крестик, фон, Esc):
// он делает history.back(), а onClose вызывается уже из popstate.
export function useBackClose(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const depthRef = useRef(0); // глубина нашей записи; 0 — записи нет
  const activeRef = useRef(false);

  useEffect(() => {
    if (!open) return undefined;
    activeRef.current = true;
    // ref переживает двойной запуск эффекта в StrictMode — запись не задваивается
    if (!depthRef.current) {
      const depth = (window.history.state?.pcOverlay || 0) + 1;
      window.history.pushState({ ...window.history.state, pcOverlay: depth }, '');
      depthRef.current = depth;
    }
    const depth = depthRef.current;

    const onPop = () => {
      if ((window.history.state?.pcOverlay || 0) < depth) {
        depthRef.current = 0;
        onCloseRef.current();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      activeRef.current = false;
      // Оверлей закрыли не через «Назад» (например, после сохранения) —
      // убираем свою запись, чтобы следующее «Назад» не было «пустым».
      // Отложено: в StrictMode эффект сразу запускается снова.
      setTimeout(() => {
        if (!activeRef.current && depthRef.current) {
          depthRef.current = 0;
          window.history.back();
        }
      }, 0);
    };
  }, [open]);

  return useCallback(() => {
    if (depthRef.current) window.history.back();
    else onCloseRef.current();
  }, []);
}
