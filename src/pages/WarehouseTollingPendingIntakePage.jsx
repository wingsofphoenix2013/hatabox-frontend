import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Divider,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';
import { getApiErrorMessage } from '../utils/apiError';
import WarehouseIntakeDrawer from '../components/WarehouseIntakeDrawer';

const { Title, Text } = Typography;

function WarehouseTollingPendingIntakePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );

  const [locations, setLocations] = useState([]);
  const [locationsError, setLocationsError] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetPendingItems, setPresetPendingItems] = useState([]);

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const pageSize = 50;

  useEffect(() => {
    const params = new URLSearchParams();

    const normalizedSearch = searchText.trim();

    if (normalizedSearch) {
      params.set('search', normalizedSearch);
    }

    if (page > 1) {
      params.set('page', String(page));
    }

    setSearchParams(params);
  }, [searchText, page, setSearchParams]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsError('');

        const response = await api.get('warehouse-locations/', {
          params: { is_active: true },
        });

        setLocations(
          Array.isArray(response.data?.results) ? response.data.results : [],
        );
      } catch (err) {
        console.error('Failed to load warehouse locations:', err);

        const backendMessage = getApiErrorMessage(err?.response?.data);

        setLocations([]);
        setLocationsError(
          backendMessage || 'Не вдалося завантажити перелік активних локацій.',
        );
      }
    };

    loadLocations();
  }, []);

  useEffect(() => {
    const loadPendingIntakeItems = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {
          page,
        };

        const normalizedSearch = searchText.trim();

        if (normalizedSearch) {
          params.search = normalizedSearch;
        }

        const response = await api.get(
          'warehouse-tolling-pending-intake-items/',
          {
            params,
          },
        );

        setItems(
          Array.isArray(response.data?.results) ? response.data.results : [],
        );
        setTotal(Number(response.data?.count) || 0);
        setSelectedRowKeys([]);
      } catch (err) {
        console.error(
          'Failed to load warehouse tolling pending intake items:',
          err,
        );

        const backendMessage = getApiErrorMessage(err?.response?.data);

        setError(
          backendMessage ||
            'Не вдалося завантажити список первинного оформлення давальницьких товарів.',
        );
        setItems([]);
        setTotal(0);
        setSelectedRowKeys([]);
      } finally {
        setLoading(false);
      }
    };

    loadPendingIntakeItems();
  }, [page, searchText, reloadKey]);

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setPage(1);
  };

  const handleDrawerCompleted = async () => {
    try {
      setLocationsError('');

      const response = await api.get('warehouse-locations/', {
        params: { is_active: true },
      });

      setLocations(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to reload warehouse locations:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      setLocations([]);
      setLocationsError(
        backendMessage || 'Не вдалося завантажити перелік активних локацій.',
      );
    }

    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const selectedItems = items.filter((item) =>
    selectedRowKeys.includes(item.id),
  );

  const handleBulkActionChange = (value) => {
    if (value === 'intake') {
      setPresetPendingItems(selectedItems);
      setDrawerOpen(true);
    }
  };

  const columns = [
    {
      title: 'Постачальник / Замовлення',
      key: 'organization_order',
      width: 340,
      render: (_, record) => (
        <Flex vertical gap={2} style={{ minWidth: 0 }}>
          <Text strong style={{ lineHeight: 1.3 }}>
            {record.organization_name || '—'}
          </Text>

          <Flex align="center" gap={6} style={{ minWidth: 0 }}>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                minWidth: 0,
              }}
            >
              {record.order_no || '—'} ·{' '}
              {record.order_created_at
                ? formatDateDisplay(record.order_created_at)
                : '—'}
            </Text>

            {record.order_id ? (
              <Tooltip title="Відкрити давальче замовлення">
                <Link
                  to={`/orders/tolling/${record.order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  state={{ tollingOrderLabel: record.order_no }}
                >
                  <InfoCircleOutlined
                    style={{
                      color: '#1677ff',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  />
                </Link>
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Номенклатура',
      key: 'item',
      width: 440,
      render: (_, record) => (
        <Flex vertical gap={2} style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={record.inventory_item_name || '—'}
          >
            {record.inventory_item_name || '—'}
          </div>

          <Flex align="center" gap={6} style={{ minWidth: 0 }}>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={
                record.inventory_item_code
                  ? `Внутрішній код: ${record.inventory_item_code}`
                  : '—'
              }
            >
              {record.inventory_item_code
                ? `Внутрішній код: ${record.inventory_item_code}`
                : '—'}
            </Text>

            {record.inventory_item_id ? (
              <Tooltip title="Відкрити номенклатуру">
                <a
                  href={`/production/components/${record.inventory_item_id}`}
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
                </a>
              </Tooltip>
            ) : null}
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Отримано',
      key: 'received_quantity',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <Text strong>
          {formatQuantity(record.received_quantity)}{' '}
          {record.inventory_item_unit_symbol || ''}
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_, record) => {
        const dropdownItems = [
          {
            key: 'intake',
            label: <div style={{ padding: '4px 0' }}>Оформити отримання</div>,
            onClick: () => {
              setPresetPendingItems([record]);
              setDrawerOpen(true);
            },
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
              Давальчі поставки
            </Title>

            <Text type="secondary">
              Первинне оформлення давальницьких товарів.
            </Text>
          </Flex>
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
              onChange={handleBulkActionChange}
              options={[
                {
                  value: 'intake',
                  label: 'Оформити отримання',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по організації або номенклатурі"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
              value={searchText}
              onChange={handleSearchChange}
            />
          </Flex>
        </Card>

        {locationsError && (
          <Alert type="warning" description={locationsError} showIcon />
        )}

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
              current: page,
              pageSize,
              total,
              showSizeChanger: false,
              onChange: (nextPage) => {
                setPage(nextPage);
              },
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
                  позицій
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає позицій для відображення.',
            }}
            scroll={{ x: 1050 }}
          />
        </Card>
      </Flex>
      <WarehouseIntakeDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setPresetPendingItems([]);
        }}
        locations={locations}
        pendingItems={items}
        presetPendingItems={presetPendingItems}
        onCompleted={handleDrawerCompleted}
        sourceType="tolling"
      />
    </div>
  );
}

export default WarehouseTollingPendingIntakePage;
