import { useEffect, useState } from 'react';
import {
  EditOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Input,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import SaleOrderCustomerComponentsDrawer from '../components/SaleOrderCustomerComponentsDrawer';
import { getApiErrorMessage } from '../utils/apiError';
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

  const [confirmationStatus, setConfirmationStatus] = useState(null);
  const [confirmationStatusLoading, setConfirmationStatusLoading] =
    useState(false);

  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const [isCustomerComponentsDrawerOpen, setIsCustomerComponentsDrawerOpen] =
    useState(false);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const [isEditingResponsiblePerson, setIsEditingResponsiblePerson] =
    useState(false);
  const [responsiblePersonOptions, setResponsiblePersonOptions] = useState([]);
  const [responsiblePersonsLoading, setResponsiblePersonsLoading] =
    useState(false);
  const [editingResponsiblePerson, setEditingResponsiblePerson] =
    useState(null);
  const [savingResponsiblePerson, setSavingResponsiblePerson] = useState(false);

  const loadConfirmationStatus = async () => {
    try {
      setConfirmationStatusLoading(true);

      const response = await api.get(`sales-orders/${id}/confirmation-status/`);
      setConfirmationStatus(response.data);
    } catch (err) {
      console.error('Failed to load confirmation status:', err);
      setConfirmationStatus(null);
    } finally {
      setConfirmationStatusLoading(false);
    }
  };

  const loadOrderPage = async () => {
    try {
      setLoading(true);
      setError('');
      setConfirmationStatus(null);

      const response = await api.get(`sales-orders/${id}/`);
      setOrder(response.data);

      if (response.data?.status === 'draft') {
        await loadConfirmationStatus();
      }
    } catch (err) {
      console.error('Failed to load sale order page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
      setConfirmationStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditComment = () => {
    setEditingComment(order?.comment || '');
    setIsEditingComment(true);
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);

      const response = await api.post(`sales-orders/${id}/update-details/`, {
        comment: editingComment || '',
      });

      setOrder(response.data);
      setIsEditingComment(false);
      message.success('Коментар збережено.');
    } catch (err) {
      console.error('Failed to update sale order comment:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти коментар.');
    } finally {
      setSavingComment(false);
    }
  };

  const loadResponsiblePersonOptions = async () => {
    if (!order?.organization) return;

    try {
      setResponsiblePersonsLoading(true);

      const response = await api.get(
        `organization-person-assignments/?organization=${order.organization}&is_current=true`,
      );

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setResponsiblePersonOptions(
        results.map((item) => ({
          value: item.person,
          label: `${item.person_full_name || '—'} — ${
            item.position_name || '—'
          }`,
        })),
      );
    } catch (err) {
      console.error('Failed to load responsible person options:', err);
      message.error('Не вдалося завантажити відповідальних осіб.');
      setResponsiblePersonOptions([]);
    } finally {
      setResponsiblePersonsLoading(false);
    }
  };

  const handleStartEditResponsiblePerson = async () => {
    setEditingResponsiblePerson(order?.customer_responsible_person || null);
    setIsEditingResponsiblePerson(true);
    await loadResponsiblePersonOptions();
  };

  const handleSaveResponsiblePerson = async () => {
    try {
      setSavingResponsiblePerson(true);

      const response = await api.post(`sales-orders/${id}/update-details/`, {
        customer_responsible_person: editingResponsiblePerson || null,
      });

      setOrder(response.data);
      setIsEditingResponsiblePerson(false);
      message.success('Відповідального оновлено.');
    } catch (err) {
      console.error('Failed to update responsible person:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'customer_responsible_person',
      ]);

      message.error(backendMessage || 'Не вдалося оновити відповідального.');
    } finally {
      setSavingResponsiblePerson(false);
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setConfirmingOrder(true);

      const confirmationResponse = await api.get(
        `sales-orders/${id}/confirmation-status/`,
      );

      if (!confirmationResponse.data?.can_confirm) {
        message.error(
          'Неможливо підтвердити замовлення: не отримано всі компоненти від замовника.',
        );
        return;
      }

      const response = await api.post(`sales-orders/${id}/confirm/`, {});

      setOrder(response.data);
      setConfirmationStatus(null);
      message.success('Замовлення підтверджено.');
    } catch (err) {
      console.error('Failed to confirm sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося підтвердити замовлення.');
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancellingOrder(true);

      const response = await api.post(`sales-orders/${id}/cancel/`, {});

      setOrder(response.data);
      message.success('Замовлення відмінено.');
    } catch (err) {
      console.error('Failed to cancel sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося відмінити замовлення.');
    } finally {
      setCancellingOrder(false);
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
  const canEditDetails = !['completed', 'cancelled'].includes(order.status);
  const canConfirmOrder = Boolean(confirmationStatus?.can_confirm);

  const missingCustomerComponents = Array.isArray(
    confirmationStatus?.missing_components,
  )
    ? confirmationStatus.missing_components
    : [];

  const missingCustomerComponentColumns = [
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
      title: 'Потрібно',
      dataIndex: 'required_quantity',
      key: 'required_quantity',
      width: 130,
      align: 'center',
      render: (value) => formatQuantity(value),
    },
    {
      title: 'Наявно',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      width: 130,
      align: 'center',
      render: (value) => formatQuantity(value),
    },
    {
      title: 'Дефіцит',
      dataIndex: 'missing_quantity',
      key: 'missing_quantity',
      width: 130,
      align: 'center',
      render: (value) => formatQuantity(value),
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
                  <Flex vertical gap={6}>
                    <Tooltip
                      title={
                        !confirmationStatusLoading && !canConfirmOrder
                          ? 'Товар замовника ще не доступний для цього замовлення'
                          : ''
                      }
                    >
                      <div>
                        <Popconfirm
                          title="Підтвердити замовлення?"
                          description="Після підтвердження customer stock буде зарезервовано backend’ом."
                          okText="Підтвердити"
                          cancelText="Скасувати"
                          onConfirm={handleConfirmOrder}
                          disabled={!canConfirmOrder}
                        >
                          <Button
                            block
                            type="primary"
                            loading={
                              confirmingOrder || confirmationStatusLoading
                            }
                            disabled={!canConfirmOrder}
                          >
                            Підтвердити замовлення
                          </Button>
                        </Popconfirm>
                      </div>
                    </Tooltip>
                  </Flex>

                  <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                  <Button
                    block
                    icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => setIsCustomerComponentsDrawerOpen(true)}
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

              <Divider dashed style={{ margin: '4px 0 8px 0' }} />

              {canCancel ? (
                <Popconfirm
                  title="Відмінити замовлення?"
                  description="Ця дія є незворотною. Після відміни замовлення буде переведене у статус «Скасовано»."
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={handleCancelOrder}
                >
                  <Button
                    block
                    danger
                    loading={cancellingOrder}
                    icon={<StopOutlined />}
                  >
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
          <Card
            title={
              <Flex justify="space-between" align="center" gap={12}>
                <span>Основна інформація</span>

                <Text strong>
                  {order.product_code || '—'} |{' '}
                  {order.product_family_name || '—'}
                </Text>
              </Flex>
            }
            style={{ marginBottom: 20 }}
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
                      <Flex
                        align="center"
                        justify="space-between"
                        gap={8}
                        style={{ minWidth: 0 }}
                      >
                        {isEditingResponsiblePerson ? (
                          <Select
                            allowClear
                            style={{ flex: 1 }}
                            value={editingResponsiblePerson}
                            options={responsiblePersonOptions}
                            loading={responsiblePersonsLoading}
                            disabled={savingResponsiblePerson}
                            onChange={setEditingResponsiblePerson}
                          />
                        ) : (
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
                        )}

                        {canEditDetails &&
                          (isEditingResponsiblePerson ? (
                            <SaveOutlined
                              style={{
                                color: '#8c8c8c',
                                fontSize: 16,
                                cursor: savingResponsiblePerson
                                  ? 'not-allowed'
                                  : 'pointer',
                              }}
                              onClick={
                                savingResponsiblePerson
                                  ? undefined
                                  : handleSaveResponsiblePerson
                              }
                            />
                          ) : (
                            <EditOutlined
                              style={{
                                color: '#8c8c8c',
                                fontSize: 16,
                                cursor: 'pointer',
                              }}
                              onClick={handleStartEditResponsiblePerson}
                            />
                          ))}
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
                    key: 'updated_at',
                    label: 'Оновлено',
                    children: formatDateDisplay(order.updated_at),
                  },
                  {
                    key: 'completed_at',
                    label: 'Завершено',
                    children: order.completed_at
                      ? formatDateDisplay(order.completed_at)
                      : '—',
                  },
                ]}
              />

              <Alert
                type="warning"
                showIcon
                message={
                  <Flex vertical gap={10}>
                    <Flex justify="space-between" align="center" gap={8}>
                      <Text strong>Коментар до замовлення</Text>

                      {canEditDetails &&
                        (isEditingComment ? (
                          <SaveOutlined
                            style={{
                              color: '#8c8c8c',
                              fontSize: 16,
                              cursor: savingComment ? 'not-allowed' : 'pointer',
                            }}
                            onClick={
                              savingComment ? undefined : handleSaveComment
                            }
                          />
                        ) : (
                          <EditOutlined
                            style={{
                              color: '#8c8c8c',
                              fontSize: 16,
                              cursor: 'pointer',
                            }}
                            onClick={handleStartEditComment}
                          />
                        ))}
                    </Flex>

                    {isEditingComment ? (
                      <Input.TextArea
                        value={editingComment}
                        onChange={(event) =>
                          setEditingComment(event.target.value)
                        }
                        rows={3}
                        autoFocus
                        disabled={savingComment}
                      />
                    ) : (
                      <Text style={{ whiteSpace: 'pre-wrap' }}>
                        {order.comment || 'Коментар відсутній.'}
                      </Text>
                    )}
                  </Flex>
                }
              />
            </Flex>
          </Card>
          {isDraft && missingCustomerComponents.length > 0 && (
            <Card title="Дефіцит товарів замовника">
              <Table
                rowKey="component_id"
                size="small"
                pagination={false}
                dataSource={missingCustomerComponents}
                columns={missingCustomerComponentColumns}
                locale={{
                  emptyText: 'Дефіцит товарів замовника відсутній.',
                }}
              />
            </Card>
          )}
        </Col>
      </Row>

      <SaleOrderCustomerComponentsDrawer
        open={isCustomerComponentsDrawerOpen}
        onClose={() => setIsCustomerComponentsDrawerOpen(false)}
        orderId={order.id}
        onSaved={loadOrderPage}
      />
    </div>
  );
}

export default SaleOrdersDetailPage;
