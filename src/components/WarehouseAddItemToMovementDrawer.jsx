import { useEffect, useState } from 'react';
import { Card, Drawer, Typography, Select, Flex, Tag } from 'antd';
import api from '../api/client';
import {
  getLocationTagStyle,
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';

const { Text } = Typography;

function WarehouseAddItemToMovementDrawer({ open, onClose, stockDetail }) {
  const header = stockDetail?.header || null;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState(undefined);

  useEffect(() => {
    if (!open) {
      setSelectedValue(undefined);
      return;
    }

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

  return (
    <Drawer
      title="Додати товар до переміщення"
      open={open}
      onClose={onClose}
      size="large"
    >
      <Flex vertical gap={16}>
        <Card title="Накладна переміщення">
          <Flex vertical gap={8}>
            <Text style={{ display: 'block' }}>Оберіть дію</Text>

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

        <Text strong>{header?.inventory_item_name || 'Товар не обрано'}</Text>
      </Flex>
    </Drawer>
  );
}

export default WarehouseAddItemToMovementDrawer;
