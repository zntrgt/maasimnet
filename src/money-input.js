const INTEGER_FORMATTER = new Intl.NumberFormat('tr-TR', {
  useGrouping: true,
  maximumFractionDigits: 0
});

export function parseTurkishMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value ?? '').trim().replace(/[\s₺]/g, '');
  if (!raw) return 0;

  let integerDigits = '';
  let decimalDigits = '';

  if (raw.includes(',')) {
    const commaIndex = raw.lastIndexOf(',');
    integerDigits = raw.slice(0, commaIndex).replace(/\D/g, '');
    decimalDigits = raw.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2);
  } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    integerDigits = raw.replace(/\D/g, '');
  } else if (/^\d+\.\d{1,2}$/.test(raw)) {
    const dotIndex = raw.lastIndexOf('.');
    integerDigits = raw.slice(0, dotIndex).replace(/\D/g, '');
    decimalDigits = raw.slice(dotIndex + 1).replace(/\D/g, '').slice(0, 2);
  } else {
    integerDigits = raw.replace(/\D/g, '');
  }

  if (!integerDigits && !decimalDigits) return 0;

  const normalized = `${integerDigits || '0'}${decimalDigits ? `.${decimalDigits}` : ''}`;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatTurkishMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';

  return new Intl.NumberFormat('tr-TR', {
    useGrouping: true,
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(number);
}

export function normalizeTurkishMoneyInput(value) {
  const raw = String(value ?? '').replace(/[\s₺]/g, '');
  if (!raw) return Object.freeze({ displayValue: '', numericValue: 0 });

  const commaIndex = raw.lastIndexOf(',');
  const hasComma = commaIndex >= 0;
  let integerDigits = '';
  let decimalDigits = '';
  let hasDecimalSeparator = false;

  if (hasComma) {
    integerDigits = raw.slice(0, commaIndex).replace(/\D/g, '');
    decimalDigits = raw.slice(commaIndex + 1).replace(/\D/g, '').slice(0, 2);
    hasDecimalSeparator = true;
  } else if (/^\d+\.\d{1,2}$/.test(raw) && !/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    const dotIndex = raw.lastIndexOf('.');
    integerDigits = raw.slice(0, dotIndex).replace(/\D/g, '');
    decimalDigits = raw.slice(dotIndex + 1).replace(/\D/g, '').slice(0, 2);
    hasDecimalSeparator = true;
  } else {
    integerDigits = raw.replace(/\D/g, '');
  }

  if (!integerDigits && !hasDecimalSeparator) {
    return Object.freeze({ displayValue: '', numericValue: 0 });
  }

  const normalizedInteger = integerDigits.replace(/^0+(?=\d)/, '') || '0';
  const groupedInteger = INTEGER_FORMATTER.format(Number(normalizedInteger));
  const displayValue = hasDecimalSeparator
    ? `${groupedInteger},${decimalDigits}`
    : groupedInteger;
  const numericValue = Number(`${normalizedInteger}${decimalDigits ? `.${decimalDigits}` : ''}`);

  return Object.freeze({
    displayValue,
    numericValue: Number.isFinite(numericValue) ? numericValue : 0
  });
}

export function formatMoneyInputElement(input) {
  if (!input || typeof input.value !== 'string') return 0;

  const selectionStart = typeof input.selectionStart === 'number'
    ? input.selectionStart
    : input.value.length;
  const digitsBeforeCursor = (input.value.slice(0, selectionStart).match(/\d/g) || []).length;
  const normalized = normalizeTurkishMoneyInput(input.value);

  input.value = normalized.displayValue;
  input.dataset.rawValue = String(normalized.numericValue);

  if (typeof input.setSelectionRange === 'function') {
    let cursor = input.value.length;
    let seenDigits = 0;

    for (let index = 0; index < input.value.length; index += 1) {
      if (/\d/.test(input.value[index])) seenDigits += 1;
      if (seenDigits >= digitsBeforeCursor) {
        cursor = index + 1;
        break;
      }
    }

    if (digitsBeforeCursor === 0) cursor = 0;
    input.setSelectionRange(cursor, cursor);
  }

  return normalized.numericValue;
}
