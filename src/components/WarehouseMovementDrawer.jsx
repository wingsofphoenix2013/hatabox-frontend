// src/components/WarehouseMovementDrawer.jsx

import { Drawer, Flex, Card, Alert, Typography } from 'antd';

const { Text } = Typography;

function WarehouseMovementDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Створення плану переміщення"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Card title="1. Дані плану переміщення">
          <Alert
            type="info"
            showIcon
            message="Форма створення плану переміщення буде додана пізніше."
          />

          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Тут буде вибір локації або місця зберігання, запланованої дати,
              коментаря та позицій для переміщення.
            </Text>
          </div>
        </Card>
      </Flex>
    </Drawer>
  );
}

export default WarehouseMovementDrawer;
