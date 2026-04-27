export const MOVEMENT_PLAN_STATUS_LABELS = {
  draft: 'Чернетка',
  active: 'Активний',
  executed: 'Виконано',
  cancelled: 'Скасовано',
};

export const getMovementPlanStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'active':
      return 'processing';
    case 'executed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};
