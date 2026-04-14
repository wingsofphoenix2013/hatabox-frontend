import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';

const { Text, Title } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const compactValueStyle = {
  display: 'block',
  fontSize: 12,
  lineHeight: 1.3,
  wordBreak: 'break-word',
};

const compactMutedStyle = {
  display: 'block',
  fontSize: 11,
  lineHeight: 1.2,
  marginBottom: 4,
};

const formatMoney = (value) =>
  new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatPurchasePrice = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return value;
  }

  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
};

const roundTo4 = (value) => {
  const num = Number(value);

  if (Number.isNaN(num)) {
    return 0;
  }

  return Math.round(num * 10000) / 10000;
};

const toStoredAgreedPrice = (inputPrice, pricesIncludeVat) => {
  const num = Number(inputPrice);

  if (Number.isNaN(num)) {
    return inputPrice;
  }

  if (pricesIncludeVat) {
    return roundTo4(num);
  }

  return roundTo4(num * 1.2);
};

const toDisplayedInputPrice = (storedPrice, pricesIncludeVat) => {
  const num = Number(storedPrice);

  if (Number.isNaN(num)) {
    return storedPrice;
  }

  if (pricesIncludeVat) {
    return roundTo4(num);
  }

  return roundTo4(num / 1.2);
};

function InfoCell({ label, value, compact = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text
        type="secondary"
        style={compact ? compactMutedStyle : compactLabelStyle}
      >
        {label}
      </Text>

      <Text
        style={
          compact ? { ...compactValueStyle, fontSize: 12 } : compactValueStyle
        }
      >
        {value || '—'}
      </Text>
    </div>
  );
}

