import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Flex,
  Tag,
  Typography,
} from 'antd';

import { formatDateDisplay } from '../utils/orderFormatters';

const { Text } = Typography;

const getStepStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'purple';
    case 'finished':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

function ProductionOrderScheduleDrawer({ open, onClose, steps = [] }) {
  return (
    <Drawer
      title="Налаштування графіку виробництва"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        {steps.map((step) => (
          <Card
            key={step.production_order_step}
            title={
              <Flex justify="space-between" align="center" gap={12}>
                <span>
                  {step.source_product_step || '—'}. {step.name || '—'}
                </span>

                <Tag
                  color={getStepStatusTagColor(step.status)}
                  style={{ marginInlineEnd: 0 }}
                >
                  {step.status_display || step.status || '—'}
                </Tag>
              </Flex>
            }
          >
            {['draft', 'cancelled'].includes(step.status) ? (
              <Alert
                type="warning"
                showIcon
                message="Налаштування дати закінчення етапу можливе лише для підтверджених етапів!"
              />
            ) : (
              <Descriptions
                bordered
                size="small"
                column={1}
                items={[
                  {
                    key: 'expected_finished_at',
                    label: 'Дата закінчення етапу',
                    children: step.expected_finished_at
                      ? formatDateDisplay(step.expected_finished_at)
                      : '—',
                  },
                ]}
              />
            )}
          </Card>
        ))}

        <Flex justify="space-between" gap={8}>
          <Button onClick={onClose}>Закрити</Button>

          <Button type="primary">Зберегти зміни</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionOrderScheduleDrawer;
