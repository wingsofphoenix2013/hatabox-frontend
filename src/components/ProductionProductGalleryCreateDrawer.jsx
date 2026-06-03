import { DeleteOutlined, InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Button, Card, Drawer, Flex, Tooltip, Typography, Upload } from 'antd';

const { Text } = Typography;

const { Dragger } = Upload;

function ProductionProductGalleryCreateDrawer({ open, onClose }) {
  const [fileList, setFileList] = useState([]);
  const [uploadMode, setUploadMode] = useState(null);
  const [hoveredFileUid, setHoveredFileUid] = useState(null);

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
        <Card
          title={
            uploadMode
              ? fileList.length === 1
                ? '1. Файл для завантаження'
                : '1. Файли для завантаження'
              : '1. Додайте один або кілька файлів'
          }
        >
          <Flex vertical gap={12}>
            {!uploadMode && (
              <Dragger
                multiple
                beforeUpload={() => false}
                style={{ marginBottom: 12 }}
                fileList={fileList}
                onChange={({ fileList: nextFileList }) => {
                  setFileList(nextFileList);
                  setUploadMode(null);
                  setHoveredFileUid(null);
                }}
                itemRender={(_, file, __, actions) => (
                  <Flex
                    justify="space-between"
                    align="center"
                    gap={12}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #f0f0f0',
                      borderRadius: 6,
                      background:
                        hoveredFileUid === file.uid ? '#fafafa' : '#ffffff',
                    }}
                    onMouseEnter={() => setHoveredFileUid(file.uid)}
                    onMouseLeave={() => setHoveredFileUid(null)}
                  >
                    <Text
                      style={{
                        minWidth: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={file.name}
                    >
                      {file.name}
                    </Text>

                    {!(uploadMode === 'single' && fileList.length === 1) && (
                      <DeleteOutlined
                        style={{
                          color:
                            hoveredFileUid === file.uid ? '#ff4d4f' : '#595959',
                          cursor: 'pointer',
                          flex: '0 0 auto',
                        }}
                        onClick={() => actions.remove()}
                      />
                    )}
                  </Flex>
                )}
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
            )}
          </Flex>
        </Card>

        {uploadMode && (
          <>
            <Card title="2">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="3">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </>
        )}

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose}>Закрити</Button>

          {!uploadMode ? (
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
          ) : (
            <Button type="primary">Завантажити</Button>
          )}
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryCreateDrawer;
