import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  AppstoreAddOutlined,
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
  message,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import OrderTollingCreateDrawer from '../components/OrderTollingCreateDrawer';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateDisplay } from '../utils/orderFormatters';

const { Title, Text } = Typography;

const getTollingStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'active':
      return 'processing';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const TOLLING_STATUS_OPTIONS = [
  { value: 'draft', label: 'Чернетка' },
  { value: 'active', label: 'В роботі' },
  { value: 'completed', label: 'Завершено' },
];

const ORGANIZATION_TYPE_LABELS = {
  military: 'Військова частина',
  commercial: 'Комерційна організація',
  charity: 'Благодійна організація',
};

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'military', label: 'Військова частина' },
  { value: 'commercial', label: 'Комерційна організація' },
  { value: 'charity', label: 'Благодійна організація' },
];

function OrdersTollingRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedOrganization, setSelectedOrganization] = useState(
    searchParams.get('organization')
      ? Number(searchParams.get('organization'))
      : null,
  );

  const [selectedOrganizationType, setSelectedOrganizationType] = useState(
    searchParams.get('organization_type') || null,
  );
  const [selectedStatuses, setSelectedStatuses] = useState(
    searchParams.getAll('status'),
  );
  const [createdAtFrom, setCreatedAtFrom] = useState(
    searchParams.get('created_at_from')
      ? dayjs(searchParams.get('created_at_from'), 'YYYY-MM-DD')
      : null,
  );
  const [createdAtTo, setCreatedAtTo] = useState(
    searchParams.get('created_at_to')
      ? dayjs(searchParams.get('created_at_to'), 'YYYY-MM-DD')
      : null,
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadOrders(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    searchText,
    selectedOrganization,
    selectedOrganizationType,
    selectedStatuses,
    createdAtFrom,
    createdAtTo,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchText) {
      params.set('search', searchText);
    }

    if (selectedOrganization) {
      params.set('organization', String(selectedOrganization));
    }

    if (selectedOrganizationType) {
      params.set('organization_type', selectedOrganizationType);
    }

    selectedStatuses.forEach((status) => {
      params.append('status', status);
    });

    if (createdAtFrom) {
      params.set('created_at_from', createdAtFrom.format('YYYY-MM-DD'));
    }

    if (createdAtTo) {
      params.set('created_at_to', createdAtTo.format('YYYY-MM-DD'));
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    searchText,
    selectedOrganization,
    selectedOrganizationType,
    selectedStatuses,
    createdAtFrom,
    createdAtTo,
    currentPage,
    setSearchParams,
  ]);

  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);

      const response = await api.get('organizations/');
      const results = Array.isArray(response.data) ? response.data : [];

      setOrganizations(
        results.map((item) => ({
          value: item.id,
          label: item.name,
          type: item.type || null,
        })),
      );
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setOrganizations([]);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      message.error(
        backendMessage || 'Не вдалося завантажити список організацій.',
      );
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const loadOrders = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (searchText) {
        params.append('search', searchText);
      }

      if (selectedOrganization) {
        params.set('organization', String(selectedOrganization));
      }

      if (selectedOrganizationType) {
        params.set('organization_type', selectedOrganizationType);
      }

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      if (createdAtFrom) {
        params.append('created_at_from', createdAtFrom.format('YYYY-MM-DD'));
      }

      if (createdAtTo) {
        params.append('created_at_to', createdAtTo.format('YYYY-MM-DD'));
      }

      const response = await api.get(`tolling-orders/?${params.toString()}`);

      setItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setTotal(Number(response.data?.count) || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load tolling orders:', err);

      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      setError(
        backendMessage || 'Не вдалося завантажити реєстр давальчих поставок.',
      );
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationTypeById = (organizationId) => {
    const matchedOrganization = organizations.find(
      (item) => item.value === organizationId,
    );

    return matchedOrganization?.type || null;
  };

  const columns = [
    {
      title: 'Номер документа',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 220,
      render: (value, record) => (
        <Link
          to={`/orders/tolling/${record.id}`}
          state={{ tollingOrderLabel: record.order_no }}
        >
          {value || '—'}
        </Link>
      ),
    },
    {
      title: 'Дата документа',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (value) => formatDateDisplay(value),
    },
    {
      title: 'Назва організації',
      dataIndex: 'organization_name',
      key: 'organization_name',
      width: 420,
      render: (value, record) => {
        const organizationType = getOrganizationTypeById(record.organization);
        const organizationTypeLabel = organizationType
          ? ORGANIZATION_TYPE_LABELS[organizationType]
          : null;

        return (
          <Flex align="center" gap={8} wrap>
            <span>{value || '—'}</span>

            {organizationTypeLabel && (
              <Tag color="default">{organizationTypeLabel}</Tag>
            )}
          </Flex>
        );
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      align: 'center',
      render: (value) => {
        const statusOption = TOLLING_STATUS_OPTIONS.find(
          (item) => item.value === value,
        );

        return (
          <Tag color={getTollingStatusTagColor(value)}>
            {statusOption?.label || value || '—'}
          </Tag>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => {
        const items = [
          {
            key: 'placeholder',
            label: (
              <div style={{ padding: '4px 0' }}>Дії будуть додані пізніше</div>
            ),
          },
        ];

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

  const handleTableChange = (pagination) => {
    if (pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Реєстр давальчих поставок
            </Title>
            <Text type="secondary">
              Перелік документів передачі давальницьких товарів від організацій
              з контролем статусу обробки.
            </Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            Додати передачу
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
              placeholder="Пошук (номер / організація)"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Перелік організацій"
              style={{ minWidth: 260 }}
              loading={organizationsLoading}
              value={selectedOrganization}
              onChange={(value) => {
                setSelectedOrganization(value ?? null);
                setCurrentPage(1);
              }}
              options={organizations}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              allowClear
              placeholder="Тип організацій"
              style={{ minWidth: 240 }}
              value={selectedOrganizationType}
              onChange={(value) => {
                setSelectedOrganizationType(value ?? null);
                setCurrentPage(1);
              }}
              options={ORGANIZATION_TYPE_OPTIONS}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Статус"
              style={{ minWidth: 220 }}
              value={selectedStatuses}
              onChange={(values) => {
                setSelectedStatuses(values);
                setCurrentPage(1);
              }}
              options={TOLLING_STATUS_OPTIONS}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <DatePicker
              placeholder="Дата від"
              format="DD-MM-YYYY"
              value={createdAtFrom}
              onChange={(value) => {
                setCreatedAtFrom(value);
                setCurrentPage(1);
              }}
            />

            <DatePicker
              placeholder="Дата до"
              format="DD-MM-YYYY"
              value={createdAtTo}
              onChange={(value) => {
                setCreatedAtTo(value);
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
            scroll={{ x: 1000 }}
          />
        </Card>
      </Flex>

      <OrderTollingCreateDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        organizations={organizations}
        onCompleted={async () => {
          await loadOrders(currentPage);
        }}
      />
    </div>
  );
}

export default OrdersTollingRegisterPage;
