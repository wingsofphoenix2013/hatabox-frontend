import { useMemo, useState } from 'react';
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
import { formatQuantity } from '../utils/formatNumber';

const { Text, Title } = Typography;

const MOCK_VENDOR_ITEMS = [
  {
    value: 101,
    label: 'Амортизатор газовий передній',
    vendor_sku: 'AGP-001',
    inv_item_id: 5001,
    inv_item_name: 'Амортизатор передній газовий',
    unit_name: 'Штуки',
    conversion_enabled: true,
  },
  {
    value: 102,
    label: 'Пружина підвіски задня',
    vendor_sku: 'PZ-204',
    inv_item_id: 5002,
    inv_item_name: 'Пружина задньої підвіски',
    unit_name: 'Штуки',
    conversion_enabled: false,
  },
  {
    value: 103,
    label: 'Опора амортизатора',
    vendor_sku: 'OA-778',
    inv_item_id: 5003,
    inv_item_name: 'Опора амортизатора верхня',
    unit_name: 'Штуки',
    conversion_enabled: false,
  },
  {
    value: 104,
    label: 'Сайлентблок важеля',
    vendor_sku: 'SV-450',
    inv_item_id: 5004,
    inv_item_name: 'Сайлентблок важеля підвіски',
    unit_name: 'Штуки',
    conversion_enabled: true,
  },
];

const MOCK_ORDER_ITEMS = [
  {
    id: 1,
    vendor_item: 101,
    vendor_item_name: 'Амортизатор газовий передній',
    vendor_item_sku: 'AGP-001',
    inv_item_id: 5001,
    inv_item_name: 'Амортизатор передній газовий',
    unit_name: 'Штуки',
    conversion_enabled: true,
    quantity: 4,
    agreed_price: 1250.5,
    expected_delivery_date: '2026-04-20',
  },
  {
    id: 2,
    vendor_item: 102,
    vendor_item_name: 'Пружина підвіски задня',
    vendor_item_sku: 'PZ-204',
    inv_item_id: 5002,
    inv_item_name: 'Пружина задньої підвіски',
    unit_name: 'Штуки',
    conversion_enabled: false,
    quantity: 2,
    agreed_price: 890,
    expected_delivery_date: '2026-04-22',
  },
  {
    id: 3,
    vendor_item: 103,
    vendor_item_name: 'Опора амортизатора',
    vendor_item_sku: 'OA-778',
    inv_item_id: 5003,
    inv_item_name: 'Опора амортизатора верхня',
    unit_name: 'Штуки',
    conversion_enabled: false,
    quantity: 6,
    agreed_price: 215.75,
    expected_delivery_date: '2026-04-25',
  },
];

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

