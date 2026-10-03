import Link from 'next/link';

export function LegalDoc({ title, children, embedded = false }) {
  const body = 'p-5 pb-12 text-sm leading-relaxed text-fg [&_a]:text-link [&_a]:underline-offset-2';

  // В модальном окне (перехваченный маршрут): без шапки и ссылки «назад» — закрытие делает LegalModal
  if (embedded) {
    return (
      <div className={body}>
        <h1 className="mb-2 text-lg font-semibold">{title}</h1>
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="h-1 bg-gradient-to-r from-brand to-accent" aria-hidden="true" />
      <main className={body}>
        <Link href="/" className="text-xs text-link underline underline-offset-2">
          ← К сервису
        </Link>
        <h1 className="mb-2 mt-3 text-lg font-semibold">{title}</h1>
        {children}
      </main>
    </>
  );
}

export function Sec({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

// Нумерованный пункт: <P n="1.1.">текст</P>
export function P({ n, children }) {
  return (
    <p>
      {n && <span className="text-subtle">{n} </span>}
      {children}
    </p>
  );
}

// Пункты вида [['2.1.', 'текст'], ...]
export function Items({ list }) {
  return list.map(([n, text]) => (
    <P key={n} n={n}>
      {text}
    </P>
  ));
}

export function Ul({ items }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

export function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-line text-left align-top">
        <thead className="bg-surface2">
          <tr>
            {head.map((h) => (
              <th key={h} className="border border-line p-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border border-line p-2 align-top">
                  {Array.isArray(c) ? <Ul items={c} /> : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
