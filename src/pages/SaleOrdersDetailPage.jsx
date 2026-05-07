import { useEffect, useState } from 'react';
import {
  InfoCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  StopOutlined,
  WarningFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import { formatDateDisplay } from '../utils/orderFormatters';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

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

function SaleOrdersDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [refreshingShortages, setRefreshingShortages] = useState(false);

  const loadOrderPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`sales-orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to load sale order page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshWarehouseShortages = async () => {
    try {
      setRefreshingShortages(true);

      await api.get(`warehouse-sales-order-availability/${id}/`);

      const response = await api.get(`sales-orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to refresh warehouse shortages:', err);
    } finally {
      setRefreshingShortages(false);
    }
  };

  useEffect(() => {
    loadOrderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Замовлення не знайдено." showIcon />
      </div>
    );
  }

  const isDraft = order.status === 'draft';
  const isConfirmed = order.status === 'confirmed';
  const canCancel = isDraft || isConfirmed;

  const warehouseShortages = Array.isArray(order.warehouse_shortages)
    ? order.warehouse_shortages
    : [];

  const customerShortages = warehouseShortages.filter(
    (item) => item.fulfillment_mode === 'customer',
  );

  const mixedShortages = warehouseShortages.filter(
    (item) => item.fulfillment_mode === 'mixed',
  );

  const shortageColumns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Компонент',
      key: 'component',
      render: (_, record) => (
        <Flex align="center" gap={6} wrap>
          <span>
            {record.inv_item_name || '—'} | {record.inv_item_code || '—'}
          </span>

          {record.inv_item && (
            <Link
              to={`/inventory/stock/${record.inv_item}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <InfoCircleOutlined
                style={{
                  color: '#1677ff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              />
            </Link>
          )}
        </Flex>
      ),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <span>
          {formatQuantity(record.missing_quantity)}{' '}
          {record.inv_item_unit_symbol || ''}
        </span>
      ),
    },
    {
      title: 'Крит.',
      dataIndex: 'is_required_for_start',
      key: 'is_required_for_start',
      width: 100,
      align: 'center',
      render: (value) =>
        value ? (
          <WarningFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
        ) : (
          <span style={{ color: '#bfbfbf' }}>—</span>
        ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex align="center" gap={12} wrap>
          <Title level={2} style={{ margin: 0 }}>
            {`Замовлення №${order.id} від ${formatDateDisplay(
              order.created_at,
            )}`}
          </Title>

          <Tag
            color={getStatusTagColor(order.status)}
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              ...(isDraft
                ? {
                    border: '1px solid #d9d9d9',
                    background: '#fafafa',
                    color: '#595959',
                  }
                : {}),
            }}
          >
            {order.status_display || order.status || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Актуальне фото" style={{ marginBottom: 20 }}>
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
              <Text type="secondary">Дані з’являться пізніше.</Text>
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              {isDraft && (
                <>
                  <Tooltip
                    title={
                      order.can_try_confirm
                        ? ''
                        : 'Неможливо підтвердити замовлення: наявний дефіцит критичних компонентів'
                    }
                  >
                    <div>
                      <Button
                        block
                        type="primary"
                        disabled={!order.can_try_confirm}
                      >
                        Підтвердити замовлення
                      </Button>
                    </div>
                  </Tooltip>

                  <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                  <Button
                    block
                    disabled
                    icon={<SettingOutlined style={{ color: '#bfbfbf' }} />}
                  >
                    Налаштування товарів замовника
                  </Button>
                </>
              )}

              {isConfirmed && (
                <>
                  <Tooltip title="Функціонал передачі ще не реалізовано">
                    <div>
                      <Button block type="primary" disabled>
                        Передати в виробництво
                      </Button>
                    </div>
                  </Tooltip>
                </>
              )}

              {order.has_warehouse_shortages && (
                <>
                  <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                  <Button
                    block
                    icon={
                      <ReloadOutlined
                        spin={refreshingShortages}
                        style={{
                          color: refreshingShortages ? '#bfbfbf' : '#1677ff',
                        }}
                      />
                    }
                    disabled={refreshingShortages}
                    onClick={handleRefreshWarehouseShortages}
                  >
                    Оновити звіт по дефіциту
                  </Button>
                </>
              )}

              <Divider dashed style={{ margin: '4px 0 8px 0' }} />

              {canCancel ? (
                <Popconfirm
                  title="Відмінити замовлення?"
                  description="Ця дія є незворотною. Після відміни замовлення буде переведене у статус «Скасовано»."
                  okText="Так"
                  cancelText="Ні"
                >
                  <Button block danger icon={<StopOutlined />}>
                    Відміна замовлення
                  </Button>
                </Popconfirm>
              ) : (
                <Tooltip title="Замовлення в поточному статусі не можна відмінити.">
                  <div>
                    <Button block disabled icon={<StopOutlined />}>
                      Відміна замовлення
                    </Button>
                  </div>
                </Tooltip>
              )}
            </Flex>
          </Card>

          <Card title="Історія замовлення">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>

          {order.has_warehouse_shortages && (
            <Card
              title={
                <Flex justify="space-between" align="center" gap={12}>
                  <span>Дефіцит компонентів</span>

                  <Flex align="center" gap={8}>
                    <Text type="secondary">
                      Перевірено:{' '}
                      {formatDateDisplay(
                        order.warehouse_shortages_last_checked_at,
                      )}
                    </Text>

                    <Tooltip title="Оновити">
                      <ReloadOutlined
                        spin={refreshingShortages}
                        style={{
                          color: '#1677ff',
                          fontSize: 16,
                          cursor: refreshingShortages
                            ? 'not-allowed'
                            : 'pointer',
                        }}
                        onClick={
                          refreshingShortages
                            ? undefined
                            : handleRefreshWarehouseShortages
                        }
                      />
                    </Tooltip>
                  </Flex>
                </Flex>
              }
            >
              {refreshingShortages ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <Flex vertical gap={16}>
                  <Flex vertical gap={10}>
                    <Text strong>Компоненти від замовника</Text>

                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={customerShortages}
                      columns={shortageColumns}
                      locale={{
                        emptyText:
                          'Дефіцит компонентів від замовника відсутній.',
                      }}
                    />
                  </Flex>

                  <Flex vertical gap={10}>
                    <Text strong>Загальний перелік компонентів</Text>

                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={mixedShortages}
                      columns={shortageColumns}
                      locale={{
                        emptyText: 'Загальний дефіцит компонентів відсутній.',
                      }}
                    />
                  </Flex>
                </Flex>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default SaleOrdersDetailPage;