function OrderItemsDrawer({ open, onClose, order, onOrderUpdated }) {
  const [vendorItemOptions, setVendorItemOptions] = useState([]);
  const [vendorItemsLoading, setVendorItemsLoading] = useState(false);

  const [selectedVendorItemId, setSelectedVendorItemId] = useState(null);
  const [selectedVendorItem, setSelectedVendorItem] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [price, setPrice] = useState(null);
  const [expectedDate, setExpectedDate] = useState(null);
  const [requiresUnitConversion, setRequiresUnitConversion] = useState(false);

  const [editingItemId, setEditingItemId] = useState(null);

  const [savingItem, setSavingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);

  const items = useMemo(() => {
    return Array.isArray(order?.items) ? order.items : [];
  }, [order]);

  const orderStatus = order?.status || 'draft';
  const isDraft = orderStatus === 'draft';
  const isInProgress = orderStatus === 'in_progress';
  const isCompleted = orderStatus === 'completed';
  const isCancelled = orderStatus === 'cancelled';

  const canCreateItem = isDraft;
  const canEditItem = isDraft || isInProgress;
  const canDeleteItem = isDraft;
  const canEditAllFields = isDraft;
  const canEditOnlyDate = isInProgress;
  const pricesIncludeVat = Boolean(order?.prices_include_vat);

  const isEditingMode = Boolean(editingItemId);
  const submitButtonText = isEditingMode ? 'Зберегти зміни' : 'Додати рядок';
  const priceLabel = pricesIncludeVat ? 'Ціна з ПДВ' : 'Ціна без ПДВ';

  const availableVendorItemIds = useMemo(() => {
    return new Set(
      items
        .filter((item) => item.id !== editingItemId)
        .map((item) => item.vendor_item),
    );
  }, [items, editingItemId]);

  const loadVendorItems = useCallback(async () => {
    if (!order?.vendor || !canEditAllFields) {
      setVendorItemOptions([]);
      return;
    }

    try {
      setVendorItemsLoading(true);

      const response = await api.get(`vendor-items/?vendor=${order.vendor}`);

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      const filtered = results.filter((item) => {
        if (item.id === selectedVendorItemId) {
          return true;
        }

        return !availableVendorItemIds.has(item.id);
      });

      setVendorItemOptions(
        filtered.map((item) => ({
          value: item.id,
          label: item.name || item.item_name || `ID ${item.id}`,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to load vendor items:', err);
      setVendorItemOptions([]);
    } finally {
      setVendorItemsLoading(false);
    }
  }, [
    order?.vendor,
    canEditAllFields,
    selectedVendorItemId,
    availableVendorItemIds,
  ]);

  useEffect(() => {
    if (open && canEditAllFields) {
      loadVendorItems();
    }
  }, [open, canEditAllFields, loadVendorItems]);

  const orderTotalAmount = Number(order?.order_total_amount) || 0;
  const vatAmount = Number(order?.vat_amount) || 0;

  const resetForm = () => {
    setSelectedVendorItemId(null);
    setSelectedVendorItem(null);
    setQuantity(null);
    setPrice(null);
    setExpectedDate(null);
    setRequiresUnitConversion(false);
    setEditingItemId(null);
    setVendorItemOptions([]);
    setVendorItemsLoading(false);
  };

  const handleCloseDrawer = () => {
    resetForm();
    onClose();
  };

  const notifyOrderUpdated = async () => {
    if (onOrderUpdated) {
      await onOrderUpdated();
    }
  };

  const handleSearchVendorItems = async () => {};

  const handleStartEditItem = (record) => {
    if (!canEditItem || isEditingMode) {
      return;
    }

    setEditingItemId(record.id);
    setSelectedVendorItemId(record.vendor_item);
    setSelectedVendorItem({
      id: record.vendor_item,
      value: record.vendor_item,
      label: record.vendor_item_name || record.vendor_item_inv_item_name || '—',
      vendor_sku: record.vendor_item_sku || '',
      item: record.vendor_item_inv_item_id,
      item_name: record.vendor_item_inv_item_name || '',
      item_unit_name: record.vendor_item_inv_item_unit_name || '',
      item_unit_symbol: record.vendor_item_inv_item_unit_symbol || '',
      name: record.vendor_item_name || record.vendor_item_inv_item_name || '',
    });
    setQuantity(
      record.quantity !== null && record.quantity !== undefined
        ? Number(record.quantity)
        : null,
    );
    setPrice(
      record.agreed_price !== null && record.agreed_price !== undefined
        ? toDisplayedInputPrice(record.agreed_price, pricesIncludeVat)
        : null,
    );
    setExpectedDate(
      record.expected_delivery_date
        ? dayjs(record.expected_delivery_date, 'YYYY-MM-DD')
        : null,
    );
    setRequiresUnitConversion(Boolean(record.requires_unit_conversion));
    setVendorItemOptions([
      {
        value: record.vendor_item,
        label:
          record.vendor_item_name || record.vendor_item_inv_item_name || '—',
        item: {
          id: record.vendor_item,
          vendor_sku: record.vendor_item_sku || '',
          item: record.vendor_item_inv_item_id,
          item_name: record.vendor_item_inv_item_name || '',
          item_unit_name: record.vendor_item_inv_item_unit_name || '',
          item_unit_symbol: record.vendor_item_inv_item_unit_symbol || '',
          name:
            record.vendor_item_name || record.vendor_item_inv_item_name || '—',
        },
      },
    ]);
  };

  const handleDeleteItem = async (itemId) => {
    if (!canDeleteItem || isEditingMode) {
      return;
    }

    try {
      setDeletingItemId(itemId);

      await api.delete(`order-items/${itemId}/`);
      message.success('Рядок замовлення видалено.');

      await notifyOrderUpdated();
    } catch (err) {
      console.error('Failed to delete order item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося видалити рядок замовлення.');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleSubmit = async () => {
    if (!isEditingMode && !canCreateItem) {
      return;
    }

    if (isEditingMode && !canEditItem) {
      return;
    }

    if (canEditAllFields) {
      if (!selectedVendorItemId) {
        message.error('Оберіть позицію постачальника.');
        return;
      }

      if (
        quantity === null ||
        quantity === undefined ||
        Number(quantity) <= 0
      ) {
        message.error('Кількість повинна бути більшою за 0.');
        return;
      }

      if (price === null || price === undefined) {
        message.error('Вкажіть ціну.');
        return;
      }
    }

    if (!expectedDate) {
      message.error('Вкажіть дату очікуваної поставки.');
      return;
    }

    try {
      setSavingItem(true);

      if (isEditingMode) {
        if (canEditOnlyDate) {
          await api.patch(`order-items/${editingItemId}/`, {
            expected_delivery_date: expectedDate.format('YYYY-MM-DD'),
          });
        } else {
          await api.patch(`order-items/${editingItemId}/`, {
            vendor_item: selectedVendorItemId,
            quantity,
            agreed_price: toStoredAgreedPrice(price, pricesIncludeVat),
            requires_unit_conversion: requiresUnitConversion,
            expected_delivery_date: expectedDate.format('YYYY-MM-DD'),
          });
        }

        message.success('Рядок замовлення оновлено.');
      } else {
        await api.post('order-items/', {
          order: Number(order.id),
          vendor_item: selectedVendorItemId,
          quantity,
          agreed_price: toStoredAgreedPrice(price, pricesIncludeVat),
          requires_unit_conversion: requiresUnitConversion,
          expected_delivery_date: expectedDate.format('YYYY-MM-DD'),
        });

        message.success('Рядок замовлення додано.');
      }

      resetForm();
      await notifyOrderUpdated();
    } catch (err) {
      console.error('Failed to save order item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'vendor_item',
        'quantity',
        'agreed_price',
        'requires_unit_conversion',
        'expected_delivery_date',
        'order',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти рядок замовлення.');
    } finally {
      setSavingItem(false);
    }
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва компонента',
      dataIndex: 'vendor_item_name',
      key: 'vendor_item_name',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>{value || '—'}</div>
        );
      },
    },
    {
      title: 'Артікул',
      dataIndex: 'vendor_item_sku',
      key: 'vendor_item_sku',
      width: 140,
      align: 'center',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>{value || '—'}</div>
        );
      },
    },
    {
      title: 'К-сть',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>
            {formatQuantity(value)}
          </div>
        );
      },
    },
    {
      title: priceLabel,
      dataIndex: 'agreed_price',
      key: 'agreed_price',
      width: 160,
      align: 'center',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>
            {`${formatPurchasePrice(
              toDisplayedInputPrice(value, pricesIncludeVat),
            )} ₴`}
          </div>
        );
      },
    },
    {
      title: 'Поставка',
      dataIndex: 'expected_delivery_date',
      key: 'expected_delivery_date',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        if (!value) {
          return <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>—</div>;
        }

        const date = dayjs(value, 'YYYY-MM-DD');

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>
            {date.isValid() ? date.format('DD-MM-YYYY') : '—'}
          </div>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (isCompleted || isCancelled) {
          return null;
        }

        const isThisRowEditing = editingItemId === record.id;
        const isOtherRowDimmed = isEditingMode && !isThisRowEditing;

        const showEdit = canEditItem;
        const showDelete = canDeleteItem;

        return (
          <Space size="middle" style={{ opacity: isOtherRowDimmed ? 0.45 : 1 }}>
            {showEdit && (
              <EditOutlined
                style={{
                  color: isOtherRowDimmed ? '#d9d9d9' : '#1677ff',
                  cursor: isOtherRowDimmed ? 'default' : 'pointer',
                }}
                onClick={() => {
                  if (!isOtherRowDimmed) {
                    handleStartEditItem(record);
                  }
                }}
              />
            )}

            {showDelete &&
              (isOtherRowDimmed || deletingItemId === record.id ? (
                <DeleteOutlined
                  style={{
                    color: '#d9d9d9',
                    cursor: 'default',
                  }}
                />
              ) : (
                <Popconfirm
                  title="Видалити рядок?"
                  description="Ви впевнені, що хочете видалити цей рядок замовлення?"
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={() => handleDeleteItem(record.id)}
                >
                  <DeleteOutlined
                    style={{
                      color: '#ff4d4f',
                      cursor: 'pointer',
                    }}
                  />
                </Popconfirm>
              ))}
          </Space>
        );
      },
    },
  ];

  return (
    <Drawer
      title="Комплектація замовлення"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Flex vertical gap={16}>
        {!isDraft && !isInProgress && (
          <Alert
            type="warning"
            showIcon
            message="Редагування недоступне"
            description="Для цього статусу замовлення змінювати склад не можна."
          />
        )}

        <Card
          title={
            <Flex justify="space-between" align="center" wrap gap={12}>
              <span>1. Компонент</span>

              <Flex align="center" gap={8}>
                <Text style={{ fontSize: 12 }}>
                  Ціна у рахунку враховує ПДВ
                </Text>
                <Switch
                  checked={pricesIncludeVat}
                  checkedChildren="Так"
                  unCheckedChildren="Ні"
                  disabled
                />
              </Flex>
            </Flex>
          }
        >
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Позиція постачальника</Text>
              <Select
                showSearch
                placeholder="Оберіть позицію"
                style={{ width: '100%' }}
                value={selectedVendorItemId}
                onSearch={handleSearchVendorItems}
                filterOption
                optionFilterProp="label"
                options={vendorItemOptions}
                loading={vendorItemsLoading}
                onChange={(value, option) => {
                  setSelectedVendorItemId(value);
                  setSelectedVendorItem(option?.item || null);

                  if (!isEditingMode) {
                    setQuantity(null);
                    setPrice(null);
                    setExpectedDate(null);
                    setRequiresUnitConversion(false);
                  }
                }}
                disabled={
                  !canEditAllFields || (isEditingMode && canEditOnlyDate)
                }
              />
            </div>

            <Flex gap={12} wrap>
              <div style={{ flex: 1, minWidth: 140 }}>
                <Text style={compactLabelStyle}>Кількість</Text>
                <InputNumber
                  min={0.001}
                  step={0.001}
                  controls={false}
                  value={quantity}
                  onChange={setQuantity}
                  style={{ width: '100%' }}
                  disabled={
                    !canEditAllFields || (isEditingMode && canEditOnlyDate)
                  }
                />
              </div>

              <div style={{ flex: 1, minWidth: 160 }}>
                <Text style={compactLabelStyle}>{priceLabel}</Text>
                <InputNumber
                  min={0}
                  step={0.0001}
                  precision={4}
                  controls={false}
                  value={price}
                  onChange={setPrice}
                  style={{ width: '100%' }}
                  disabled={
                    !canEditAllFields || (isEditingMode && canEditOnlyDate)
                  }
                />
              </div>

              <div style={{ flex: 1, minWidth: 170 }}>
                <Text style={compactLabelStyle}>Дата очікуваної поставки</Text>
                <DatePicker
                  value={expectedDate}
                  format="DD-MM-YYYY"
                  onChange={setExpectedDate}
                  style={{ width: '100%' }}
                  disabledDate={(current) =>
                    canEditOnlyDate
                      ? current &&
                        current.startOf('day').isBefore(dayjs().startOf('day'))
                      : false
                  }
                />
              </div>
            </Flex>

            <div
              style={{
                padding: '10px 12px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <Flex wrap gap={16}>
                <div style={{ flex: '1 1 140px' }}>
                  <InfoCell
                    label="Артікул"
                    value={selectedVendorItem?.vendor_sku}
                    compact
                  />
                </div>

                <div style={{ flex: '1 1 220px' }}>
                  <Text type="secondary" style={compactMutedStyle}>
                    Номенклатурна одиниця
                  </Text>

                  <Flex align="center" gap={6} wrap>
                    <InfoCircleOutlined
                      style={{
                        color: '#1677ff',
                        fontSize: 13,
                        cursor: selectedVendorItem?.item
                          ? 'pointer'
                          : 'default',
                        opacity: selectedVendorItem?.item ? 1 : 0.45,
                      }}
                      onClick={() => {
                        if (selectedVendorItem?.item) {
                          window.open(
                            `/inventory/items/${selectedVendorItem.item}`,
                            '_blank',
                          );
                        }
                      }}
                    />

                    <Text style={compactValueStyle}>
                      {selectedVendorItem?.item_name || '—'}
                    </Text>
                  </Flex>
                </div>

                <div style={{ flex: '0 1 120px' }}>
                  <InfoCell
                    label="Одиниця"
                    value={
                      selectedVendorItem?.item_unit_symbol ||
                      selectedVendorItem?.item_unit_name
                    }
                    compact
                  />
                </div>

                <div style={{ flex: '1 1 190px' }}>
                  <Text type="secondary" style={compactMutedStyle}>
                    Конвертація одиниць виміру
                  </Text>

                  <Switch
                    checked={requiresUnitConversion}
                    checkedChildren="Так"
                    unCheckedChildren="Ні"
                    onChange={setRequiresUnitConversion}
                    disabled={
                      !canEditAllFields || (isEditingMode && canEditOnlyDate)
                    }
                  />
                </div>
              </Flex>
            </div>

            <Flex justify="flex-end" gap={8}>
              <Button onClick={resetForm}>Очистити</Button>

              <Button
                type="primary"
                icon={isEditingMode ? undefined : <PlusOutlined />}
                loading={savingItem}
                onClick={handleSubmit}
                disabled={
                  (!canCreateItem && !isEditingMode) ||
                  (!canEditItem && isEditingMode)
                }
              >
                {submitButtonText}
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card
          title={
            <Flex justify="space-between" align="center" wrap gap={12}>
              <span>2. Склад замовлення</span>

              <div style={{ textAlign: 'right' }}>
                <Title level={5} style={{ margin: 0 }}>
                  {formatMoney(orderTotalAmount)} ₴
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ПДВ: {formatMoney(vatAmount)} ₴
                </Text>
              </div>
            </Flex>
          }
        >
          {isEditingMode && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message="Режим редагування"
              description="Інші рядки тимчасово недоступні. Змініть дані у верхній картці та натисніть «Зберегти зміни» або «Очистити»."
            />
          )}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={items}
            pagination={false}
            size="small"
          />
        </Card>

        <Flex justify="flex-end">
          <Button onClick={handleCloseDrawer}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderItemsDrawer;
