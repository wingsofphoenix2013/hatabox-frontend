import { useEffect, useRef, useState } from 'react';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  SaveOutlined,
  SettingOutlined,
  ShoppingOutlined,
  StopOutlined,
  ToolOutlined,
  WarningFilled,
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
  Spin,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import SaleOrderCustomerComponentsDrawer from '../components/SaleOrderCustomerComponentsDrawer';
import SaleOrderDiaryDrawer from '../components/SaleOrderDiaryDrawer';
import SaleOrderProductionStartDrawer from '../components/SaleOrderProductionStartDrawer';
import { getApiErrorMessage } from '../utils/apiError';
import {
  formatDateDisplay,
  formatDateTimeDisplay,
} from '../utils/orderFormatters';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

const PRODUCTION_STEP_STATUS_LABELS = {
  draft: 'Чернетка',
  confirmed: 'Підтверджено',
  in_progress: 'В роботі',
  completed: 'Виконано',
  finished: 'Завершено',
  cancelled: 'Скасовано',
};

const getEventSourceIcon = (source) => {
  const commonStyle = {
    background: '#ffffff',
    padding: 3,
    borderRadius: '50%',
  };

  switch (source) {
    case 'sales':
      return <ShoppingOutlined style={{ ...commonStyle, color: '#1677ff' }} />;
    case 'production':
      return <ToolOutlined style={{ ...commonStyle, color: '#722ed1' }} />;
    case 'warehouse':
      return <InboxOutlined style={{ ...commonStyle, color: '#13c2c2' }} />;
    case 'system':
      return <RobotOutlined style={{ ...commonStyle, color: '#8c8c8c' }} />;
    default:
      return (
        <InfoCircleOutlined style={{ ...commonStyle, color: '#8c8c8c' }} />
      );
  }
};

