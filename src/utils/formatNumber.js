export function formatQuantity(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return value;
  }

  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(num);
}
