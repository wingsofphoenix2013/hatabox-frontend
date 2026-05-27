import { useState } from 'react';
import { Button, Card, Drawer, Flex, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const getAttachmentType = (file) => {
  const type = String(file?.type || '').toLowerCase();

  if (type.startsWith('image/')) return 'photo';
  if (type.startsWith('video/')) return 'video';

  return null;
};

function OrderReclamationPhotoDrawer({ open, onClose, reclamation, onSaved }) {
  const [fileList, setFileList] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleCloseDrawer = () => {
    setFileList([]);
    onClose();
  };

  const handleSave = async () => {
    const libraryId = reclamation?.library?.id;

    if (!libraryId) {
      message.error('Бібліотеку фотофіксації не знайдено.');
      return;
    }

    if (fileList.length === 0) {
      message.error('Додайте фото або відео.');
      return;
    }

    const invalidFile = fileList.find(
      (item) => !getAttachmentType(item.originFileObj),
    );

    if (invalidFile) {
      message.error('Дозволено завантажувати лише фото або відео.');
      return;
    }

    try {
      setSaving(true);

      await Promise.all(
        fileList.map((item) => {
          const file = item.originFileObj;
          const payload = new FormData();

          payload.append('library', libraryId);
          payload.append('attachment_type', getAttachmentType(file));
          payload.append('file', file);

          return api.post('reclamation-return-library-items/', payload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        }),
      );

      message.success('Фотофіксацію збережено.');

      if (onSaved) {
        await onSaved();
      }

      handleCloseDrawer();
    } catch (err) {
      console.error('Failed to upload reclamation files:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'library',
        'attachment_type',
        'file',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти фотофіксацію.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Фотофіксація"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="Додати фотографії або відео">
          <Dragger
            multiple
            beforeUpload={() => false}
            fileList={fileList}
            onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
            accept="image/*,video/*"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              Перетягніть файли сюди або натисніть для вибору
            </p>
            <p className="ant-upload-hint">
              Можна додати фотографії або відео.
            </p>
          </Dragger>
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Button
            type="primary"
            loading={saving}
            disabled={fileList.length === 0}
            onClick={handleSave}
          >
            Зберегти фотофіксацію
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderReclamationPhotoDrawer;
