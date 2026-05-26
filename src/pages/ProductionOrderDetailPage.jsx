import { useEffect, useState } from 'react';
import {
  ApiOutlined,
  AppstoreAddOutlined,
  BellOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  FilePdfOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  SettingOutlined,
  StopOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Popconfirm,
  Col,
  Flex,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';

import { useParams } from 'react-router-dom';

import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateDisplay } from '../utils/orderFormatters';

import ProductionOrderScheduleDrawer from '../components/ProductionOrderScheduleDrawer';
import ProductionOrderStepFinishedDrawer from '../components/ProductionOrderStepFinishedDrawer';

const { Title, Text } = Typography;

const getProductionOrderStatusTagColor = (status) => {
  switch (status) {
    case 'in_progress':
      return 'purple';
    case 'ready':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStepStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'confirmed':
      return 'processing';
    case 'in_progress':
      return 'purple';
    case 'finished':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStepStatusIcon = (status) => {
  switch (status) {
    case 'draft':
      return <FileAddOutlined style={{ color: '#8c8c8c' }} />;
    case 'confirmed':
      return <FileDoneOutlined style={{ color: '#1677ff' }} />;
    case 'in_progress':
      return <SyncOutlined spin style={{ color: '#722ed1' }} />;
    case 'finished':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'cancelled':
      return <StopOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return <FileAddOutlined style={{ color: '#8c8c8c' }} />;
  }
};

function ProductionOrderDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingStepId, setStartingStepId] = useState(null);

  const [isFinishStepDrawerOpen, setIsFinishStepDrawerOpen] = useState(false);

  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`production-orders/${id}/detail/`);

      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load production order detail page:', err);
      setError('Не вдалося завантажити дані карти виробництва.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProductionStep = async (stepId) => {
    if (!stepId) return;

    try {
      setStartingStepId(stepId);

      await api.post(`production-order-steps/${stepId}/start/`, {});

      message.success('Етап передано в роботу.');

      await loadPage();
    } catch (err) {
      console.error('Failed to start production step:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося передати етап в роботу.');
    } finally {
      setStartingStepId(null);
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

  if (error && !data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  const summary = data?.summary || {};
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const currentInProgressStep = steps.find(
    (step) => step.status === 'in_progress',
  );
  const canConfigureSchedule = steps.some((step) => !step.expected_finished_at);

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="flex-start" gap={16}>
          <Flex align="center" gap={12} wrap>
            <Title level={2} style={{ margin: 0 }}>
              Виріб №{summary.serial_number || '—'}
            </Title>

            <Tag
              color={getProductionOrderStatusTagColor(
                summary.production_order_status,
              )}
              style={{
                fontSize: 20,
                lineHeight: '32px',
                paddingInline: 14,
                paddingBlock: 6,
                borderRadius: 10,
                marginInlineEnd: 0,
              }}
            >
              {summary.production_order_status_display ||
                summary.production_order_status ||
                '—'}
            </Tag>
          </Flex>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Графік виробництва" style={{ marginBottom: 20 }}>
              {steps.length > 0 ? (
                <Flex vertical gap={10}>
                  {steps.map((step) => {
                    const isFinished = Boolean(step.finished_at);
                    const dateValue = isFinished
                      ? step.finished_at
                      : step.expected_finished_at;
                    const dateText = dateValue
                      ? formatDateDisplay(dateValue)
                      : '—';

                    return (
                      <Flex
                        key={step.production_order_step}
                        align="flex-end"
                        gap={8}
                        style={{ minWidth: 0 }}
                      >
                        <Flex
                          align="center"
                          justify="center"
                          style={{ width: 22, flex: '0 0 auto' }}
                        >
                          {getStepStatusIcon(step.status)}
                        </Flex>

                        <Text
                          style={{
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {(() => {
                            const stepName = step.name || '—';
                            const shortStepName =
                              stepName.length > 20
                                ? `${stepName.slice(0, 20)}...`
                                : stepName;
                            const content = `${step.source_product_step || '—'}. ${shortStepName}`;

                            return stepName.length > 20 ? (
                              <Tooltip title={stepName}>{content}</Tooltip>
                            ) : (
                              content
                            );
                          })()}
                        </Text>

                        <div
                          style={{
                            flex: 1,
                            borderBottom: '1px dotted #d9d9d9',
                            transform: 'translateY(-4px)',
                          }}
                        />

                        <Flex
                          align="center"
                          gap={4}
                          style={{ flex: '0 0 auto' }}
                        >
                          {isFinished && step.final_is_overdue ? (
                            <Tooltip
                              title={`Затримка: ${
                                step.final_overdue_days ?? '—'
                              } днів`}
                            >
                              <WarningOutlined
                                style={{
                                  color: '#ff4d4f',
                                  fontSize: 15,
                                }}
                              />
                            </Tooltip>
                          ) : null}

                          {!isFinished && step.current_is_overdue ? (
                            <Tooltip
                              title={`Затримка: ${Math.abs(
                                Number(step.current_days_left) || 0,
                              )} днів`}
                            >
                              <Tag
                                color="error"
                                style={{
                                  marginInlineEnd: 0,
                                  fontSize: 12,
                                  lineHeight: '22px',
                                }}
                              >
                                {dateText}
                              </Tag>
                            </Tooltip>
                          ) : !isFinished ? (
                            <Tooltip
                              title={`До закінчення етапу: ${
                                step.current_days_left ?? '—'
                              } днів`}
                            >
                              <Text>{dateText}</Text>
                            </Tooltip>
                          ) : (
                            <Text>{dateText}</Text>
                          )}
                        </Flex>
                      </Flex>
                    );
                  })}
                </Flex>
              ) : (
                <Text type="secondary">Дані зʼявляться пізніше</Text>
              )}
              {summary.production_order_status === 'in_progress' && (
                <Flex justify="flex-end" style={{ marginTop: 12 }}>
                  {canConfigureSchedule ? (
                    <Button
                      type="link"
                      icon={<SettingOutlined />}
                      style={{ padding: 0 }}
                      onClick={() => setIsScheduleDrawerOpen(true)}
                    >
                      Налаштувати графік
                    </Button>
                  ) : (
                    <Tooltip title="Налаштування графіка вже неможливо">
                      <Button
                        type="link"
                        icon={<SettingOutlined />}
                        disabled
                        style={{ padding: 0 }}
                      >
                        Налаштувати графік
                      </Button>
                    </Tooltip>
                  )}
                </Flex>
              )}
            </Card>

            <Card title="Історія замовлення">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card
              title="Поточний етап"
              style={{ marginBottom: 20 }}
              extra={
                currentInProgressStep ? (
                  currentInProgressStep.can_finish ? (
                    <Button
                      icon={
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      }
                      style={{
                        color: '#52c41a',
                        borderColor: '#52c41a',
                      }}
                      onClick={() => setIsFinishStepDrawerOpen(true)}
                    >
                      Завершити етап
                    </Button>
                  ) : (
                    <Tooltip title="Не виконані всі роботи для завершення етапу">
                      <Button disabled icon={<CheckCircleOutlined />}>
                        Завершити етап
                      </Button>
                    </Tooltip>
                  )
                ) : null
              }
            >
              {currentInProgressStep ? (
                <Card
                  size="small"
                  title={
                    <Flex align="center" gap={12} wrap>
                      <span>
                        Етап {currentInProgressStep.source_product_step || '—'}.{' '}
                        {currentInProgressStep.name || '—'}
                      </span>

                      <Tag
                        color={getStepStatusTagColor(
                          currentInProgressStep.status,
                        )}
                        style={{ marginInlineEnd: 0 }}
                      >
                        {currentInProgressStep.status_display ||
                          currentInProgressStep.status ||
                          '—'}
                      </Tag>
                    </Flex>
                  }
                >
                  <Text type="secondary">Дані зʼявляться пізніше</Text>
                </Card>
              ) : (
                <Alert
                  type="warning"
                  showIcon
                  message='Немає жодного етапу виробництва позначеного "В роботі"!'
                />
              )}
            </Card>

            <Card title="Щоденник виробництва" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Заплановані етапи" style={{ marginBottom: 20 }}>
              <Flex vertical gap={16}>
                {steps
                  .filter((step) =>
                    ['draft', 'confirmed'].includes(step.status),
                  )
                  .map((step) => (
                    <Card
                      key={step.production_order_step}
                      size="small"
                      title={
                        <Flex
                          align="center"
                          gap={12}
                          wrap={false}
                          style={{ width: '100%' }}
                        >
                          <Flex
                            align="center"
                            gap={12}
                            wrap
                            style={{ minWidth: 0 }}
                          >
                            <Text
                              strong
                              style={{
                                fontSize: 14,
                                margin: 0,
                              }}
                            >
                              Етап {step.source_product_step || '—'}.{' '}
                              {step.name || '—'}
                            </Text>

                            <Tag
                              color={getStepStatusTagColor(step.status)}
                              style={{
                                marginInlineEnd: 0,
                                fontSize: 12,
                              }}
                            >
                              {step.status_display || step.status || '—'}
                            </Tag>
                          </Flex>

                          <div style={{ marginLeft: 'auto' }} />

                          {step.can_start ? (
                            <Popconfirm
                              title="Розпочати виробництво?"
                              description="Після запуску етап буде передано в роботу. Цю дію неможливо скасувати."
                              okText="Розпочати"
                              cancelText="Скасувати"
                              onConfirm={() =>
                                handleStartProductionStep(
                                  step.production_order_step,
                                )
                              }
                            >
                              <Button
                                size="small"
                                icon={
                                  <ApiOutlined style={{ color: '#722ed1' }} />
                                }
                                loading={
                                  startingStepId === step.production_order_step
                                }
                                style={{
                                  color: '#722ed1',
                                  borderColor: '#722ed1',
                                }}
                              >
                                Розпочати виробництво
                              </Button>
                            </Popconfirm>
                          ) : (
                            <Tooltip
                              title={
                                Array.isArray(step.can_start_reasons) &&
                                step.can_start_reasons.length > 0 ? (
                                  <Flex vertical gap={4}>
                                    {step.can_start_reasons.map((reason) => (
                                      <span key={reason}>{reason}</span>
                                    ))}
                                  </Flex>
                                ) : (
                                  'Етап поки не можна передати в роботу.'
                                )
                              }
                            >
                              <Button
                                size="small"
                                disabled
                                icon={<ApiOutlined />}
                              >
                                Розпочати виробництво
                              </Button>
                            </Tooltip>
                          )}
                        </Flex>
                      }
                    >
                      <Descriptions
                        bordered
                        size="small"
                        column={2}
                        items={[
                          {
                            key: 'production_movement',
                            label: 'Накладна на видачу',
                            children: step.production_movement ? (
                              <Flex align="center" gap={6}>
                                <Text strong>№{step.production_movement}</Text>

                                {step.production_movement_invoice_file ? (
                                  <a
                                    href={step.production_movement_invoice_file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <FilePdfOutlined
                                      style={{ color: '#1677ff' }}
                                    />
                                  </a>
                                ) : null}
                              </Flex>
                            ) : (
                              '—'
                            ),
                          },
                          {
                            key: 'components_transferred',
                            label: 'Компоненти видано',
                            children: step.components_transferred ? (
                              <CheckCircleFilled
                                style={{
                                  color: '#52c41a',
                                  fontSize: 17,
                                }}
                              />
                            ) : step.production_movement ? (
                              <Flex align="center" gap={6}>
                                <BellOutlined
                                  style={{
                                    color: '#1677ff',
                                    fontSize: 16,
                                  }}
                                />
                                <Text>Запросити видачу</Text>
                              </Flex>
                            ) : (
                              '—'
                            ),
                          },
                        ]}
                      />
                    </Card>
                  ))}
              </Flex>
            </Card>

            <Card title="Завершені етапи">
              <Flex vertical gap={16}>
                {steps
                  .filter((step) => step.status === 'finished')
                  .map((step) => (
                    <Card
                      key={step.production_order_step}
                      size="small"
                      title={
                        <Flex align="center" gap={12} wrap>
                          <Text strong style={{ fontSize: 14 }}>
                            Етап {step.source_product_step || '—'}.{' '}
                            {step.name || '—'}
                          </Text>

                          <Tag
                            color={getStepStatusTagColor(step.status)}
                            style={{
                              marginInlineEnd: 0,
                              fontSize: 12,
                            }}
                          >
                            {step.status_display || step.status || '—'}
                          </Tag>
                        </Flex>
                      }
                    >
                      <Text type="secondary">Дані зʼявляться пізніше</Text>
                    </Card>
                  ))}
              </Flex>
            </Card>
          </Col>
        </Row>
      </Flex>
      <ProductionOrderScheduleDrawer
        open={isScheduleDrawerOpen}
        onClose={() => setIsScheduleDrawerOpen(false)}
        steps={steps}
        productionStartedAt={summary.sales_order_created_at}
        productionOrderId={summary.production_order}
        onSaved={(detailData) => {
          setData(detailData);
          setIsScheduleDrawerOpen(false);
        }}
      />
      <ProductionOrderStepFinishedDrawer
        open={isFinishStepDrawerOpen}
        onClose={() => setIsFinishStepDrawerOpen(false)}
        step={currentInProgressStep}
        serialNumber={summary.serial_number}
        isLastStep={
          steps[steps.length - 1]?.production_order_step ===
          currentInProgressStep?.production_order_step
        }
        onFinished={loadPage}
      />
    </div>
  );
}

export default ProductionOrderDetailPage;
