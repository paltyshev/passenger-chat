import './globals.css';

export const metadata = {
  title: 'Собеседник в аэропорту',
  description: 'Найдите попутчика для разговора в зоне ожидания',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="bg-slate-50 min-h-screen text-slate-900">
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  );
}
