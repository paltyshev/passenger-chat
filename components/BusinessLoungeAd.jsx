export default function BusinessLoungeAd() {
  return (
    <a
      href="https://gelaero.ru/services/business-lounge/"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-100 active:bg-amber-100"
    >
      <span className="text-xl leading-none shrink-0" aria-hidden="true">
        ✈️
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs font-medium text-amber-900 truncate">
          Бизнес-зал аэропорта Геленджик
        </span>
        <span className="block text-[11px] text-amber-700 truncate">
          Тишина и комфорт перед вылетом — подробнее об услуге
        </span>
      </span>
      <span className="text-[10px] uppercase tracking-wide text-amber-500 shrink-0">
        Реклама
      </span>
    </a>
  );
}
