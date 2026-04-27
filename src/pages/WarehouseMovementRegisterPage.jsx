// src/pages/WarehouseMovementRegisterPage.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  PlusOutlined,
  WarningFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Dropdown,
  Flex,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import {
  MOVEMENT_PLAN_STATUS_LABELS,
  getMovementPlanStatusTagColor,
} from '../constants/movementPlanStatus';
import { formatDateDisplay } from '../utils/orderFormatters';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const pageSize = 50;

const getLocationTagStyle = () => ({
  color: '#595959',
  background: '#fafafa',
  borderColor: '#d9d9d9',
  fontWeight: 600,
  minWidth: 34,
  textAlign: 'center',
});

const getPlacementTagColor = (label = '') => {
  const normalized = label.toLowerCase();

  if (normalized.includes('контейнер')) return 'processing';
  if (normalized.includes('стелаж')) return 'success';
  if (normalized.includes('бокс')) return 'warning';

  return 'default';
};

const renderStoragePlaceChain = (value) => {
  if (!value) return null;

  const normalizedValue = value.replace(/\s+на локації\s*$/i, '');

  const parts = normalizedValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <Flex wrap={false} gap={6} style={{ whiteSpace: 'nowrap' }}>
      {parts.map((part, index) => {
        const tokens = part.split(' ');
        const code = tokens.pop();
        const label = tokens.join(' ');

        return (
          <Flex key={`${part}-${index}`} align="center" gap={4}>
            <span>{label}</span>
            <Tag
              color={getPlacementTagColor(label)}
              style={{ marginInlineEnd: 0, fontWeight: 600 }}
            >
              {code}
            </Tag>
            {index < parts.length - 1 && <span>,</span>}
          </Flex>
        );
      })}
    </Flex>
  );
};

