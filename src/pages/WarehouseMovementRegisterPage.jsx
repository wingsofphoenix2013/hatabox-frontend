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
  Popconfirm,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import WarehouseMovementDrawer from '../components/WarehouseMovementDrawer';
import {
  MOVEMENT_PLAN_STATUS_LABELS,
  getMovementPlanStatusTagColor,
} from '../constants/movementPlanStatus';
import { formatDateDisplay } from '../utils/orderFormatters';
import { renderWarehousePlacement } from '../utils/warehousePlacementRenderers';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const pageSize = 50;

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

  const [editingPlanId, setEditingPlanId] = useState(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const [executingPlanId, setExecutingPlanId] = useState(null);

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

  const openEditDrawer = (planId) => {
    setEditingPlanId(planId);
    setIsCreateDrawerOpen(true);
  };

  const closeMovementDrawer = () => {
    setIsCreateDrawerOpen(false);
    setEditingPlanId(null);
  };

  const openCreateDrawer = () => {
    setEditingPlanId(null);
    setIsCreateDrawerOpen(true);
  };

  const handleExecutePlan = async (planId) => {
    if (!planId) return;

    try {
      setExecutingPlanId(planId);

      await api.post(`movement-plans/${planId}/execute/`, {});

      message.success('Переміщення виконано.');
      loadMovementPlans(currentPage);
    } catch (err) {
      console.error('Failed to execute movement plan:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося виконати переміщення.');
    } finally {
      setExecutingPlanId(null);
    }
  };

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
      render: (_, record) =>
        renderWarehousePlacement({
          locationCode: record.target_location_code,
          locationName: record.target_location_name,
          storagePlaceDisplayName: record.target_storage_place_display_name,
          storagePlaceFullDisplay: record.target_storage_place_full_display,
        }),
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
      render: (_, record) => {
        const dropdownItems = [
          {
            key: 'edit',
            label: <div style={{ padding: '4px 0' }}>Редагувати накладну</div>,
            onClick: () => openEditDrawer(record.id),
          },
        ];

        if (record.status === 'active') {
          dropdownItems.push({
            key: 'execute',
            label: (
              <Popconfirm
                title="Виконати переміщення?"
                description="Після виконання товари будуть переміщені на обрану локацію або місце зберігання."
                okText="Так"
                cancelText="Ні"
                onConfirm={() => handleExecutePlan(record.id)}
              >
                <div
                  style={{
                    padding: '4px 0',
                    color: '#1677ff',
                    cursor: 'pointer',
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {executingPlanId === record.id
                    ? 'Виконується...'
                    : 'Виконати переміщення'}
                </div>
              </Popconfirm>
            ),
            disabled: executingPlanId === record.id,
          });
        }

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

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateDrawer}
          >
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
      <WarehouseMovementDrawer
        open={isCreateDrawerOpen}
        onClose={closeMovementDrawer}
        planId={editingPlanId}
        onSaved={() => {
          if (!editingPlanId && currentPage !== 1) {
            setCurrentPage(1);
            return;
          }

          loadMovementPlans(currentPage);
        }}
      />
    </div>
  );
}

export default WarehouseMovementRegisterPage;
