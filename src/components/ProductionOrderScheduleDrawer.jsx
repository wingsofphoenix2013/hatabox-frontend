import { Button, Card, Drawer, Flex, Tag, Typography } from 'antd';

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
            <Text type="secondary">Дані зʼявляться пізніше</Text>
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
