import { Drawer } from 'antd';

function ProductionComponentCreateDrawer({ open, onClose }) {
  return (
    <Drawer
      title="Створення компонента"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      TODO
    </Drawer>
  );
}

export default ProductionComponentCreateDrawer;
