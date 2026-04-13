import { useEffect, useMemo, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
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
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;

function ReceiptDrawer({ open, onClose, order, onReceiptSaved }) {
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [creatingReceiptDocument, setCreatingReceiptDocument] = useState(false);
  const [createdReceiptDocument, setCreatedReceiptDocument] = useState(null);
  const [receiptDocumentLoading, setReceiptDocumentLoading] = useState(false);

  const [receiptOrderItemId, setReceiptOrderItemId] = useState(null);
  const [receiptQuantity, setReceiptQuantity] = useState(null);
  const [savingReceiptItem, setSavingReceiptItem] = useState(false);

  useEffect(() => {
    if (!open) {
      setReceiptNo('');
      setReceiptDate(null);
      setReceiptFile(null);
      setCreatingReceiptDocument(false);
      setCreatedReceiptDocument(null);
      setReceiptDocumentLoading(false);
      setReceiptOrderItemId(null);
      setReceiptQuantity(null);
    }
  }, [open]);

  const receiptDocumentItems = Array.isArray(createdReceiptDocument?.items)
    ? createdReceiptDocument.items
    : [];

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
        label: `${
          item.vendor_item_name || item.vendor_item_inv_item_name || '—'
        } | Замовлено ${formatQuantity(item.quantity)} | Отримано ${formatQuantity(
          item.received_quantity,
        )} | Залишок ${formatQuantity(item.remaining_quantity)}`,
      }));
  }, [order, receiptDocumentItems]);

  const loadReceiptDocument = async (receiptDocumentId) => {
    try {
      setReceiptDocumentLoading(true);

      const response = await api.get(`receipt-documents/${receiptDocumentId}/`);
      setCreatedReceiptDocument(response.data);
    } catch (err) {
      console.error('Failed to load receipt document:', err);
      message.error('Не вдалося оновити дані видаткової накладної.');
    } finally {
      setReceiptDocumentLoading(false);
    }
  };

  const handleReceiptFileChange = ({ fileList }) => {
    const fileObj = fileList[0]?.originFileObj || null;

    if (!fileObj) {
      setReceiptFile(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(fileObj.type)) {
      message.error('Дозволено завантажувати лише JPG, JPEG, PNG або PDF.');
      setReceiptFile(null);
      return;
    }

    setReceiptFile(fileObj);
  };

  const handleCreateReceiptDocument = async () => {
    if (!receiptNo.trim()) {
      message.error('Вкажіть номер видаткової накладної.');
      return;
    }

    if (!receiptDate) {
      message.error('Вкажіть дату отримання товару.');
      return;
    }

    if (!receiptFile) {
      message.error('Завантажте файл видаткової накладної.');
      return;
    }

    try {
      setCreatingReceiptDocument(true);

      const payload = new FormData();
      payload.append('receipt_no', receiptNo.trim());
      payload.append('order', String(order.id));
      payload.append('receipt_date', receiptDate.format('YYYY-MM-DD'));
      payload.append('comment', '');
      payload.append('image', receiptFile);

      const response = await api.post('receipt-documents/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setCreatedReceiptDocument(response.data);
      message.success('Видаткову накладну зареєстровано.');

      if (onReceiptSaved) {
        await onReceiptSaved();
      }
    } catch (err) {
      console.error('Failed to create receipt document:', err);

      const responseData = err?.response?.data;

      const backendMessage =
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        responseData?.receipt_no?.[0] ||
        responseData?.receipt_date?.[0] ||
        responseData?.image?.[0] ||
        (typeof responseData === 'string' ? responseData : null);

      message.error(
        backendMessage || 'Не вдалося зареєструвати видаткову накладну.',
      );
    } finally {
      setCreatingReceiptDocument(false);
    }
  };

  const handleSaveReceiptItem = async () => {
    if (!createdReceiptDocument?.id) {
      message.error('Спочатку зареєструйте видаткову накладну.');
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
        receipt_document: createdReceiptDocument.id,
        order_item: receiptOrderItemId,
        received_quantity: receiptQuantity,
      });

      message.success('Рядок отримання додано.');

      setReceiptOrderItemId(null);
      setReceiptQuantity(null);

      await loadReceiptDocument(createdReceiptDocument.id);

      if (onReceiptSaved) {
        await onReceiptSaved();
      }
    } catch (err) {
      console.error('Failed to create receipt item:', err);

      const responseData = err?.response?.data;

      const backendMessage =
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        responseData?.received_quantity?.[0] ||
        responseData?.order_item?.[0] ||
        (typeof responseData === 'string' ? responseData : null);

      message.error(backendMessage || 'Не вдалося додати рядок отримання.');
    } finally {
      setSavingReceiptItem(false);
    }
  };

  const receiptItemsColumns = [
    {
      title: 'Назва компонента',
      key: 'order_item_name',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Select
              showSearch
              placeholder="Оберіть товар із замовлення"
              style={{ width: '100%' }}
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

        return (
          record.order_item_vendor_item_name ||
          record.order_item_inv_item_name ||
          '—'
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
      width: 140,
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
              value={receiptQuantity}
              onChange={setReceiptQuantity}
              style={{ width: 120 }}
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

  return (
    <Drawer
      title="Отримання товару"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Card title="1. Зареєструйте видаткову накладну">
          <Flex vertical gap={16}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Номер документа
              </Text>
              <Input
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Номер видаткової накладної"
                disabled={Boolean(createdReceiptDocument)}
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
                disabled={Boolean(createdReceiptDocument)}
              />
            </div>

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Файл накладної
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
                disabled={Boolean(createdReceiptDocument)}
              >
                <Button
                  icon={<UploadOutlined />}
                  disabled={Boolean(createdReceiptDocument)}
                >
                  Обрати файл
                </Button>
              </Upload>
            </div>

            {!createdReceiptDocument && (
              <Flex justify="flex-end">
                <Button
                  type="primary"
                  loading={creatingReceiptDocument}
                  onClick={handleCreateReceiptDocument}
                >
                  Зберегти крок 1
                </Button>
              </Flex>
            )}

            {createdReceiptDocument && (
              <Alert
                type="success"
                showIcon
                message="Видаткову накладну зареєстровано"
              />
            )}
          </Flex>
        </Card>

        {createdReceiptDocument && (
          <Card title="2. Оберіть товар та кількість">
            <Flex vertical gap={16}>
              <Table
                rowKey="id"
                columns={receiptItemsColumns}
                dataSource={[{ id: 'new-row' }, ...receiptDocumentItems]}
                pagination={false}
                size="small"
                loading={receiptDocumentLoading}
              />

              {selectedReceiptOrderItem && (
                <Alert
                  type="info"
                  showIcon
                  message={`Доступно до отримання: ${formatQuantity(
                    selectedReceiptOrderItem.remaining_quantity,
                  )}`}
                />
              )}

              {receiptOrderItemOptions.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="Усі товари замовлення вже повністю отримані або вже додані до цієї накладної"
                />
              )}
            </Flex>
          </Card>
        )}

        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ReceiptDrawer;
