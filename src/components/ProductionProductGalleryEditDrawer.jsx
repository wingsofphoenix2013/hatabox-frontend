import {
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Button, Card, Drawer, Flex, Input, Typography } from 'antd';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function ProductionProductGalleryEditDrawer({ open, onClose, attachment }) {
  const fileName = String(attachment?.file || '')
    .split('?')[0]
    .toLowerCase();

  const isImage =
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp') ||
    fileName.endsWith('.gif');

  const getAttachmentIcon = () => {
    if (fileName.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ fontSize: 64, color: '#595959' }} />;
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileWordOutlined style={{ fontSize: 64, color: '#595959' }} />;
    }

    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return <FileExcelOutlined style={{ fontSize: 64, color: '#595959' }} />;
    }

    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return <FilePptOutlined style={{ fontSize: 64, color: '#595959' }} />;
    }

    if (
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.webm')
    ) {
      return <PlayCircleOutlined style={{ fontSize: 64, color: '#595959' }} />;
    }

    return null;
  };

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
        <Card title="1. Файл">
          <Flex vertical gap={10} align="center">
            <Flex
              justify="center"
              align="center"
              style={{
                width: '100%',
                minHeight: 260,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
                overflow: 'hidden',
              }}
            >
              {isImage ? (
                <img
                  src={attachment?.file}
                  alt={attachment?.name || ''}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 420,
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                getAttachmentIcon()
              )}
            </Flex>

            <Text>{attachment?.display_filename || '—'}</Text>
          </Flex>
        </Card>

        <Card title="2. Назва та опис">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Назва</Text>

              <Input placeholder="Назва файла" />
            </div>

            <div>
              <Text style={compactLabelStyle}>Опис</Text>

              <Input.TextArea rows={4} placeholder="Опис файла" />
            </div>
          </Flex>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={onClose}>Закрити</Button>

          <Button type="primary">Зберегти</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductGalleryEditDrawer;
