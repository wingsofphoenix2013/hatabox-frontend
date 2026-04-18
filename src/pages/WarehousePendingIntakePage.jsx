import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
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
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';
import WarehouseIntakeDrawer from '../components/WarehouseIntakeDrawer';

const { Title, Text } = Typography;

function WarehousePendingIntakePage() {
  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [selectedConversionStatuses, setSelectedConversionStatuses] = useState(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadPendingIntakeItems();
  }, []);

  const loadPendingIntakeItems = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('warehouse-pending-intake-items/');

      setItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load warehouse pending intake items:', err);
      setError('Не вдалося завантажити список первинного отримання.');
      setItems([]);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        (item.vendor_name || '').toLowerCase().includes(normalizedSearch) ||
        (item.order_no || '').toLowerCase().includes(normalizedSearch) ||
        (item.vendor_item_name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        (item.inventory_item_name || '')
          .toLowerCase()
          .includes(normalizedSearch);

      const conversionKey = item.requires_unit_conversion
        ? 'requires_conversion'
        : 'ready';

      const matchesConversion =
        selectedConversionStatuses.length === 0 ||
        selectedConversionStatuses.includes(conversionKey);

      return matchesSearch && matchesConversion;
    });
  }, [items, searchText, selectedConversionStatuses]);

  const columns = [
    {
      title: 'Постачальник / Замовлення',
      key: 'vendor_order',
      width: 320,
      render: (_, record) => (
        <Flex vertical gap={2} style={{ minWidth: 0 }}>
          <Text strong style={{ lineHeight: 1.3 }}>
            {record.vendor_name || '—'}
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
              <Tooltip title="Відкрити замовлення">
                <Link
                  to={`/orders/${record.order_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  state={{ orderLabel: record.order_no }}
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
      width: 430,
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
            title={record.vendor_item_name || '—'}
          >
            {record.vendor_item_name || '—'}
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
              title={record.inventory_item_name || '—'}
            >
              {record.inventory_item_name || '—'}
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
      width: 150,
      align: 'center',
      render: (_, record) => {
        const isConversionRequired = record.requires_unit_conversion;

        return (
          <Text strong>
            {formatQuantity(record.received_quantity)}{' '}
            {isConversionRequired ? (
              <Tooltip title="Одиниця потребує уточнення">
                <span style={{ color: '#ff4d4f' }}>???</span>
              </Tooltip>
            ) : (
              record.inventory_item_unit_symbol || ''
            )}
          </Text>
        );
      },
    },
    {
      title: 'Конвертація',
      key: 'conversion',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.requires_unit_conversion ? (
          <Tooltip title="Потрібна конвертація одиниць">
            <CloseCircleFilled
              style={{
                color: '#ff4d4f',
                fontSize: 18,
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Готово до приймання">
            <CheckCircleFilled
              style={{
                color: '#52c41a',
                fontSize: 18,
              }}
            />
          </Tooltip>
        ),
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => {
        const items = [
          {
            key: 'open',
            label: <div style={{ padding: '4px 0' }}>Переглянути позицію</div>,
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

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Первинне отримання
            </Title>

            <Text type="secondary">
              Позиції, що очікують оформлення первинного отримання на склад.
            </Text>
          </Flex>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Оформити первинне отримання
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
              placeholder="Пошук по постачальнику або номенклатурі"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Конвертація"
              style={{ minWidth: 220 }}
              value={selectedConversionStatuses}
              onChange={setSelectedConversionStatuses}
              options={[
                { value: 'ready', label: 'Готові до приймання' },
                {
                  value: 'requires_conversion',
                  label: 'Потрібна конвертація',
                },
              ]}
              optionFilterProp="label"
            />
          </Flex>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredItems}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 50,
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
                  позицій
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає позицій для відображення.',
            }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </Flex>
      <WarehouseIntakeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locations={[]}
        pendingItems={items}
      />
    </div>
  );
}

export default WarehousePendingIntakePage;