function OrderItemsDrawer({ open, onClose, order }) {
  const [pricesIncludeVat, setPricesIncludeVat] = useState(
    Boolean(order?.prices_include_vat),
  );
  const [items, setItems] = useState(MOCK_ORDER_ITEMS);

  const [selectedVendorItemId, setSelectedVendorItemId] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [price, setPrice] = useState(null);
  const [expectedDate, setExpectedDate] = useState(null);

  const [editingItemId, setEditingItemId] = useState(null);

  const orderStatus = order?.status || 'draft';
  const isDraft = orderStatus === 'draft';
  const isInProgress = orderStatus === 'in_progress';
  const canEditAnyField = isDraft;
  const canEditOnlyDate = isInProgress;
  const canEditItem = isDraft || isInProgress;
  const canDeleteItem = isDraft;

  const selectedVendorItem = useMemo(() => {
    return (
      MOCK_VENDOR_ITEMS.find((item) => item.value === selectedVendorItemId) ||
      null
    );
  }, [selectedVendorItemId]);

  const orderTotalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.agreed_price || 0);
    }, 0);
  }, [items]);

  const vatAmount = useMemo(() => {
    if (!pricesIncludeVat) {
      return 0;
    }

    return orderTotalAmount / 6;
  }, [orderTotalAmount, pricesIncludeVat]);

  const priceLabel = pricesIncludeVat ? 'Ціна з ПДВ' : 'Ціна без ПДВ';
  const isEditingMode = Boolean(editingItemId);
  const submitButtonText = isEditingMode ? 'Зберегти зміни' : 'Додати рядок';

  const availableVendorItemOptions = useMemo(() => {
    const takenIds = new Set(
      items
        .filter((item) => item.id !== editingItemId)
        .map((item) => item.vendor_item),
    );

    return MOCK_VENDOR_ITEMS.filter((item) => !takenIds.has(item.value)).map(
      (item) => ({
        value: item.value,
        label: item.label,
      }),
    );
  }, [items, editingItemId]);

  const resetForm = () => {
    setSelectedVendorItemId(null);
    setQuantity(null);
    setPrice(null);
    setExpectedDate(null);
    setEditingItemId(null);
  };

  const resetDrawerState = () => {
    setPricesIncludeVat(Boolean(order?.prices_include_vat));
    setItems(MOCK_ORDER_ITEMS);
    resetForm();
  };

  const handleCloseDrawer = () => {
    resetDrawerState();
    onClose();
  };

  const handleEditItem = (record) => {
    if (!canEditItem || isEditingMode) {
      return;
    }

    setEditingItemId(record.id);
    setSelectedVendorItemId(record.vendor_item);
    setQuantity(record.quantity);
    setPrice(record.agreed_price);
    setExpectedDate(
      record.expected_delivery_date
        ? dayjs(record.expected_delivery_date, 'YYYY-MM-DD')
        : null,
    );
  };

  const handleDeleteItem = (itemId) => {
    if (!canDeleteItem || isEditingMode) {
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    message.success('Тестовий рядок видалено.');
  };

  const handleSubmit = () => {
    if (!selectedVendorItemId) {
      message.error('Оберіть позицію постачальника.');
      return;
    }

    if (canEditAnyField) {
      if (
        quantity === null ||
        quantity === undefined ||
        Number(quantity) <= 0
      ) {
        message.error('Кількість повинна бути більшою за 0.');
        return;
      }

      if (price === null || price === undefined || Number(price) < 0) {
        message.error('Вкажіть коректну ціну.');
        return;
      }
    }

    if (!expectedDate) {
      message.error('Вкажіть дату очікуваної поставки.');
      return;
    }

    if (isEditingMode) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== editingItemId) {
            return item;
          }

          return {
            ...item,
            vendor_item: canEditAnyField
              ? selectedVendorItem.value
              : item.vendor_item,
            vendor_item_name: canEditAnyField
              ? selectedVendorItem.label
              : item.vendor_item_name,
            vendor_item_sku: canEditAnyField
              ? selectedVendorItem.vendor_sku
              : item.vendor_item_sku,
            inv_item_id: canEditAnyField
              ? selectedVendorItem.inv_item_id
              : item.inv_item_id,
            inv_item_name: canEditAnyField
              ? selectedVendorItem.inv_item_name
              : item.inv_item_name,
            unit_name: canEditAnyField
              ? selectedVendorItem.unit_name
              : item.unit_name,
            conversion_enabled: canEditAnyField
              ? selectedVendorItem.conversion_enabled
              : item.conversion_enabled,
            quantity: canEditAnyField ? Number(quantity) : item.quantity,
            agreed_price: canEditAnyField ? Number(price) : item.agreed_price,
            expected_delivery_date: expectedDate.format('YYYY-MM-DD'),
          };
        }),
      );

      message.success('Тестовий рядок оновлено.');
      resetForm();
      return;
    }

    const newItem = {
      id: Date.now(),
      vendor_item: selectedVendorItem.value,
      vendor_item_name: selectedVendorItem.label,
      vendor_item_sku: selectedVendorItem.vendor_sku,
      inv_item_id: selectedVendorItem.inv_item_id,
      inv_item_name: selectedVendorItem.inv_item_name,
      unit_name: selectedVendorItem.unit_name,
      conversion_enabled: selectedVendorItem.conversion_enabled,
      quantity: Number(quantity),
      agreed_price: Number(price),
      expected_delivery_date: expectedDate.format('YYYY-MM-DD'),
    };

    setItems((prev) => [...prev, newItem]);
    message.success('Тестовий рядок додано.');
    resetForm();
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
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isRowDimmed = isEditingMode && editingItemId !== record.id;

        return (
          <div style={{ opacity: isRowDimmed ? 0.45 : 1 }}>
            {`${formatPurchasePrice(value)} ₴`}
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
        const isThisRowEditing = editingItemId === record.id;
        const isOtherRowDimmed = isEditingMode && !isThisRowEditing;

        const editDisabled = !canEditItem || isOtherRowDimmed;
        const deleteDisabled = !canDeleteItem || isOtherRowDimmed;

        return (
          <Space size="middle" style={{ opacity: isOtherRowDimmed ? 0.45 : 1 }}>
            <EditOutlined
              style={{
                color: editDisabled ? '#d9d9d9' : '#1677ff',
                cursor: editDisabled ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!editDisabled) {
                  handleEditItem(record);
                }
              }}
            />

            {deleteDisabled ? (
              <DeleteOutlined
                style={{
                  color: '#d9d9d9',
                  cursor: 'default',
                }}
              />
            ) : (
              <Popconfirm
                title="Видалити рядок?"
                description="Ви впевнені, що хочете видалити цей тестовий рядок?"
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
            )}
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
        <Alert
          type="info"
          showIcon
          message="Прототип без API"
          description="Поведінка додавання, редагування і видалення працює локально для візуальної оцінки."
        />

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
                  onChange={setPricesIncludeVat}
                  checkedChildren="Так"
                  unCheckedChildren="Ні"
                  disabled={isEditingMode && canEditOnlyDate}
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
                onChange={setSelectedVendorItemId}
                options={availableVendorItemOptions}
                optionFilterProp="label"
                disabled={
                  !canEditAnyField || (isEditingMode && canEditOnlyDate)
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
                    !canEditAnyField || (isEditingMode && canEditOnlyDate)
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
                    !canEditAnyField || (isEditingMode && canEditOnlyDate)
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
                        cursor: selectedVendorItem ? 'pointer' : 'default',
                        opacity: selectedVendorItem ? 1 : 0.45,
                      }}
                      onClick={() => {
                        if (selectedVendorItem?.inv_item_id) {
                          window.open(
                            `/inventory/items/${selectedVendorItem.inv_item_id}`,
                            '_blank',
                          );
                        }
                      }}
                    />

                    <Text style={compactValueStyle}>
                      {selectedVendorItem?.inv_item_name || '—'}
                    </Text>
                  </Flex>
                </div>

                <div style={{ flex: '0 1 120px' }}>
                  <InfoCell
                    label="Одиниця"
                    value={selectedVendorItem?.unit_name}
                    compact
                  />
                </div>

                <div style={{ flex: '1 1 190px' }}>
                  <Text type="secondary" style={compactMutedStyle}>
                    Конвертація одиниць виміру
                  </Text>

                  <Switch
                    checked={Boolean(selectedVendorItem?.conversion_enabled)}
                    checkedChildren="Так"
                    unCheckedChildren="Ні"
                    disabled
                  />
                </div>
              </Flex>
            </div>

            <Flex justify="flex-end" gap={8}>
              <Button onClick={resetForm}>Очистити</Button>

              <Button
                type="primary"
                icon={isEditingMode ? undefined : <PlusOutlined />}
                onClick={handleSubmit}
                disabled={!canEditItem && !isEditingMode}
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
