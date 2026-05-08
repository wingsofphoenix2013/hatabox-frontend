import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  InfoCircleFilled,
  WarningFilled,
  SwapOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Dropdown,
  Flex,
  Image,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';
import {
  getLocationTagStyle,
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';
import WarehouseAddItemToMovementDrawer from '../components/WarehouseAddItemToMovementDrawer';

const { Title, Text } = Typography;

const SALES_ORDER_STATUS_LABELS = {
  draft: 'Чернетка',
  confirmed: 'Підтверджено',
  in_progress: 'В роботі',
};

const getFulfillmentModeLabel = (mode) => {
  if (mode === 'customer') return 'Від замовників';
  if (mode === 'mixed') return 'Закупівля';

  return '—';
};

const getFulfillmentModeTagColor = (mode) => {
  if (mode === 'customer') return 'default';
  if (mode === 'mixed') return 'processing';

  return 'default';
};

function WarehouseStockDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [shortageData, setShortageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const [stockResponse, shortageResponse] = await Promise.all([
        api.get(`warehouse-stock-detail/${id}/`),
        api.get(`warehouse-shortage-detail/${id}/`),
      ]);

      setData(stockResponse.data || null);
      setShortageData(shortageResponse.data || null);
    } catch (err) {
      console.error('Failed to load warehouse stock detail page:', err);
      setError('Не вдалося завантажити дані складського залишку.');
      setData(null);
      setShortageData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!data?.header) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Позицію не знайдено." showIcon />
      </div>
    );
  }

  const header = data.header;
  const stockRows = data.stock_rows || [];
  const reservedStockRows = data.reserved_stock_rows || [];
  const pendingIntakeRows = data.pending_intake_rows || [];
  const incomingRows = data.incoming_rows || [];
  const shortageRows = shortageData?.rows || [];
  const shortageSummary = shortageData?.summary || {};
  const shouldShowShortageCard =
    Number(shortageSummary.total_missing_quantity) > 0;
  const imageUrl = header.image || '';
  const unitSymbol = header.inventory_item_unit_symbol || '';
  const hasAvailableStock = stockRows.some((row) => Number(row.quantity) > 0);

  const availableStockColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Локація',
      key: 'location',
      width: 240,
      render: (_, record) => (
        <Tag
          style={{
            ...getLocationTagStyle(),
            marginInlineEnd: 0,
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={`${record.location_code || '—'} - ${
            record.location_name || '—'
          }`}
        >
          {(record.location_code || '—') +
            ' - ' +
            (record.location_name || '—')}
        </Tag>
      ),
    },
    {
      title: 'Місце зберігання',
      key: 'storage_place',
      render: (_, record) =>
        record.storage_place_id ? (
          <div
            title={record.storage_place_display_name || undefined}
            style={{
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {renderStoragePlaceChain(record.storage_place_full_display)}
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) =>
        unitSymbol
          ? `${formatQuantity(record.quantity)} ${unitSymbol}`
          : formatQuantity(record.quantity),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
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
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  const reservedStockColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Звідки',
      key: 'source',
      width: 360,
      render: (_, record) =>
        renderWarehousePlacement({
          locationCode: record.location_code,
          locationName: record.location_name,
          storagePlaceDisplayName: record.storage_place_display_name,
          storagePlaceFullDisplay: record.storage_place_full_display,
        }),
    },
    {
      title: 'Куди',
      key: 'target',
      width: 360,
      render: (_, record) =>
        renderWarehousePlacement({
          locationCode: record.target_location_code,
          locationName: record.target_location_name,
          storagePlaceFullDisplay: record.target_storage_place_full_display,
        }),
    },
    {
      title: 'Коли',
      key: 'planned_at',
      width: 140,
      align: 'center',
      render: (_, record) => formatDateDisplay(record.movement_plan_planned_at),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) =>
        unitSymbol
          ? `${formatQuantity(record.quantity)} ${unitSymbol}`
          : formatQuantity(record.quantity),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
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
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  const pendingIntakeColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Заказ',
      key: 'order',
      render: (_, record) => {
        const isTolling = record.source_type === 'tolling';
        const orderId = isTolling
          ? record.tolling_order_id
          : record.external_order_id;
        const orderNo = isTolling
          ? record.tolling_order_no
          : record.external_order_no;
        const createdAt = isTolling
          ? record.tolling_order_created_at
          : record.external_order_created_at;
        const orderUrl = isTolling
          ? `/orders/tolling/${orderId}`
          : `/orders/${orderId}`;

        if (!orderId) {
          return '—';
        }

        return (
          <Link to={orderUrl} target="_blank" rel="noreferrer">
            {`№${orderNo || '—'} від ${formatDateDisplay(createdAt)}`}
          </Link>
        );
      },
    },
    {
      title: 'Постачальник',
      key: 'counterparty',
      render: (_, record) => {
        const counterpartyName =
          record.vendor_name || record.organization_name || '—';

        return (
          <Flex align="center" gap={6} wrap={false}>
            <span>{counterpartyName}</span>

            {record.vendor_id ? (
              <Link
                to={`/orders/vendors/${record.vendor_id}`}
                target="_blank"
                rel="noreferrer"
              >
                <InfoCircleOutlined style={{ color: '#1677ff' }} />
              </Link>
            ) : null}
          </Flex>
        );
      },
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.has_unconverted_quantity) {
          return (
            <span>
              <Text type="danger">???</Text>
              {unitSymbol ? ` ${unitSymbol}` : ''}
            </span>
          );
        }

        return unitSymbol
          ? `${formatQuantity(record.quantity)} ${unitSymbol}`
          : formatQuantity(record.quantity);
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
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
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  const shortageColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Замовлення',
      key: 'sales_order',
      width: 360,
      render: (_, record) => {
        const statusLabel =
          SALES_ORDER_STATUS_LABELS[record.sales_order_status] ||
          record.sales_order_status ||
          '—';

        return (
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Flex align="center" gap={6} style={{ minWidth: 0 }}>
              <Text
                strong
                style={{
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={record.organization_name || '—'}
              >
                {record.organization_name || '—'}
              </Text>

              {record.organization ? (
                <Link
                  to={`/organizations/${record.organization}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <InfoCircleOutlined style={{ color: '#1677ff' }} />
                </Link>
              ) : null}
            </Flex>

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
              >
                №{record.sales_order || '—'} від{' '}
                {formatDateDisplay(record.sales_order_created_at)} |{' '}
                {statusLabel}
              </Text>

              {record.sales_order ? (
                <Link
                  to={`/sales/orders/${record.sales_order}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                </Link>
              ) : null}
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: 'Виріб',
      key: 'product',
      render: (_, record) => (
        <Flex vertical gap={2} style={{ minWidth: 0 }}>
          <Text
            strong
            style={{
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={record.product_name || '—'}
          >
            {record.product_name || '—'}
          </Text>

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
            title={record.product_code || '—'}
          >
            {record.product_code || '—'}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'К-сть',
      key: 'missing_quantity',
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Flex vertical gap={4} align="center">
          <Text strong>
            {formatQuantity(record.missing_quantity)} {unitSymbol}
          </Text>

          <Tag
            color={getFulfillmentModeTagColor(record.fulfillment_mode)}
            style={{ marginInlineEnd: 0 }}
          >
            {getFulfillmentModeLabel(record.fulfillment_mode)}
          </Tag>
        </Flex>
      ),
    },
  ];

  const incomingColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Заказ',
      key: 'order',
      render: (_, record) => {
        const isTolling = record.source_type === 'tolling';
        const orderId = isTolling
          ? record.tolling_order_id
          : record.external_order_id;
        const orderNo = isTolling
          ? record.tolling_order_no
          : record.external_order_no;
        const createdAt = isTolling
          ? record.tolling_order_created_at
          : record.external_order_created_at;
        const orderUrl = isTolling
          ? `/orders/tolling/${orderId}`
          : `/orders/${orderId}`;

        if (!orderId) {
          return '—';
        }

        return (
          <Link to={orderUrl} target="_blank" rel="noreferrer">
            {`№${orderNo || '—'} від ${formatDateDisplay(createdAt)}`}
          </Link>
        );
      },
    },
    {
      title: 'Постачальник',
      key: 'counterparty',
      render: (_, record) => {
        const counterpartyName =
          record.vendor_name || record.organization_name || '—';

        return (
          <Flex align="center" gap={6} wrap={false}>
            <span>{counterpartyName}</span>

            {record.vendor_id ? (
              <Link
                to={`/orders/vendors/${record.vendor_id}`}
                target="_blank"
                rel="noreferrer"
              >
                <InfoCircleOutlined style={{ color: '#1677ff' }} />
              </Link>
            ) : null}
          </Flex>
        );
      },
    },
    {
      title: 'Дата поставки',
      key: 'delivery_date',
      width: 180,
      align: 'center',
      render: (_, record) => {
        const date = record.expected_delivery_date;
        const delta = record.delivery_days_delta;
        const isOverdue = record.is_delivery_overdue;
        const statusText = record.delivery_status_text;

        if (!date) {
          return '—';
        }

        const dateText = formatDateDisplay(date);

        if (isOverdue || (delta !== null && delta < 0)) {
          const content = (
            <Tag color="error" style={{ fontWeight: 600 }}>
              <WarningFilled style={{ marginRight: 4 }} />
              {dateText}
            </Tag>
          );

          return statusText ? (
            <Tooltip title={statusText}>{content}</Tooltip>
          ) : (
            content
          );
        }

        if (delta === 0) {
          return (
            <Tag color="warning" style={{ fontWeight: 600 }}>
              <InfoCircleFilled style={{ marginRight: 4 }} />
              {dateText}
            </Tag>
          );
        }

        const content = <span>{dateText}</span>;

        return statusText ? (
          <Tooltip title={statusText}>{content}</Tooltip>
        ) : (
          content
        );
      },
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.has_unconverted_quantity) {
          return (
            <span>
              <Text type="danger">???</Text>
              {unitSymbol ? ` ${unitSymbol}` : ''}
            </span>
          );
        }

        return unitSymbol
          ? `${formatQuantity(record.quantity)} ${unitSymbol}`
          : formatQuantity(record.quantity);
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
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
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            {header.inventory_item_name || '—'}
          </Title>

          <Text type="secondary">
            {header.inventory_item_category_name || '—'}
          </Text>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card style={{ marginBottom: 20 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 12,
                }}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={header.inventory_item_name || 'Inventory item image'}
                    preview={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Text type="secondary">Зображення відсутнє</Text>
                )}
              </div>
            </Card>

            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                <Button
                  block
                  disabled={!hasAvailableStock}
                  icon={
                    <SwapOutlined
                      style={{
                        color: hasAvailableStock ? '#1677ff' : '#bfbfbf',
                      }}
                    />
                  }
                  onClick={() => setIsMovementDrawerOpen(true)}
                >
                  Переміщення товару
                </Button>
              </Flex>
            </Card>

            <Card title="Історія">
              <Text type="secondary">Дані з’являться пізніше.</Text>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Вміст буде додано пізніше.</Text>
            </Card>

            {shouldShowShortageCard && (
              <Card
                title="Дефіцит за замовленнями"
                style={{ marginBottom: 20 }}
              >
                <Flex vertical gap={16}>
                  <Descriptions
                    size="small"
                    column={2}
                    bordered
                    items={[
                      {
                        key: 'sales_orders_count',
                        label: 'Замовлень',
                        children:
                          Number(shortageSummary.sales_orders_count) || 0,
                      },
                      {
                        key: 'is_required_for_start',
                        label: 'Критичність',
                        children: shortageData?.is_required_for_start ? (
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
                    ]}
                  />

                  <Descriptions
                    size="small"
                    column={3}
                    bordered
                    items={[
                      {
                        key: 'total_missing_quantity',
                        label: 'Загально',
                        children: `${formatQuantity(
                          shortageSummary.total_missing_quantity,
                        )} ${unitSymbol}`,
                      },
                      {
                        key: 'mixed_missing_quantity',
                        label: 'Закупівля',
                        children: `${formatQuantity(
                          shortageSummary.mixed_missing_quantity,
                        )} ${unitSymbol}`,
                      },
                      {
                        key: 'customer_missing_quantity',
                        label: 'Від замовників',
                        children: `${formatQuantity(
                          shortageSummary.customer_missing_quantity,
                        )} ${unitSymbol}`,
                      },
                    ]}
                  />

                  <Table
                    rowKey={(record) => record.shortage_id}
                    columns={shortageColumns}
                    dataSource={shortageRows}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                  />
                </Flex>
              </Card>
            )}

            {stockRows.length > 0 && (
              <Card title="Доступно на складах" style={{ marginBottom: 20 }}>
                <Table
                  rowKey={(record) =>
                    `${record.placement_type}-${record.location_id}-${
                      record.storage_place_id || 'location'
                    }`
                  }
                  columns={availableStockColumns}
                  dataSource={stockRows}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}

            {reservedStockRows.length > 0 && (
              <Card
                title="Зарезервовано на складах"
                style={{ marginBottom: 20 }}
              >
                <Table
                  rowKey={(record) => record.movement_plan_item_id}
                  columns={reservedStockColumns}
                  dataSource={reservedStockRows}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}

            {pendingIntakeRows.length > 0 && (
              <Card title="Первинне оформлення" style={{ marginBottom: 20 }}>
                <Table
                  rowKey={(record) =>
                    `${record.source_type}-${record.receipt_item_id}`
                  }
                  columns={pendingIntakeColumns}
                  dataSource={pendingIntakeRows}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}

            {incomingRows.length > 0 && (
              <Card title="Закупівля та очікування">
                <Table
                  rowKey={(record) =>
                    `${record.source_type}-${record.order_item_id}`
                  }
                  columns={incomingColumns}
                  dataSource={incomingRows}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}
          </Col>
        </Row>
      </Flex>

      <WarehouseAddItemToMovementDrawer
        open={isMovementDrawerOpen}
        onClose={() => setIsMovementDrawerOpen(false)}
        stockDetail={data}
      />
    </div>
  );
}

export default WarehouseStockDetailPage;
