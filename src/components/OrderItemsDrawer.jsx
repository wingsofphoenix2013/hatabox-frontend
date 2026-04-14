import { Button, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function OrderItemsDrawer({ open, onClose, order }) {
  return (
    <Drawer
      title="Комплектація замовлення"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Text>
          Заглушка для екрана комплектації замовлення
          {order?.order_no ? ` № ${order.order_no}` : ''}
        </Text>

        <Flex justify="flex-end">
          <Button onClick={onClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderItemsDrawer;
