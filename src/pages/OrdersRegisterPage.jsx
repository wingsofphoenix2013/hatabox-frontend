import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Progress,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import OrderReceiptDrawer from '../components/OrderReceiptDrawer';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

const getSorterOrder = (ordering, field) => {
  if (ordering === field) return 'ascend';
  if (ordering === `-${field}`) return 'descend';
  return null;
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
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);

  const [openOrderActionDrawer, setOpenOrderActionDrawer] = useState(null);
  const [selectedActionOrder, setSelectedActionOrder] = useState(null);
  const [loadingOrderActionId, setLoadingOrderActionId] = useState(null);
  const [loadingOrderActionType, setLoadingOrderActionType] = useState(null);

  const [vendorOptions, setVendorOptions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [suggestedOrderNo, setSuggestedOrderNo] = useState('');
  const [selectedVendorVat, setSelectedVendorVat] = useState(null);

  const [form] = Form.useForm();

  useEffect(() => {
    loadOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    searchText,
    selectedStatuses,
    selectedPaymentRanges,
    selectedReceiptRanges,
    ordering,
  ]);

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

    if (ordering) {
      params.set('ordering', ordering);
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
    ordering,
    currentPage,
    setSearchParams,
  ]);

  const loadOrders = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (searchText) {
        params.append('search', searchText);
      }

      if (ordering) {
        params.append('ordering', ordering);
      }

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      selectedPaymentRanges.forEach((range) => {
        params.append('payment_range', range);
      });

      selectedReceiptRanges.forEach((range) => {
        params.append('receipt_range', range);
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

  const openCreateDrawer = () => {
    setIsCreateDrawerOpen(true);
    form.resetFields();
    setVendorOptions([]);
    setSelectedVendor(null);
    setSuggestedOrderNo('');
    setSelectedVendorVat(null);
  };

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
    form.resetFields();
    setVendorOptions([]);
    setSelectedVendor(null);
    setSuggestedOrderNo('');
    setSelectedVendorVat(null);
  };

  const handleSearchVendors = async (searchValue) => {
    const query = searchValue?.trim();

    if (!query || query.length < 2) {
      setVendorOptions([]);
      return;
    }

    try {
      const response = await api.get(
        `vendors/?search=${encodeURIComponent(query)}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      setVendorOptions(
        results.map((item) => ({
          value: item.id,
          label: item.name,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to search vendors:', err);
      setVendorOptions([]);
    }
  };

  const buildSuggestedOrderNo = async (vendor) => {
    if (!vendor?.code) {
      setSuggestedOrderNo('');
      return;
    }

    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear());
      const datePart = `${day}${month}${year}`;

      const response = await api.get(`orders/?vendor=${vendor.id}`);

      const existing = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      const prefix = `${vendor.code}_${datePart}_`;

      const usedVariants = existing
        .map((row) => row.order_no || '')
        .filter((orderNo) => orderNo.startsWith(prefix))
        .map((orderNo) => {
          const raw = orderNo.slice(prefix.length);
          const parsed = Number(raw);
          return Number.isInteger(parsed) ? parsed : null;
        })
        .filter((value) => value !== null);

      const nextVariant =
        usedVariants.length > 0 ? Math.max(...usedVariants) + 1 : 1;

      setSuggestedOrderNo(`${prefix}${nextVariant}`);
    } catch (err) {
      console.error('Failed to build suggested order_no:', err);
      setSuggestedOrderNo('');
    }
  };

  const handleSelectVendor = async (value, option) => {
    const vendor = option?.item || null;

    setSelectedVendor(vendor);
    setSelectedVendorVat(vendor?.vat ?? null);
    form.setFieldValue('vendor', value);

    if (vendor?.vat === false) {
      form.setFieldValue('invoice_price_format', 'without_vat');
    } else {
      form.setFieldValue('invoice_price_format', undefined);
    }

    await buildSuggestedOrderNo(vendor);
  };

  const handleInsertSuggestedOrderNo = () => {
    if (!suggestedOrderNo) return;
    form.setFieldValue('order_no', suggestedOrderNo);
  };

  const handleSaveOrder = async (values) => {
    try {
      setCreateSaving(true);

      const pricesIncludeVat =
        selectedVendorVat === true
          ? values.invoice_price_format === 'with_vat'
          : false;

      const payload = new FormData();
      payload.append('vendor', String(values.vendor));
      payload.append('order_no', values.order_no);
      payload.append('comment', values.comment || '');
      payload.append('discount_amount', '0');
      payload.append('status', 'draft');
      payload.append('prices_include_vat', String(pricesIncludeVat));

      const response = await api.post('orders/', payload);

      const createdOrder = response.data;

      message.success('Замовлення створено.');
      closeCreateDrawer();
      navigate(`/orders/${createdOrder.id}/edit`);
    } catch (err) {
      console.error('Failed to create order:', err);

      console.error(
        'Failed to create order response data:',
        err?.response?.data,
      );
      console.error(
        'Failed to create order response status:',
        err?.response?.status,
      );

      const responseData = err?.response?.data;

      const backendMessage =
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        responseData?.order_no?.[0] ||
        responseData?.vendor?.[0] ||
        (typeof responseData === 'string' ? responseData : null);

      message.error(backendMessage || 'Не вдалося створити замовлення.');
    } finally {
      setCreateSaving(false);
    }
  };

  const handleOpenOrderAction = async (orderId, actionType) => {
    if (!orderId || !actionType) {
      return;
    }

    try {
      setLoadingOrderActionId(orderId);
      setLoadingOrderActionType(actionType);

      const response = await api.get(`orders/${orderId}/`);
      setSelectedActionOrder(response.data);
      setOpenOrderActionDrawer(actionType);
    } catch (err) {
      console.error(`Failed to load order for action "${actionType}":`, err);

      const responseData = err?.response?.data;
      const backendMessage =
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        (typeof responseData === 'string' ? responseData : null);

      message.error(backendMessage || 'Не вдалося завантажити замовлення.');
    } finally {
      setLoadingOrderActionId(null);
      setLoadingOrderActionType(null);
    }
  };

  const handleCloseOrderActionDrawer = () => {
    setOpenOrderActionDrawer(null);
    setSelectedActionOrder(null);
  };

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
        <Link
          to={`/orders/${record.id}`}
          state={{ orderLabel: record.order_no }}
        >
          {value}
        </Link>
      ),
    },
    {
      title: 'Постачальник',
      dataIndex: 'vendor_name',
      key: 'vendor_name',
      width: 260,
      render: (value, record) => (
        <Flex
          align="center"
          gap={6}
          style={{
            minWidth: 0,
          }}
        >
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

          {record.vendor && (
            <Link
              to={`/orders/vendors/${record.vendor}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InfoCircleOutlined
                style={{
                  color: '#1677ff',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              />
            </Link>
          )}
        </Flex>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const hasComment = Boolean(record.comment);
        const isCompleted = record.status === 'completed';
        const showCommentIcon = hasComment && !isCompleted;

        return (
          <Flex align="center" justify="center" gap={6}>
            <div
              style={{
                width: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {showCommentIcon && (
                <Tooltip
                  title={
                    <div style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>
                      <strong>Коментар:</strong>
                      <br />
                      {record.comment}
                    </div>
                  }
                >
                  <ExclamationCircleOutlined
                    style={{ color: '#faad14', fontSize: 14 }}
                  />
                </Tooltip>
              )}
            </div>

            <Tag color={getStatusTagColor(record.status)}>{value}</Tag>
          </Flex>
        );
      },
    },
    {
      title: 'Сума замовлення',
      dataIndex: 'order_total_amount',
      key: 'order_total_amount',
      width: 180,
      align: 'right',
      sorter: true,
      sortOrder: getSorterOrder(ordering, 'order_total_amount'),
      render: (value) => formatMoney(value),
    },
    {
      title: 'Сплачено',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      width: 180,
      sorter: true,
      sortOrder: getSorterOrder(ordering, 'payment_percent'),
      render: (value) => {
        const percent = Number(value) || 0;

        return (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(percent)}
          />
        );
      },
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      width: 180,
      sorter: true,
      sortOrder: getSorterOrder(ordering, 'receipt_percent'),
      render: (value, record) => {
        const percent = Number(value) || 0;
        const isOverdue = Boolean(record.is_receipt_overdue);

        const progress = (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(percent, isOverdue)}
          />
        );

        if (percent === 100 && !isOverdue) {
          return progress;
        }

        let tooltipText = null;

        if (isOverdue) {
          tooltipText = `Прострочено на ${record.receipt_overdue_days} дн.`;
        } else {
          tooltipText = `Очікується за ${record.receipt_expected_days} дн.`;
        }

        const content = (
          <Flex align="center" justify="space-between" gap={8}>
            <div style={{ flex: 1 }}>{progress}</div>

            {isOverdue && (
              <WarningOutlined
                style={{
                  color: '#ff4d4f',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </Flex>
        );

        if (isOverdue) {
          return (
            <Tooltip title={tooltipText}>
              <div
                style={{
                  background: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                  padding: '6px 8px',
                }}
              >
                {content}
              </div>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={tooltipText}>
            <div>{content}</div>
          </Tooltip>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_, record) => {
        const isLoading =
          loadingOrderActionId === record.id &&
          loadingOrderActionType === 'receipt';

        const items = [
          {
            key: 'receipt',
            label: 'Прибуткові накладні',
            onClick: () => {
              handleOpenOrderAction(record.id, 'receipt');
            },
          },
        ];

        if (isLoading) {
          return <Spin size="small" />;
        }

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <AppstoreAddOutlined
              style={{
                fontSize: 17,
                color: '#8c8c8c',
                cursor: 'pointer',
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  const handleTableChange = (pagination, _, sorter) => {
    if (pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }

    if (!Array.isArray(sorter)) {
      let nextOrdering = '';

      if (sorter.order === 'ascend') {
        nextOrdering = sorter.field;
      } else if (sorter.order === 'descend') {
        nextOrdering = `-${sorter.field}`;
      }

      if (nextOrdering !== ordering) {
        setOrdering(nextOrdering);
        setCurrentPage(1);
      }
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
            onClick={openCreateDrawer}
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
              onChange={(values) => {
                setSelectedPaymentRanges(values);
                setCurrentPage(1);
              }}
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
              onChange={(values) => {
                setSelectedReceiptRanges(values);
                setCurrentPage(1);
              }}
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
            dataSource={items}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            size="small"
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: 50,
              total,
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

      <Drawer
        title="Створення нового замовлення"
        placement="right"
        size="large"
        onClose={closeCreateDrawer}
        open={isCreateDrawerOpen}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveOrder}>
          <Form.Item
            label="Постачальник"
            name="vendor"
            rules={[{ required: true, message: 'Оберіть постачальника' }]}
          >
            <Select
              showSearch
              filterOption={false}
              placeholder="Почніть вводити назву постачальника"
              onSearch={handleSearchVendors}
              onChange={handleSelectVendor}
              options={vendorOptions}
            />
          </Form.Item>

          <Form.Item
            label="Номер замовлення"
            name="order_no"
            rules={[{ required: true, message: 'Вкажіть номер замовлення' }]}
          >
            <Input
              placeholder="Номер замовлення"
              addonAfter={
                <span
                  style={{
                    color: suggestedOrderNo ? '#1677ff' : '#bfbfbf',
                    cursor: suggestedOrderNo ? 'pointer' : 'default',
                  }}
                  onClick={handleInsertSuggestedOrderNo}
                >
                  <CopyOutlined />
                </span>
              }
            />
          </Form.Item>

          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Наприклад — {suggestedOrderNo || 'XXX_XXXXX_1'}
            </Text>
          </div>

          <Form.Item
            label="Формат рахунку постачальника"
            name="invoice_price_format"
            rules={[
              {
                validator: async (_, value) => {
                  if (selectedVendorVat === true && !value) {
                    throw new Error('Оберіть формат рахунку постачальника');
                  }
                },
              },
            ]}
          >
            <Select
              placeholder={
                selectedVendor
                  ? 'Оберіть формат рахунку'
                  : 'Спочатку оберіть постачальника'
              }
              disabled={!selectedVendor || selectedVendorVat === false}
              options={[
                {
                  value: 'without_vat',
                  label: (
                    <span>
                      Ціна у рахунку{' '}
                      <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                        без
                      </span>{' '}
                      ПДВ
                    </span>
                  ),
                },
                {
                  value: 'with_vat',
                  label: (
                    <span>
                      Ціна у рахунку{' '}
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>
                        з
                      </span>{' '}
                      ПДВ
                    </span>
                  ),
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Коментар"
            name="comment"
            style={{ marginBottom: 24 }}
          >
            <TextArea rows={4} placeholder="Коментар до замовлення" />
          </Form.Item>

          <Flex gap={8}>
            <Button onClick={closeCreateDrawer}>Відміна</Button>
            <Button type="primary" htmlType="submit" loading={createSaving}>
              Зберегти
            </Button>
          </Flex>
        </Form>
      </Drawer>
      <OrderReceiptDrawer
        open={openOrderActionDrawer === 'receipt'}
        onClose={handleCloseOrderActionDrawer}
        order={selectedActionOrder}
        onReceiptSaved={() => loadOrders(currentPage)}
      />
    </div>
  );
}

export default OrdersRegisterPage;
