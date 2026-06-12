import { useEffect, useState } from 'react';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  AutoComplete,
  Popconfirm,
  Table,
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

function StoragePlaceEditDrawer({
  open,
  onClose,
  storagePlace,
  preferredItems = [],
  onUpdated,
}) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');

  const [editingName, setEditingName] = useState(false);
  const [editingComment, setEditingComment] = useState(false);

  const [savingField, setSavingField] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [preferredItemsState, setPreferredItemsState] = useState([]);
  const [isAddingPreferredItem, setIsAddingPreferredItem] = useState(false);
  const [selectedInvItemId, setSelectedInvItemId] = useState(null);
  const [selectedInvItem, setSelectedInvItem] = useState(null);
  const [invItemOptions, setInvItemOptions] = useState([]);
  const [invItemSearchText, setInvItemSearchText] = useState('');
  const [invItemsLoading, setInvItemsLoading] = useState(false);
  const [savingPreferredItem, setSavingPreferredItem] = useState(false);
  const [deletingPreferredItemId, setDeletingPreferredItemId] = useState(null);

  useEffect(() => {
    if (open) {
      setName(storagePlace?.name || '');
      setComment(storagePlace?.comment || '');
      setEditingName(false);
      setEditingComment(false);
      setSavingField(null);
      setHasChanges(false);
      setPreferredItemsState(
        Array.isArray(preferredItems) ? preferredItems : [],
      );
      setIsAddingPreferredItem(false);
      setSelectedInvItemId(null);
      setSelectedInvItem(null);
      setInvItemOptions([]);
      setInvItemSearchText('');
      setInvItemsLoading(false);
      setSavingPreferredItem(false);
      setDeletingPreferredItemId(null);
    }
  }, [open, storagePlace, preferredItems]);

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

  useEffect(() => {
    if (!isAddingPreferredItem || !invItemSearchText.trim()) {
      setInvItemOptions([]);
      return;
    }

    const timerId = setTimeout(async () => {
      try {
        setInvItemsLoading(true);

        const response = await api.get(
          `inventory-item-options/?search=${encodeURIComponent(
            invItemSearchText.trim(),
          )}`,
        );

        const results = Array.isArray(response.data) ? response.data : [];

        setInvItemOptions(
          results.map((item) => ({
            value: String(item.id),
            label: `${item.internal_code || '—'} — ${item.name || '—'}`,
            item,
          })),
        );
      } catch (err) {
        console.error('Failed to load inventory item options:', err);
        setInvItemOptions([]);
      } finally {
        setInvItemsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timerId);
  }, [isAddingPreferredItem, invItemSearchText]);

  const resetPreferredItemDraft = () => {
    setIsAddingPreferredItem(false);
    setSelectedInvItemId(null);
    setSelectedInvItem(null);
    setInvItemOptions([]);
    setInvItemSearchText('');
  };

  const handleSavePreferredItem = async () => {
    if (
      savingPreferredItem ||
      !selectedInvItemId ||
      selectedInvItem?.requires_storage_place === false
    ) {
      return;
    }

    try {
      setSavingPreferredItem(true);

      const response = await api.post('storage-place-preferred-items/', {
        storage_place: storagePlace.id,
        inv_item: Number(selectedInvItemId),
      });

      const createdItem = response.data || {};

      setPreferredItemsState((prevItems) => [
        ...prevItems,
        {
          id: createdItem.id,
          internal_code: createdItem.inv_item_code || '—',
          name: createdItem.inv_item_name || '—',
        },
      ]);

      message.success('Бажану номенклатуру додано.');
      setHasChanges(true);
      resetPreferredItemDraft();
    } catch (err) {
      console.error('Failed to add preferred item:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'storage_place',
        'inv_item',
      ]);

      message.error(backendMessage || 'Не вдалося додати бажану номенклатуру.');
    } finally {
      setSavingPreferredItem(false);
    }
  };

  const handleDeletePreferredItem = async (preferredItemId) => {
    try {
      setDeletingPreferredItemId(preferredItemId);

      await api.delete(`storage-place-preferred-items/${preferredItemId}/`);

      setPreferredItemsState((prevItems) =>
        prevItems.filter((item) => item.id !== preferredItemId),
      );

      message.success('Бажану номенклатуру видалено.');
      setHasChanges(true);
    } catch (err) {
      console.error('Failed to delete preferred item:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(
        backendMessage || 'Не вдалося видалити бажану номенклатуру.',
      );
    } finally {
      setDeletingPreferredItemId(null);
    }
  };

  const preferredItemsColumns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва',
      key: 'name',
      render: (_, record) =>
        record.isDraft ? (
          <AutoComplete
            allowClear
            placeholder="Почніть вводити назву компонента"
            style={{ width: '100%' }}
            value={invItemSearchText}
            options={invItemOptions}
            onSearch={(value) => {
              setInvItemSearchText(value);
              setSelectedInvItemId(null);
              setSelectedInvItem(null);
            }}
            onClear={() => {
              setSelectedInvItemId(null);
              setSelectedInvItem(null);
              setInvItemSearchText('');
              setInvItemOptions([]);
            }}
            onSelect={(value, option) => {
              setSelectedInvItemId(value);
              setSelectedInvItem(option?.item || null);
              setInvItemSearchText(option?.label || '');
            }}
          />
        ) : (
          <Text>
            {record.internal_code || '—'} — {record.name || '—'}
          </Text>
        ),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) =>
        record.isDraft ? (
          <Flex justify="center" gap={10}>
            <Tooltip
              title={
                selectedInvItem?.requires_storage_place === false
                  ? 'Цю номенклатуру не можна використовувати як бажану для місця зберігання.'
                  : ''
              }
            >
              <SaveOutlined
                style={{
                  color:
                    selectedInvItemId &&
                    selectedInvItem?.requires_storage_place !== false &&
                    !savingPreferredItem
                      ? '#52c41a'
                      : '#bfbfbf',
                  cursor:
                    selectedInvItemId &&
                    selectedInvItem?.requires_storage_place !== false &&
                    !savingPreferredItem
                      ? 'pointer'
                      : 'default',
                  opacity: savingPreferredItem ? 0.5 : 1,
                  fontSize: 16,
                }}
                onClick={handleSavePreferredItem}
              />
            </Tooltip>

            <CloseOutlined
              style={{
                color: '#262626',
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={resetPreferredItemDraft}
            />
          </Flex>
        ) : (
          <Popconfirm
            title="Видалити бажану номенклатуру?"
            description="Ви впевнені, що хочете видалити цей компонент?"
            okText="Так"
            cancelText="Ні"
            onConfirm={() => handleDeletePreferredItem(record.id)}
            disabled={deletingPreferredItemId === record.id}
          >
            <DeleteOutlined
              style={{
                color: '#8c8c8c',
                cursor: 'pointer',
                fontSize: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff4d4f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#8c8c8c';
              }}
            />
          </Popconfirm>
        ),
    },
  ];

  const preferredItemsDataSource = isAddingPreferredItem
    ? [...preferredItemsState, { id: '__draft__', isDraft: true }]
    : preferredItemsState;

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
          <Flex vertical gap={12}>
            <Table
              rowKey="id"
              columns={preferredItemsColumns}
              dataSource={preferredItemsDataSource}
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Бажану номенклатуру ще не додано.',
              }}
              components={{
                body: {
                  cell: (props) => (
                    <td
                      {...props}
                      style={{
                        fontSize: 12.5,
                        padding: '7px 8px',
                      }}
                    />
                  ),
                },
              }}
            />

            <Flex justify="flex-end">
              <Button
                type="link"
                size="small"
                icon={<PlusCircleOutlined />}
                disabled={isAddingPreferredItem}
                onClick={() => setIsAddingPreferredItem(true)}
                style={{ padding: 0 }}
              >
                Додати бажаний компонент
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Flex justify="space-between" align="center">
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <span />
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default StoragePlaceEditDrawer;
