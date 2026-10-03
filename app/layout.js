import './globals.css';

export const metadata = {
  title: 'Собеседник в аэропорту',
  description: 'Найдите попутчика для разговора в зоне ожидания',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121e2b' },
  ],
};

// Применяет сохранённый ручной выбор темы до первой отрисовки (без вспышки).
// Если выбора нет — работает системная тема через prefers-color-scheme.
const THEME_INIT = `try{var t=localStorage.getItem('pc_theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen">
        <div className="mx-auto min-h-screen max-w-md bg-surface shadow-sm sm:border-x sm:border-line">
          {children}
        </div>
      </body>
    </html>
  );
}
