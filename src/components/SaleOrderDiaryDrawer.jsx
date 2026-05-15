import { Drawer, Typography } from 'antd';

const { Text } = Typography;

function SaleOrderDiaryDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Щоденник виробництва"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Text type="secondary">Дані з’являться пізніше.</Text>
    </Drawer>
  );
}

export default SaleOrderDiaryDrawer;
