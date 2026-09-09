// Утилиты для ввода и валидации номеров телефонов РФ (+7 XXX XXX-XX-XX).
// Используются и на клиенте (маска ввода), и на сервере (валидация при регистрации).

export function formatRuPhone(digits) {
  let out = '+7';
  if (digits.length > 0) out += ' (' + digits.slice(0, 3);
  if (digits.length >= 3) out += ')';
  if (digits.length > 3) out += ' ' + digits.slice(3, 6);
  if (digits.length > 6) out += '-' + digits.slice(6, 8);
  if (digits.length > 8) out += '-' + digits.slice(8, 10);
  return out;
}

/**
 * Маска ввода номера телефона РФ.
 * prevValue — предыдущее значение поля (до этого нажатия), rawValue — новое сырое значение из input.
 *
 * Правила:
 * - первое нажатие "+" сразу подставляет код страны "+7 ", чтобы ввод "+" не выглядел как ничего не происходящее;
 * - ведущие "7" или "8" считаются кодом страны/старым префиксом и заменяются на "+7";
 * - если человек начинает сразу с "9" (номер мобильного без кода), код страны подставляется автоматически;
 * - максимум 10 цифр после кода страны.
 */
export function normalizePhoneInput(prevValue, rawValue) {
  if (prevValue === '' && rawValue === '+') return '+7 ';

  const digitsAll = rawValue.replace(/\D/g, '');
  if (!digitsAll) return '';

  let digits = digitsAll;
  if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
  digits = digits.slice(0, 10);

  return formatRuPhone(digits);
}

// Номер валиден, если после нормализации это код страны 7 + ровно 10 цифр номера.
export function isValidRuPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('7');
}
