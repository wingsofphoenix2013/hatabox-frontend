import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
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
  Col,
  Flex,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from 'antd';

import { useParams } from 'react-router-dom';

import api from '../api/client';
import { formatDateDisplay } from '../utils/orderFormatters';

import ProductionOrderScheduleDrawer from '../components/ProductionOrderScheduleDrawer';

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
                          {step.source_product_step || '—'}. {step.name || '—'}
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
                              <Tag color="error" style={{ marginInlineEnd: 0 }}>
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

            <Card title="Поточний етап">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>
        </Row>
      </Flex>
      <ProductionOrderScheduleDrawer
        open={isScheduleDrawerOpen}
        onClose={() => setIsScheduleDrawerOpen(false)}
        steps={steps}
      />
    </div>
  );
}

export default ProductionOrderDetailPage;
