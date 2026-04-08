import { useEffect, useState } from 'react';
import { EditOutlined, LinkOutlined, WarningOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const formatDateUa = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getProgressStrokeColor = (percent, isOverdue = false) => {
  if (isOverdue) return '#ff4d4f';

  if (percent === 0) return '#bfbfbf';
  if (percent <= 24) return '#d9f7be';
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a';
};

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrderPage();
  }, [id]);

  const loadOrderPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to load order page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const summaryColumns = [
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      align: 'center',
      width: '28%',
      render: (value, record) => (
        <Tag color={getStatusTagColor(record.status)}>{value || '—'}</Tag>
      ),
    },
    {
      title: 'Оплата',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      align: 'center',
      width: '36%',
      render: (value) => {
        const percent = Number(value) || 0;

        return (
          <div style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={getProgressStrokeColor(percent)}
            />
          </div>
        );
      },
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      align: 'center',
      width: '36%',
      render: (value, record) => {
        const percent = Number(value) || 0;
        const isOverdue = Boolean(record.is_receipt_overdue);

        const progress = (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(percent, isOverdue)}
          />
        );

        if (percent === 100 && !isOverdue) {
          return <div style={{ width: '100%' }}>{progress}</div>;
        }

        let tooltipText = null;

        if (isOverdue) {
          tooltipText = `Прострочено на ${record.receipt_overdue_days} дн.`;
        } else {
          tooltipText = `Очікується за ${record.receipt_expected_days} дн.`;
        }

        const content = (
          <Flex align="center" justify="space-between" gap={8}>
            <div style={{ flex: 1 }}>{progress}</div>

            {isOverdue && (
              <WarningOutlined
                style={{
                  color: '#ff4d4f',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </Flex>
        );

        if (isOverdue) {
          return (
            <Tooltip title={tooltipText}>
              <div
                style={{
                  width: '100%',
                  background: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                  padding: '6px 8px',
                }}
              >
                {content}
              </div>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={tooltipText}>
            <div style={{ width: '100%' }}>{content}</div>
          </Tooltip>
        );
      },
    },
  ];

  const isDraft = order?.status === 'draft';

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
            {`Заказ № ${order.order_no} від ${formatDateUa(order.created_at)}`}
          </Title>

          <Tag
            color={isDraft ? undefined : getStatusTagColor(order.status)}
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
            {order.status_name || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Файли" style={{ marginBottom: 20 }}>
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
              }}
            >
              <Text type="secondary">Дані з’являться пізніше</Text>
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              <Button block>Перейти до оплати</Button>
              <Button block>Перейти до замовлення</Button>
              <Button block>Перейти до історії</Button>
            </Flex>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <Text
                type="secondary"
                style={{ display: 'block', marginBottom: 6, fontSize: 12 }}
              >
                Назва постачальника
              </Text>

              <Flex align="center" gap={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {order.vendor_name || '—'}
                </Title>

                {order.vendor && (
                  <Link
                    to={`/orders/vendors/${order.vendor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkOutlined
                      style={{
                        color: '#8c8c8c',
                        fontSize: 16,
                        cursor: 'pointer',
                      }}
                    />
                  </Link>
                )}
              </Flex>
            </div>

            <Table
              columns={summaryColumns}
              dataSource={[order]}
              rowKey="id"
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>

          <Card
            title="Оплата"
            style={{ marginBottom: 20 }}
            extra={
              <Button
                icon={<EditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => navigate(`/orders/${order.id}/edit`)}
              >
                Редагувати
              </Button>
            }
          >
            <Text type="secondary">No data</Text>
          </Card>

          <Card
            title="Замовлення"
            extra={
              <Button
                icon={<EditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => navigate(`/orders/${order.id}/edit`)}
              >
                Редагувати
              </Button>
            }
          >
            <Text type="secondary">No data</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderDetailPage;
