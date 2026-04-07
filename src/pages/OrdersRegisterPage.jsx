import { useState } from 'react';
import {
  AppstoreAddOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Flex,
  Progress,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const mockOrders = [
  {
    id: 1,
    order_no: 'EO-2026-001',
    vendor_name: 'ТОВ Тест',
    status: 'draft',
    status_name: 'Чернетка',
    order_total_amount: 125000,
    payment_percent: 0,
    receipt_percent: 0,
    is_receipt_overdue: false,
    receipt_overdue_days: 0,
    receipt_expected_days: 7,
  },
  {
    id: 2,
    order_no: 'EO-2026-002',
    vendor_name: 'ТОВ Електроімпорт',
    status: 'in_progress',
    status_name: 'В роботі',
    order_total_amount: 348500,
    payment_percent: 35,
    receipt_percent: 20,
    is_receipt_overdue: true,
    receipt_overdue_days: 12,
  },
  {
    id: 3,
    order_no: 'EO-2026-003',
    vendor_name: 'ФОП Коваленко',
    status: 'in_progress',
    status_name: 'В роботі',
    order_total_amount: 68400,
    payment_percent: 80,
    receipt_percent: 55,
    is_receipt_overdue: false,
    receipt_overdue_days: 0,
    receipt_expected_days: 12,
  },
  {
    id: 4,
    order_no: 'EO-2026-004',
    vendor_name: 'ТОВ Метиз Груп',
    status: 'completed',
    status_name: 'Виконано',
    order_total_amount: 91200,
    payment_percent: 100,
    receipt_percent: 100,
    is_receipt_overdue: false,
    receipt_overdue_days: 0,
  },
];

const formatMoney = (value) =>
  new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getProgressStrokeColor = (percent, isOverdue = false) => {
  if (isOverdue) return '#ff4d4f';

  if (percent === 0) return '#bfbfbf';

  if (percent <= 24) return '#d9f7be'; // очень светлый зелёный
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a'; // 100%
};

function OrdersRegisterPage() {
  const navigate = useNavigate();

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchVendor, setSearchVendor] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPaymentRanges, setSelectedPaymentRanges] = useState([]);
  const [selectedReceiptRanges, setSelectedReceiptRanges] = useState([]);

  const matchPercentRange = (percent, ranges, isOverdue = false) => {
    if (ranges.length === 0) return true;

    return ranges.some((range) => {
      if (range === 'overdue') return isOverdue;
      if (range === '0') return percent === 0;
      if (range === '1-49') return percent >= 1 && percent <= 49;
      if (range === '50-99') return percent >= 50 && percent <= 99;
      if (range === '100') return percent === 100;
      return false;
    });
  };

  const filteredOrders = mockOrders.filter((order) => {
    const vendorMatches = order.vendor_name
      .toLowerCase()
      .includes(searchVendor.toLowerCase());

    const statusMatches =
      selectedStatuses.length === 0 || selectedStatuses.includes(order.status);

    const paymentMatches = matchPercentRange(
      order.payment_percent,
      selectedPaymentRanges,
    );

    const receiptMatches = matchPercentRange(
      order.receipt_percent,
      selectedReceiptRanges,
      order.is_receipt_overdue,
    );

    return vendorMatches && statusMatches && paymentMatches && receiptMatches;
  });

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Номер замовлення',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
      render: (value, record) => (
        <Link to={`/orders/${record.id}`}>{value}</Link>
      ),
    },
    {
      title: 'Постачальник',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      width: 240,
      render: (value) => (
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={value}
        >
          {value}
        </div>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      width: 150,
      align: 'center',
      render: (value, record) => (
        <Tag color={getStatusTagColor(record.status)}>{value}</Tag>
      ),
    },
    {
      title: 'Сума замовлення',
      dataIndex: 'order_total_amount',
      key: 'order_total_amount',
      width: 180,
      align: 'right',
      sorter: (a, b) => a.order_total_amount - b.order_total_amount,
      render: (value) => formatMoney(value),
    },
    {
      title: 'Сплачено',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      width: 180,
      sorter: (a, b) => a.payment_percent - b.payment_percent,
      render: (value) => (
        <Progress
          percent={value}
          size="small"
          strokeColor={getProgressStrokeColor(value)}
        />
      ),
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      width: 180,
      sorter: (a, b) => a.receipt_percent - b.receipt_percent,
      render: (value, record) => {
        const progress = (
          <Progress
            percent={value}
            size="small"
            strokeColor={getProgressStrokeColor(
              value,
              record.is_receipt_overdue,
            )}
          />
        );

        if (value === 100) {
          return progress;
        }

        let tooltipText = null;

        if (record.is_receipt_overdue) {
          tooltipText = `Прострочено на ${record.receipt_overdue_days} дн.`;
        } else {
          tooltipText = `Очікується за ${record.receipt_expected_days} дн.`;
        }

        return (
          <Tooltip title={tooltipText}>
            <div>{progress}</div>
          </Tooltip>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => (
        <AppstoreAddOutlined
          style={{
            fontSize: 17,
            color: '#8c8c8c',
            cursor: 'pointer',
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Реєстр замовлень
          </Title>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/orders/new')}
          >
            Додати замовлення
          </Button>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Text>
              Обрано: <strong>{selectedRowKeys.length}</strong>
            </Text>

            <Select
              placeholder="Дії"
              style={{ width: 180 }}
              disabled={selectedRowKeys.length === 0}
              options={[{ value: 'placeholder', label: 'Дії' }]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              showSearch={{ optionFilterProp: 'label' }}
              allowClear
              placeholder="Пошук по постачальнику"
              suffixIcon={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchVendor || undefined}
              onChange={(value) => setSearchVendor(value || '')}
              options={mockOrders.map((order) => ({
                value: order.vendor_name,
                label: order.vendor_name,
              }))}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Статус"
              style={{ minWidth: 220 }}
              value={selectedStatuses}
              onChange={setSelectedStatuses}
              options={[
                { value: 'draft', label: 'Чернетка' },
                { value: 'in_progress', label: 'В роботі' },
                { value: 'completed', label: 'Виконано' },
                { value: 'cancelled', label: 'Скасовано' },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Сплачено"
              style={{ minWidth: 180 }}
              value={selectedPaymentRanges}
              onChange={setSelectedPaymentRanges}
              options={[
                { value: '0', label: '0%' },
                { value: '1-49', label: '1–49%' },
                { value: '50-99', label: '50–99%' },
                { value: '100', label: '100%' },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Отримання"
              style={{ minWidth: 200 }}
              value={selectedReceiptRanges}
              onChange={setSelectedReceiptRanges}
              options={[
                { value: 'overdue', label: 'Прострочені' },
                { value: '0', label: '0%' },
                { value: '1-49', label: '1–49%' },
                { value: '50-99', label: '50–99%' },
                { value: '100', label: '100%' },
              ]}
            />
          </Flex>
        </Card>

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredOrders}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            size="small"
            pagination={{
              current: 1,
              pageSize: 50,
              total: filteredOrders.length,
              showSizeChanger: false,
              showTotal: (total, range) => (
                <span>
                  Показано{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {range[0]}–{range[1]}
                  </span>{' '}
                  з{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {total}
                  </span>{' '}
                  результатів пошуку
                </span>
              ),
            }}
            scroll={{ x: 1300 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default OrdersRegisterPage;
