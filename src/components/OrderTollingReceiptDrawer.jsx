import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Flex,
  InputNumber,
  Popconfirm,
  Select,
  Table,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;

function OrderTollingReceiptDrawer({ open, onClose, order, onReceiptSaved }) {
  const [receiptDocuments, setReceiptDocuments] = useState([]);
  const [receiptDocumentsLoading, setReceiptDocumentsLoading] = useState(false);

  const [selectedReceiptDocumentId, setSelectedReceiptDocumentId] =
    useState(null);

  const [activeReceiptDocument, setActiveReceiptDocument] = useState(null);
  const [receiptDocumentLoading, setReceiptDocumentLoading] = useState(false);

  const [receiptDate, setReceiptDate] = useState(null);

  const [editingReceiptItemId, setEditingReceiptItemId] = useState(null);
  const [editingReceiptQuantity, setEditingReceiptQuantity] = useState(null);
  const [savingReceiptItem, setSavingReceiptItem] = useState(false);
  const [deletingReceiptItemId, setDeletingReceiptItemId] = useState(null);

  const [completingReceipt, setCompletingReceipt] = useState(false);

  const resetReceiptItemEditing = () => {
    setEditingReceiptItemId(null);
    setEditingReceiptQuantity(null);
    setSavingReceiptItem(false);
    setDeletingReceiptItemId(null);
  };

  const resetDrawerState = () => {
    setReceiptDocuments([]);
    setReceiptDocumentsLoading(false);

    setSelectedReceiptDocumentId(null);

    setActiveReceiptDocument(null);
    setReceiptDocumentLoading(false);

    setReceiptDate(null);

    resetReceiptItemEditing();
    setCompletingReceipt(false);
  };

  const notifyReceiptSaved = async () => {
    if (onReceiptSaved) {
      await onReceiptSaved();
    }
  };

  const getReceiptDocumentStatusLabel = (completed) =>
    completed ? 'Оброблена' : 'Чернетка';

  const formatSelectDate = (value) => {
    if (!value) return '—';

    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('DD-MM-YYYY') : '—';
  };

  const loadReceiptDocuments = async (orderId) => {
    if (!orderId) {
      setReceiptDocuments([]);
      return [];
    }

    try {
      setReceiptDocumentsLoading(true);

      const response = await api.get(
        `tolling-receipt-documents/?order=${orderId}`,
      );

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setReceiptDocuments(results);
      return results;
    } catch (err) {
      console.error('Failed to load tolling receipt documents:', err);
      setReceiptDocuments([]);
      message.error('Не вдалося завантажити документи отримання.');
      return [];
    } finally {
      setReceiptDocumentsLoading(false);
    }
  };

  const loadReceiptDocument = async (receiptDocumentId) => {
    if (!receiptDocumentId) {
      setActiveReceiptDocument(null);
      setReceiptDate(null);
      return;
    }

    try {
      setReceiptDocumentLoading(true);

      const response = await api.get(
        `tolling-receipt-documents/${receiptDocumentId}/`,
      );

      setActiveReceiptDocument(response.data);
      setReceiptDate(
        response.data?.receipt_date
          ? dayjs(response.data.receipt_date, 'YYYY-MM-DD')
          : null,
      );
    } catch (err) {
      console.error('Failed to load tolling receipt document:', err);
      setActiveReceiptDocument(null);
      setReceiptDate(null);
      message.error('Не вдалося завантажити дані документа отримання.');
    } finally {
      setReceiptDocumentLoading(false);
    }
  };

  const getDefaultReceiptDocumentId = (documents) => {
    const incompleteDocuments = documents.filter((item) => !item.completed);

    if (incompleteDocuments.length === 1) {
      return incompleteDocuments[0].id;
    }

    if (incompleteDocuments.length > 1) {
      return null;
    }

    return documents[0]?.id || null;
  };

  useEffect(() => {
    const initializeDrawer = async () => {
      if (!open) {
        resetDrawerState();
        return;
      }

      resetDrawerState();

      const documents = await loadReceiptDocuments(order?.id);
      const defaultDocumentId = getDefaultReceiptDocumentId(documents);

      if (defaultDocumentId) {
        setSelectedReceiptDocumentId(defaultDocumentId);
        await loadReceiptDocument(defaultDocumentId);
      }
    };

    initializeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const incompleteReceiptDocuments = useMemo(() => {
    return receiptDocuments.filter((item) => !item.completed);
  }, [receiptDocuments]);

  const hasInconsistentIncompleteDocuments =
    incompleteReceiptDocuments.length > 1;

  const receiptDocumentSelectOptions = useMemo(() => {
    return receiptDocuments.map((item) => ({
      value: item.id,
      label: `${item.receipt_no || '—'} | ${formatSelectDate(
        item.receipt_date,
      )} | ${getReceiptDocumentStatusLabel(item.completed)}`,
    }));
  }, [receiptDocuments]);

  const receiptDocumentItems = useMemo(() => {
    return Array.isArray(activeReceiptDocument?.items)
      ? activeReceiptDocument.items
      : [];
  }, [activeReceiptDocument]);

  const isActiveReceiptCompleted = Boolean(activeReceiptDocument?.completed);
  const hasReceiptItems = receiptDocumentItems.length > 0;

  const getOrderItemByReceiptItem = (receiptItem) => {
    const orderItems = Array.isArray(order?.items) ? order.items : [];
    return (
      orderItems.find((item) => item.id === receiptItem.order_item) || null
    );
  };

  const getReceiptLinePlannedQuantity = (receiptItem) => {
    const orderItem = getOrderItemByReceiptItem(receiptItem);

    if (!orderItem) {
      return Number(receiptItem.received_quantity) || 0;
    }

    const orderedQuantity = Number(orderItem.quantity) || 0;
    const completedReceivedQuantity = Number(orderItem.received_quantity) || 0;

    const plannedQuantity = orderedQuantity - completedReceivedQuantity;

    return plannedQuantity > 0
      ? plannedQuantity
      : Number(receiptItem.received_quantity) || 0;
  };

  const editingReceiptItem = useMemo(() => {
    return receiptDocumentItems.find(
      (item) => item.id === editingReceiptItemId,
    );
  }, [receiptDocumentItems, editingReceiptItemId]);

  const getEditMaxAllowedQuantity = (receiptItem) => {
    return getReceiptLinePlannedQuantity(receiptItem);
  };

  const isEditQuantityInvalid =
    Boolean(editingReceiptItem) &&
    editingReceiptQuantity !== null &&
    editingReceiptQuantity !== undefined &&
    Number(editingReceiptQuantity) >
      Number(getEditMaxAllowedQuantity(editingReceiptItem));

  const canCompleteReceipt =
    Boolean(activeReceiptDocument?.id) &&
    !isActiveReceiptCompleted &&
    Boolean(receiptDate) &&
    hasReceiptItems;

  const handleSelectReceiptDocument = async (value) => {
    setSelectedReceiptDocumentId(value);
    resetReceiptItemEditing();
    await loadReceiptDocument(value);
  };

  const handleStartEditReceiptItem = (record) => {
    if (isActiveReceiptCompleted) {
      return;
    }

    setEditingReceiptItemId(record.id);
    setEditingReceiptQuantity(
      record.received_quantity !== null &&
        record.received_quantity !== undefined
        ? Number(record.received_quantity)
        : null,
    );
  };

  const handleSaveEditedReceiptItem = async (record) => {
    if (isActiveReceiptCompleted) {
      return;
    }

    if (
      editingReceiptQuantity === null ||
      editingReceiptQuantity === undefined ||
      Number(editingReceiptQuantity) <= 0
    ) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    const maxAllowedQuantity = getEditMaxAllowedQuantity(record);

    if (Number(editingReceiptQuantity) > Number(maxAllowedQuantity)) {
      message.error('Кількість перевищує доступний обсяг для отримання.');
      return;
    }

    try {
      setSavingReceiptItem(true);

      await api.patch(`tolling-receipt-items/${record.id}/`, {
        received_quantity: editingReceiptQuantity,
      });

      message.success('Рядок отримання оновлено.');

      resetReceiptItemEditing();

      await Promise.all([
        loadReceiptDocument(activeReceiptDocument.id),
        loadReceiptDocuments(order.id),
      ]);

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to update tolling receipt item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'received_quantity',
      ]);

      message.error(backendMessage || 'Не вдалося оновити рядок отримання.');
    } finally {
      setSavingReceiptItem(false);
    }
  };

  const handleDeleteReceiptItem = async (record) => {
    if (isActiveReceiptCompleted) {
      return;
    }

    try {
      setDeletingReceiptItemId(record.id);

      await api.delete(`tolling-receipt-items/${record.id}/`);

      message.success('Рядок отримання видалено.');

      if (editingReceiptItemId === record.id) {
        resetReceiptItemEditing();
      }

      await Promise.all([
        loadReceiptDocument(activeReceiptDocument.id),
        loadReceiptDocuments(order.id),
      ]);

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to delete tolling receipt item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося видалити рядок отримання.');
    } finally {
      setDeletingReceiptItemId(null);
    }
  };

  const handleCompleteReceipt = async () => {
    if (!activeReceiptDocument?.id || !receiptDate) {
      return;
    }

    try {
      setCompletingReceipt(true);

      await api.patch(
        `tolling-receipt-documents/${activeReceiptDocument.id}/`,
        {
          receipt_date: receiptDate.format('YYYY-MM-DD'),
          completed: true,
        },
      );

      message.success('Документ отримання позначено як оброблений.');

      await notifyReceiptSaved();
      onClose();
    } catch (err) {
      console.error('Failed to complete tolling receipt document:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'receipt_date',
        'completed',
      ]);

      message.error(
        backendMessage || 'Не вдалося завершити документ отримання.',
      );
    } finally {
      setCompletingReceipt(false);
    }
  };

  const getActionIconStyle = (color) => ({
    fontSize: 16,
    color,
    cursor: 'pointer',
  });

  const getDisabledActionIconStyle = () => ({
    fontSize: 16,
    color: '#bfbfbf',
    cursor: 'not-allowed',
  });

  const receiptItemsColumns = [
    {
      title: 'Назва',
      key: 'inv_item_name',
      render: (_, record) => {
        const itemName = record.inv_item_name || '—';

        return (
          <div
            style={{
              maxWidth: 260,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
            }}
            title={itemName}
          >
            {itemName}
          </div>
        );
      },
    },
    {
      title: 'Залишок',
      key: 'planned_quantity',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const plannedQuantity = getReceiptLinePlannedQuantity(record);

        if (editingReceiptItemId === record.id) {
          const typedQuantity =
            editingReceiptQuantity !== null &&
            editingReceiptQuantity !== undefined
              ? Number(editingReceiptQuantity)
              : 0;

          const remainingValue = plannedQuantity - typedQuantity;

          return formatQuantity(remainingValue > 0 ? remainingValue : 0);
        }

        return formatQuantity(plannedQuantity);
      },
    },
    {
      title: 'К-сть',
      key: 'received_quantity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (editingReceiptItemId === record.id) {
          return (
            <InputNumber
              min={0.001}
              step={0.001}
              controls={false}
              size="small"
              value={editingReceiptQuantity}
              onChange={setEditingReceiptQuantity}
              style={{ width: 90 }}
            />
          );
        }

        return formatQuantity(record.received_quantity);
      },
    },
    {
      title: '',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (isActiveReceiptCompleted) {
          return (
            <Flex justify="center" align="center" gap={12}>
              <EditOutlined style={getDisabledActionIconStyle()} />
              <DeleteOutlined style={getDisabledActionIconStyle()} />
            </Flex>
          );
        }

        if (editingReceiptItemId === record.id) {
          return (
            <Flex justify="center" align="center" gap={12}>
              <SaveOutlined
                style={
                  isEditQuantityInvalid || savingReceiptItem
                    ? getDisabledActionIconStyle()
                    : getActionIconStyle('#52c41a')
                }
                onClick={() => {
                  if (isEditQuantityInvalid || savingReceiptItem) {
                    return;
                  }

                  handleSaveEditedReceiptItem(record);
                }}
              />

              <DeleteOutlined style={getDisabledActionIconStyle()} />
            </Flex>
          );
        }

        return (
          <Flex justify="center" align="center" gap={12}>
            <EditOutlined
              style={getActionIconStyle('#1677ff')}
              onClick={() => handleStartEditReceiptItem(record)}
            />

            <Popconfirm
              title="Видалити рядок?"
              description="Після видалення рядок отримання буде втрачено."
              okText="Так"
              cancelText="Ні"
              onConfirm={() => handleDeleteReceiptItem(record)}
            >
              <DeleteOutlined
                style={getActionIconStyle('#ff4d4f')}
                spin={deletingReceiptItemId === record.id}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <Drawer
      title="Отримання товару"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Card title="1. Оберіть прибуткову накладну">
          <Flex vertical gap={12}>
            {hasInconsistentIncompleteDocuments && (
              <Alert
                type="warning"
                showIcon
                message="Виявлено кілька незавершених документів отримання. Оберіть потрібний документ вручну."
              />
            )}

            {!receiptDocumentsLoading && receiptDocuments.length === 0 && (
              <Alert
                type="info"
                showIcon
                message="Для цього замовлення ще немає документів отримання."
              />
            )}

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Документ
              </Text>

              <Select
                style={{ width: '100%' }}
                placeholder="Оберіть документ отримання"
                value={selectedReceiptDocumentId}
                options={receiptDocumentSelectOptions}
                loading={receiptDocumentsLoading}
                onChange={handleSelectReceiptDocument}
                allowClear={false}
              />
            </div>
          </Flex>
        </Card>

        {activeReceiptDocument && (
          <Card title="2. Оберіть дату отримання">
            <Flex vertical gap={12}>
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Дата отримання товару
                </Text>

                <DatePicker
                  style={{ width: '100%' }}
                  format="DD-MM-YYYY"
                  value={receiptDate}
                  onChange={setReceiptDate}
                  disabled={isActiveReceiptCompleted}
                />
              </div>

              {isActiveReceiptCompleted && (
                <Alert
                  type="info"
                  showIcon
                  message="Для обробленого документа дату змінювати не можна."
                />
              )}
            </Flex>
          </Card>
        )}

        {activeReceiptDocument && (
          <Card title="3. Склад прибуткової накладної">
            <Flex vertical gap={16}>
              <Table
                rowKey="id"
                columns={receiptItemsColumns}
                dataSource={receiptDocumentItems}
                pagination={false}
                size="small"
                loading={receiptDocumentLoading}
                locale={{
                  emptyText: 'У цій накладній немає рядків.',
                }}
              />

              {isEditQuantityInvalid && (
                <Alert
                  type="error"
                  showIcon
                  message="Неможливо зберегти кількість, яка перевищує доступний обсяг для отримання."
                />
              )}
            </Flex>
          </Card>
        )}

        {activeReceiptDocument && (
          <Card title="4. Фіксація прибуткової накладної">
            <Flex vertical gap={12} align="flex-start">
              {!isActiveReceiptCompleted && (
                <>
                  <Button
                    type="primary"
                    disabled={!canCompleteReceipt}
                    loading={completingReceipt}
                    onClick={handleCompleteReceipt}
                  >
                    Позначити як оброблену
                  </Button>

                  {!canCompleteReceipt && (
                    <Alert
                      type="warning"
                      showIcon
                      message={
                        !receiptDate && !hasReceiptItems
                          ? 'Оберіть дату отримання та переконайтеся, що в накладній є хоча б одна позиція.'
                          : !receiptDate
                            ? 'Оберіть дату отримання товару.'
                            : 'У накладній має бути хоча б одна позиція.'
                      }
                    />
                  )}
                </>
              )}

              {isActiveReceiptCompleted && (
                <Alert
                  type="info"
                  showIcon
                  message="Документ отримання зафіксований та доступний лише для перегляду."
                />
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    </Drawer>
  );
}

export default OrderTollingReceiptDrawer;
