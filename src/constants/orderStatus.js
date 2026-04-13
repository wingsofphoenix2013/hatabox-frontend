export const PAYMENT_STATUS_LABELS = {
  draft: 'Чернетка',
  approved: 'Погоджено',
  paid: 'Сплачено',
  cancelled: 'Скасовано',
};

export const getPaymentStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'approved':
      return 'processing';
    case 'paid':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

export const getProgressStrokeColor = (percent, isOverdue = false) => {
  if (isOverdue) return '#ff4d4f';

  if (percent === 0) return '#bfbfbf';
  if (percent <= 24) return '#d9f7be';
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a';
};

export const getAvailablePaymentStatusOptions = (status) => {
  switch (status) {
    case 'draft':
      return [
        { value: 'draft', label: 'Чернетка' },
        { value: 'approved', label: 'Погоджено' },
      ];
    case 'approved':
      return [
        { value: 'approved', label: 'Погоджено' },
        { value: 'paid', label: 'Сплачено' },
      ];
    case 'paid':
      return [{ value: 'paid', label: 'Сплачено' }];
    case 'cancelled':
      return [{ value: 'cancelled', label: 'Скасовано' }];
    default:
      return [];
  }
};
