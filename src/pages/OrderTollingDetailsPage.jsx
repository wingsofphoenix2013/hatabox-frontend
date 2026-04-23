import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SettingOutlined,
  StopOutlined,
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
  Tag,
  Typography,
  message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';
import { getApiErrorMessage } from '../utils/apiError';

const { Title, Text } = Typography;

const getTollingStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'active':
      return 'processing';
    case 'completed':
      return 'success';
    default:
      return 'default';
  }
};

const TOLLING_STATUS_LABELS = {
  draft: 'Чернетка',
  active: 'В роботі',
  completed: 'Завершено',
};

function OrderTollingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sendingToWork, setSendingToWork] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);

  useEffect(() => {
    loadOrderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrderPage = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');

      const response = await api.get(`tolling-orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to load tolling order page:', err);
      setError('Не вдалося завантажити дані передачі.');
      setOrder(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const isDraft = order?.status === 'draft';
  const isActive = order?.status === 'active';
  const isCompleted = order?.status === 'completed';

  const hasOrderItems = Array.isArray(order?.items) && order.items.length > 0;

  const handleSendToWork = async () => {
    try {
      setSendingToWork(true);

      await api.patch(`tolling-orders/${id}/`, {
        status: 'active',
      });

      message.success('Передачу передано в роботу.');
      await loadOrderPage({ silent: true });
    } catch (err) {
      console.error('Failed to send tolling order to work:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'status',
      ]);

      message.error(backendMessage || 'Не вдалося передати передачу в роботу.');
    } finally {
      setSendingToWork(false);
    }
  };

  const handleDeleteEmptyDraft = async () => {
    try {
      setDeletingDraft(true);

      await api.delete(`tolling-orders/${id}/`);

      message.success('Чернетку передачі видалено.');
      navigate('/orders/tolling');
    } catch (err) {
      console.error('Failed to delete tolling draft:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      message.error(backendMessage || 'Не вдалося видалити чернетку передачі.');
    } finally {
      setDeletingDraft(false);
    }
  };

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
        <Alert type="warning" description="Передачу не знайдено." showIcon />
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
            {`Передача № ${order.order_no} від ${formatDateUa(order.created_at)}`}
          </Title>

          <Tag
            color={getTollingStatusTagColor(order.status)}
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
            {TOLLING_STATUS_LABELS[order.status] || order.status || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Файли" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>

          {!isCompleted && (
            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                {isDraft && (
                  <>
                    {hasOrderItems ? (
                      <Popconfirm
                        title="Увага!"
                        description="Ви не зможете редагувати передачу після передачі її в роботу. Ви впевнені, що склад передачі вже остаточний?"
                        okText="Так"
                        cancelText="Ні"
                        onConfirm={handleSendToWork}
                        disabled={sendingToWork}
                      >
                        <Button block type="primary" loading={sendingToWork}>
                          Передати в роботу
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button block type="primary" disabled>
                        Передати в роботу
                      </Button>
                    )}

                    <Divider style={{ margin: '4px 0 8px 0' }} />

                    <Button
                      block
                      icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                    >
                      Комплектація передачі
                    </Button>

                    <Divider style={{ margin: '4px 0 8px 0' }} />

                    {!hasOrderItems ? (
                      <Popconfirm
                        title="Увага!"
                        description="Чернетку передачі буде видалено. Ви впевнені?"
                        okText="Так"
                        cancelText="Ні"
                        onConfirm={handleDeleteEmptyDraft}
                        disabled={deletingDraft}
                      >
                        <Button
                          block
                          danger
                          icon={<DeleteOutlined />}
                          loading={deletingDraft}
                        >
                          Відміна передачі
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Popconfirm
                        title="Увага!"
                        description="Функціонал відміни передачі з позиціями буде доступний пізніше."
                        okText="Зрозуміло"
                        cancelText="Закрити"
                        onConfirm={() => {}}
                      >
                        <Button block danger icon={<StopOutlined />}>
                          Відміна передачі
                        </Button>
                      </Popconfirm>
                    )}
                  </>
                )}

                {isActive && (
                  <>
                    <Button
                      block
                      icon={<DownloadOutlined style={{ color: '#1677ff' }} />}
                    >
                      Отримання товару
                    </Button>

                    <Button
                      block
                      icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                    >
                      Комплектація передачі
                    </Button>

                    <Divider style={{ margin: '4px 0 8px 0' }} />

                    <Popconfirm
                      title="Увага!"
                      description="Функціонал відміни передачі в цьому статусі буде доступний пізніше."
                      okText="Зрозуміло"
                      cancelText="Закрити"
                      onConfirm={() => {}}
                    >
                      <Button block danger icon={<StopOutlined />}>
                        Відміна передачі
                      </Button>
                    </Popconfirm>
                  </>
                )}
              </Flex>
            </Card>
          )}

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>

          <Card title="Передача">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderTollingDetailsPage;
