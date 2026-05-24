import { Button, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function ProductionOrderStepFinishedDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Завершення етапу"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Text type="secondary">Дані зʼявляться пізніше</Text>

        <Flex justify="space-between" gap={8}>
          <Button onClick={onClose}>Закрити</Button>
          <Button type="primary">Зберегти зміни</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionOrderStepFinishedDrawer;
