import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Flex,
  Input,
  Select,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import {
  getLocationTagStyle,
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';

const { Text } = Typography;
const { TextArea } = Input;

function WarehouseAddItemToMovementDrawer({ open, onClose, stockDetail }) {
  const header = stockDetail?.header || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(undefined);

  const [step, setStep] = useState('select_plan');

  const [locations, setLocations] = useState([]);
  const [storagePlaces, setStoragePlaces] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [storagePlacesLoading, setStoragePlacesLoading] = useState(false);

  const [destinationType, setDestinationType] = useState('location');
  const [targetLocationId, setTargetLocationId] = useState(null);
  const [targetStoragePlaceId, setTargetStoragePlaceId] = useState(null);
  const [plannedAt, setPlannedAt] = useState(null);
  const [comment, setComment] = useState('');
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (!open) {
      setSelectedValue(undefined);
      setStep('select_plan');
      setDestinationType('location');
      setTargetLocationId(null);
      setTargetStoragePlaceId(null);
      setPlannedAt(null);
      setComment('');
      setActivePlan(null);
      return;
    }

    loadPlans();
    loadLocations();
    loadStoragePlaces();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadPlans = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('status', 'draft');
      params.append('status', 'active');

      const response = await api.get(`movement-plans/?${params.toString()}`);

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setPlans(results);
    } catch (err) {
      console.error('Failed to load movement plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
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

  const options = [
    {
      value: 'create',
      label: (
        <Text strong style={{ color: '#1677ff' }}>
          Створити новий план переміщення
        </Text>
      ),
    },
    {
      type: 'group',
      label: (
        <Text type="secondary" style={{ fontSize: 12 }}>
          Або оберіть існуючу:
        </Text>
      ),
      options: plans.map((plan) => ({
        value: `plan:${plan.id}`,
        label: (
          <Flex align="center" gap={8} wrap={false}>
            <Text strong>№ {plan.id}</Text>

            {plan.target_storage_place ? (
              <Flex align="center" gap={6} wrap={false}>
                <Tag style={getLocationTagStyle()}>
                  {plan.target_location_code || '—'}
                </Tag>

                <Text type="secondary">:</Text>

                {renderStoragePlaceChain(
                  plan.target_storage_place_full_display,
                )}
              </Flex>
            ) : (
              renderWarehousePlacement({
                locationCode: plan.target_location_code,
                locationName: plan.target_location_name,
                storagePlaceDisplayName: null,
                storagePlaceFullDisplay: null,
              })
            )}
          </Flex>
        ),
        searchLabel: `${plan.id} ${plan.target_location_code || ''} ${
          plan.target_location_name || ''
        } ${plan.target_storage_place_full_display || ''}`,
      })),
    },
  ];

  const locationOptions = useMemo(
    () =>
      locations.map((item) => ({
        value: item.id,
        label: renderWarehousePlacement({
          locationCode: item.code,
          locationName: item.name,
          storagePlaceDisplayName: null,
          storagePlaceFullDisplay: null,
        }),
        searchLabel: `${item.code || ''} ${item.name || ''}`,
      })),
    [locations],
  );

  const storagePlaceOptions = useMemo(
    () =>
      storagePlaces.map((item) => ({
        value: item.id,
        label: (
          <Flex align="center" gap={6} wrap={false}>
            <Tag style={getLocationTagStyle()}>{item.location_code || '—'}</Tag>

            <Text type="secondary">:</Text>

            {renderStoragePlaceChain(item.display_name_verbose)}
          </Flex>
        ),
        searchLabel: `${item.location_code || ''} ${item.display_name || ''} ${
          item.display_name_verbose || ''
        }`,
      })),
    [storagePlaces],
  );

  const canCreatePlan =
    (destinationType === 'location' && targetLocationId) ||
    (destinationType === 'storage_place' && targetStoragePlaceId);

  const handleChooseVariant = () => {
    if (selectedValue === 'create') {
      setStep('create_plan');
    }
  };

  const handleCreatePlan = async () => {
    if (!canCreatePlan) {
      message.error('Оберіть напрямок переміщення.');
      return;
    }

    const payload = {
      planned_at: plannedAt
        ? plannedAt.hour(12).minute(0).second(0).millisecond(0).toISOString()
        : null,
      comment: comment.trim(),
      target_location: destinationType === 'location' ? targetLocationId : null,
      target_storage_place:
        destinationType === 'storage_place' ? targetStoragePlaceId : null,
    };

    try {
      setCreatingPlan(true);

      const response = await api.post('movement-plans/', payload);

      setActivePlan(response.data);
      setStep('add_item');

      message.success('План переміщення створено.');
    } catch (err) {
      console.error('Failed to create movement plan:', err);
      message.error('Не вдалося створити план переміщення.');
    } finally {
      setCreatingPlan(false);
    }
  };

  return (
    <Drawer
      title="Додати товар до переміщення"
      open={open}
      onClose={onClose}
      size="large"
    >
      <Flex vertical gap={16}>
        {step === 'select_plan' && (
          <>
            <Card title="1. Оберіть варіант накладної">
              <Flex vertical gap={8}>
                <Text style={{ display: 'block' }}>Зробіть вибір</Text>

                <Select
                  showSearch
                  style={{ width: '100%' }}
                  placeholder="Оберіть або створіть накладну"
                  value={selectedValue}
                  options={options}
                  loading={loading}
                  optionFilterProp="searchLabel"
                  onChange={setSelectedValue}
                />
              </Flex>
            </Card>

            <Flex justify="space-between">
              <Button onClick={onClose}>Закрити</Button>

              <Button
                type="primary"
                disabled={!selectedValue}
                onClick={handleChooseVariant}
              >
                Обрати варіант
              </Button>
            </Flex>
          </>
        )}

        {step === 'create_plan' && (
          <>
            <Card title="1. Основна інформація">
              <Flex vertical gap={16}>
                <div>
                  <Text style={{ display: 'block', marginBottom: 8 }}>
                    Тип напрямку
                  </Text>

                  <Switch
                    checked={destinationType === 'storage_place'}
                    checkedChildren="Місце"
                    unCheckedChildren="Локація"
                    onChange={(checked) => {
                      setDestinationType(
                        checked ? 'storage_place' : 'location',
                      );
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
                    placeholder="Коментар до плану переміщення"
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </Flex>
            </Card>

            <Flex justify="space-between">
              <Button onClick={onClose}>Закрити</Button>

              <Button
                type="primary"
                loading={creatingPlan}
                disabled={!canCreatePlan}
                onClick={handleCreatePlan}
              >
                Створити план
              </Button>
            </Flex>
          </>
        )}

        {step === 'add_item' && (
          <Card title="2. Додавання товару">
            <Text strong>
              {header?.inventory_item_name || 'Товар не обрано'}
            </Text>

            {activePlan?.id && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                План переміщення №{activePlan.id} створено.
              </Text>
            )}
          </Card>
        )}
      </Flex>
    </Drawer>
  );
}

export default WarehouseAddItemToMovementDrawer;
