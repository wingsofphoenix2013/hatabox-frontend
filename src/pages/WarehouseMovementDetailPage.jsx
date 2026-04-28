// srs/pages/WarehouseMovementDetailPage.jsx

import { useEffect, useState } from 'react';
import {
  PrinterOutlined,
  SettingOutlined,
  StopOutlined,
  SwapOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateDisplay } from '../utils/orderFormatters';
import { formatQuantity } from '../utils/formatNumber';
import { renderWarehousePlacement } from '../utils/warehousePlacementRenderers';
import {
  MOVEMENT_PLAN_STATUS_LABELS,
  getMovementPlanStatusTagColor,
} from '../constants/movementPlanStatus';

const { Title, Text } = Typography;

function WarehouseMovementDetailPage() {
  const { id } = useParams();

  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    loadMovementPlanPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMovementPlanPage = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');

      const response = await api.get(`movement-plans/${id}/`);
      setPlan(response.data);
    } catch (err) {
      console.error('Failed to load movement plan page:', err);
      setError('Не вдалося завантажити дані накладної.');
      setPlan(null);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const isDraft = plan?.status === 'draft';
  const isActive = plan?.status === 'active';
  const isExecuted = plan?.status === 'executed';
  const isCancelled = plan?.status === 'cancelled';

  const handleStartEditComment = () => {
    setEditingComment(plan?.comment || '');
    setIsEditingComment(true);
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setEditingComment('');
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);

      const response = await api.patch(`movement-plans/${id}/`, {
        comment: editingComment || '',
      });

      setPlan(response.data);
      message.success('Коментар збережено.');
      setIsEditingComment(false);
    } catch (err) {
      console.error('Failed to update movement plan comment:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти коментар.');
    } finally {
      setSavingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!plan) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Накладну не знайдено." showIcon />
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
            {`Накладна №${plan.id} від ${formatDateDisplay(plan.created_at)}`}
          </Title>

          <Tag
            color={getMovementPlanStatusTagColor(plan.status)}
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
            {MOVEMENT_PLAN_STATUS_LABELS[plan.status] || plan.status || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Накладна" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>

          {!isCancelled && (
            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                {isDraft && (
                  <>
                    <Button
                      block
                      icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                    >
                      Комплектація переміщення
                    </Button>

                    <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                    <Button block danger icon={<StopOutlined />}>
                      Скасувати переміщення
                    </Button>
                  </>
                )}

                {isActive && (
                  <>
                    <Button block type="primary" icon={<SwapOutlined />}>
                      Виконати переміщення
                    </Button>

                    <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                    <Button
                      block
                      icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                    >
                      Комплектація переміщення
                    </Button>

                    <Button
                      block
                      icon={<PrinterOutlined style={{ color: '#1677ff' }} />}
                    >
                      Роздрукувати накладну
                    </Button>

                    <Divider dashed style={{ margin: '4px 0 8px 0' }} />

                    <Button block danger icon={<StopOutlined />}>
                      Скасувати переміщення
                    </Button>
                  </>
                )}

                {isExecuted && (
                  <Button
                    block
                    icon={<PrinterOutlined style={{ color: '#1677ff' }} />}
                  >
                    Роздрукувати накладну
                  </Button>
                )}
              </Flex>
            </Card>
          )}

          <Card title="Історія переміщення">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Alert
              type="warning"
              showIcon
              message={
                <Flex vertical gap={12}>
                  <Flex justify="space-between" align="center">
                    <Text strong>Коментар до переміщення</Text>

                    {!isEditingComment && !isExecuted && !isCancelled && (
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

                  {!isEditingComment ? (
                    <Text style={{ whiteSpace: 'pre-wrap' }}>
                      {plan.comment ? plan.comment : 'Додати коментар'}
                    </Text>
                  ) : (
                    <Flex vertical gap={8}>
                      <Input.TextArea
                        value={editingComment}
                        onChange={(e) => setEditingComment(e.target.value)}
                        rows={3}
                        autoFocus
                      />

                      <Flex gap={8}>
                        <Button
                          type="primary"
                          size="small"
                          loading={savingComment}
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

          <Card
            title={
              <Flex align="center" gap={8} wrap={false}>
                <span style={{ fontWeight: 600 }}>Маршрут:</span>

                <div style={{ fontSize: 13 }}>
                  {renderWarehousePlacement({
                    locationCode: plan.target_location_code,
                    locationName: plan.target_location_name,
                    storagePlaceDisplayName:
                      plan.target_storage_place_display_name,
                    storagePlaceFullDisplay:
                      plan.target_storage_place_full_display,
                  })}
                </div>
              </Flex>
            }
          >
            <Table
              rowKey={(record, index) => index}
              dataSource={
                Array.isArray(plan?.source_lines) ? plan.source_lines : []
              }
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Немає даних для відображення.',
              }}
              columns={[
                {
                  title: '№',
                  key: 'index',
                  width: 60,
                  align: 'center',
                  render: (_, __, index) => (
                    <div style={{ textAlign: 'center' }}>{index + 1}</div>
                  ),
                },
                {
                  title: 'Товар',
                  key: 'item',
                  render: (_, record) => (
                    <Flex align="center" gap={6} wrap>
                      <span>{record.inventory_item_name || '—'}</span>

                      {record.inventory_item_id && (
                        <Link
                          to={`/inventory/stock/${record.inventory_item_id}`}
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
                  title: 'Звідки',
                  key: 'source',
                  render: (_, record) => (
                    <div style={{ whiteSpace: 'nowrap' }}>
                      {renderWarehousePlacement({
                        locationCode: record.source_location_code,
                        locationName: record.source_location_name,
                        storagePlaceDisplayName:
                          record.source_storage_place_display_name,
                        storagePlaceFullDisplay:
                          record.source_storage_place_full_display,
                      })}
                    </div>
                  ),
                },
                {
                  title: 'К-сть',
                  key: 'quantity',
                  width: 160,
                  align: 'center',
                  render: (_, record) => (
                    <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {formatQuantity(record.quantity)} {record.unit_symbol}
                    </div>
                  ),
                },
              ]}
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

export default WarehouseMovementDetailPage;