const getEventSourceTagColor = (source) => {
  switch (source) {
    case 'sales':
      return 'processing';
    case 'production':
      return 'purple';
    case 'warehouse':
      return 'cyan';
    case 'system':
      return 'default';
    default:
      return 'default';
  }
};

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
    case 'finished':
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
  const [orderEvents, setOrderEvents] = useState([]);
  const [orderEventsLoading, setOrderEventsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmationStatus, setConfirmationStatus] = useState(null);
  const [confirmationStatusLoading, setConfirmationStatusLoading] =
    useState(false);

  const [productionReadiness, setProductionReadiness] = useState(null);
  const [productionReadinessLoading, setProductionReadinessLoading] =
    useState(false);

  const productionReadinessPollRef = useRef(null);

  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [confirmingProductionStepId, setConfirmingProductionStepId] =
    useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const [isCustomerComponentsDrawerOpen, setIsCustomerComponentsDrawerOpen] =
    useState(false);

  const [isDiaryDrawerOpen, setIsDiaryDrawerOpen] = useState(false);
  const [diaryEntriesCount, setDiaryEntriesCount] = useState(0);

  const [isProductionStartDrawerOpen, setIsProductionStartDrawerOpen] =
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

  const clearProductionReadinessPoll = () => {
    if (productionReadinessPollRef.current) {
      window.clearTimeout(productionReadinessPollRef.current);
      productionReadinessPollRef.current = null;
    }
  };

  const loadDiaryEntriesCount = async () => {
    try {
      const response = await api.get(
        `production-diary-entries/?sales_order=${id}`,
      );

      setDiaryEntriesCount(Number(response.data?.count) || 0);
    } catch (err) {
      console.error('Failed to load production diary entries count:', err);
      setDiaryEntriesCount(0);
    }
  };

  const loadOrderEvents = async () => {
    try {
      setOrderEventsLoading(true);

      const response = await api.get(`sales-orders/${id}/events/`);

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setOrderEvents(results.slice(0, 5));
    } catch (err) {
      console.error('Failed to load sale order events:', err);

      setOrderEvents([]);
    } finally {
      setOrderEventsLoading(false);
    }
  };

  const loadProductionReadiness = async ({ silent = false } = {}) => {
    try {
      clearProductionReadinessPoll();

      if (!silent) {
        setProductionReadinessLoading(true);
      }

      const response = await api.get(
        `sales-orders/${id}/production-readiness/`,
      );

      setProductionReadiness(response.data || null);

      if (response.data?.readiness_status === 'pending') {
        productionReadinessPollRef.current = window.setTimeout(() => {
          loadProductionReadiness({ silent: true });
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to load production readiness:', err);
      setProductionReadiness(null);
    } finally {
      if (!silent) {
        setProductionReadinessLoading(false);
      }
    }
  };

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
      setProductionReadiness(null);
      clearProductionReadinessPoll();

      const response = await api.get(`sales-orders/${id}/`);
      setOrder(response.data);

      await loadOrderEvents();
      await loadDiaryEntriesCount();

      if (response.data?.status === 'draft') {
        await loadConfirmationStatus();
      }

      if (['confirmed', 'in_progress'].includes(response.data?.status)) {
        await loadProductionReadiness();
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
      await loadOrderEvents();
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
      await loadOrderEvents();
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
      setProductionReadiness(null);

      await loadProductionReadiness();
      await loadOrderEvents();

      message.success('Замовлення підтверджено.');
    } catch (err) {
      console.error('Failed to confirm sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося підтвердити замовлення.');
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleConfirmProductionStep = async (stepId) => {
    try {
      setConfirmingProductionStepId(stepId);

      await api.post(`production-order-steps/${stepId}/confirm/`, {});

      message.success('Етап підтверджено.');

      await loadProductionReadiness();
      await loadOrderEvents();
    } catch (err) {
      console.error('Failed to confirm production step:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(
        backendMessage || 'Не вдалося підтвердити етап виробництва.',
      );
    } finally {
      setConfirmingProductionStepId(null);
    }
  };

  const handleCancelOrder = async () => {
    try {
      setCancellingOrder(true);

      const response = await api.post(`sales-orders/${id}/cancel/`, {});

      setOrder(response.data);
      await loadOrderEvents();
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

  useEffect(
    () => () => {
      clearProductionReadinessPoll();
    },
    [],
  );

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
  const isInProgress = order.status === 'in_progress';
  const isCancelled = order.status === 'cancelled';
  const canCancel = isDraft || isConfirmed;
  const shouldShowNavigationCard = !isCancelled || diaryEntriesCount > 0;
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
              {['in_progress', 'ready', 'completed'].includes(order.status) ? (
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
              ) : (
                <Text type="secondary">
                  Серійний номер призначається на етапі запуску виробництва
                </Text>
              )}
            </div>
          </Card>

          {shouldShowNavigationCard && (
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
                    <Tooltip
                      title={
                        productionReadiness?.summary?.production_order_can_start
                          ? ''
                          : 'Виробництво ще не готове до запуску.'
                      }
                    >
                      <div>
                        <Button
                          block
                          type="primary"
                          disabled={
                            !productionReadiness?.summary
                              ?.production_order_can_start
                          }
                          onClick={() => setIsProductionStartDrawerOpen(true)}
                        >
                          Передати в виробництво
                        </Button>
                      </div>
                    </Tooltip>
                  </>
                )}

                {!isDraft && (
                  <Button
                    block
                    icon={<FileTextOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => setIsDiaryDrawerOpen(true)}
                  >
                    Щоденник виробництва
                  </Button>
                )}

                {canCancel && (
                  <Divider dashed style={{ margin: '4px 0 8px 0' }} />
                )}

                {canCancel && (
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
                )}
              </Flex>
            </Card>
          )}

          <Card title="Історія замовлення">
            {orderEventsLoading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : orderEvents.length > 0 ? (
              <Flex vertical gap={12}>
                <Timeline
                  items={orderEvents.map((event) => ({
                    dot: getEventSourceIcon(event.source),
                    children: (
                      <Flex vertical gap={4}>
                        <Flex align="center" gap={6} wrap={false}>
                          <Tag
                            color={getEventSourceTagColor(event.source)}
                            style={{ marginInlineEnd: 0 }}
                          >
                            {event.source_display || event.source || '—'}
                          </Tag>

                          <Text strong style={{ fontSize: 13 }}>
                            {event.title || '—'}
                          </Text>
                        </Flex>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTimeDisplay(event.created_at)} ·{' '}
                          {event.created_by_username || 'Створено автоматично'}
                        </Text>
                      </Flex>
                    ),
                  }))}
                />

                <Flex justify="flex-end">
                  <Button type="link" style={{ padding: 0 }} disabled>
                    Показати всю історію
                  </Button>
                </Flex>
              </Flex>
            ) : (
              <Text type="secondary">Дані з’являться пізніше.</Text>
            )}
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
                    label: [
                      'confirmed',
                      'in_progress',
                      'ready',
                      'completed',
                    ].includes(order.status)
                      ? 'Очікується'
                      : 'Оновлено',
                    children: [
                      'confirmed',
                      'in_progress',
                      'ready',
                      'completed',
                    ].includes(order.status)
                      ? order.expected_ready_at
                        ? formatDateDisplay(order.expected_ready_at)
                        : '—'
                      : formatDateDisplay(order.updated_at),
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
          {(isConfirmed || isInProgress) && (
            <Card title="Готовність виробництва">
              {productionReadinessLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : productionReadiness?.readiness_status === 'pending' ? (
                <Flex
                  vertical
                  align="center"
                  justify="center"
                  gap={12}
                  style={{ padding: '28px 0' }}
                >
                  <Spin size="large" />
                  <Text type="secondary">
                    {productionReadiness.message ||
                      'Виробничі етапи ще формуються.'}
                  </Text>
                </Flex>
              ) : productionReadiness?.readiness_status === 'failed' ? (
                <Alert
                  type="error"
                  showIcon
                  message={
                    productionReadiness.message ||
                    'Не вдалося сформувати виробничі етапи.'
                  }
                />
              ) : (
                <Flex vertical gap={16}>
                  {(productionReadiness?.steps || []).map((step) => (
                    <Card
                      key={step.production_order_step}
                      size="small"
                      title={
                        <Flex
                          justify="space-between"
                          align="center"
                          gap={12}
                          wrap
                        >
                          <Flex align="center" gap={8} wrap>
                            <span>
                              Етап {step.sequence_number}: {step.name}
                            </span>

                            <Tag
                              color={getStatusTagColor(step.status)}
                              style={{ marginInlineEnd: 0 }}
                            >
                              {PRODUCTION_STEP_STATUS_LABELS[step.status] ||
                                step.status ||
                                '—'}
                            </Tag>
                          </Flex>
                          {step.status === 'draft' && (
                            <Tooltip
                              title={
                                !step.can_be_confirmed
                                  ? 'Етап не може бути підтверджений, поки не вирішені критичні проблеми.'
                                  : productionReadiness?.summary?.next_step !==
                                      step.production_order_step
                                    ? 'Спочатку потрібно підтвердити попередній етап.'
                                    : ''
                              }
                            >
                              <div>
                                <Popconfirm
                                  title="Підтвердити етап?"
                                  description="Після підтвердження етапу процедура буде незворотною."
                                  okText="Підтвердити"
                                  cancelText="Скасувати"
                                  disabled={
                                    !step.can_be_confirmed ||
                                    productionReadiness?.summary?.next_step !==
                                      step.production_order_step ||
                                    !productionReadiness?.summary
                                      ?.can_confirm_next_step
                                  }
                                  onConfirm={() =>
                                    handleConfirmProductionStep(
                                      step.production_order_step,
                                    )
                                  }
                                >
                                  <Button
                                    size="small"
                                    type={
                                      step.can_be_confirmed &&
                                      productionReadiness?.summary
                                        ?.next_step ===
                                        step.production_order_step &&
                                      productionReadiness?.summary
                                        ?.can_confirm_next_step
                                        ? 'primary'
                                        : 'default'
                                    }
                                    loading={
                                      confirmingProductionStepId ===
                                      step.production_order_step
                                    }
                                    disabled={!step.can_be_confirmed}
                                    onClick={
                                      step.can_be_confirmed &&
                                      (productionReadiness?.summary
                                        ?.next_step !==
                                        step.production_order_step ||
                                        !productionReadiness?.summary
                                          ?.can_confirm_next_step)
                                        ? (event) => event.preventDefault()
                                        : undefined
                                    }
                                  >
                                    Підтвердити етап
                                  </Button>
                                </Popconfirm>
                              </div>
                            </Tooltip>
                          )}
                        </Flex>
                      }
                    >
                      {Array.isArray(step.issues) && step.issues.length > 0 ? (
                        <Table
                          rowKey="issue"
                          size="small"
                          pagination={false}
                          dataSource={step.issues}
                          columns={[
                            {
                              title: '№',
                              key: 'index',
                              width: 56,
                              align: 'center',
                              render: (_, __, index) => index + 1,
                            },
                            {
                              title: 'Компонент',
                              key: 'component',
                              render: (_, record) => (
                                <Flex align="center" gap={6} wrap>
                                  <span>
                                    {record.inv_item_name || '—'} |{' '}
                                    {record.inv_item_code || '—'}
                                  </span>

                                  {record.inv_item ? (
                                    <Link
                                      to={`/inventory/stock/${record.inv_item}`}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <InfoCircleOutlined
                                        style={{ color: '#8c8c8c' }}
                                      />
                                    </Link>
                                  ) : null}
                                </Flex>
                              ),
                            },
                            {
                              title: 'Дефіцит',
                              key: 'missing_quantity',
                              width: 160,
                              align: 'center',
                              render: (_, record) => (
                                <Text strong>
                                  {formatQuantity(record.missing_quantity)}{' '}
                                  {record.unit_symbol || ''}
                                </Text>
                              ),
                            },
                            {
                              title: 'Крит.',
                              key: 'severity',
                              width: 90,
                              align: 'center',
                              render: (_, record) =>
                                record.severity === 'critical' ? (
                                  <Tooltip title={record.message || ''}>
                                    <WarningFilled
                                      style={{
                                        color: '#ff4d4f',
                                        fontSize: 18,
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <span style={{ color: '#bfbfbf' }}>—</span>
                                ),
                            },
                          ]}
                        />
                      ) : step.status === 'confirmed' ? (
                        <Alert
                          type="success"
                          showIcon
                          message={
                            <Flex
                              align="center"
                              justify="space-between"
                              gap={12}
                              wrap
                            >
                              <Text>
                                Етап підтверджено. Компоненти зарезервовано.
                                Видаткова сформована.
                              </Text>

                              <Flex align="center" gap={6}>
                                {step.production_movement_components_transferred ? (
                                  <>
                                    <CheckCircleFilled
                                      style={{
                                        color: '#52c41a',
                                        fontSize: 16,
                                      }}
                                    />

                                    <Text strong>Компоненти ВИДАНО.</Text>
                                  </>
                                ) : (
                                  <>
                                    <CloseCircleFilled
                                      style={{
                                        color: '#ff4d4f',
                                        fontSize: 16,
                                      }}
                                    />

                                    <Text strong>Компоненти НЕ ВИДАНО.</Text>
                                  </>
                                )}
                              </Flex>
                            </Flex>
                          }
                        />
                      ) : step.status === 'in_progress' ? (
                        <Alert
                          type="success"
                          showIcon
                          message="Етап розпочато."
                        />
                      ) : step.status === 'finished' ? (
                        <Alert
                          type="success"
                          showIcon
                          message="Етап завершено."
                        />
                      ) : (
                        <Flex
                          align="center"
                          gap={8}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                            background: '#fafafa',
                          }}
                        >
                          <CheckCircleFilled
                            style={{
                              color: '#52c41a',
                              fontSize: 16,
                            }}
                          />

                          <Text>Етап готовий до підтвердження.</Text>
                        </Flex>
                      )}
                    </Card>
                  ))}
                </Flex>
              )}
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

      <SaleOrderDiaryDrawer
        open={isDiaryDrawerOpen}
        onClose={() => setIsDiaryDrawerOpen(false)}
        salesOrderId={order.id}
        productionReadiness={productionReadiness}
        onSaved={async () => {
          await loadOrderEvents();
          await loadProductionReadiness({ silent: true });
        }}
      />

      <SaleOrderProductionStartDrawer
        open={isProductionStartDrawerOpen}
        onClose={() => setIsProductionStartDrawerOpen(false)}
        productionOrderId={productionReadiness?.production_order}
        onStarted={async () => {
          await loadOrderPage();
        }}
      />
    </div>
  );
}

export default SaleOrdersDetailPage;
