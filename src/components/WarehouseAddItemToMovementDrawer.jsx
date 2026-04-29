import { useEffect, useState } from 'react';
import { Drawer, Typography, Select, Flex, Tag, Divider } from 'antd';
import api from '../api/client';
import {
  getLocationTagStyle,
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';
import {
  MOVEMENT_PLAN_STATUS_LABELS,
  getMovementPlanStatusTagColor,
} from '../constants/movementPlanStatus';

const { Text } = Typography;

function WarehouseAddItemToMovementDrawer({ open, onClose, stockDetail }) {
  const header = stockDetail?.header || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(undefined);

  useEffect(() => {
    if (!open) return;

    loadPlans();
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
      type: 'divider',
    },
    ...plans.map((plan) => ({
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

              {renderStoragePlaceChain(plan.target_storage_place_full_display)}
            </Flex>
          ) : (
            renderWarehousePlacement({
              locationCode: plan.target_location_code,
              locationName: plan.target_location_name,
              storagePlaceDisplayName: null,
              storagePlaceFullDisplay: null,
            })
          )}

          <Tag color={getMovementPlanStatusTagColor(plan.status)}>
            {MOVEMENT_PLAN_STATUS_LABELS[plan.status]}
          </Tag>
        </Flex>
      ),
      searchLabel: `${plan.id} ${plan.target_location_code || ''} ${
        plan.target_location_name || ''
      }`,
    })),
  ];

  return (
    <Drawer
      title="Додати товар до переміщення"
      open={open}
      onClose={onClose}
      size="large"
    >
      <Flex vertical gap={16}>
        <div>
          <Text style={{ display: 'block', marginBottom: 8 }}>
            Накладна переміщення
          </Text>

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
        </div>

        <Divider />

        <Text strong>{header?.inventory_item_name || 'Товар не обрано'}</Text>
      </Flex>
    </Drawer>
  );
}

export default WarehouseAddItemToMovementDrawer;
