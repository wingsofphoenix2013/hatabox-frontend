import { useEffect, useState } from 'react';
import {
  BankOutlined,
  EditOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Flex,
  Image,
  Popconfirm,
  Progress,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

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

const formatDateDisplay = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatMoney = (value) =>
  new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getPaymentStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'approved':
      return 'processing';
    case 'paid':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
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

const getFileNameFromUrl = (fileUrl) => {
  if (!fileUrl) return '';

  try {
    const cleanUrl = fileUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    return decodeURIComponent(parts[parts.length - 1] || '');
  } catch {
    return '';
  }
};

const isImageFile = (fileNameOrUrl = '', mimeType = '') => {
  const normalizedName = String(fileNameOrUrl).toLowerCase();
  const normalizedType = String(mimeType).toLowerCase();

  return (
    normalizedType === 'image/jpeg' ||
    normalizedType === 'image/png' ||
    normalizedName.endsWith('.jpg') ||
    normalizedName.endsWith('.jpeg') ||
    normalizedName.endsWith('.png')
  );
};

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingToWork, setSubmittingToWork] = useState(false);
  const [isPaymentsDrawerOpen, setIsPaymentsDrawerOpen] = useState(false);

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

  const handleSendToWork = async () => {
    try {
      setSubmittingToWork(true);

      const payload = new FormData();
      payload.append('status', 'in_progress');

      await api.patch(`orders/${id}/`, payload);

      message.success('Замовлення передано в роботу');
      loadOrderPage();
    } catch (err) {
      console.error('Failed to send order to work:', err);
      console.error(
        'Failed to send order to work response data:',
        err?.response?.data,
      );
      console.error(
        'Failed to send order to work response status:',
        err?.response?.status,
      );

      const responseData = err?.response?.data;

      const backendMessage =
        responseData?.detail ||
        responseData?.error ||
        responseData?.message ||
        (typeof responseData === 'string' ? responseData : null);

      message.error(
        backendMessage || 'Не вдалося передати замовлення в роботу',
      );
    } finally {
      setSubmittingToWork(false);
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
  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 130,
      align: 'center',
      render: (value) => formatDateDisplay(value),
    },
    {
      title: '№ документа',
      dataIndex: 'payment_no',
      key: 'payment_no',
      render: (value, record) => {
        if (!value) return '—';

        return (
          <Flex align="center" gap={6}>
            <span>{value}</span>

            {record.status === 'paid' && (
              <FileImageOutlined
                style={{
                  color: '#8c8c8c',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // TODO: показ скан-копії платіжки
                }}
              />
            )}
          </Flex>
        );
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      width: 140,
      align: 'center',
      render: (value, record) => (
        <Tag color={getPaymentStatusTagColor(record.status)}>
          {value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Сума',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      width: 140,
      align: 'center',
      render: (value) => (value ? `${value} ₴` : '—'),
    },
  ];
  const orderItemsColumns = [
    {
      title: 'Товар',
      key: 'vendor_item_name',
      render: (_, record) => (
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={record.vendor_item_name || '—'}
        >
          {record.vendor_item_name || '—'}
        </div>
      ),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (_, record) => formatQuantity(record.quantity),
    },
    {
      title: 'Ціна',
      key: 'agreed_price',
      width: 110,
      align: 'center',
      render: (_, record) =>
        record.agreed_price ? `${record.agreed_price} ₴` : '—',
    },
    {
      title: 'Поставка',
      key: 'expected_delivery_date',
      width: 140,
      align: 'center',
      render: (_, record) => formatDateDisplay(record.expected_delivery_date),
    },
  ];

  const isDraft = order?.status === 'draft';
  const isInProgress = order?.status === 'in_progress';
  const hasOrderItems = Array.isArray(order?.items) && order.items.length > 0;
  const canSendToWork = isDraft && hasOrderItems;

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

  const currentFileUrl = order?.image || '';
  const currentFileName = getFileNameFromUrl(currentFileUrl);

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
                marginBottom: 16,
                padding: 12,
              }}
            >
              {currentFileUrl ? (
                isImageFile(currentFileUrl) ? (
                  <Image
                    src={currentFileUrl}
                    alt="Order file"
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
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ textAlign: 'center' }}
                  >
                    <FilePdfOutlined
                      style={{ fontSize: 52, color: '#cf1322' }}
                    />

                    <Text strong style={{ wordBreak: 'break-word' }}>
                      {currentFileName || 'PDF файл'}
                    </Text>
                  </Flex>
                )
              ) : (
                <Text type="secondary">Файл не завантажено</Text>
              )}
            </div>

            {currentFileUrl && (
              <Button
                block
                onClick={() => window.open(currentFileUrl, '_blank')}
              >
                Відкрити файл
              </Button>
            )}
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              {isDraft && (
                <>
                  {canSendToWork ? (
                    <Popconfirm
                      title="Увага!"
                      description="Ви не зможете редагувати склад замовлення після передачі його в роботу! Ви впевнені, що склад замовлення вже остаточний?"
                      okText="Так"
                      cancelText="Ні"
                      onConfirm={handleSendToWork}
                      disabled={submittingToWork}
                    >
                      <Button block type="primary" loading={submittingToWork}>
                        Передати в роботу
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button block type="primary" disabled>
                      Передати в роботу
                    </Button>
                  )}

                  <Divider style={{ margin: '4px 0 8px 0' }} />
                </>
              )}

              {isInProgress && (
                <>
                  <Button
                    block
                    icon={<BankOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => setIsPaymentsDrawerOpen(true)}
                  >
                    Редагувати оплати
                  </Button>
                </>
              )}

              <Button
                block
                icon={<EditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => navigate(`/orders/${order.id}/edit`)}
              >
                Редагувати замовлення
              </Button>

              <Divider style={{ margin: '4px 0 8px 0' }} />

              <Popconfirm
                title="Увага!"
                description="Ця операція незворотна! Ви впевнені?"
                okText="Так"
                cancelText="Ні"
                onConfirm={() => {}}
              >
                <Button block danger icon={<StopOutlined />}>
                  Відміна замовлення
                </Button>
              </Popconfirm>
            </Flex>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
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
                    {order.vendor_name || '—'}
                  </Title>

                  {order.vendor && (
                    <>
                      <Link
                        to={`/orders/vendors/${order.vendor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <InfoCircleOutlined
                          style={{
                            color: '#1677ff',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                        />
                      </Link>

                      <LinkOutlined
                        style={{
                          color: '#8c8c8c',
                          fontSize: 16,
                          cursor: 'pointer',
                        }}
                      />
                    </>
                  )}
                </Flex>
              </Flex>
            }
            style={{ marginBottom: 20 }}
          >
            {order.comment && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 12px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                }}
              >
                <Flex align="flex-start" gap={8}>
                  <InfoCircleOutlined
                    style={{
                      color: '#8c8c8c',
                      marginTop: 3,
                    }}
                  />

                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    <Text strong>Коментар до замовлення:</Text> {order.comment}
                  </Text>
                </Flex>
              </div>
            )}

            <Table
              columns={summaryColumns}
              dataSource={[order]}
              rowKey="id"
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>

          {!isDraft && (
            <Card
              title={
                <Flex justify="space-between" align="center" wrap>
                  <span>Оплата</span>

                  <Text>
                    Баланс:{' '}
                    <strong
                      style={{
                        color:
                          Number(order.remaining_amount) > 0
                            ? '#ff4d4f'
                            : undefined,
                      }}
                    >
                      {formatMoney(order.remaining_amount)} ₴
                    </strong>
                  </Text>
                </Flex>
              }
              style={{ marginBottom: 20 }}
            >
              <Table
                rowKey="id"
                columns={paymentColumns}
                dataSource={
                  Array.isArray(order.payment_documents)
                    ? order.payment_documents
                    : []
                }
                pagination={false}
                size="small"
                tableLayout="fixed"
              />
            </Card>
          )}

          <Card title="Замовлення">
            <Table
              rowKey="id"
              columns={orderItemsColumns}
              dataSource={Array.isArray(order.items) ? order.items : []}
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>
        </Col>
      </Row>
      <Drawer
        title="Редагувати оплати"
        placement="right"
        size="large"
        open={isPaymentsDrawerOpen}
        onClose={() => setIsPaymentsDrawerOpen(false)}
      >
        <Text type="secondary">Вміст з’явиться пізніше</Text>
      </Drawer>
    </div>
  );
}

export default OrderDetailPage;
