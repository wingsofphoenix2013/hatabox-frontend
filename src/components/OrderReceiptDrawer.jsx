import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Table,
  Typography,
  Upload,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';
import {
  extractFileFromUploadEvent,
  validateFileType,
} from '../utils/fileHelpers';

const { Text, Link } = Typography;

function OrderReceiptDrawer({
  open,
  onClose,
  order,
  onReceiptSaved,
  initialReceiptDocumentId = null,
}) {
  const [receiptDocuments, setReceiptDocuments] = useState([]);
  const [receiptDocumentsLoading, setReceiptDocumentsLoading] = useState(false);
  const [receiptSelectOpen, setReceiptSelectOpen] = useState(false);

  const [isCreatingNewReceipt, setIsCreatingNewReceipt] = useState(false);
  const [selectedExistingReceiptId, setSelectedExistingReceiptId] =
    useState(null);

  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [creatingReceiptDocument, setCreatingReceiptDocument] = useState(false);

  const [activeReceiptDocument, setActiveReceiptDocument] = useState(null);
  const [receiptDocumentLoading, setReceiptDocumentLoading] = useState(false);

  const [receiptOrderItemId, setReceiptOrderItemId] = useState(null);
  const [receiptQuantity, setReceiptQuantity] = useState(null);
  const [savingReceiptItem, setSavingReceiptItem] = useState(false);

  const [editingReceiptItemId, setEditingReceiptItemId] = useState(null);
  const [editingReceiptQuantity, setEditingReceiptQuantity] = useState(null);
  const [deletingReceiptItemId, setDeletingReceiptItemId] = useState(null);

  const [uploadingReceiptFile, setUploadingReceiptFile] = useState(false);

  const resetReceiptCreateForm = () => {
    setReceiptNo('');
    setReceiptDate(null);
    setReceiptFile(null);
    setCreatingReceiptDocument(false);
  };

  const resetReceiptItemForm = () => {
    setReceiptOrderItemId(null);
    setReceiptQuantity(null);
    setSavingReceiptItem(false);
  };

  const resetReceiptItemEditing = () => {
    setEditingReceiptItemId(null);
    setEditingReceiptQuantity(null);
  };

  const resetReceiptDrawerState = () => {
    setReceiptDocuments([]);
    setReceiptDocumentsLoading(false);
    setReceiptSelectOpen(false);

    setIsCreatingNewReceipt(false);
    setSelectedExistingReceiptId(null);

    resetReceiptCreateForm();

    setActiveReceiptDocument(null);
    setReceiptDocumentLoading(false);

    resetReceiptItemForm();
    resetReceiptItemEditing();

    setDeletingReceiptItemId(null);
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
      setIsCreatingNewReceipt(false);
      return [];
    }

    try {
      setReceiptDocumentsLoading(true);

      const response = await api.get(`receipt-documents/?order=${orderId}`);

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setReceiptDocuments(results);

      if (results.length === 0) {
        setIsCreatingNewReceipt(true);
      }

      return results;
    } catch (err) {
      console.error('Failed to load receipt documents:', err);
      setReceiptDocuments([]);
      message.error('Не вдалося завантажити прибуткові накладні.');
      return [];
    } finally {
      setReceiptDocumentsLoading(false);
    }
  };

  const loadReceiptDocument = async (receiptDocumentId) => {
    if (!receiptDocumentId) {
      setActiveReceiptDocument(null);
      return;
    }

    try {
      setReceiptDocumentLoading(true);

      const response = await api.get(`receipt-documents/${receiptDocumentId}/`);
      setActiveReceiptDocument(response.data);
    } catch (err) {
      console.error('Failed to load receipt document:', err);
      setActiveReceiptDocument(null);
      message.error('Не вдалося завантажити дані прибуткової накладної.');
    } finally {
      setReceiptDocumentLoading(false);
    }
  };

  useEffect(() => {
    const initializeDrawer = async () => {
      if (!open) {
        resetReceiptDrawerState();
        return;
      }

      resetReceiptDrawerState();

      const documents = await loadReceiptDocuments(order?.id);

      if (initialReceiptDocumentId) {
        const targetExists = documents.some(
          (item) => item.id === initialReceiptDocumentId,
        );

        if (targetExists) {
          setSelectedExistingReceiptId(initialReceiptDocumentId);
          setIsCreatingNewReceipt(false);
          await loadReceiptDocument(initialReceiptDocumentId);
        }
      }
    };

    initializeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id, initialReceiptDocumentId]);

  const hasReceiptDocuments =
    Array.isArray(receiptDocuments) && receiptDocuments.length > 0;

  const hasIncompleteReceiptDocument = useMemo(() => {
    return receiptDocuments.some((item) => !item.completed);
  }, [receiptDocuments]);

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

  const selectedReceiptOrderItem = useMemo(() => {
    const items = Array.isArray(order?.items) ? order.items : [];

    return items.find((item) => item.id === receiptOrderItemId) || null;
  }, [order, receiptOrderItemId]);

  const editingReceiptItem = useMemo(() => {
    return receiptDocumentItems.find(
      (item) => item.id === editingReceiptItemId,
    );
  }, [receiptDocumentItems, editingReceiptItemId]);

  const editingOrderItem = useMemo(() => {
    if (!editingReceiptItem) return null;

    const items = Array.isArray(order?.items) ? order.items : [];
    return (
      items.find((item) => item.id === editingReceiptItem.order_item) || null
    );
  }, [order, editingReceiptItem]);

  const getEditableRemainingForItem = (orderItem) => {
    if (!orderItem) return null;

    if (
      editingReceiptItem &&
      editingOrderItem &&
      editingOrderItem.id === orderItem.id
    ) {
      return (
        Number(orderItem.remaining_quantity || 0) +
        Number(editingReceiptItem.received_quantity || 0)
      );
    }

    return Number(orderItem.remaining_quantity || 0);
  };

  const receiptOrderItemOptions = useMemo(() => {
    const currentReceiptOrderItemIds = new Set(
      receiptDocumentItems.map((item) => item.order_item),
    );

    const items = Array.isArray(order?.items) ? order.items : [];

    return items
      .filter((item) => Number(item.remaining_quantity) > 0)
      .filter((item) => !currentReceiptOrderItemIds.has(item.id))
      .map((item) => ({
        value: item.id,
        label: item.vendor_item_name || item.vendor_item_inv_item_name || '—',
      }));
  }, [order, receiptDocumentItems]);

  const canAddReceiptItems =
    Boolean(activeReceiptDocument?.id) && !isActiveReceiptCompleted;

  const hasReceiptItems = receiptDocumentItems.length > 0;
  const hasReceiptFile = Boolean(activeReceiptDocument?.image);

  const canCompleteReceipt =
    !isActiveReceiptCompleted && hasReceiptItems && hasReceiptFile;

  const isNewQuantityInvalid =
    Boolean(selectedReceiptOrderItem) &&
    receiptQuantity !== null &&
    receiptQuantity !== undefined &&
    Number(receiptQuantity) >
      Number(selectedReceiptOrderItem.remaining_quantity);

  const isEditQuantityInvalid =
    Boolean(editingReceiptItem && editingOrderItem) &&
    editingReceiptQuantity !== null &&
    editingReceiptQuantity !== undefined &&
    Number(editingReceiptQuantity) >
      Number(getEditableRemainingForItem(editingOrderItem));

  const handleReceiptFileChange = ({ fileList }) => {
    const fileObj = extractFileFromUploadEvent(fileList);

    if (!fileObj) {
      setReceiptFile(null);
      return;
    }

    const { valid, error } = validateFileType(fileObj);

    if (!valid) {
      message.error(error);
      setReceiptFile(null);
      return;
    }

    setReceiptFile(fileObj);
  };

  const handleSelectExistingReceipt = async (value) => {
    setSelectedExistingReceiptId(value);
    setIsCreatingNewReceipt(false);
    resetReceiptCreateForm();
    resetReceiptItemForm();
    resetReceiptItemEditing();
    await loadReceiptDocument(value);
  };

  const handleStartCreateNewReceipt = () => {
    if (hasIncompleteReceiptDocument) {
      message.warning(
        'Спочатку відкрийте та завершіть існуючу чернетку прибуткової накладної.',
      );
      return;
    }

    setReceiptSelectOpen(false);
    setSelectedExistingReceiptId(null);
    setActiveReceiptDocument(null);
    resetReceiptItemForm();
    resetReceiptItemEditing();
    resetReceiptCreateForm();
    setIsCreatingNewReceipt(true);
  };

  const handleCreateReceiptDocument = async () => {
    if (hasIncompleteReceiptDocument) {
      message.error(
        'Неможливо створити нову прибуткову накладну, поки існує незавершена чернетка.',
      );
      return;
    }

    if (!receiptNo.trim()) {
      message.error('Вкажіть номер прибуткової накладної.');
      return;
    }

    if (!receiptDate) {
      message.error('Вкажіть дату отримання товару.');
      return;
    }

    try {
      setCreatingReceiptDocument(true);

      const payload = new FormData();
      payload.append('receipt_no', receiptNo.trim());
      payload.append('order', String(order.id));
      payload.append('receipt_date', receiptDate.format('YYYY-MM-DD'));
      payload.append('comment', '');

      if (receiptFile) {
        payload.append('image', receiptFile);
      }

      const response = await api.post('receipt-documents/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const createdDocument = response.data;

      message.success('Прибуткову накладну зареєстровано.');

      const refreshedReceiptDocuments = await loadReceiptDocuments(order.id);

      setIsCreatingNewReceipt(false);
      setSelectedExistingReceiptId(createdDocument.id);

      const createdDocumentStillExists = refreshedReceiptDocuments.some(
        (item) => item.id === createdDocument.id,
      );

      if (createdDocumentStillExists) {
        await loadReceiptDocument(createdDocument.id);
      } else {
        setActiveReceiptDocument(createdDocument);
      }

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to create receipt document:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'receipt_no',
        'receipt_date',
        'image',
      ]);

      message.error(
        backendMessage || 'Не вдалося зареєструвати прибуткову накладну.',
      );
    } finally {
      setCreatingReceiptDocument(false);
    }
  };

  const handleSaveReceiptItem = async () => {
    if (!activeReceiptDocument?.id) {
      message.error('Спочатку оберіть або створіть прибуткову накладну.');
      return;
    }

    if (isActiveReceiptCompleted) {
      return;
    }

    if (!receiptOrderItemId) {
      message.error('Оберіть товар.');
      return;
    }

    if (
      receiptQuantity === null ||
      receiptQuantity === undefined ||
      Number(receiptQuantity) <= 0
    ) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    if (
      selectedReceiptOrderItem &&
      Number(receiptQuantity) >
        Number(selectedReceiptOrderItem.remaining_quantity)
    ) {
      message.error('Кількість перевищує доступний залишок до отримання.');
      return;
    }

    try {
      setSavingReceiptItem(true);

      await api.post('receipt-items/', {
        receipt_document: activeReceiptDocument.id,
        order_item: receiptOrderItemId,
        received_quantity: receiptQuantity,
      });

      message.success('Рядок отримання додано.');

      resetReceiptItemForm();
      resetReceiptItemEditing();

      await Promise.all([
        loadReceiptDocument(activeReceiptDocument.id),
        loadReceiptDocuments(order.id),
      ]);

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to create receipt item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'received_quantity',
        'order_item',
      ]);

      message.error(backendMessage || 'Не вдалося додати рядок отримання.');
    } finally {
      setSavingReceiptItem(false);
    }
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

    const currentOrderItem = Array.isArray(order?.items)
      ? order.items.find((item) => item.id === record.order_item)
      : null;

    const maxAllowedQuantity = getEditableRemainingForItem(currentOrderItem);

    if (
      maxAllowedQuantity !== null &&
      Number(editingReceiptQuantity) > Number(maxAllowedQuantity)
    ) {
      message.error('Кількість перевищує доступний залишок до отримання.');
      return;
    }

    try {
      await api.patch(`receipt-items/${record.id}/`, {
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
      console.error('Failed to update receipt item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'received_quantity',
      ]);

      message.error(backendMessage || 'Не вдалося оновити рядок отримання.');
    }
  };

  const handleDeleteReceiptItem = async (record) => {
    if (isActiveReceiptCompleted) {
      return;
    }

    try {
      setDeletingReceiptItemId(record.id);

      await api.delete(`receipt-items/${record.id}/`);

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
      console.error('Failed to delete receipt item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося видалити рядок отримання.');
    } finally {
      setDeletingReceiptItemId(null);
    }
  };

  const handleCompleteReceipt = async () => {
    if (!activeReceiptDocument?.id) {
      return;
    }

    try {
      const payload = new FormData();
      payload.append('completed', 'true');

      await api.patch(
        `receipt-documents/${activeReceiptDocument.id}/`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      message.success('Прибуткову накладну позначено як оброблену.');

      await Promise.all([
        loadReceiptDocument(activeReceiptDocument.id),
        loadReceiptDocuments(order.id),
      ]);

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to complete receipt:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(
        backendMessage || 'Не вдалося завершити прибуткову накладну.',
      );
    }
  };

  const handleUploadReceiptFile = async () => {
    if (!receiptFile) {
      message.error('Спочатку оберіть файл.');
      return;
    }

    if (!activeReceiptDocument?.id) {
      return;
    }

    try {
      setUploadingReceiptFile(true);

      const payload = new FormData();
      payload.append('image', receiptFile);

      const response = await api.patch(
        `receipt-documents/${activeReceiptDocument.id}/`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      setActiveReceiptDocument(response.data);
      setReceiptFile(null);

      message.success('Файл успішно завантажено.');

      await notifyReceiptSaved();
    } catch (err) {
      console.error('Failed to upload receipt file:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, ['image']);

      message.error(backendMessage || 'Не вдалося завантажити файл.');
    } finally {
      setUploadingReceiptFile(false);
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
      title: 'Назва компонента',
      key: 'order_item_name',
      width: 280,
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Select
              showSearch
              placeholder="Оберіть товар"
              style={{ width: '100%', fontSize: 13 }}
              value={receiptOrderItemId}
              onChange={(value) => {
                setReceiptOrderItemId(value);
                setReceiptQuantity(null);
              }}
              options={receiptOrderItemOptions}
              optionFilterProp="label"
            />
          );
        }

        const name =
          record.order_item_vendor_item_name ||
          record.order_item_inv_item_name ||
          '—';

        return (
          <div
            style={{
              maxWidth: 260,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
            }}
            title={name}
          >
            {name}
          </div>
        );
      },
    },
    {
      title: 'Залишок',
      key: 'remaining_quantity',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          if (!selectedReceiptOrderItem) return '—';
          return formatQuantity(selectedReceiptOrderItem.remaining_quantity);
        }

        const currentOrderItem = Array.isArray(order?.items)
          ? order.items.find((item) => item.id === record.order_item)
          : null;

        if (!currentOrderItem) return '—';

        const remainingValue =
          editingReceiptItemId === record.id
            ? getEditableRemainingForItem(currentOrderItem)
            : Number(currentOrderItem.remaining_quantity || 0);

        return formatQuantity(remainingValue);
      },
    },
    {
      title: 'К-сть',
      key: 'received_quantity',
      width: 110,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <InputNumber
              min={0.001}
              step={0.001}
              controls={false}
              size="small"
              value={receiptQuantity}
              onChange={setReceiptQuantity}
              style={{ width: 90 }}
            />
          );
        }

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
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Button
              type="primary"
              size="small"
              loading={savingReceiptItem}
              onClick={handleSaveReceiptItem}
              disabled={
                !receiptOrderItemId ||
                !receiptQuantity ||
                Number(receiptQuantity) <= 0 ||
                isNewQuantityInvalid
              }
            >
              Додати
            </Button>
          );
        }

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
                  isEditQuantityInvalid
                    ? getDisabledActionIconStyle()
                    : getActionIconStyle('#52c41a')
                }
                onClick={() => {
                  if (isEditQuantityInvalid) {
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

  const receiptItemsTableData =
    canAddReceiptItems && receiptOrderItemOptions.length > 0
      ? [...receiptDocumentItems, { id: 'new-row' }]
      : receiptDocumentItems;

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
          <Flex vertical gap={16}>
            {!hasReceiptDocuments && !receiptDocumentsLoading && (
              <>
                <Alert
                  type="info"
                  showIcon
                  message="Для цього замовлення ще немає прибуткових накладних. Заповніть форму нижче, щоб створити першу."
                />

                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>
                    Номер документа
                  </Text>
                  <Input
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="Номер прибуткової накладної"
                  />
                </div>

                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>
                    Дата отримання товару
                  </Text>
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD-MM-YYYY"
                    value={receiptDate}
                    onChange={setReceiptDate}
                  />
                </div>

                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>
                    Файл накладної (необов’язково для чернетки)
                  </Text>
                  <Upload
                    beforeUpload={() => false}
                    maxCount={1}
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleReceiptFileChange}
                    showUploadList
                    fileList={
                      receiptFile
                        ? [
                            {
                              uid: receiptFile.uid || receiptFile.name,
                              name: receiptFile.name,
                              status: 'done',
                            },
                          ]
                        : []
                    }
                  >
                    <Button icon={<UploadOutlined />}>Обрати файл</Button>
                  </Upload>
                </div>

                <Flex justify="flex-end">
                  <Button
                    type="primary"
                    loading={creatingReceiptDocument}
                    onClick={handleCreateReceiptDocument}
                  >
                    Створити прибуткову накладну
                  </Button>
                </Flex>
              </>
            )}

            {hasReceiptDocuments && (
              <>
                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>
                    Документ
                  </Text>

                  <Select
                    style={{ width: '100%' }}
                    placeholder="Оберіть прибуткову накладну"
                    value={selectedExistingReceiptId}
                    options={receiptDocumentSelectOptions}
                    loading={receiptDocumentsLoading}
                    open={receiptSelectOpen}
                    onDropdownVisibleChange={setReceiptSelectOpen}
                    onChange={handleSelectExistingReceipt}
                    dropdownRender={(menu) => (
                      <div>
                        {!hasIncompleteReceiptDocument && (
                          <>
                            <div
                              style={{ padding: 8 }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <Button
                                type="link"
                                style={{ padding: 0, height: 'auto' }}
                                onClick={handleStartCreateNewReceipt}
                              >
                                Створити нову прибуткову накладну
                              </Button>
                            </div>

                            <Divider style={{ margin: '4px 0' }} />
                          </>
                        )}

                        {menu}
                      </div>
                    )}
                  />
                </div>

                {isCreatingNewReceipt && (
                  <Card
                    type="inner"
                    title="Нова прибуткова накладна"
                    styles={{ body: { paddingTop: 16 } }}
                  >
                    <Flex vertical gap={16}>
                      <div>
                        <Text style={{ display: 'block', marginBottom: 8 }}>
                          Номер документа
                        </Text>
                        <Input
                          value={receiptNo}
                          onChange={(e) => setReceiptNo(e.target.value)}
                          placeholder="Номер прибуткової накладної"
                        />
                      </div>

                      <div>
                        <Text style={{ display: 'block', marginBottom: 8 }}>
                          Дата отримання товару
                        </Text>
                        <DatePicker
                          style={{ width: '100%' }}
                          format="DD-MM-YYYY"
                          value={receiptDate}
                          onChange={setReceiptDate}
                        />
                      </div>

                      <div>
                        <Text style={{ display: 'block', marginBottom: 8 }}>
                          Файл накладної (необов’язково для чернетки)
                        </Text>
                        <Upload
                          beforeUpload={() => false}
                          maxCount={1}
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleReceiptFileChange}
                          showUploadList
                          fileList={
                            receiptFile
                              ? [
                                  {
                                    uid: receiptFile.uid || receiptFile.name,
                                    name: receiptFile.name,
                                    status: 'done',
                                  },
                                ]
                              : []
                          }
                        >
                          <Button icon={<UploadOutlined />}>Обрати файл</Button>
                        </Upload>
                      </div>

                      <Flex justify="flex-end" gap={8}>
                        <Button
                          onClick={() => {
                            setIsCreatingNewReceipt(false);
                            resetReceiptCreateForm();
                          }}
                        >
                          Скасувати
                        </Button>

                        <Button
                          type="primary"
                          loading={creatingReceiptDocument}
                          onClick={handleCreateReceiptDocument}
                        >
                          Створити прибуткову накладну
                        </Button>
                      </Flex>
                    </Flex>
                  </Card>
                )}
              </>
            )}
          </Flex>
        </Card>

        {activeReceiptDocument && (
          <Card title="2. Дані прибуткової накладної">
            <Flex vertical gap={16}>
              <div
                style={{
                  padding: '12px 14px',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <Flex vertical gap={8}>
                  <Text>
                    <Text strong>Номер документа:</Text>{' '}
                    {activeReceiptDocument.receipt_no || '—'}
                  </Text>

                  <Text>
                    <Text strong>Дата:</Text>{' '}
                    {formatSelectDate(activeReceiptDocument.receipt_date)}
                  </Text>

                  <Text>
                    <Text strong>Статус:</Text>{' '}
                    {getReceiptDocumentStatusLabel(
                      activeReceiptDocument.completed,
                    )}
                  </Text>

                  <div>
                    <Text strong>Файл:</Text>

                    <div style={{ marginTop: 8 }}>
                      {activeReceiptDocument.image ? (
                        <Flex vertical gap={8} align="flex-start">
                          <Link
                            href={activeReceiptDocument.image}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Відкрити файл
                          </Link>

                          {!isActiveReceiptCompleted && (
                            <>
                              <Upload
                                beforeUpload={() => false}
                                maxCount={1}
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleReceiptFileChange}
                                showUploadList={false}
                              >
                                <Button size="small" icon={<UploadOutlined />}>
                                  Замінити файл
                                </Button>
                              </Upload>

                              {receiptFile && (
                                <Button
                                  size="small"
                                  type="primary"
                                  loading={uploadingReceiptFile}
                                  onClick={handleUploadReceiptFile}
                                >
                                  Завантажити файл
                                </Button>
                              )}
                            </>
                          )}
                        </Flex>
                      ) : (
                        !isActiveReceiptCompleted && (
                          <Flex vertical gap={8} align="flex-start">
                            <Upload
                              beforeUpload={() => false}
                              maxCount={1}
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleReceiptFileChange}
                              showUploadList
                            >
                              <Button icon={<UploadOutlined />}>
                                Обрати файл
                              </Button>
                            </Upload>

                            {receiptFile && (
                              <Button
                                type="primary"
                                loading={uploadingReceiptFile}
                                onClick={handleUploadReceiptFile}
                              >
                                Завантажити файл
                              </Button>
                            )}
                          </Flex>
                        )
                      )}
                    </div>
                  </div>
                </Flex>
              </div>
            </Flex>
          </Card>
        )}

        {activeReceiptDocument && (
          <Card title="3. Склад прибуткової накладної">
            <Flex vertical gap={16}>
              <Table
                rowKey="id"
                columns={receiptItemsColumns}
                dataSource={receiptItemsTableData}
                pagination={false}
                size="small"
                loading={receiptDocumentLoading}
              />

              {isNewQuantityInvalid && (
                <Alert
                  type="error"
                  showIcon
                  message="Неможливо зберегти кількість, яка перевищує залишок до отримання."
                />
              )}

              {isEditQuantityInvalid && (
                <Alert
                  type="error"
                  showIcon
                  message="Неможливо зберегти кількість, яка перевищує залишок до отримання."
                />
              )}

              {!isActiveReceiptCompleted &&
                receiptOrderItemOptions.length === 0 &&
                receiptDocumentItems.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="До цієї прибуткової накладної вже додано всі позиції замовлення. За потреби змінюйте кількість у наявних рядках."
                  />
                )}

              {isActiveReceiptCompleted &&
                receiptDocumentItems.length === 0 && (
                  <Alert
                    type="info"
                    showIcon
                    message="У цій прибутковій накладній немає рядків."
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
                    onClick={handleCompleteReceipt}
                  >
                    Позначити як оброблену
                  </Button>

                  {!canCompleteReceipt && (
                    <Alert
                      type="warning"
                      showIcon
                      message={
                        !hasReceiptFile && !hasReceiptItems
                          ? 'Завантажте файл та додайте хоча б одну позицію.'
                          : !hasReceiptFile
                            ? 'Завантажте файл прибуткової накладної.'
                            : 'Додайте хоча б одну позицію до накладної.'
                      }
                    />
                  )}
                </>
              )}

              {isActiveReceiptCompleted && (
                <Alert
                  type="info"
                  showIcon
                  message="Прибуткова накладна зафіксована та доступна лише для перегляду."
                />
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    </Drawer>
  );
}

export default OrderReceiptDrawer;
