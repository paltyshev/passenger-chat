'use client';

export default function ContactModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-1">{user.name}</h2>
        <a
          href={`tel:${user.phone.replace(/[^\d+]/g, '')}`}
          className="block text-2xl font-mono mb-4 text-slate-900 hover:text-slate-700 underline underline-offset-4"
        >
          {user.phone}
        </a>

        <div className="text-sm text-slate-600 flex flex-col gap-2 mb-5">
          <p>Чтобы начать общение:</p>
          <ol className="list-decimal list-inside flex flex-col gap-1">
            <li>Сохраните этот номер в контакты телефона.</li>
            <li>
              Откройте MAX, Telegram или другой мессенджер — контакт появится там автоматически.
            </li>
            <li>Напишите первым, представьтесь и укажите тему для разговора.</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-medium"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
