import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;
const { TextArea } = Input;

const getLocationTagStyle = () => ({
  color: '#595959',
  background: '#fafafa',
  borderColor: '#d9d9d9',
  fontWeight: 600,
  minWidth: 34,
  textAlign: 'center',
  marginInlineEnd: 0,
});

const getPlacementTagColor = (label = '') => {
  const normalized = label.toLowerCase();

  if (normalized.includes('контейнер')) return 'processing';
  if (normalized.includes('стелаж')) return 'success';
  if (normalized.includes('бокс')) return 'warning';

  return 'default';
};

const renderStoragePlaceChain = (value) => {
  if (!value) return null;

  const normalizedValue = value.replace(/\s+на локації\s*$/i, '');

  const parts = normalizedValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <Flex wrap={false} gap={6} style={{ whiteSpace: 'nowrap' }}>
      {parts.map((part, index) => {
        const tokens = part.split(' ');
        const code = tokens.pop();
        const label = tokens.join(' ');

        return (
          <Flex key={`${part}-${index}`} align="center" gap={4}>
            <span>{label}</span>
            <Tag
              color={getPlacementTagColor(label)}
              style={{ marginInlineEnd: 0, fontWeight: 600 }}
            >
              {code}
            </Tag>
            {index < parts.length - 1 && <span>,</span>}
          </Flex>
        );
      })}
    </Flex>
  );
};

const renderStoragePlaceOption = (item) => (
  <Flex align="center" gap={6} wrap={false} style={{ minWidth: 0 }}>
    <Tag style={getLocationTagStyle()}>{item.location_code || '—'}</Tag>
    <Text type="secondary">:</Text>
    {renderStoragePlaceChain(item.display_name_verbose)}
  </Flex>
);

function WarehouseMovementDrawer({ open, onClose, planId = null, onSaved }) {
  const [locations, setLocations] = useState([]);
  const [storagePlaces, setStoragePlaces] = useState([]);

  const [locationsLoading, setLocationsLoading] = useState(false);
  const [storagePlacesLoading, setStoragePlacesLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [destinationType, setDestinationType] = useState('location');
  const [targetLocationId, setTargetLocationId] = useState(null);
  const [targetStoragePlaceId, setTargetStoragePlaceId] = useState(null);
  const [plannedAt, setPlannedAt] = useState(null);
  const [comment, setComment] = useState('');
  const [planStatus, setPlanStatus] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [moveQuantity, setMoveQuantity] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  const [addingItem, setAddingItem] = useState(false);
  const [editingPlanItemId, setEditingPlanItemId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [deletingPlanItemId, setDeletingPlanItemId] = useState(null);

  const [executingPlan, setExecutingPlan] = useState(false);

  const activePlanId = planId || activePlan?.id;
  const isEditMode = Boolean(activePlanId);

  const resetState = () => {
    setDestinationType('location');
    setTargetLocationId(null);
    setTargetStoragePlaceId(null);
    setPlannedAt(null);
    setComment('');
    setPlanStatus(null);
    setActivePlan(null);
    setSelectedStockItem(null);
    setMoveQuantity(null);
    setStockItems([]);
    setStockLoading(false);
    setSaving(false);
    setAddingItem(false);
    setEditingPlanItemId(null);
    setEditingQuantity(null);
    setDeletingPlanItemId(null);
    setExecutingPlan(false);
  };

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

  const loadLocations = async () => {
    try {
      setLocationsLoading(true);
      const results = await loadAllPaginated('warehouse-locations/', {
        is_active: true,
      });
      setLocations(results);
    } catch (err) {
      console.error('Failed to load warehouse locations:', err);
      setLocations([]);
      message.error('Не вдалося завантажити локації.');
    } finally {
      setLocationsLoading(false);
    }
  };

  const loadStoragePlaces = async () => {
    try {
      setStoragePlacesLoading(true);
      const results = await loadAllPaginated('warehouse-storage-places/', {
        is_active: true,
      });
      setStoragePlaces(results);
    } catch (err) {
      console.error('Failed to load warehouse storage places:', err);
      setStoragePlaces([]);
      message.error('Не вдалося завантажити місця зберігання.');
    } finally {
      setStoragePlacesLoading(false);
    }
  };

  const loadStockItems = async (search = '') => {
    if (!search || search.trim().length < 2) {
      setStockItems([]);
      return;
    }

    try {
      setStockLoading(true);

      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('has_stock', 'true');
      params.append('search', search.trim());

      const response = await api.get(
        `warehouse-stock-overview/?${params.toString()}`,
      );

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setStockItems(results);
    } catch (err) {
      console.error('Failed to load warehouse stock overview:', err);
      setStockItems([]);
      message.error('Не вдалося завантажити залишки складу.');
    } finally {
      setStockLoading(false);
    }
  };

  const applyPlanToState = (plan) => {
    setActivePlan(plan);
    setPlanStatus(plan?.status || null);
    setComment(plan?.comment || '');
    setPlannedAt(plan?.planned_at ? dayjs(plan.planned_at) : null);

    if (plan?.target_storage_place) {
      setDestinationType('storage_place');
      setTargetStoragePlaceId(plan.target_storage_place);
      setTargetLocationId(null);
    } else {
      setDestinationType('location');
      setTargetLocationId(plan?.target_location || null);
      setTargetStoragePlaceId(null);
    }
  };

  const loadPlan = async () => {
    if (!planId) return;

    try {
      setPlanLoading(true);

      const response = await api.get(`movement-plans/${planId}/`);
      const plan = response.data;

      applyPlanToState(plan);
    } catch (err) {
      console.error('Failed to load movement plan:', err);
      message.error('Не вдалося завантажити план переміщення.');
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    resetState();
    loadLocations();
    loadStoragePlaces();

    if (planId) {
      loadPlan();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  const locationOptions = useMemo(
    () =>
      locations.map((item) => ({
        value: item.id,
        label: (
          <Flex align="center" gap={6}>
            <Tag style={getLocationTagStyle()}>{item.code || '—'}</Tag>
            <Text>:</Text>
            <span>{item.name || '—'}</span>
          </Flex>
        ),
        searchLabel: `${item.code || ''} ${item.name || ''}`,
      })),
    [locations],
  );

  const storagePlaceOptions = useMemo(
    () =>
      storagePlaces.map((item) => ({
        value: item.id,
        label: renderStoragePlaceOption(item),
        searchLabel: `${item.location_code || ''} ${
          item.display_name || ''
        } ${item.display_name_verbose || ''} ${item.name || ''}`,
      })),
    [storagePlaces],
  );

  const stockOptions = useMemo(
    () =>
      stockItems.map((item) => ({
        value: item.inventory_item_id,
        label: item.inventory_item_name || '—',
        raw: item,
      })),
    [stockItems],
  );

  const isReadonly = planStatus === 'executed' || planStatus === 'cancelled';
  const isDestinationLocked = isEditMode && planStatus === 'active';

  const renderSelectedStockInfo = () => {
    if (!selectedStockItem) return null;

    const unit = selectedStockItem.inventory_item_unit_symbol || '';

    const cellStyle = {
      flex: '1 1 140px',
      minWidth: 0,
    };

    const labelStyle = {
      display: 'block',
      fontSize: 11,
      lineHeight: 1.2,
    };

    const valueStyle = {
      fontSize: 13,
      lineHeight: 1.3,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    return (
      <Card size="small" style={{ background: '#fafafa' }}>
        <Flex gap={18} wrap align="center">
          <div style={cellStyle}>
            <Text type="secondary" style={labelStyle}>
              Артикул
            </Text>
            <div style={valueStyle}>
              {selectedStockItem.inventory_item_code || '—'}
            </div>
          </div>

          <div style={{ ...cellStyle, flex: '1.4 1 180px' }}>
            <Text type="secondary" style={labelStyle}>
              Категорія
            </Text>
            <div style={valueStyle}>
              {selectedStockItem.inventory_item_category_name || '—'}
            </div>
          </div>

          <div style={cellStyle}>
            <Text type="secondary" style={labelStyle}>
              Доступно для переміщення
            </Text>
            <div
              style={{
                ...valueStyle,
                color: '#52c41a',
                fontWeight: 700,
              }}
            >
              {formatQuantity(selectedStockItem.available_quantity)} {unit}
            </div>
          </div>

          <div style={cellStyle}>
            <Text type="secondary" style={labelStyle}>
              Вже зарезервовано
            </Text>
            <div
              style={{
                ...valueStyle,
                color: '#8c8c8c',
                fontWeight: 700,
              }}
            >
              {formatQuantity(selectedStockItem.reserved_quantity)} {unit}
            </div>
          </div>
        </Flex>
      </Card>
    );
  };

  const canSave =
    !isReadonly &&
    ((destinationType === 'location' && targetLocationId) ||
      (destinationType === 'storage_place' && targetStoragePlaceId));

  const loadActivePlan = async (targetPlanId = activePlanId) => {
    if (!targetPlanId) return null;

    const response = await api.get(`movement-plans/${targetPlanId}/`);
    const plan = response.data;

    applyPlanToState(plan);

    return plan;
  };

  const handleSave = async () => {
    if (!canSave) {
      message.error('Оберіть напрямок переміщення.');
      return;
    }

    const payload = {
      planned_at: plannedAt
        ? plannedAt.hour(12).minute(0).second(0).millisecond(0).toISOString()
        : null,
      comment: comment.trim(),
    };

    if (!isDestinationLocked) {
      payload.target_location =
        destinationType === 'location' ? targetLocationId : null;
      payload.target_storage_place =
        destinationType === 'storage_place' ? targetStoragePlaceId : null;
    }

    try {
      setSaving(true);

      if (isEditMode) {
        await api.patch(`movement-plans/${activePlanId}/`, payload);
        await loadActivePlan(activePlanId);
        message.success('План переміщення оновлено.');

        if (onSaved) {
          await onSaved();
        }

        return;
      }

      const response = await api.post('movement-plans/', payload);
      await loadActivePlan(response.data.id);
      message.success('План переміщення створено.');

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to save movement plan:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'target_location',
        'target_storage_place',
        'planned_at',
        'comment',
        'destination',
      ]);

      message.error(backendMessage || 'Не вдалося зберегти план переміщення.');
    } finally {
      setSaving(false);
    }
  };

  const planLines = Array.isArray(activePlan?.lines) ? activePlan.lines : [];
  const canManageItems = planStatus === 'active';

  const getActionIconStyle = (color) => ({
    fontSize: 16,
    color,
    cursor: 'pointer',
  });

  const getDisabledActionIconStyle = () => ({
    fontSize: 16,
    color: '#bfbfbf',
    cursor: 'not-allowed',
  });

  const availableMoveQuantity =
    Number(selectedStockItem?.available_quantity) || 0;
  const requestedMoveQuantity = Number(moveQuantity) || 0;

  const isMoveQuantityInvalid =
    Boolean(selectedStockItem) && requestedMoveQuantity > availableMoveQuantity;

  const canAddMovementItem =
    Boolean(selectedStockItem) &&
    requestedMoveQuantity > 0 &&
    !isMoveQuantityInvalid &&
    !isReadonly;

  const handleAddMovementItem = async () => {
    if (!activePlanId) {
      message.error('Спочатку створіть план переміщення.');
      return;
    }

    if (!selectedStockItem?.inventory_item_id) {
      message.error('Оберіть товар.');
      return;
    }

    if (!moveQuantity || Number(moveQuantity) <= 0) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    try {
      setAddingItem(true);

      await api.post(`movement-plans/${activePlanId}/add-items/`, {
        inventory_item: selectedStockItem.inventory_item_id,
        quantity: String(moveQuantity),
      });

      await loadActivePlan(activePlanId);

      setSelectedStockItem(null);
      setMoveQuantity(null);
      setStockItems([]);

      message.success('Товар додано до накладної.');

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to add movement item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'inventory_item',
        'quantity',
      ]);

      message.error(backendMessage || 'Не вдалося додати товар до накладної.');
    } finally {
      setAddingItem(false);
    }
  };

  const handleStartEditPlanItem = (record) => {
    if (!canManageItems) return;

    setEditingPlanItemId(record.inventory_item_id);
    setEditingQuantity(Number(record.quantity));
  };

  const handleSaveEditedPlanItem = async (record) => {
    if (!activePlanId || !canManageItems) return;

    if (!editingQuantity || Number(editingQuantity) <= 0) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    try {
      await api.post(
        `movement-plans/${activePlanId}/change-inventory-item-quantity/`,
        {
          inventory_item: record.inventory_item_id,
          quantity: String(editingQuantity),
        },
      );

      await loadActivePlan(activePlanId);

      setEditingPlanItemId(null);
      setEditingQuantity(null);

      message.success('Кількість оновлено.');

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to change movement item quantity:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'item_id',
        'quantity',
      ]);

      message.error(backendMessage || 'Не вдалося змінити кількість.');
    }
  };

  const handleRemovePlanItem = async (record) => {
    if (!activePlanId || !canManageItems) return;

    try {
      setDeletingPlanItemId(record.inventory_item_id);

      await api.post(`movement-plans/${activePlanId}/remove-inventory-item/`, {
        inventory_item: record.inventory_item_id,
      });

      await loadActivePlan(activePlanId);

      if (editingPlanItemId === record.inventory_item_id) {
        setEditingPlanItemId(null);
        setEditingQuantity(null);
      }

      message.success('Товар видалено з накладної.');

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to remove movement item:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, ['item_id']);

      message.error(backendMessage || 'Не вдалося видалити товар.');
    } finally {
      setDeletingPlanItemId(null);
    }
  };

  const handleExecutePlan = async () => {
    if (!activePlanId || planStatus !== 'active') return;

    try {
      setExecutingPlan(true);

      await api.post(`movement-plans/${activePlanId}/execute/`, {});

      await loadActivePlan(activePlanId);

      message.success('Переміщення виконано.');

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to execute movement plan:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося виконати переміщення.');
    } finally {
      setExecutingPlan(false);
    }
  };

  const planItemsColumns = [
    {
      title: 'Товар',
      dataIndex: 'inventory_item_name',
      key: 'inventory_item_name',
      width: 300,
      render: (value) => (
        <div
          style={{
            maxWidth: 280,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: 13,
          }}
          title={value || '—'}
        >
          {value || '—'}
        </div>
      ),
    },
    {
      title: 'Кількість',
      key: 'quantity',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (editingPlanItemId === record.inventory_item_id) {
          return (
            <InputNumber
              min={0.001}
              step={0.001}
              controls={false}
              size="small"
              value={editingQuantity}
              onChange={setEditingQuantity}
              style={{ width: 100 }}
            />
          );
        }

        return `${formatQuantity(record.quantity)} ${record.unit_symbol || ''}`;
      },
    },
    {
      title: '',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => {
        if (!canManageItems) {
          return (
            <Flex justify="center" align="center" gap={12}>
              <EditOutlined style={getDisabledActionIconStyle()} />
              <DeleteOutlined style={getDisabledActionIconStyle()} />
            </Flex>
          );
        }

        if (editingPlanItemId === record.inventory_item_id) {
          return (
            <Flex justify="center" align="center" gap={12}>
              <SaveOutlined
                style={getActionIconStyle('#52c41a')}
                onClick={() => handleSaveEditedPlanItem(record)}
              />

              <DeleteOutlined style={getDisabledActionIconStyle()} />
            </Flex>
          );
        }

        return (
          <Flex justify="center" align="center" gap={12}>
            <EditOutlined
              style={getActionIconStyle('#1677ff')}
              onClick={() => handleStartEditPlanItem(record)}
            />

            <Popconfirm
              title="Видалити товар?"
              description="Після видалення резерв по цьому товару буде знято."
              okText="Так"
              cancelText="Ні"
              onConfirm={() => handleRemovePlanItem(record)}
            >
              <DeleteOutlined
                style={getActionIconStyle('#ff4d4f')}
                spin={deletingPlanItemId === record.inventory_item_id}
              />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <Drawer
      title={
        isEditMode
          ? 'Редагування плану переміщення'
          : 'Створення плану переміщення'
      }
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Card title="1. Основна інформація" loading={planLoading}>
          <Flex vertical gap={16}>
            {isReadonly && (
              <Alert
                type="info"
                showIcon
                message="Цей план доступний лише для перегляду."
              />
            )}

            {isDestinationLocked && (
              <Alert
                type="warning"
                showIcon
                message="Для активного плану не можна змінювати напрямок переміщення."
              />
            )}

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Тип напрямку
              </Text>

              <Switch
                checked={destinationType === 'storage_place'}
                checkedChildren="Місце"
                unCheckedChildren="Локація"
                disabled={isReadonly || isDestinationLocked}
                onChange={(checked) => {
                  setDestinationType(checked ? 'storage_place' : 'location');
                  setTargetLocationId(null);
                  setTargetStoragePlaceId(null);
                }}
              />
            </div>

            {destinationType === 'location' && (
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Локація
                </Text>

                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Оберіть локацію"
                  value={targetLocationId}
                  options={locationOptions}
                  loading={locationsLoading}
                  disabled={isReadonly || isDestinationLocked}
                  optionFilterProp="searchLabel"
                  onChange={setTargetLocationId}
                />
              </div>
            )}

            {destinationType === 'storage_place' && (
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Місце зберігання
                </Text>

                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Оберіть місце зберігання"
                  value={targetStoragePlaceId}
                  options={storagePlaceOptions}
                  loading={storagePlacesLoading}
                  disabled={isReadonly || isDestinationLocked}
                  optionFilterProp="searchLabel"
                  onChange={setTargetStoragePlaceId}
                />
              </div>
            )}

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Дата реалізації
              </Text>

              <DatePicker
                style={{ width: '100%' }}
                format="DD-MM-YYYY"
                value={plannedAt}
                disabled={isReadonly}
                onChange={setPlannedAt}
                disabledDate={(current) =>
                  current && current < dayjs().startOf('day')
                }
              />
            </div>

            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                Коментар
              </Text>

              <TextArea
                rows={4}
                value={comment}
                disabled={isReadonly}
                placeholder="Коментар до плану переміщення"
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {!isReadonly && (
              <Flex justify="flex-end">
                <Button
                  type="primary"
                  loading={saving}
                  disabled={!canSave}
                  onClick={handleSave}
                >
                  {isEditMode ? 'Зберегти зміни' : 'Створити план'}
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
        {activePlan?.id && (
          <Card title="2. Додавання товару">
            <Flex vertical gap={16}>
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>Товар</Text>

                <Select
                  showSearch
                  allowClear
                  style={{ width: '100%' }}
                  placeholder="Почніть вводити назву або артикул товару"
                  value={selectedStockItem?.inventory_item_id}
                  options={stockOptions}
                  loading={stockLoading}
                  filterOption={false}
                  onSearch={loadStockItems}
                  onClear={() => {
                    setSelectedStockItem(null);
                    setMoveQuantity(null);
                    setStockItems([]);
                  }}
                  onChange={(value) => {
                    const selectedItem =
                      stockItems.find(
                        (item) => item.inventory_item_id === value,
                      ) || null;

                    setSelectedStockItem(selectedItem);
                    setMoveQuantity(null);
                  }}
                />
              </div>

              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  Кількість для переміщення
                </Text>

                <InputNumber
                  min={0.001}
                  max={availableMoveQuantity || undefined}
                  step={0.001}
                  controls={false}
                  style={{ width: '100%' }}
                  placeholder="Вкажіть кількість"
                  value={moveQuantity}
                  status={isMoveQuantityInvalid ? 'error' : undefined}
                  onChange={setMoveQuantity}
                />
              </div>

              {renderSelectedStockInfo()}
              {isMoveQuantityInvalid && (
                <Alert
                  type="error"
                  showIcon
                  message="Кількість для переміщення не може перевищувати доступний залишок."
                />
              )}

              <Flex justify="flex-end">
                <Button
                  type="primary"
                  loading={addingItem}
                  disabled={!canAddMovementItem}
                  onClick={handleAddMovementItem}
                >
                  Додати товар
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
        {activePlan?.id && (
          <Card title="3. Склад накладної">
            <Flex vertical gap={12}>
              {!canManageItems && planLines.length > 0 && (
                <Alert
                  type="info"
                  showIcon
                  message="Редагування та видалення товарів доступне лише для накладної у статусі «Активний»."
                />
              )}

              <Table
                rowKey="inventory_item_id"
                columns={planItemsColumns}
                dataSource={planLines}
                pagination={false}
                size="small"
                locale={{
                  emptyText: 'До накладної ще не додано товари.',
                }}
              />
            </Flex>
          </Card>
        )}
        {activePlan?.id && (
          <Card title="4. Виконання накладної">
            <Flex vertical gap={12} align="flex-start">
              {planStatus === 'draft' && (
                <Alert
                  type="warning"
                  showIcon
                  message="Щоб виконати переміщення, додайте хоча б один товар до накладної."
                />
              )}

              {planStatus === 'active' && (
                <>
                  <Popconfirm
                    title="Виконати переміщення?"
                    description="Після виконання товари будуть переміщені на обрану локацію або місце зберігання."
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={handleExecutePlan}
                  >
                    <Button type="primary" loading={executingPlan}>
                      Виконати переміщення
                    </Button>
                  </Popconfirm>

                  <Alert
                    type="info"
                    showIcon
                    message="Після виконання накладна стане доступною лише для перегляду."
                  />
                </>
              )}

              {planStatus === 'executed' && (
                <Alert
                  type="success"
                  showIcon
                  message="Переміщення за цією накладною виконано."
                />
              )}

              {planStatus === 'cancelled' && (
                <Alert
                  type="info"
                  showIcon
                  message="Цю накладну скасовано. Виконання недоступне."
                />
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    </Drawer>
  );
}

export default WarehouseMovementDrawer;
