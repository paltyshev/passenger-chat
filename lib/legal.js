// Реквизиты и версии юридических документов. Единый источник для
// /privacy, /consent и формы регистрации.

export const OPERATOR = {
  name: 'ООО «АЭРОПОРТ ГЕЛЕНДЖИК»',
  inn: '2304072434',
  ogrn: '1172375094583',
  address: '353466, Россия, Краснодарский край, г. Геленджик, ул. Солнцедарская, д. 10',
  email: 'feedback@gelaero.ru',
};

// Лицо, осуществляющее обработку по поручению Оператора (проверка номера звонком).
// TODO: сверить реквизиты с договором/офертой, по которой заведён аккаунт на sms.ru.
export const PROCESSOR = {
  name: 'ООО «СМС.РУ»',
  inn: '7713461582',
  ogrn: '1187746809007',
  address: '127422, г. Москва, ул. Тимирязевская, д. 5/14',
  site: 'sms.ru',
};

export const SERVICE_URL = 'https://kover.gelaero.ru';

// Менять при любом изменении текста согласия: версия пишется в запись пользователя.
export const CONSENT_VERSION = '1.0';

export const OPERATOR_LINE = `${OPERATOR.name} (ИНН ${OPERATOR.inn}, ОГРН ${OPERATOR.ogrn}, адрес местонахождения: ${OPERATOR.address})`;
export const PROCESSOR_LINE = `${PROCESSOR.name} (ИНН ${PROCESSOR.inn}, ОГРН ${PROCESSOR.ogrn}, адрес: ${PROCESSOR.address}; сервис ${PROCESSOR.site})`;
