import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Select,
  Table,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;

function WarehouseIntakeDrawer({ open, onClose, pendingItems = [] }) {
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [locationId, setLocationId] = useState(null);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [items, setItems] = useState([]);

  // --- загрузка локаций
  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  const loadLocations = async () => {
    try {
      setLocationsLoading(true);

      const response = await api.get('warehouse-locations/');

      setLocations(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load locations:', err);
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  // --- фильтр товаров (только без конвертации)
  const availableItems = useMemo(() => {
    return pendingItems.filter(
      (i) => i.can_be_directly_accepted && !i.requires_unit_conversion,
    );
  }, [pendingItems]);

  // --- reset вниз при смене локации
  const handleLocationChange = (value) => {
    setLocationId(value);

    setSelectedItemId(null);
    setSelectedItem(null);
    setItems([]);
  };

  // --- выбор товара
  const handleSelectItem = (value) => {
    const item = availableItems.find((i) => i.id === value);

    setSelectedItemId(value);
    setSelectedItem(item || null);
  };

  // --- добавить товар
  const handleAddItem = () => {
    if (!selectedItem) return;

    if (items.some((i) => i.id === selectedItem.id)) {
      message.warning('Цей товар вже додано.');
      return;
    }

    setItems((prev) => [...prev, selectedItem]);

    setSelectedItemId(null);
    setSelectedItem(null);
  };

  // --- удалить товар
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // --- submit (заглушка)
  const handleSubmit = () => {
    console.log('SUBMIT MOCK', {
      locationId,
      items,
    });

    message.success('Мок: дані зібрані (без відправки)');
  };

  const canStep2 = Boolean(locationId);
  const canSubmit = items.length > 0;

  const columns = [
    {
      title: 'Постачальник',
      render: (_, r) => r.vendor_name || '—',
    },
    {
      title: 'Номенклатура',
      render: (_, r) => r.vendor_item_name || '—',
    },
    {
      title: 'К-сть',
      render: (_, r) => (
        <>
          {formatQuantity(r.received_quantity)}{' '}
          {r.inventory_item_unit_symbol || ''}
        </>
      ),
    },
    {
      title: '',
      width: 50,
      render: (_, r) => (
        <DeleteOutlined
          style={{
            color: '#ff4d4f',
            cursor: 'pointer',
          }}
          onClick={() => handleRemoveItem(r.id)}
        />
      ),
    },
  ];

  return (
    <Drawer
      title="Оформлення первинного отримання"
      open={open}
      onClose={onClose}
      size="large"
    >
      <Flex vertical gap={16}>
        {/* STEP 1 */}
        <Card title="1. Оберіть локацію">
          <Select
            placeholder="Оберіть локацію"
            style={{ width: '100%' }}
            value={locationId}
            onChange={handleLocationChange}
            loading={locationsLoading}
            options={locations.map((l) => ({
              value: l.id,
              label: `${l.code} — ${l.name}`,
            }))}
          />
        </Card>

        {/* STEP 2 */}
        <Card title="2. Оберіть товари" style={{ opacity: canStep2 ? 1 : 0.5 }}>
          {!canStep2 && (
            <Alert
              type="info"
              showIcon
              message="Спочатку оберіть локацію"
              style={{ marginBottom: 12 }}
            />
          )}

          <Flex vertical gap={12}>
            <Select
              showSearch
              placeholder="Оберіть товар"
              style={{ width: '100%' }}
              value={selectedItemId}
              onChange={handleSelectItem}
              disabled={!canStep2}
              optionFilterProp="label"
              options={availableItems.map((i) => ({
                value: i.id,
                label: `${i.vendor_item_name}`,
              }))}
            />

            {selectedItem && (
              <div
                style={{
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <Text strong>{selectedItem.vendor_item_name}</Text>
                <br />
                <Text type="secondary">{selectedItem.inventory_item_name}</Text>
                <br />
                <Text>
                  {formatQuantity(selectedItem.received_quantity)}{' '}
                  {selectedItem.inventory_item_unit_symbol}
                </Text>
              </div>
            )}

            <Flex justify="flex-end">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                disabled={!selectedItem}
              >
                Додати товар
              </Button>
            </Flex>

            {items.length > 0 && (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={items}
                pagination={false}
                size="small"
              />
            )}
          </Flex>
        </Card>

        {/* ACTION */}
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Скасувати</Button>

          <Button type="primary" disabled={!canSubmit} onClick={handleSubmit}>
            Оформити отримання
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default WarehouseIntakeDrawer;
