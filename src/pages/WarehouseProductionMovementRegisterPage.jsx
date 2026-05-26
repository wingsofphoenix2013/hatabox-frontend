import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  BellFilled,
  FilePdfOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Dropdown,
  Flex,
  Input,
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
import { formatDateUa } from '../utils/orderFormatters';

const { Title, Text } = Typography;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS = {
  created: 'Чернетка',
  executed: 'Видано',
  cancelled: 'Скасовано',
};

const statusOptions = [
  { value: 'created', label: 'Чернетка' },
  { value: 'executed', label: 'Видано' },
  { value: 'cancelled', label: 'Скасовано' },
];

const getStatusTagColor = (status) => {
  switch (status) {
    case 'created':
      return 'default';
    case 'executed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

function WarehouseProductionMovementRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [stepOptions, setStepOptions] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('production_order_serial_number') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('production_order_serial_number') || '',
  );
  const [selectedStepNames, setSelectedStepNames] = useState(
    searchParams.getAll('production_order_step_name'),
  );
  const [selectedStatuses, setSelectedStatuses] = useState(
    searchParams.getAll('status'),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [stepOptionsLoading, setStepOptionsLoading] = useState(false);
  const [executingMovementId, setExecutingMovementId] = useState(null);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  const loadStepOptions = async () => {
    try {
      setStepOptionsLoading(true);

      const response = await api.get(
        'warehouse-production-movements/step-options/',
      );

      setStepOptions(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load production movement step options:', err);
      message.error('Не вдалося завантажити перелік етапів.');
      setStepOptions([]);
    } finally {
      setStepOptionsLoading(false);
    }
  };

  const loadMovements = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('production_order_serial_number', debouncedSearchText);
      }

      selectedStepNames.forEach((stepName) => {
        params.append('production_order_step_name', stepName);
      });

      selectedStatuses.forEach((status) => {
        params.append('status', status);
      });

      const response = await api.get(
        `warehouse-production-movements/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
    } catch (err) {
      console.error('Failed to load warehouse production movements:', err);
      setError('Не вдалося завантажити реєстр видачі компонентів.');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteMovement = async (movementId) => {
    if (!movementId) return;

    try {
      setExecutingMovementId(movementId);

      await api.post(
        `warehouse-production-movements/${movementId}/execute/`,
        {},
      );

      message.success('Компоненти видано у виробництво.');

      await loadMovements(currentPage);
    } catch (err) {
      console.error('Failed to execute warehouse production movement:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося видати компоненти.');
    } finally {
      setExecutingMovementId(null);
    }
  };

  useEffect(() => {
    loadStepOptions();
  }, []);

  useEffect(() => {
    loadMovements(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchText, selectedStepNames, selectedStatuses]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchText) {
      params.set('production_order_serial_number', debouncedSearchText);
    }

    selectedStepNames.forEach((stepName) => {
      params.append('production_order_step_name', stepName);
    });

    selectedStatuses.forEach((status) => {
      params.append('status', status);
    });

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    debouncedSearchText,
    selectedStepNames,
    selectedStatuses,
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
      title: 'Дата',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (value) => formatDateUa(value),
    },
    {
      title: 'Замовлення',
      key: 'sales_order',
      width: 320,
      render: (_, record) => {
        const orderLabel = `${record.product_family_name || '—'} №${
          record.production_order_serial_number || '—'
        }`;

        return (
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <div
              title={orderLabel}
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {record.product_family_name || '—'}{' '}
              <strong>№{record.production_order_serial_number || '—'}</strong>
            </div>

            {record.sales_order ? (
              <Link
                to={`/sales/orders/${record.sales_order}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InfoCircleOutlined style={{ color: '#1677ff' }} />
              </Link>
            ) : null}
          </Flex>
        );
      },
    },
    {
      title: 'Етап',
      key: 'production_order_step',
      width: 360,
      render: (_, record) => (
        <Flex align="center" gap={8} style={{ minWidth: 0 }}>
          <div
            title={record.production_order_step_name || '—'}
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {record.production_order_step_name || '—'}
          </div>

          {record.invoice_file ? (
            <a
              href={record.invoice_file}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FilePdfOutlined style={{ color: '#1677ff' }} />
            </a>
          ) : null}
        </Flex>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value, record) => (
        <Flex align="center" justify="center" gap={6}>
          <Tag color={getStatusTagColor(value)} style={{ marginInlineEnd: 0 }}>
            {STATUS_LABELS[value] || value || '—'}
          </Tag>

          {record.issue_requested ? (
            <BellFilled
              style={{
                color: '#ff4d4f',
                fontSize: 15,
              }}
            />
          ) : null}
        </Flex>
      ),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 90,
      align: 'center',
      render: (_, record) => {
        if (record.status !== 'created') {
          return (
            <Tooltip title="Переміщення вже виконано">
              <AppstoreAddOutlined
                style={{
                  fontSize: 17,
                  color: '#bfbfbf',
                  cursor: 'not-allowed',
                }}
              />
            </Tooltip>
          );
        }

        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'execute',
                  label: (
                    <Popconfirm
                      title="Видати компоненти?"
                      description="Цю операцію неможливо скасувати. Компоненти будуть передані у виробництво."
                      okText="Видати"
                      cancelText="Скасувати"
                      onConfirm={() => handleExecuteMovement(record.id)}
                    >
                      <span>Видати компоненти</span>
                    </Popconfirm>
                  ),
                },
              ],
            }}
          >
            <AppstoreAddOutlined
              style={{
                fontSize: 17,
                color: '#1677ff',
                cursor:
                  executingMovementId === record.id ? 'not-allowed' : 'pointer',
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
              Видача компонентів
            </Title>

            <Text type="secondary">
              Каталог документів на видачу під виробництво.
            </Text>
          </Flex>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Input
              placeholder="Пошук по серійному номеру"
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
              mode="multiple"
              allowClear
              showSearch
              placeholder="Етап виробництва"
              style={{ minWidth: 280 }}
              value={selectedStepNames}
              loading={stepOptionsLoading}
              options={stepOptions}
              optionFilterProp="label"
              onChange={(values) => {
                setSelectedStepNames(values);
                setCurrentPage(1);
              }}
            />

            <Select
              mode="multiple"
              allowClear
              placeholder="Статус"
              style={{ minWidth: 220 }}
              value={selectedStatuses}
              options={statusOptions}
              optionFilterProp="label"
              onChange={(values) => {
                setSelectedStatuses(values);
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
                  накладних
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає накладних для відображення.',
            }}
            scroll={{ x: 1120 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default WarehouseProductionMovementRegisterPage;
