import { useEffect, useState } from 'react';
import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  Tooltip,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;
const { TextArea } = Input;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function StoragePlaceEditDrawer({ open, onClose, storagePlace, onUpdated }) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [editingComment, setEditingComment] = useState(false);

  const [savingField, setSavingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (open) {
      setName(storagePlace?.name || '');
      setComment(storagePlace?.comment || '');
      setEditingName(false);
      setEditingComment(false);
      setSavingField(null);
      setHasChanges(false);
    }
  }, [open, storagePlace]);

  const handleSaveField = async (fieldName) => {
    try {
      setSavingField(fieldName);

      const payload =
        fieldName === 'name'
          ? { name }
          : {
              comment,
            };

      await api.patch(`storage-places/${storagePlace.id}/`, payload);

      message.success(
        fieldName === 'name' ? 'Назву збережено.' : 'Опис збережено.',
      );

      setHasChanges(true);

      if (fieldName === 'name') {
        setEditingName(false);
      }

      if (fieldName === 'comment') {
        setEditingComment(false);
      }
    } catch (err) {
      console.error('Failed to update storage place:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        fieldName,
      ]);

      message.error(backendMessage || 'Не вдалося зберегти зміни.');
    } finally {
      setSavingField(null);
    }
  };

  const handleCloseDrawer = async () => {
    if (hasChanges && onUpdated) {
      await onUpdated();
    }

    onClose();
  };

  return (
    <Drawer
      title="Налаштування місця зберігання"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
      maskClosable={false}
      keyboard={false}
    >
      <Flex vertical gap={16}>
        <Card title="Назва та опис">
          <Flex vertical gap={16}>
            <div>
              <Flex justify="space-between" align="center">
                <Text style={compactLabelStyle}>Назва</Text>

                {!editingName ? (
                  <Tooltip title="Редагувати">
                    <EditOutlined
                      style={{
                        color: '#8c8c8c',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#1677ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8c8c8c';
                      }}
                      onClick={() => setEditingName(true)}
                    />
                  </Tooltip>
                ) : (
                  <Flex gap={10}>
                    <SaveOutlined
                      style={{
                        color: '#52c41a',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onClick={() => handleSaveField('name')}
                    />

                    <CloseOutlined
                      style={{
                        color: '#262626',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onClick={() => {
                        setName(storagePlace?.name || '');
                        setEditingName(false);
                      }}
                    />
                  </Flex>
                )}
              </Flex>

              {!editingName ? (
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {storagePlace?.name || '—'}
                </Text>
              ) : (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={savingField === 'name'}
                  autoFocus
                />
              )}
            </div>

            <div>
              <Flex justify="space-between" align="center">
                <Text style={compactLabelStyle}>Опис</Text>

                {!editingComment ? (
                  <Tooltip title="Редагувати">
                    <EditOutlined
                      style={{
                        color: '#8c8c8c',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#1677ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#8c8c8c';
                      }}
                      onClick={() => setEditingComment(true)}
                    />
                  </Tooltip>
                ) : (
                  <Flex gap={10}>
                    <SaveOutlined
                      style={{
                        color: '#52c41a',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onClick={() => handleSaveField('comment')}
                    />

                    <CloseOutlined
                      style={{
                        color: '#262626',
                        cursor: 'pointer',
                        fontSize: 16,
                      }}
                      onClick={() => {
                        setComment(storagePlace?.comment || '');
                        setEditingComment(false);
                      }}
                    />
                  </Flex>
                )}
              </Flex>

              {!editingComment ? (
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {storagePlace?.comment || '—'}
                </Text>
              ) : (
                <TextArea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={savingField === 'comment'}
                  rows={4}
                  autoFocus
                />
              )}
            </div>
          </Flex>
        </Card>

        <Card title="Бажана номенклатура">
          <Text type="secondary">Дані з’являться пізніше.</Text>
        </Card>

        <Flex justify="flex-end" align="center">
          <Button onClick={handleCloseDrawer}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default StoragePlaceEditDrawer;
