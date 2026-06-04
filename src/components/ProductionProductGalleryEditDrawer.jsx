import { Button, Card, Drawer, Flex, Typography } from 'antd';

const { Text } = Typography;

function ProductionProductGalleryEditDrawer({ open, onClose, attachment }) {
  return (
    <Drawer
      title="Редагувати файл"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Інформація про файл">
          <Text type="secondary">
            {attachment?.display_filename || attachment?.name || '—'}
          </Text>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={onClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryEditDrawer;
