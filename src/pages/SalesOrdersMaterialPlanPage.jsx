import { useEffect, useState } from 'react';
import { InfoCircleOutlined, RollbackOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Table,
  Flex,
  Row,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import { formatDateDisplay, formatMoney } from '../utils/orderFormatters';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'purple';
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

function SalesOrdersMaterialPlanPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [materialCostSummary, setMaterialCostSummary] = useState(null);
  const [materialCostSummaryLoading, setMaterialCostSummaryLoading] =
    useState(false);

  const [materialSnapshot, setMaterialSnapshot] = useState(null);
  const [materialSnapshotLoading, setMaterialSnapshotLoading] = useState(false);

  const loadMaterialCostSummary = async (productionOrderId) => {
    try {
      setMaterialCostSummaryLoading(true);

      const response = await api.get(
        `production-orders/${productionOrderId}/material-snapshot-summary/`,
      );

      setMaterialCostSummary(response.data || null);
    } catch (err) {
      console.error('Failed to load material cost summary:', err);
      setMaterialCostSummary(null);
    } finally {
      setMaterialCostSummaryLoading(false);
    }
  };

  const loadMaterialSnapshot = async (productionOrderId) => {
    try {
      setMaterialSnapshotLoading(true);

      const response = await api.get(
        `production-orders/${productionOrderId}/material-snapshot/`,
      );

      setMaterialSnapshot(response.data || null);
    } catch (err) {
      console.error('Failed to load material snapshot:', err);
      setMaterialSnapshot(null);
    } finally {
      setMaterialSnapshotLoading(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`sales-orders/${id}/`);
      setOrder(response.data);

      await loadMaterialCostSummary(response.data.production_order);
      await loadMaterialSnapshot(response.data.production_order);
    } catch (err) {
      console.error('Failed to load sale order:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
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

  const ownComponents = Array.isArray(materialSnapshot?.own_components)
    ? materialSnapshot.own_components
    : [];

  const ownComponentColumns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Компонент',
      key: 'name',
      render: (_, record) => (
        <Flex align="center" gap={6} wrap>
          <span>
            {record.inv_item__internal_code || '—'} |{' '}
            {record.inv_item__name || '—'}
          </span>

          {record.external_order_id && (
            <Tooltip title="Детальна інформація про закупівлю">
              <Link
                to={`/orders/${record.external_order_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InfoCircleOutlined
                  style={{
                    color: '#8c8c8c',
                    fontSize: 14,
                  }}
                />
              </Link>
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 130,
      align: 'center',
      render: (_, record) =>
        `${formatQuantity(record.quantity)} ${
          record.inv_item__unit__symbol || ''
        }`,
    },
    {
      title: 'В-сть. без ПДВ',
      dataIndex: 'cost_without_vat',
      key: 'cost_without_vat',
      width: 160,
      align: 'center',
      render: (value) => formatMoney(value),
    },
    {
      title: 'ПДВ',
      dataIndex: 'vat_amount',
      key: 'vat_amount',
      width: 130,
      align: 'center',
      render: (value) => formatMoney(value),
    },
    {
      title: 'В-сть. з ПДВ',
      dataIndex: 'cost_with_vat',
      key: 'cost_with_vat',
      width: 160,
      align: 'right',
      render: (value) => <Text strong>{formatMoney(value)}</Text>,
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
            {`Розрахунок собівартості замовлення №${order.id} від ${formatDateDisplay(
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
            }}
          >
            {order.status_display || order.status || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Серійний номер" style={{ marginBottom: 20 }}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                textAlign: 'center',
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 72,
                  lineHeight: '42px',
                  textAlign: 'center',
                  wordBreak: 'break-word',
                }}
              >
                № {order.production_order_serial_number || '—'}
              </Text>
            </div>
          </Card>

          <Card title="Навігація">
            <Link to={`/sales/orders/${order.id}`}>
              <Button
                block
                icon={<RollbackOutlined style={{ color: '#1677ff' }} />}
              >
                Повернутись до замовлення
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card
            title={
              <Flex justify="space-between" align="center" gap={12}>
                <span>Основна інформація</span>

                <Flex align="center" gap={8}>
                  <Text strong>
                    {order.product_code || '—'} |{' '}
                    {order.product_family_name || '—'}
                  </Text>
                </Flex>
              </Flex>
            }
          >
            <Flex vertical gap={16}>
              <Descriptions
                bordered
                size="small"
                column={2}
                items={[
                  {
                    key: 'organization',
                    label: 'Військова частина',
                    children: (
                      <Flex align="center" gap={6}>
                        <span>{order.organization_name || '—'}</span>

                        {order.organization && (
                          <Link
                            to={`/organizations/${order.organization}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <InfoCircleOutlined
                              style={{
                                color: '#8c8c8c',
                                fontSize: 14,
                              }}
                            />
                          </Link>
                        )}
                      </Flex>
                    ),
                  },
                  {
                    key: 'customer_responsible_person',
                    label: 'Відповідальний',
                    children: (
                      <Flex align="center" gap={6} style={{ minWidth: 0 }}>
                        <span>
                          {order.customer_responsible_person_name || '—'}
                        </span>

                        {order.customer_responsible_person && (
                          <Link
                            to={`/contacts/${order.customer_responsible_person}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <InfoCircleOutlined
                              style={{
                                color: '#8c8c8c',
                                fontSize: 14,
                              }}
                            />
                          </Link>
                        )}
                      </Flex>
                    ),
                  },
                ]}
              />

              <Descriptions
                bordered
                size="small"
                column={3}
                items={[
                  {
                    key: 'created_at',
                    label: 'Створено',
                    children: (
                      <span>
                        {formatDateDisplay(order.created_at)} |{' '}
                        {order.created_by_username || '—'}
                      </span>
                    ),
                  },
                  {
                    key: 'completed_at',
                    label: 'Завершено',
                    children: order.completed_at
                      ? formatDateDisplay(order.completed_at)
                      : '—',
                  },
                  {
                    key: 'closed_at',
                    label: 'Передано',
                    children: order.closed_at
                      ? formatDateDisplay(order.closed_at)
                      : '—',
                  },
                ]}
              />

              <Alert
                type="warning"
                showIcon
                message={
                  <Flex vertical gap={10}>
                    <Text strong>Коментар до замовлення</Text>

                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                      {order.comment || 'Коментар відсутній.'}
                    </Text>
                  </Flex>
                }
              />
            </Flex>
          </Card>

          <Card
            title="Розрахунок собівартості"
            style={{ marginTop: 20 }}
            loading={materialCostSummaryLoading}
          >
            <div style={{ marginBottom: 12 }}>
              <Text strong>Вартість комплектуючих</Text>
            </div>

            <Descriptions
              bordered
              size="small"
              column={3}
              items={[
                {
                  key: 'total_cost_without_vat',
                  label: 'Вартість без ПДВ',
                  children: materialCostSummary
                    ? formatMoney(materialCostSummary.total_cost_without_vat)
                    : '—',
                },
                {
                  key: 'total_vat_amount',
                  label: 'ПДВ',
                  children: materialCostSummary
                    ? formatMoney(materialCostSummary.total_vat_amount)
                    : '—',
                },
                {
                  key: 'total_cost_with_vat',
                  label: 'Вартість з ПДВ',
                  children: materialCostSummary
                    ? formatMoney(materialCostSummary.total_cost_with_vat)
                    : '—',
                },
              ]}
            />
          </Card>

          <Card title="Закуплені компоненти" style={{ marginTop: 20 }}>
            <Table
              rowKey={(record) =>
                `${record.inv_item_id}-${record.external_order_id}-${record.vendor_item_id}-${record.unit_price}`
              }
              size="small"
              loading={materialSnapshotLoading}
              dataSource={ownComponents}
              columns={ownComponentColumns}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SalesOrdersMaterialPlanPage;
