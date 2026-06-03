import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Button, Card, Drawer, Flex, Tooltip, Typography, Upload } from 'antd';

const { Text } = Typography;

const { Dragger } = Upload;

function ProductionProductGalleryCreateDrawer({ open, onClose }) {
  const [fileList, setFileList] = useState([]);
  const [uploadMode, setUploadMode] = useState(null);

  const handleClose = () => {
    setFileList([]);
    setUploadMode(null);
    onClose();
  };

  const handleNextStep = () => {
    if (fileList.length === 0) {
      return;
    }

    setUploadMode(fileList.length === 1 ? 'single' : 'bulk');
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
          <Flex vertical gap={12}>
            <Dragger
              multiple
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: nextFileList }) => {
                setFileList(nextFileList);
                setUploadMode(null);
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
          </Flex>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose}>Закрити</Button>

          <Tooltip
            title={
              fileList.length === 0
                ? 'Для наступного кроку потрібно додати хоча б один файл.'
                : ''
            }
          >
            <Button
              type="primary"
              disabled={fileList.length === 0}
              onClick={handleNextStep}
            >
              Наступний крок
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryCreateDrawer;
