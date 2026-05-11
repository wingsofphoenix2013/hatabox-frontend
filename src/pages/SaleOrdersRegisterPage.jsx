// src/pages/SaleOrdersRegisterPage.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import SaleOrderCreateDrawer from '../components/SaleOrderCreateDrawer';
import { formatDateUa } from '../utils/orderFormatters';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS = {
  draft: 'Чернетка',
  confirmed: 'Підтверджено',
  in_progress: 'В роботі',
  ready: 'Готово до передачі',
  completed: 'Виконано',
  cancelled: 'Скасовано',
};

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'warning';
    case 'ready':
      return 'cyan';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const statusOptions = [
  { value: 'draft', label: 'Чернетка' },
  { value: 'confirmed', label: 'Підтверджено' },
  { value: 'in_progress', label: 'В роботі' },
  { value: 'ready', label: 'Готово до передачі' },
  { value: 'completed', label: 'Виконано' },
  { value: 'cancelled', label: 'Скасовано' },
];

const dateFilterTypeOptions = [
  { value: 'created_at', label: 'Дата створення' },
  { value: 'completed_at', label: 'Дата завершення' },
];

function SaleOrdersRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedStatuses, setSelectedStatuses] = useState(
    searchParams.getAll('status'),
  );
  const [dateFilterType, setDateFilterType] = useState(
    searchParams.get('date_filter_type') || 'created_at',
  );
  const [dateRange, setDateRange] = useState(null);
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '');
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  useEffect(() => {
    loadSaleOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchText,
    selectedStatuses,
    dateFilterType,
    dateRange,
    ordering,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchText) {
      params.set('search', debouncedSearchText);
    }

    selectedStatuses.forEach((status) => {
      params.append('status', status);
    });

    if (dateFilterType) {
      params.set('date_filter_type', dateFilterType);
    }

    if (dateRange?.[0] && dateRange?.[1]) {
      params.set(`${dateFilterType}_from`, dateRange[0].format('YYYY-MM-DD'));
      params.set(`${dateFilterType}_to`, dateRange[1].format('YYYY-MM-DD'));
    }

    if (ordering) {
      params.set('ordering', ordering);
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    debouncedSearchText,
    selectedStatuses,
    dateFilterType,
    dateRange,
    ordering,
    currentPage,
    setSearchParams,
  ]);

  const loadSaleOrders = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      if (dateRange?.[0] && dateRange?.[1]) {
        params.append(
          `${dateFilterType}_from`,
          dateRange[0].format('YYYY-MM-DD'),
        );
        params.append(
          `${dateFilterType}_to`,
          dateRange[1].format('YYYY-MM-DD'),
        );
      }

      if (ordering) {
        params.append('ordering', ordering);
      }

      const response = await api.get(`sales-orders/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load sale orders:', err);
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
  };

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
  };

  const handleTableChange = (_, __, sorter) => {
    if (!sorter?.field || !sorter?.order) {
      setOrdering('');
      return;
    }

    if (sorter.field === 'created_at') {
      setOrdering(sorter.order === 'ascend' ? 'created_at' : '-created_at');
      return;
    }

    if (sorter.field === 'completed_at') {
      setOrdering(sorter.order === 'ascend' ? 'completed_at' : '-completed_at');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: '№',
        key: 'row_number',
        width: 70,
        align: 'center',
        render: (_, __, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: 'Замовлення',
        key: 'order',
        width: 180,
        render: (_, record) => {
          const orderLabel = `№ ${record.id} від ${formatDateUa(
            record.created_at,
          )}`;

          return (
            <Link
              to={`/sales/orders/${record.id}`}
              state={{
                orderLabel,
              }}
            >
              {orderLabel}
            </Link>
          );
        },
      },
      {
        title: 'Замовник',
        dataIndex: 'organization_name',
        key: 'organization_name',
        width: 280,
        render: (value, record) => (
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <div
              title={value || '—'}
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value || '—'}
            </div>

            {record.organization ? (
              <Link
                to={`/organizations/${record.organization}`}
                state={{
                  organizationLabel: value,
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InfoCircleOutlined />
              </Link>
            ) : null}
          </Flex>
        ),
      },
      {
        title: 'Виріб',
        key: 'product',
        width: 360,
        render: (_, record) => {
          const productLabel = `${record.product_code || '—'} | ${
            record.product_family_name || '—'
          }`;

          return (
            <Flex align="center" gap={8} style={{ minWidth: 0 }}>
              <div
                title={productLabel}
                style={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {productLabel}
              </div>

              {record.product ? (
                <Link
                  to={`/production/products/${record.product}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InfoCircleOutlined />
                </Link>
              ) : null}
            </Flex>
          );
        },
      },
      {
        title: 'Статус',
        dataIndex: 'status',
        key: 'status',
        width: 230,
        render: (value, record) => {
          const criticalIssues =
            Number(record.open_critical_confirmation_issues_count) || 0;

          return (
            <Flex align="center" gap={6} wrap>
              <Tag color={getStatusTagColor(value)}>
                {STATUS_LABELS[value] || value || '—'}
              </Tag>

              {value === 'draft' && (
                <Tooltip
                  title={
                    record.can_confirm_now
                      ? 'Замовлення можна підтвердити.'
                      : 'Не вистачає товару замовника для підтвердження замовлення.'
                  }
                >
                  <Tag color={record.can_confirm_now ? 'success' : 'error'}>
                    Проблем:{' '}
                    {criticalIssues === 0 ? (
                      '—'
                    ) : (
                      <span
                        style={{
                          color: '#cf1322',
                          fontWeight: 700,
                        }}
                      >
                        {criticalIssues}
                      </span>
                    )}
                  </Tag>
                </Tooltip>
              )}
            </Flex>
          );
        },
      },
      {
        title: 'Створено',
        dataIndex: 'created_at',
        key: 'created_at',
        field: 'created_at',
        width: 140,
        sorter: true,
        sortOrder:
          ordering === 'created_at'
            ? 'ascend'
            : ordering === '-created_at'
              ? 'descend'
              : null,
        render: (value) => formatDateUa(value),
      },
      {
        title: 'Завершено',
        dataIndex: 'completed_at',
        key: 'completed_at',
        field: 'completed_at',
        width: 140,
        sorter: true,
        sortOrder:
          ordering === 'completed_at'
            ? 'ascend'
            : ordering === '-completed_at'
              ? 'descend'
              : null,
        render: (value) => formatDateUa(value),
      },
      {
        title: 'Дії',
        key: 'actions',
        width: 70,
        align: 'center',
        render: () => {
          const menuItems = [
            {
              key: 'placeholder',
              label: (
                <div style={{ padding: '4px 0' }}>
                  Дії будуть додані пізніше
                </div>
              ),
            },
          ];

          return (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
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
    ],
    [currentPage, ordering],
  );

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Реєстр замовлень
            </Title>

            <Text type="secondary">
              Каталог замовлень на виробництво продукції.
            </Text>
          </Flex>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateDrawer}
          >
            Додати нове замовлення
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
              options={[
                {
                  value: 'placeholder',
                  label: 'Дії',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по виробу або замовнику"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
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
              placeholder="Статус"
              style={{ minWidth: 240 }}
              value={selectedStatuses}
              onChange={(values) => {
                setSelectedStatuses(values);
                setCurrentPage(1);
              }}
              options={statusOptions}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              placeholder="Тип дати"
              style={{ width: 180 }}
              value={dateFilterType}
              onChange={(value) => {
                setDateFilterType(value);
                setDateRange(null);
                setCurrentPage(1);
              }}
              options={dateFilterTypeOptions}
            />

            <RangePicker
              value={dateRange}
              onChange={(value) => {
                setDateRange(value);
                setCurrentPage(1);
              }}
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
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
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
                  замовлень
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає замовлень для відображення.',
            }}
            scroll={{ x: 1280 }}
          />
        </Card>
      </Flex>
      <SaleOrderCreateDrawer
        open={isCreateDrawerOpen}
        onClose={closeCreateDrawer}
        onCreated={() => loadSaleOrders(currentPage)}
      />
    </div>
  );
}

export default SaleOrdersRegisterPage;
