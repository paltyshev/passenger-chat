export default function BusinessLoungeAd() {
  return (
    <a
      href="https://gelaero.ru/services/business-lounge/"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 border-b border-ad-line bg-ad-bg px-4 py-2.5 transition-opacity active:opacity-80"
    >
      <span className="text-xl leading-none shrink-0" aria-hidden="true">
        ✈️
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-ad-fg">
          Бизнес-зал аэропорта Геленджик
        </span>
        <span className="block truncate text-[11px] text-ad-muted">
          Тишина и комфорт перед вылетом — подробнее об услуге
        </span>
      </span>
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-ad-muted">Реклама</span>
    </a>
  );
}