const renderDestination = (record) => (
  <Flex align="center" gap={6} wrap={false} style={{ minWidth: 0 }}>
    <Tag
      style={{
        ...getLocationTagStyle(),
        marginInlineEnd: 0,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={`${record.target_location_code || '—'} - ${
        record.target_location_name || '—'
      }`}
    >
      {(record.target_location_code || '—') +
        ' - ' +
        (record.target_location_name || '—')}
    </Tag>

    {record.target_storage_place ? (
      <>
        <Text type="secondary">:</Text>
        <div
          title={record.target_storage_place_display_name || undefined}
          style={{
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {renderStoragePlaceChain(record.target_storage_place_full_display)}
        </div>
      </>
    ) : null}
  </Flex>
);

function WarehouseMovementRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [selectedStatuses, setSelectedStatuses] = useState(
    searchParams.getAll('status'),
  );

  const [createdAtRange, setCreatedAtRange] = useState(null);
  const [plannedAtRange, setPlannedAtRange] = useState(null);

  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadMovementPlans(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatuses, createdAtRange, plannedAtRange]);

  useEffect(() => {
    const params = new URLSearchParams();

    selectedStatuses.forEach((status) => {
      params.append('status', status);
    });

    if (createdAtRange?.[0]) {
      params.set('created_at_from', createdAtRange[0].format('YYYY-MM-DD'));
    }

    if (createdAtRange?.[1]) {
      params.set('created_at_to', createdAtRange[1].format('YYYY-MM-DD'));
    }

    if (plannedAtRange?.[0]) {
      params.set('planned_at_from', plannedAtRange[0].format('YYYY-MM-DD'));
    }

    if (plannedAtRange?.[1]) {
      params.set('planned_at_to', plannedAtRange[1].format('YYYY-MM-DD'));
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    selectedStatuses,
    createdAtRange,
    plannedAtRange,
    currentPage,
    setSearchParams,
  ]);

  const loadMovementPlans = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      if (createdAtRange?.[0]) {
        params.append(
          'created_at_from',
          createdAtRange[0].format('YYYY-MM-DD'),
        );
      }

      if (createdAtRange?.[1]) {
        params.append('created_at_to', createdAtRange[1].format('YYYY-MM-DD'));
      }

      if (plannedAtRange?.[0]) {
        params.append(
          'planned_at_from',
          plannedAtRange[0].format('YYYY-MM-DD'),
        );
      }

      if (plannedAtRange?.[1]) {
        params.append('planned_at_to', plannedAtRange[1].format('YYYY-MM-DD'));
      }

      const response = await api.get(`movement-plans/?${params.toString()}`);

      setItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setTotal(Number(response.data?.count) || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load movement plans:', err);
      setError('Не вдалося завантажити плани переміщення.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => [
      { value: 'draft', label: 'Чернетка' },
      { value: 'active', label: 'Активний' },
      { value: 'executed', label: 'Виконано' },
      { value: 'cancelled', label: 'Скасовано' },
    ],
    [],
  );

  const columns = [
    {
      title: 'Документ',
      key: 'document',
      width: 260,
      render: (_, record) => (
        <Link
          to={`/inventory/movements/${record.id}`}
          style={{
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {`Накладна №${record.id} від ${formatDateDisplay(record.created_at)}`}
        </Link>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (value) => (
        <Tag color={getMovementPlanStatusTagColor(value)}>
          {MOVEMENT_PLAN_STATUS_LABELS[value] || value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Заплановано',
      dataIndex: 'planned_at',
      key: 'planned_at',
      width: 180,
      align: 'center',
      render: (_, record) => {
        if (!record.planned_at) {
          return '—';
        }

        const dateText = formatDateDisplay(record.planned_at);
        const hasStatusText = Boolean(record.planned_status_text);

        const isToday = record.days_delta === 0;

        const content = record.is_overdue ? (
          <Tag color="error" style={{ fontWeight: 600 }}>
            <WarningFilled style={{ marginRight: 4 }} />
            {dateText}
          </Tag>
        ) : isToday ? (
          <Tag color="warning" style={{ fontWeight: 600 }}>
            <WarningFilled style={{ marginRight: 4 }} />
            {dateText}
          </Tag>
        ) : (
          <span>{dateText}</span>
        );

        if (!hasStatusText) {
          return content;
        }

        return <Tooltip title={record.planned_status_text}>{content}</Tooltip>;
      },
    },
    {
      title: 'Куди',
      key: 'destination',
      width: 420,
      render: (_, record) => renderDestination(record),
    },
    {
      title: 'Позицій',
      dataIndex: 'items_count',
      key: 'items_count',
      width: 110,
      align: 'center',
      render: (value) => <Text strong>{Number(value) || 0}</Text>,
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => {
        const dropdownItems = [
          {
            key: 'placeholder',
            label: (
              <div style={{ padding: '4px 0' }}>Дії будуть додані пізніше</div>
            ),
          },
        ];

        return (
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
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

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Переміщення товарів
            </Title>

            <Text type="secondary">
              Реєстр планів переміщення товарів між локаціями та місцями
              зберігання.
            </Text>
          </Flex>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Створити план переміщення
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
              value={undefined}
              options={[
                {
                  value: 'placeholder',
                  label: 'Дії будуть додані пізніше',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Статус"
              style={{ minWidth: 220 }}
              value={selectedStatuses}
              onChange={(values) => {
                setSelectedStatuses(values);
                setCurrentPage(1);
              }}
              options={statusOptions}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <RangePicker
              placeholder={['Створено від', 'Створено до']}
              value={createdAtRange}
              onChange={(value) => {
                setCreatedAtRange(value);
                setCurrentPage(1);
              }}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <RangePicker
              placeholder={['Заплановано від', 'Заплановано до']}
              value={plannedAtRange}
              onChange={(value) => {
                setPlannedAtRange(value);
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
            pagination={{
              current: currentPage,
              pageSize,
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
                  планів
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає планів переміщення для відображення.',
            }}
            scroll={{ x: 1280 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default WarehouseMovementRegisterPage;
