/** @type {import('tailwindcss').Config} */
// Цвета берутся из CSS-переменных (см. app/globals.css), поэтому светлая и тёмная
// темы переключаются без префиксов dark: в разметке.
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: c('canvas'),
        surface: c('surface'),
        surface2: c('surface2'),
        line: c('line'),
        fg: c('fg'),
        muted: c('muted'),
        subtle: c('subtle'),
        link: c('link'),
        brand: { DEFAULT: c('brand'), fg: c('brand-fg') },
        accent: { DEFAULT: c('accent'), strong: c('accent-strong') },
        danger: { DEFAULT: c('danger'), bg: c('danger-bg'), line: c('danger-line') },
        ad: { bg: c('ad-bg'), line: c('ad-line'), fg: c('ad-fg'), muted: c('ad-muted') },
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        sheetIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn .18s ease-out',
        'sheet-in': 'sheetIn .22s ease-out',
      },
    },
  },
  plugins: [],
};
