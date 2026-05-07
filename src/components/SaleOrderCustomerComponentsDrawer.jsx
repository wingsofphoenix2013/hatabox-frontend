import { useEffect, useState } from 'react';
import { DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Select,
  Table,
  Typography,
  message,
} from 'antd';

import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;

const SEARCH_DEBOUNCE_MS = 300;

function SaleOrderCustomerComponentsDrawer({
  open,
  onClose,
  orderId,
  onSaved,
}) {
  const [components, setComponents] = useState([]);
  const [customerComponents, setCustomerComponents] = useState([]);
  const [initialCustomerComponentIds, setInitialCustomerComponentIds] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [componentSearchText, setComponentSearchText] = useState('');
  const [debouncedComponentSearchText, setDebouncedComponentSearchText] =
    useState('');
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedComponentSearchText(componentSearchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [componentSearchText]);

  const resetState = () => {
    setComponents([]);
    setCustomerComponents([]);
    setInitialCustomerComponentIds([]);
    setLoading(false);
    setSaving(false);
    setComponentSearchText('');
    setDebouncedComponentSearchText('');
    setSelectedComponentId(null);
  };

  const loadComponents = async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      const response = await api.get(`sales-orders/${orderId}/components/`);
      const results = Array.isArray(response.data) ? response.data : [];

      const initialCustomerComponents = results.filter(
        (item) => item.fulfillment_mode === 'customer',
      );

      setComponents(results);
      setCustomerComponents(initialCustomerComponents);
      setInitialCustomerComponentIds(
        initialCustomerComponents.map((item) => item.id),
      );
    } catch (err) {
      console.error('Failed to load sale order components:', err);
      message.error('Не вдалося завантажити компоненти замовлення.');
      setComponents([]);
      setCustomerComponents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    loadComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  const customerComponentIds = customerComponents
    .map((item) => item.id)
    .sort((a, b) => a - b);

  const sortedInitialCustomerComponentIds = [
    ...initialCustomerComponentIds,
  ].sort((a, b) => a - b);

  const hasCustomerComponentsChanges =
    customerComponentIds.length !== sortedInitialCustomerComponentIds.length ||
    customerComponentIds.some(
      (idValue, index) => idValue !== sortedInitialCustomerComponentIds[index],
    );

  const availableComponentOptions = components
    .filter(
      (item) =>
        !customerComponents.some((selectedItem) => selectedItem.id === item.id),
    )
    .filter((item) => {
      if (!debouncedComponentSearchText.trim()) return true;

      const normalizedSearch = debouncedComponentSearchText.toLowerCase();

      return (
        String(item.inv_item_name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(item.inv_item_code || '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    })
    .map((item) => ({
      value: item.id,
      label: `${item.inv_item_name || '—'} | ${formatQuantity(item.quantity)}`,
    }));

  const handleAddCustomerComponent = () => {
    if (!selectedComponentId) return;

    const component = components.find(
      (item) => item.id === selectedComponentId,
    );

    if (!component) return;

    setCustomerComponents((prev) => [...prev, component]);
    setSelectedComponentId(null);
    setComponentSearchText('');
    setDebouncedComponentSearchText('');
  };

  const handleDeleteCustomerComponent = (componentId) => {
    setCustomerComponents((prev) =>
      prev.filter((item) => item.id !== componentId),
    );
  };

  const handleSave = async () => {
    if (!orderId) return;

    try {
      setSaving(true);

      await api.post(`sales-orders/${orderId}/set-customer-components/`, {
        component_ids: customerComponents.map((item) => item.id),
      });

      message.success('Компоненти замовника збережено.');

      onClose();

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to save sale order customer components:', err);
      message.error('Не вдалося зберегти компоненти замовника.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Налаштування товарів замовника"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        <Card title="Товар замовника">
          <Flex vertical gap={16}>
            <Flex align="center" gap={10}>
              <Select
                showSearch
                allowClear
                placeholder="Почніть вводити назву компонента"
                style={{ flex: 1 }}
                value={selectedComponentId}
                options={availableComponentOptions}
                filterOption={false}
                searchValue={componentSearchText}
                loading={loading}
                disabled={loading || saving}
                onSearch={setComponentSearchText}
                onChange={setSelectedComponentId}
                onClear={() => {
                  setSelectedComponentId(null);
                  setComponentSearchText('');
                  setDebouncedComponentSearchText('');
                }}
              />

              <SaveOutlined
                style={{
                  color: selectedComponentId && !saving ? '#52c41a' : '#bfbfbf',
                  fontSize: 20,
                  cursor:
                    selectedComponentId && !saving ? 'pointer' : 'not-allowed',
                }}
                onClick={
                  selectedComponentId && !saving
                    ? handleAddCustomerComponent
                    : undefined
                }
              />
            </Flex>

            <Flex vertical gap={10}>
              <Text strong>Очікуємо від замовника</Text>

              <Table
                rowKey="id"
                size="small"
                loading={loading}
                pagination={false}
                dataSource={customerComponents}
                locale={{
                  emptyText: 'Компоненти ще не обрані.',
                }}
                columns={[
                  {
                    title: '№',
                    key: 'index',
                    width: 60,
                    align: 'center',
                    render: (_, __, index) => index + 1,
                  },
                  {
                    title: 'Назва',
                    dataIndex: 'inv_item_name',
                    key: 'inv_item_name',
                    render: (value) => value || '—',
                  },
                  {
                    title: 'К-сть',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 120,
                    align: 'center',
                    render: (value) => formatQuantity(value),
                  },
                  {
                    title: 'Дії',
                    key: 'actions',
                    width: 80,
                    align: 'center',
                    render: (_, record) => (
                      <DeleteOutlined
                        style={{
                          color: saving ? '#bfbfbf' : '#ff4d4f',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: 16,
                        }}
                        onClick={
                          saving
                            ? undefined
                            : () => handleDeleteCustomerComponent(record.id)
                        }
                      />
                    ),
                  },
                ]}
              />
            </Flex>
          </Flex>
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={onClose}>Закрити</Button>
          <Button
            type="primary"
            loading={saving}
            disabled={
              Boolean(selectedComponentId) || !hasCustomerComponentsChanges
            }
            onClick={handleSave}
          >
            Зберегти зміни
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default SaleOrderCustomerComponentsDrawer;
