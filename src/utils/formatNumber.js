export function formatQuantity(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return value;
  }

  return num.toString();
}
