import { Button, Card, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function ProductionProductGalleryCreateDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Додати файли"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Завантаження файлів">
          <Text type="secondary">Дані зʼявляться пізніше</Text>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={onClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryCreateDrawer;
