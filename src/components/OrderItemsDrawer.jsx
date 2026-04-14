import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tag,
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
  },
  {
    value: 102,
    label: 'Пружина підвіски задня',
    vendor_sku: 'PZ-204',
  },
  {
    value: 103,
    label: 'Опора амортизатора',
    vendor_sku: 'OA-778',
  },
  {
    value: 104,
    label: 'Сайлентблок важеля',
    vendor_sku: 'SV-450',
  },
];

const MOCK_ORDER_ITEMS = [
  {
    id: 1,
    vendor_item: 101,
    vendor_item_name: 'Амортизатор газовий передній',
    vendor_item_sku: 'AGP-001',
    quantity: 4,
    agreed_price: 1250.5,
    expected_delivery_date: '2026-04-20',
  },
  {
    id: 2,
    vendor_item: 102,
    vendor_item_name: 'Пружина підвіски задня',
    vendor_item_sku: 'PZ-204',
    quantity: 2,
    agreed_price: 890,
    expected_delivery_date: '2026-04-22',
  },
  {
    id: 3,
    vendor_item: 103,
    vendor_item_name: 'Опора амортизатора',
    vendor_item_sku: 'OA-778',
    quantity: 6,
    agreed_price: 215.75,
    expected_delivery_date: '2026-04-25',
  },
];

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

function OrderItemsDrawer({ open, onClose, order }) {
  const [pricesIncludeVat, setPricesIncludeVat] = useState(
    Boolean(order?.prices_include_vat),
  );

  const [items, setItems] = useState(MOCK_ORDER_ITEMS);

  const [selectedVendorItemId, setSelectedVendorItemId] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [price, setPrice] = useState(null);
  const [expectedDate, setExpectedDate] = useState(null);

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

  const resetForm = () => {
    setSelectedVendorItemId(null);
    setQuantity(null);
    setPrice(null);
    setExpectedDate(null);
  };

  const handleAddMockItem = () => {
    if (!selectedVendorItemId) {
      message.error('Оберіть позицію постачальника.');
      return;
    }

    if (quantity === null || quantity === undefined || Number(quantity) <= 0) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    if (price === null || price === undefined || Number(price) < 0) {
      message.error('Вкажіть коректну ціну.');
      return;
    }

    if (!expectedDate) {
      message.error('Вкажіть дату очікуваної поставки.');
      return;
    }

    const newItem = {
      id: Date.now(),
      vendor_item: selectedVendorItem.value,
      vendor_item_name: selectedVendorItem.label,
      vendor_item_sku: selectedVendorItem.vendor_sku,
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
      render: (value) => value || '—',
    },
    {
      title: 'vendor_sku',
      dataIndex: 'vendor_item_sku',
      key: 'vendor_item_sku',
      width: 140,
      align: 'center',
      render: (value) => value || '—',
    },
    {
      title: 'К-сть',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value) => formatQuantity(value),
    },
    {
      title: pricesIncludeVat ? 'Ціна' : 'Ціна без ПДВ',
      dataIndex: 'agreed_price',
      key: 'agreed_price',
      width: 150,
      align: 'center',
      render: (value) => `${formatPurchasePrice(value)} ₴`,
    },
    {
      title: 'Поставка',
      dataIndex: 'expected_delivery_date',
      key: 'expected_delivery_date',
      width: 150,
      align: 'center',
      render: (value) => {
        if (!value) return '—';
        const date = dayjs(value, 'YYYY-MM-DD');
        return date.isValid() ? date.format('DD-MM-YYYY') : '—';
      },
    },
    {
      title: '',
      key: 'actions',
      width: 90,
      align: 'center',
      render: () => (
        <Space size="middle">
          <EditOutlined style={{ color: '#1677ff', cursor: 'pointer' }} />
          <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title="Комплектація замовлення"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Alert
          type="info"
          showIcon
          message="Прототип без API"
          description="Форма і таблиця працюють локально тільки для візуальної оцінки."
        />

        <Card
          title={
            <Flex justify="space-between" align="center" wrap gap={12}>
              <span>1. Додати рядок замовлення</span>

              <Flex align="center" gap={8}>
                <Text>Ціна у рахунку враховує ПДВ</Text>
                <Switch
                  checked={pricesIncludeVat}
                  onChange={setPricesIncludeVat}
                  checkedChildren="Так"
                  unCheckedChildren="Ні"
                />
              </Flex>
            </Flex>
          }
        >
          <Flex vertical gap={16}>
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Позиція постачальника
              </Text>
              <Select
                showSearch
                placeholder="Оберіть позицію"
                style={{ width: '100%' }}
                value={selectedVendorItemId}
                onChange={setSelectedVendorItemId}
                options={MOCK_VENDOR_ITEMS}
                optionFilterProp="label"
              />
            </div>

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                vendor_sku
              </Text>
              <Tag>{selectedVendorItem?.vendor_sku || '—'}</Tag>
            </div>

            <Flex gap={16} wrap>
              <div style={{ flex: 1, minWidth: 180 }}>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Кількість
                </Text>
                <InputNumber
                  min={0.001}
                  step={0.001}
                  controls={false}
                  value={quantity}
                  onChange={setQuantity}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  {pricesIncludeVat ? 'Ціна' : 'Ціна без ПДВ'}
                </Text>
                <InputNumber
                  min={0}
                  step={0.0001}
                  precision={4}
                  controls={false}
                  value={price}
                  onChange={setPrice}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 180 }}>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Дата очікуваної поставки
                </Text>
                <DatePicker
                  value={expectedDate}
                  format="DD-MM-YYYY"
                  onChange={setExpectedDate}
                  style={{ width: '100%' }}
                />
              </div>
            </Flex>

            <Flex justify="flex-end" gap={8}>
              <Button onClick={resetForm}>Очистити</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddMockItem}
              >
                Додати рядок
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
                <Text type="secondary">ПДВ: {formatMoney(vatAmount)} ₴</Text>
              </div>
            </Flex>
          }
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={items}
            pagination={false}
            size="small"
          />
        </Card>

        <Flex justify="flex-end">
          <Button onClick={onClose}>Закрити</Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderItemsDrawer;
