// srs/pages/WarehouseMovementDetailPage.jsx

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  PrinterOutlined,
  SettingOutlined,
  StopOutlined,
  SwapOutlined,
  EditOutlined,
  InfoCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Input,
  Row,
  Select,
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
import WarehouseMovementDrawer from '../components/WarehouseMovementDrawer';
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

  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);

  const [locations, setLocations] = useState([]);
  const [storagePlaces, setStoragePlaces] = useState([]);

  const [editingDestination, setEditingDestination] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [editingPlannedAt, setEditingPlannedAt] = useState(false);
  const [editingPlannedAtValue, setEditingPlannedAtValue] = useState(null);

  const [savingMainInfo, setSavingMainInfo] = useState(false);

  useEffect(() => {
    loadMovementPlanPage();
    loadDestinationOptions();
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

  const canEditDestination = isDraft;
  const canEditPlannedAt = isDraft || isActive;

  const loadAllPaginated = async (endpoint, params = {}) => {
    const allResults = [];
    let page = 1;
    let hasNext = true;

    while (hasNext) {
      const response = await api.get(endpoint, {
        params: {
          ...params,
          page,
        },
      });

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      allResults.push(...results);

      hasNext = Boolean(response.data?.next);
      page += 1;
    }

    return allResults;
  };

  const loadDestinationOptions = async () => {
    try {
      const [locationResults, storagePlaceResults] = await Promise.all([
        loadAllPaginated('warehouse-locations/', { is_active: true }),
        loadAllPaginated('warehouse-storage-places/', { is_active: true }),
      ]);

      setLocations(locationResults);
      setStoragePlaces(storagePlaceResults);
    } catch (err) {
      console.error('Failed to load destination options:', err);
      message.error('Не вдалося завантажити напрямки переміщення.');
    }
  };

  const destinationOptions = useMemo(
    () => [
      ...locations.map((item) => ({
        value: `location:${item.id}`,
        label: renderWarehousePlacement({
          locationCode: item.code,
          locationName: item.name,
          storagePlaceDisplayName: null,
          storagePlaceFullDisplay: null,
        }),
        searchLabel: `${item.code || ''} ${item.name || ''}`,
      })),
      ...storagePlaces.map((item) => ({
        value: `storage_place:${item.id}`,
        label: renderWarehousePlacement({
          locationCode: item.location_code,
          locationName: null,
          storagePlaceDisplayName: item.display_name,
          storagePlaceFullDisplay: item.display_name_verbose,
        }),
        searchLabel: `${item.location_code || ''} ${
          item.display_name || ''
        } ${item.display_name_verbose || ''}`,
      })),
    ],
    [locations, storagePlaces],
  );

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

  const handleStartEditDestination = () => {
    if (!canEditDestination) return;

    if (plan.target_storage_place) {
      setSelectedDestination(`storage_place:${plan.target_storage_place}`);
    } else if (plan.target_location) {
      setSelectedDestination(`location:${plan.target_location}`);
    } else {
      setSelectedDestination(null);
    }

    setEditingDestination(true);
  };

  const handleSaveDestination = async () => {
    if (!selectedDestination) {
      message.error('Оберіть напрямок переміщення.');
      return;
    }

    const [type, rawId] = selectedDestination.split(':');
    const destinationId = Number(rawId);

    const payload = {
      target_location: type === 'location' ? destinationId : null,
      target_storage_place: type === 'storage_place' ? destinationId : null,
    };

    try {
      setSavingMainInfo(true);

      const response = await api.patch(`movement-plans/${id}/`, payload);

      setPlan(response.data);
      setEditingDestination(false);
      message.success('Напрямок переміщення оновлено.');
      await loadMovementPlanPage({ silent: true });
    } catch (err) {
      console.error('Failed to update movement destination:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'target_location',
        'target_storage_place',
        'destination',
      ]);

      message.error(
        backendMessage || 'Не вдалося оновити напрямок переміщення.',
      );
    } finally {
      setSavingMainInfo(false);
    }
  };

  const handleStartEditPlannedAt = () => {
    if (!canEditPlannedAt) return;

    setEditingPlannedAtValue(plan?.planned_at ? dayjs(plan.planned_at) : null);
    setEditingPlannedAt(true);
  };

  const handleSavePlannedAt = async () => {
    try {
      setSavingMainInfo(true);

      const response = await api.patch(`movement-plans/${id}/`, {
        planned_at: editingPlannedAtValue
          ? editingPlannedAtValue
              .hour(12)
              .minute(0)
              .second(0)
              .millisecond(0)
              .toISOString()
          : null,
      });

      setPlan(response.data);
      setEditingPlannedAt(false);
      message.success('Планову дату оновлено.');
      await loadMovementPlanPage({ silent: true });
    } catch (err) {
      console.error('Failed to update movement planned date:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'planned_at',
      ]);

      message.error(backendMessage || 'Не вдалося оновити планову дату.');
    } finally {
      setSavingMainInfo(false);
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

          {!isCancelled && !isExecuted && (
            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                {isDraft && (
                  <>
                    <Button
                      block
                      icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                      onClick={() => setIsMovementDrawerOpen(true)}
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
                      onClick={() => setIsMovementDrawerOpen(true)}
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
            {!(isExecuted || isCancelled) || plan.comment ? (
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

                          <Button
                            size="small"
                            onClick={handleCancelEditComment}
                          >
                            Скасувати
                          </Button>
                        </Flex>
                      </Flex>
                    )}
                  </Flex>
                }
              />
            ) : null}
            <Descriptions
              bordered
              size="small"
              column={2}
              style={{ marginTop: 16 }}
              items={[
                {
                  key: 'destination',
                  label: 'Куди',
                  contentStyle: { textAlign: 'center' },
                  children: (
                    <Flex align="center" justify="space-between" gap={8}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingDestination ? (
                          <Select
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="Оберіть напрямок"
                            value={selectedDestination}
                            options={destinationOptions}
                            optionFilterProp="searchLabel"
                            onChange={setSelectedDestination}
                          />
                        ) : (
                          renderWarehousePlacement({
                            locationCode: plan.target_location_code,
                            locationName: plan.target_location_name,
                            storagePlaceDisplayName:
                              plan.target_storage_place_display_name,
                            storagePlaceFullDisplay:
                              plan.target_storage_place_full_display,
                          })
                        )}
                      </div>

                      {canEditDestination &&
                        (editingDestination ? (
                          <SaveOutlined
                            style={{
                              color: '#52c41a',
                              fontSize: 16,
                              cursor: savingMainInfo
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                            onClick={
                              savingMainInfo ? undefined : handleSaveDestination
                            }
                          />
                        ) : (
                          <EditOutlined
                            style={{
                              color: '#1677ff',
                              fontSize: 16,
                              cursor: 'pointer',
                            }}
                            onClick={handleStartEditDestination}
                          />
                        ))}
                    </Flex>
                  ),
                },
                {
                  key: 'planned_at',
                  label: 'Заплановано на',
                  contentStyle: { textAlign: 'center' },
                  children: (
                    <Flex align="center" justify="space-between" gap={8}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingPlannedAt ? (
                          <DatePicker
                            style={{ width: '100%' }}
                            format="DD-MM-YYYY"
                            value={editingPlannedAtValue}
                            onChange={setEditingPlannedAtValue}
                            disabledDate={(current) =>
                              current && current < dayjs().startOf('day')
                            }
                          />
                        ) : (
                          (() => {
                            if (!plan.planned_at) return '—';

                            const dateText = formatDateDisplay(plan.planned_at);
                            const showStatus = isDraft || isActive;

                            if (!showStatus) {
                              return dateText;
                            }

                            if (plan.is_overdue) {
                              return (
                                <Flex align="center" justify="center" gap={6}>
                                  <Tag color="error">{dateText}</Tag>
                                  {plan.planned_status_text && (
                                    <Text type="secondary">
                                      {plan.planned_status_text}
                                    </Text>
                                  )}
                                </Flex>
                              );
                            }

                            if (plan.days_delta === 0) {
                              return (
                                <Flex align="center" justify="center" gap={6}>
                                  <Tag color="warning">{dateText}</Tag>
                                  {plan.planned_status_text && (
                                    <Text type="secondary">
                                      {plan.planned_status_text}
                                    </Text>
                                  )}
                                </Flex>
                              );
                            }

                            return (
                              <Flex align="center" justify="center" gap={6}>
                                <span>{dateText}</span>
                                {plan.planned_status_text && (
                                  <Text type="secondary">
                                    {plan.planned_status_text}
                                  </Text>
                                )}
                              </Flex>
                            );
                          })()
                        )}
                      </div>

                      {canEditPlannedAt &&
                        (editingPlannedAt ? (
                          <SaveOutlined
                            style={{
                              color: '#52c41a',
                              fontSize: 16,
                              cursor: savingMainInfo
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                            onClick={
                              savingMainInfo ? undefined : handleSavePlannedAt
                            }
                          />
                        ) : (
                          <EditOutlined
                            style={{
                              color: '#1677ff',
                              fontSize: 16,
                              cursor: 'pointer',
                            }}
                            onClick={handleStartEditPlannedAt}
                          />
                        ))}
                    </Flex>
                  ),
                },
              ]}
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
      <WarehouseMovementDrawer
        key={plan.id}
        open={isMovementDrawerOpen}
        onClose={() => setIsMovementDrawerOpen(false)}
        planId={plan.id}
        onSaved={() => loadMovementPlanPage({ silent: true })}
      />
    </div>
  );
}

export default WarehouseMovementDetailPage;
