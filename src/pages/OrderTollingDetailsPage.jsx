import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LinkOutlined,
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
  Input,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateDisplay } from '../utils/orderFormatters';

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

  const [isEditingOrderComment, setIsEditingOrderComment] = useState(false);
  const [editingOrderComment, setEditingOrderComment] = useState('');
  const [savingOrderComment, setSavingOrderComment] = useState(false);

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

  const handleStartEditComment = () => {
    setEditingOrderComment(order?.comment || '');
    setIsEditingOrderComment(true);
  };

  const handleCancelEditComment = () => {
    setIsEditingOrderComment(false);
    setEditingOrderComment('');
  };

  const handleSaveComment = async () => {
    try {
      setSavingOrderComment(true);

      const response = await api.patch(`tolling-orders/${id}/`, {
        comment: editingOrderComment || '',
      });

      setOrder(response.data);
      message.success('Коментар збережено.');
      setIsEditingOrderComment(false);
    } catch (err) {
      console.error('Failed to update tolling comment:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'comment',
      ]);
      message.error(backendMessage || 'Не вдалося зберегти коментар.');
    } finally {
      setSavingOrderComment(false);
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

  const itemsColumns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Товар',
      dataIndex: 'inventory_item_name',
      key: 'inventory_item_name',
      render: (value, record) => (
        <Flex align="center" gap={6} wrap>
          <span>{value || '—'}</span>

          {record.inv_item && (
            <Link
              to={`/production/components/${record.inv_item}`}
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
      render: (_, record) =>
        `${record.quantity || 0} ${record.unit_symbol || ''}`,
    },
    {
      title: 'Отрим.',
      key: 'received',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const received = Number(record.received_quantity) || 0;
        const total = Number(record.quantity) || 0;

        if (received === 0) {
          return (
            <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
          );
        }

        if (received >= total && total > 0) {
          return (
            <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
          );
        }

        return `${received} з ${total} ${record.unit_symbol || ''}`;
      },
    },
    {
      title: 'Поставка',
      key: 'expected_delivery_date',
      width: 160,
      align: 'center',
      render: (_, record) =>
        record.expected_delivery_date
          ? formatDateDisplay(record.expected_delivery_date)
          : '—',
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
          <Card
            title={
              <Flex justify="space-between" align="center">
                <span>Основна інформація</span>

                <Flex align="center" gap={8}>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {order.organization_name || '—'}
                  </Title>

                  <InfoCircleOutlined
                    style={{
                      color: '#bfbfbf',
                      fontSize: 16,
                      cursor: 'default',
                    }}
                  />

                  <LinkOutlined
                    style={{
                      color: '#bfbfbf',
                      fontSize: 16,
                      cursor: 'default',
                    }}
                  />
                </Flex>
              </Flex>
            }
            style={{ marginBottom: 20 }}
          >
            <Alert
              type="warning"
              showIcon
              message={
                <Flex vertical gap={12}>
                  <Flex justify="space-between" align="center">
                    <Text strong>Коментар до передачі</Text>

                    {!isEditingOrderComment && (
                      <EditOutlined
                        style={{
                          color: '#8c8c8c',
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                        onClick={handleStartEditComment}
                      />
                    )}
                  </Flex>

                  {!isEditingOrderComment ? (
                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                      {order.comment ? order.comment : 'Додати коментар'}
                    </Text>
                  ) : (
                    <Flex vertical gap={8}>
                      <Input.TextArea
                        value={editingOrderComment}
                        onChange={(e) => setEditingOrderComment(e.target.value)}
                        rows={3}
                        autoFocus
                      />

                      <Flex gap={8}>
                        <Button
                          type="primary"
                          size="small"
                          loading={savingOrderComment}
                          onClick={handleSaveComment}
                        >
                          Зберегти
                        </Button>

                        <Button size="small" onClick={handleCancelEditComment}>
                          Скасувати
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </Flex>
              }
            />
          </Card>

          <Card title="Передача">
            <Table
              rowKey="id"
              columns={itemsColumns}
              dataSource={Array.isArray(order.items) ? order.items : []}
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Немає доданих позицій.',
              }}
              components={{
                body: {
                  cell: (props) => (
                    <td
                      {...props}
                      style={{
                        fontSize: 12.5,
                        padding: '7px 8px',
                      }}
                    />
                  ),
                },
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderTollingDetailsPage;
