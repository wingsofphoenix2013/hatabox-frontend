import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  WarningFilled,
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
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

const pageSize = 50;

const fulfillmentModeOptions = [
  { value: 'customer', label: 'Від замовників' },
  { value: 'mixed', label: 'Charity / procurement' },
];

const requiredForStartOptions = [
  { value: 'true', label: 'Критичні для старту' },
  { value: 'false', label: 'Некритичні для старту' },
];

const getFulfillmentModeLabel = (mode) => {
  if (mode === 'customer') return 'Від замовників';
  if (mode === 'mixed') return 'Charity / procurement';

  return '—';
};

const getFulfillmentModeTagColor = (mode) => {
  if (mode === 'customer') return 'default';
  if (mode === 'mixed') return 'processing';

  return 'default';
};

function OrdersShortageRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedFulfillmentMode, setSelectedFulfillmentMode] = useState(
    searchParams.get('fulfillment_mode') || undefined,
  );
  const [selectedRequiredForStart, setSelectedRequiredForStart] = useState(
    searchParams.get('is_required_for_start') || undefined,
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadShortageOverview(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    searchText,
    selectedFulfillmentMode,
    selectedRequiredForStart,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    const normalizedSearch = searchText.trim();
    if (normalizedSearch) {
      params.set('search', normalizedSearch);
    }

    if (selectedFulfillmentMode) {
      params.set('fulfillment_mode', selectedFulfillmentMode);
    }

    if (selectedRequiredForStart) {
      params.set('is_required_for_start', selectedRequiredForStart);
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    searchText,
    selectedFulfillmentMode,
    selectedRequiredForStart,
    currentPage,
    setSearchParams,
  ]);

  const loadShortageOverview = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      const normalizedSearch = searchText.trim();
      if (normalizedSearch) {
        params.append('search', normalizedSearch);
      }

      if (selectedFulfillmentMode) {
        params.append('fulfillment_mode', selectedFulfillmentMode);
      }

      if (selectedRequiredForStart) {
        params.append('is_required_for_start', selectedRequiredForStart);
      }

      const response = await api.get(
        `warehouse-shortage-overview/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setTotal(Number(response.data?.count) || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load warehouse shortage overview:', err);
      setError('Не вдалося завантажити реєстр дефіциту компонентів.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: '№',
        key: 'row_number',
        width: 64,
        align: 'center',
        render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      },
      {
        title: 'Компонент',
        key: 'component',
        width: 430,
        render: (_, record) => {
          const detailHref = `/orders/shortage/${record.inv_item}`;
          const stockHref = `/inventory/stock/${record.inv_item}`;

          return (
            <Flex vertical gap={2} style={{ minWidth: 0 }}>
              <Link
                to={detailHref}
                style={{
                  fontWeight: 600,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
                title={record.inv_item_name || '—'}
              >
                {record.inv_item_name || '—'}
              </Link>

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
                  title={record.inv_item_code || '—'}
                >
                  {record.inv_item_code || '—'}
                </Text>

                {record.inv_item ? (
                  <Tooltip title="Відкрити складську картку компонента">
                    <a
                      href={stockHref}
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
          );
        },
      },
      {
        title: 'Дефіцит',
        key: 'missing_quantity',
        width: 210,
        align: 'center',
        render: (_, record) => {
          const unit = record.inventory_item_unit_symbol || '';

          return (
            <Flex align="center" justify="center" gap={6}>
              <Tag
                color={getFulfillmentModeTagColor(record.fulfillment_mode)}
                style={{ marginInlineEnd: 0 }}
              >
                {getFulfillmentModeLabel(record.fulfillment_mode)}
              </Tag>

              {record.missing_quantity ? (
                <Text strong>
                  {formatQuantity(record.missing_quantity)} {unit}
                </Text>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </Flex>
          );
        },
      },
      {
        title: 'Очікуємо',
        key: 'forecast_quantity',
        width: 160,
        align: 'center',
        render: (_, record) => {
          const unit = record.inventory_item_unit_symbol || '';
          const forecastQuantity = Number(record.forecast_quantity) || 0;
          const hasUnconverted = Boolean(record.has_unconverted_incoming);

          if (forecastQuantity <= 0 && !hasUnconverted) {
            return <Text type="secondary">—</Text>;
          }

          return (
            <Flex align="center" justify="center" gap={6}>
              {forecastQuantity > 0 ? (
                <Text strong>
                  {formatQuantity(record.forecast_quantity)} {unit}
                </Text>
              ) : null}

              {forecastQuantity > 0 && hasUnconverted ? (
                <Text type="secondary">/</Text>
              ) : null}

              {hasUnconverted ? (
                <Tooltip title="Є очікувані надходження з невідомою кількістю після конвертації">
                  <Flex align="center" gap={4}>
                    <QuestionCircleOutlined
                      style={{
                        color: '#ff4d4f',
                        fontSize: 16,
                      }}
                    />
                    <Text strong>{unit}</Text>
                  </Flex>
                </Tooltip>
              ) : null}
            </Flex>
          );
        },
      },
      {
        title: 'Критично',
        key: 'is_required_for_start',
        width: 110,
        align: 'center',
        render: (_, record) =>
          record.is_required_for_start ? (
            <Tooltip title="Критично для старту виробництва">
              <WarningFilled
                style={{
                  color: '#ff4d4f',
                  fontSize: 16,
                }}
              />
            </Tooltip>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Замов.',
        key: 'sales_orders_count',
        width: 100,
        align: 'center',
        render: (_, record) => (
          <Text strong>{Number(record.sales_orders_count) || 0}</Text>
        ),
      },
      {
        title: '',
        key: 'action',
        width: 56,
        align: 'center',
        render: () => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'placeholder',
                  label: 'Дії будуть додані пізніше',
                },
              ],
            }}
            trigger={['click']}
          >
            <AppstoreAddOutlined
              style={{
                fontSize: 17,
                color: '#bfbfbf',
                cursor: 'pointer',
              }}
            />
          </Dropdown>
        ),
      },
    ],
    [currentPage],
  );

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Реєстр дефіциту компонентів
            </Title>

            <Text type="secondary">
              Агрегований дефіцит компонентів за замовленнями продажу,
              розрахований під час перевірки доступності.
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
              options={[
                {
                  value: 'placeholder',
                  label: 'Дії будуть додані пізніше',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по компоненту"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              allowClear
              placeholder="Контур"
              style={{ minWidth: 220 }}
              value={selectedFulfillmentMode}
              onChange={(value) => {
                setSelectedFulfillmentMode(value);
                setCurrentPage(1);
              }}
              options={fulfillmentModeOptions}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              allowClear
              placeholder="Критичність"
              style={{ minWidth: 220 }}
              value={selectedRequiredForStart}
              onChange={(value) => {
                setSelectedRequiredForStart(value);
                setCurrentPage(1);
              }}
              options={requiredForStartOptions}
              optionFilterProp="label"
            />
          </Flex>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey={(record) => `${record.inv_item}-${record.fulfillment_mode}`}
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
                  позицій
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає позицій дефіциту для відображення.',
            }}
            scroll={{ x: 1120 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default OrdersShortageRegisterPage;
