import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Card,
  DatePicker,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';

import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const productionOrderStatusOptions = [
  { value: 'in_progress', label: 'В роботі' },
  { value: 'ready', label: 'Готово' },
];

const getProductionOrderStatusTagColor = (status) => {
  switch (status) {
    case 'in_progress':
      return 'purple';
    case 'ready':
      return 'success';
    default:
      return 'default';
  }
};

const getStepStatusTagColor = (status) => {
  switch (status) {
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'purple';
    case 'finished':
      return 'success';
    default:
      return 'default';
  }
};

function ProductionOrderRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [currentStepOptions, setCurrentStepOptions] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedStatus, setSelectedStatus] = useState(
    searchParams.get('production_order_status') || null,
  );
  const [selectedCurrentSteps, setSelectedCurrentSteps] = useState(
    searchParams.getAll('current_step').map((value) => Number(value)),
  );
  const [dateRange, setDateRange] = useState(null);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [currentStepOptionsLoading, setCurrentStepOptionsLoading] =
    useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  const loadCurrentStepOptions = async () => {
    try {
      setCurrentStepOptionsLoading(true);

      const response = await api.get(
        'production-orders-registry/current-step-options/',
      );

      setCurrentStepOptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load current step options:', err);
      setCurrentStepOptions([]);
    } finally {
      setCurrentStepOptionsLoading(false);
    }
  };

  const loadProductionOrders = async (page) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      if (selectedStatus) {
        params.append('production_order_status', selectedStatus);
      }

      selectedCurrentSteps.forEach((stepId) => {
        params.append('current_step', String(stepId));
      });

      if (dateRange?.[0] && dateRange?.[1]) {
        params.append(
          'sales_order_created_at_from',
          dateRange[0].format('YYYY-MM-DD'),
        );
        params.append(
          'sales_order_created_at_to',
          dateRange[1].format('YYYY-MM-DD'),
        );
      }

      const response = await api.get(
        `production-orders-registry/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
    } catch (err) {
      console.error('Failed to load production orders registry:', err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentStepOptions();
  }, []);

  useEffect(() => {
    loadProductionOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchText,
    selectedStatus,
    selectedCurrentSteps,
    dateRange,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchText) {
      params.set('search', debouncedSearchText);
    }

    if (selectedStatus) {
      params.set('production_order_status', selectedStatus);
    }

    selectedCurrentSteps.forEach((stepId) => {
      params.append('current_step', String(stepId));
    });

    if (dateRange?.[0] && dateRange?.[1]) {
      params.set(
        'sales_order_created_at_from',
        dateRange[0].format('YYYY-MM-DD'),
      );
      params.set(
        'sales_order_created_at_to',
        dateRange[1].format('YYYY-MM-DD'),
      );
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    debouncedSearchText,
    selectedStatus,
    selectedCurrentSteps,
    dateRange,
    currentPage,
    setSearchParams,
  ]);

  const columns = [
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
      width: 460,
      render: (_, record) => (
        <Flex vertical gap={4} style={{ minWidth: 0 }}>
          <Link
            to={`/production/orders/${record.production_order}`}
            style={{
              fontSize: 14,
              fontWeight: 600,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={`${record.product_code || '—'} | ${
              record.product_family_name || '—'
            } №${record.serial_number || '—'}`}
          >
            {record.product_code || '—'} | {record.product_family_name || '—'}{' '}
            <strong>№{record.serial_number || '—'}</strong>
          </Link>

          <Flex align="center" gap={6} wrap>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Замовлення від {formatDateUa(record.sales_order_created_at)} для{' '}
              {record.organization_name || '—'}
            </Text>

            <Tag
              color={getProductionOrderStatusTagColor(
                record.production_order_status,
              )}
              style={{ marginInlineEnd: 0 }}
            >
              {record.production_order_status_display ||
                record.production_order_status ||
                '—'}
            </Tag>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Етап',
      key: 'current_step',
      width: 420,
      render: (_, record) => (
        <Flex vertical gap={4} style={{ minWidth: 0 }}>
          <Flex align="center" gap={6} wrap>
            <Text
              strong
              style={{
                fontSize: 14,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={
                record.current_step
                  ? `Етап ${record.current_step}. ${
                      record.current_step_name || '—'
                    }.`
                  : '—'
              }
            >
              {record.current_step
                ? `Етап ${record.current_step}. ${
                    record.current_step_name || '—'
                  }.`
                : '—'}
            </Text>

            {record.current_step_status ? (
              <Tag
                color={getStepStatusTagColor(record.current_step_status)}
                style={{ marginInlineEnd: 0 }}
              >
                {record.current_step_status_display ||
                  record.current_step_status}
              </Tag>
            ) : null}
          </Flex>

          <Flex align="center" gap={6}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Компоненти видано:
            </Text>

            {record.current_step_components_transferred ? (
              <CheckCircleFilled
                style={{
                  color: '#52c41a',
                  fontSize: 15,
                }}
              />
            ) : (
              <CloseCircleFilled
                style={{
                  color: '#ff4d4f',
                  fontSize: 15,
                }}
              />
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Закінчення',
      key: 'current_step_expected_finished_at',
      width: 170,
      align: 'center',
      render: (_, record) => {
        if (!record.current_step_expected_finished_at) {
          return '—';
        }

        const dateText = formatDateUa(record.current_step_expected_finished_at);

        if (record.current_step_is_overdue) {
          return (
            <Tooltip
              title={`Днів прострочки: ${Math.abs(
                Number(record.current_step_days_left) || 0,
              )}`}
            >
              <Tag color="error" style={{ marginInlineEnd: 0 }}>
                {dateText}
              </Tag>
            </Tooltip>
          );
        }

        return (
          <Tooltip
            title={`Днів до закінчення робіт: ${
              record.current_step_days_left ?? '—'
            }`}
          >
            <span>{dateText}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 90,
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'placeholder',
                label: (
                  <div style={{ padding: '4px 0' }}>
                    Дії будуть додані пізніше
                  </div>
                ),
              },
            ],
          }}
          trigger={['click']}
        >
          <AppstoreAddOutlined
            style={{
              fontSize: 17,
              color: '#1677ff',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            Карти виробництва
          </Title>

          <Text type="secondary">Каталог виробничих процесів</Text>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Input
              placeholder="Пошук"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setCurrentPage(1);
              }}
            />

            <Select
              allowClear
              placeholder="Статус замовлення"
              style={{ width: 220 }}
              value={selectedStatus}
              options={productionOrderStatusOptions}
              optionFilterProp="label"
              onChange={(value) => {
                setSelectedStatus(value || null);
                setCurrentPage(1);
              }}
            />

            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Поточний етап"
              style={{ minWidth: 280 }}
              value={selectedCurrentSteps}
              loading={currentStepOptionsLoading}
              options={currentStepOptions}
              optionFilterProp="label"
              onChange={(values) => {
                setSelectedCurrentSteps(values);
                setCurrentPage(1);
              }}
            />

            <RangePicker
              placeholder={['Дата замовлення з', 'Дата замовлення по']}
              value={dateRange}
              onChange={(value) => {
                setDateRange(value);
                setCurrentPage(1);
              }}
            />
          </Flex>
        </Card>

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="production_order"
            loading={loading}
            columns={columns}
            dataSource={items}
            size="small"
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
                  карт
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає карт виробництва для відображення.',
            }}
            scroll={{ x: 1220 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default ProductionOrderRegisterPage;
