// src/pages/WarehouseMovementRegisterPage.jsx

import { Flex, Typography } from 'antd';

const { Title, Text } = Typography;

function WarehouseMovementRegisterPage() {
  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={4}>
        <Title level={2} style={{ margin: 0 }}>
          Переміщення товарів
        </Title>

        <Text type="secondary">
          Реєстр планів переміщення товарів між локаціями та місцями зберігання.
        </Text>
      </Flex>
    </div>
  );
}

export default WarehouseMovementRegisterPage;
