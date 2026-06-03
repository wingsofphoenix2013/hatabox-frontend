import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Button, Card, Drawer, Flex, Typography, Upload } from 'antd';

const { Text } = Typography;

const { Dragger } = Upload;

function ProductionProductGalleryCreateDrawer({ open, onClose }) {
  const [fileList, setFileList] = useState([]);

  const handleClose = () => {
    setFileList([]);
    onClose();
  };

  return (
    <Drawer
      title="Додати файли"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Додайте один або кілька файлів">
          <Dragger
            multiple
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList: nextFileList }) => {
              setFileList(nextFileList);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>

            <p className="ant-upload-text">
              Натисніть або перетягніть файли в цю область
            </p>

            <p className="ant-upload-hint">
              Можна додати один або кілька файлів.
            </p>
          </Dragger>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryCreateDrawer;
