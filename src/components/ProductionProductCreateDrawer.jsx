import { Button, Card, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function ProductionProductCreateDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Створити новий продукт"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Основна інформація">
          <Text type="secondary">Дані зʼявляться пізніше</Text>
        </Card>

        <Flex justify="space-between">
          <Button onClick={onClose}>Закрити</Button>

          <Button type="primary" disabled>
            Створити продукт
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductCreateDrawer;
