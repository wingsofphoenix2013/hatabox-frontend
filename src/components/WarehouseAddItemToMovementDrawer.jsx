// src/components/WarehouseAddItemToMovementDrawer.jsx

import { Drawer, Typography } from 'antd';

const { Text } = Typography;

function WarehouseAddItemToMovementDrawer({ open, onClose, stockDetail }) {
  const header = stockDetail?.header || null;

  return (
    <Drawer
      title="Додати товар до переміщення"
      open={open}
      onClose={onClose}
      width={620}
    >
      <Text strong>{header?.inventory_item_name || 'Товар не обрано'}</Text>
    </Drawer>
  );
}

export default WarehouseAddItemToMovementDrawer;
