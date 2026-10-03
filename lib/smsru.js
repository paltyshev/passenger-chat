// Клиент sms.ru для авторизации по звонку (callcheck).
// Документация: https://sms.ru/callcheck
// Ключ SMSRU_API_ID берётся ТОЛЬКО из переменных окружения сервера.

const BASE = 'https://sms.ru/callcheck';

// Статусы проверки (check_status)
export const CHECK_PENDING = 400; // звонка ещё не было
export const CHECK_CONFIRMED = 401; // номер подтверждён
export const CHECK_EXPIRED = 402; // время вышло / неверный check_id

function mockEnabled() {
  return process.env.CALLCHECK_MOCK === '1' && process.env.NODE_ENV !== 'production';
}

// "+7 (900) 123-45-67" -> "79001234567"
export function toSmsRuPhone(value) {
  return String(value || '').replace(/\D/g, '');
}

async function call(path, params) {
  const apiId = process.env.SMSRU_API_ID;
  if (!apiId) throw new Error('SMSRU_API_ID не задан');

  const qs = new URLSearchParams({ api_id: apiId, json: '1', ...params });
  // POST, чтобы api_id не попадал в URL-логи прокси
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs.toString(),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`sms.ru HTTP ${res.status}`);
  return res.json();
}

/**
 * Запускает проверку. Возвращает { checkId, callPhone, callPhonePretty }.
 * Бросает Error, если sms.ru вернул не 100.
 */
export async function startCallCheck(phone, ip) {
  if (mockEnabled()) {
    return {
      checkId: `mock-${Date.now()}`,
      callPhone: '78005550000',
      callPhonePretty: '+7 (800) 555-00-00',
    };
  }
  const params = { phone: toSmsRuPhone(phone) };
  if (ip) params.ip = ip;

  const data = await call('add', params);
  if (data.status !== 'OK' || Number(data.status_code) !== 100) {
    const err = new Error(`sms.ru add: ${data.status_code} ${data.status_text || ''}`);
    err.code = Number(data.status_code);
    throw err;
  }
  return {
    checkId: data.check_id,
    callPhone: data.call_phone,
    callPhonePretty: data.call_phone_pretty,
  };
}

/**
 * Возвращает числовой статус: 400 / 401 / 402.
 */
export async function getCallCheckStatus(checkId) {
  if (mockEnabled()) {
    // в dev-режиме подтверждаем через 6 секунд после старта
    const t = Number(String(checkId).split('-')[1]) || 0;
    return Date.now() - t > 6000 ? CHECK_CONFIRMED : CHECK_PENDING;
  }
  const data = await call('status', { check_id: checkId });
  if (data.status !== 'OK') {
    const err = new Error(`sms.ru status: ${data.status_code} ${data.status_text || ''}`);
    err.code = Number(data.status_code);
    throw err;
  }
  return Number(data.check_status);
}
