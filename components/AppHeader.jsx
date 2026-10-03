import ThemeToggle from './ThemeToggle';

// Общая шапка: фирменная полоса, значок, заголовок и переключатель темы справа.
export default function AppHeader({ title, subtitle }) {
  return (
    <header>
      <div className="h-1 bg-gradient-to-r from-brand to-accent" aria-hidden="true" />
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent text-white shadow-sm"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
