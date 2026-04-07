import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Flex,
  Input,
  Progress,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const formatMoney = (value) =>
  new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

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
  if (percent <= 24) return '#d9f7be';
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a';
};

function OrdersRegisterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedStatuses, setSelectedStatuses] = useState(
    searchParams.getAll('status'),
  );
  const [selectedPaymentRanges, setSelectedPaymentRanges] = useState(
    searchParams.getAll('payment_range'),
  );
  const [selectedReceiptRanges, setSelectedReceiptRanges] = useState(
    searchParams.getAll('receipt_range'),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadOrders(currentPage);
  }, [currentPage, searchText, selectedStatuses]);

  useEffect(() => {
    const params = new URLSearchParams();

    selectedStatuses.forEach((status) => {
      params.append('status', status);
    });

    selectedPaymentRanges.forEach((range) => {
      params.append('payment_range', range);
    });

    selectedReceiptRanges.forEach((range) => {
      params.append('receipt_range', range);
    });

    if (searchText) {
      params.set('search', searchText);
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    selectedStatuses,
    selectedPaymentRanges,
    selectedReceiptRanges,
    searchText,
    currentPage,
    setSearchParams,
  ]);

  const loadOrders = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page);

      if (searchText) {
        params.append('search', searchText);
      }

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      const response = await api.get(`orders/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Не вдалося завантажити реєстр замовлень.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredOrders = useMemo(() => {
    return items.filter((order) => {
      const paymentMatches = matchPercentRange(
        Number(order.payment_percent) || 0,
        selectedPaymentRanges,
      );

      const receiptMatches = matchPercentRange(
        Number(order.receipt_percent) || 0,
        selectedReceiptRanges,
        Boolean(order.is_receipt_overdue),
      );

      return paymentMatches && receiptMatches;
    });
  }, [items, selectedPaymentRanges, selectedReceiptRanges]);

  const displayTotal =
    selectedPaymentRanges.length > 0 || selectedReceiptRanges.length > 0
      ? filteredOrders.length
      : total;

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * 50 + index + 1,
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
          {value || '—'}
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
      sorter: (a, b) =>
        (Number(a.order_total_amount) || 0) -
        (Number(b.order_total_amount) || 0),
      render: (value) => formatMoney(value),
    },
    {
      title: 'Сплачено',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      width: 180,
      sorter: (a, b) =>
        (Number(a.payment_percent) || 0) - (Number(b.payment_percent) || 0),
      render: (value) => (
        <Progress
          percent={Number(value) || 0}
          size="small"
          strokeColor={getProgressStrokeColor(Number(value) || 0)}
        />
      ),
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      width: 180,
      sorter: (a, b) =>
        (Number(a.receipt_percent) || 0) - (Number(b.receipt_percent) || 0),
      render: (value, record) => {
        const percent = Number(value) || 0;

        const progress = (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(
              percent,
              Boolean(record.is_receipt_overdue),
            )}
          />
        );

        if (percent === 100) {
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

  const handleTableChange = (pagination) => {
    if (pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
  };

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

            <Input
              placeholder="Пошук по постачальнику"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              showSearch={{ optionFilterProp: 'label' }}
              placeholder="Статус"
              style={{ minWidth: 220 }}
              value={selectedStatuses}
              onChange={(values) => {
                setSelectedStatuses(values);
                setCurrentPage(1);
              }}
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

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredOrders}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            size="small"
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: 50,
              total: displayTotal,
              showSizeChanger: false,
              showTotal: (totalValue, range) => (
                <span>
                  Показано{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {range[0]}–{range[1]}
                  </span>{' '}
                  з{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {totalValue}
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
