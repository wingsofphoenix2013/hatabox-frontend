import { Button, Card, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function ProductionProductStepWorkCreateDrawer({ open, onClose, product }) {
  return (
    <Drawer
      title="Додати етап"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="Створення етапу">
          <Flex vertical gap={8}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              Режим продукту:{' '}
              {product?.work_tracking
                ? 'з переліком робіт'
                : 'без переліку робіт'}
            </Text>
          </Flex>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={onClose}>Закрити</Button>

          <Button type="primary" disabled>
            Створити етап
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductStepWorkCreateDrawer;
