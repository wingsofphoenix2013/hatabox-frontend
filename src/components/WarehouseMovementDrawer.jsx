import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

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

  const loadPlan = async () => {
    if (!planId) return;

    try {
      setPlanLoading(true);

      const response = await api.get(`movement-plans/${planId}/`);
      const plan = response.data;

      setActivePlan(plan);
      setPlanStatus(plan.status || null);
      setComment(plan.comment || '');
      setPlannedAt(plan.planned_at ? dayjs(plan.planned_at) : null);

      if (plan.target_storage_place) {
        setDestinationType('storage_place');
        setTargetStoragePlaceId(plan.target_storage_place);
        setTargetLocationId(null);
      } else {
        setDestinationType('location');
        setTargetLocationId(plan.target_location || null);
        setTargetStoragePlaceId(null);
      }
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
        label: (
          <Flex vertical style={{ minWidth: 0 }}>
            <Text
              style={{
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.inventory_item_name || '—'}
            >
              {item.inventory_item_name || '—'}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {item.inventory_item_code || '—'} • {item.available_quantity}{' '}
              {item.inventory_item_unit_symbol || ''}
            </Text>
          </Flex>
        ),
        raw: item,
      })),
    [stockItems],
  );

  const isReadonly = planStatus === 'executed' || planStatus === 'cancelled';
  const isDestinationLocked = isEditMode && planStatus === 'active';

  const renderSelectedStockInfo = () => {
    if (!selectedStockItem) return null;

    const unit = selectedStockItem.inventory_item_unit_symbol || '';

    return (
      <Card size="small" style={{ background: '#fafafa' }}>
        <Flex vertical gap={14}>
          <Flex gap={24} wrap>
            <div style={{ flex: '1 1 160px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Артикул
              </Text>
              <div style={{ fontWeight: 500 }}>
                {selectedStockItem.inventory_item_code || '—'}
              </div>
            </div>

            <div style={{ flex: '1 1 220px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Категорія
              </Text>
              <div style={{ fontWeight: 500 }}>
                {selectedStockItem.inventory_item_category_name || '—'}
              </div>
            </div>
          </Flex>

          <Flex gap={32} wrap>
            <div style={{ flex: '1 1 220px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Доступно для переміщення
              </Text>
              <div
                style={{
                  fontWeight: 700,
                  color: '#52c41a',
                  fontSize: 17,
                }}
              >
                {selectedStockItem.available_quantity || '0.000'} {unit}
              </div>
            </div>

            <div style={{ flex: '1 1 180px' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Зарезервовано
              </Text>
              <div
                style={{
                  fontWeight: 700,
                  color: '#8c8c8c',
                  fontSize: 17,
                }}
              >
                {selectedStockItem.reserved_quantity || '0.000'} {unit}
              </div>
            </div>
          </Flex>
        </Flex>
      </Card>
    );
  };

  const canSave =
    !isReadonly &&
    ((destinationType === 'location' && targetLocationId) ||
      (destinationType === 'storage_place' && targetStoragePlaceId));

  const handleSave = async () => {
    if (!canSave) {
      message.error('Оберіть напрямок переміщення.');
      return;
    }

    const payload = {
      planned_at: plannedAt ? plannedAt.toISOString() : null,
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
        const response = await api.patch(
          `movement-plans/${activePlanId}/`,
          payload,
        );
        setActivePlan(response.data);
        message.success('План переміщення оновлено.');

        if (onSaved) {
          await onSaved();
        }

        return;
      }

      const response = await api.post('movement-plans/', payload);
      setActivePlan(response.data);
      setPlanStatus(response.data?.status || null);
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
                  onChange={(_, option) => {
                    setSelectedStockItem(option?.raw || null);
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
                  step={0.001}
                  controls={false}
                  style={{ width: '100%' }}
                  placeholder="Вкажіть кількість"
                  value={moveQuantity}
                  onChange={setMoveQuantity}
                />
              </div>

              {renderSelectedStockInfo()}

              <Flex justify="flex-end">
                <Button type="primary" disabled>
                  Додати товар
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Drawer>
  );
}

export default WarehouseMovementDrawer;
