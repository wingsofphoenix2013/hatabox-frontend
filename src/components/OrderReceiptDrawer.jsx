import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { UploadOutlined } from '@ant-design/icons';
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

function OrderReceiptDrawer({ open, onClose, order, onReceiptSaved }) {
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
    if (!open) {
      resetReceiptDrawerState();
      return;
    }

    resetReceiptDrawerState();
    loadReceiptDocuments(order?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

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
      message.error(
        'Редагування недоступне: прибуткова накладна вже оброблена.',
      );
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

        return '—';
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
              max={
                selectedReceiptOrderItem
                  ? Number(selectedReceiptOrderItem.remaining_quantity)
                  : undefined
              }
              step={0.001}
              controls={false}
              size="small"
              value={receiptQuantity}
              onChange={setReceiptQuantity}
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
                (selectedReceiptOrderItem &&
                  Number(receiptQuantity) >
                    Number(selectedReceiptOrderItem.remaining_quantity))
              }
            >
              Зберегти
            </Button>
          );
        }

        return <Text type="secondary">Збережено</Text>;
      },
    },
  ];

  const receiptItemsTableData = canAddReceiptItems
    ? [{ id: 'new-row' }, ...receiptDocumentItems]
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

                  <Text>
                    <Text strong>Файл:</Text>{' '}
                    {activeReceiptDocument.image ? (
                      <Link
                        href={activeReceiptDocument.image}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Відкрити файл
                      </Link>
                    ) : (
                      '—'
                    )}
                  </Text>
                </Flex>
              </div>

              {isActiveReceiptCompleted && (
                <Alert
                  type="info"
                  showIcon
                  message="Прибуткова накладна оброблена. Склад накладної доступний лише для перегляду."
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
                dataSource={receiptItemsTableData}
                pagination={false}
                size="small"
                loading={receiptDocumentLoading}
              />

              {!isActiveReceiptCompleted && selectedReceiptOrderItem && (
                <Alert
                  type="info"
                  showIcon
                  message={`Доступно до отримання: ${formatQuantity(
                    selectedReceiptOrderItem.remaining_quantity,
                  )}`}
                />
              )}

              {!isActiveReceiptCompleted &&
                receiptOrderItemOptions.length === 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Усі товари замовлення вже повністю отримані або вже додані до цієї накладної."
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
      </Flex>
    </Drawer>
  );
}

export default OrderReceiptDrawer;
