import ThemeToggle from './ThemeToggle';

// Общая шапка: фирменная полоса, логотип аэропорта, заголовок и переключатель темы справа.
export default function AppHeader({ title, subtitle }) {
  return (
    <header>
      <div className="h-1 bg-gradient-to-r from-brand to-accent" aria-hidden="true" />
      <div className="flex items-center gap-3 px-4 py-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 object-contain"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
