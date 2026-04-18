import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Select,
  Typography,
  Table,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

function WarehouseIntakeDrawer({
  open,
  onClose,
  locations = [],
  pendingItems = [],
}) {
  const [locationId, setLocationId] = useState(null);

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [items, setItems] = useState([]);

  // --- фильтрация (только без конвертации)
  const availableItems = useMemo(() => {
    return pendingItems.filter(
      (i) => i.can_be_directly_accepted && !i.requires_unit_conversion,
    );
  }, [pendingItems]);

  // --- сброс вниз при смене локации
  const handleLocationChange = (value) => {
    setLocationId(value);

    // reset вниз
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

  // --- добавление
  const handleAddItem = () => {
    if (!selectedItem) return;

    if (items.some((i) => i.id === selectedItem.id)) return;

    setItems((prev) => [...prev, selectedItem]);

    // reset выбора
    setSelectedItemId(null);
    setSelectedItem(null);
  };

  // --- удаление
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const canStep2 = Boolean(locationId);

  const canSubmit = items.length > 0;

  const columns = [
    {
      title: 'Постачальник',
      render: (_, r) => r.vendor_name,
    },
    {
      title: 'Номенклатура',
      render: (_, r) => r.vendor_item_name,
    },
    {
      title: 'К-сть',
      render: (_, r) => r.received_quantity,
    },
    {
      title: '',
      width: 60,
      render: (_, r) => (
        <DeleteOutlined
          style={{ color: '#ff4d4f', cursor: 'pointer' }}
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
      width={520}
    >
      <Flex vertical gap={16}>
        {/* STEP 1 */}
        <Card title="1. Оберіть локацію">
          <Select
            placeholder="Оберіть локацію"
            style={{ width: '100%' }}
            value={locationId}
            onChange={handleLocationChange}
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
              placeholder="Оберіть товар"
              disabled={!canStep2}
              value={selectedItemId}
              onChange={handleSelectItem}
              style={{ width: '100%' }}
              options={availableItems.map((i) => ({
                value: i.id,
                label: `${i.vendor_item_name}`,
              }))}
              showSearch
              optionFilterProp="label"
            />

            {selectedItem && (
              <div
                style={{
                  background: '#fafafa',
                  padding: 10,
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                }}
              >
                <Text strong>{selectedItem.vendor_item_name}</Text>
                <br />
                <Text type="secondary">{selectedItem.inventory_item_name}</Text>
                <br />
                <Text>
                  {selectedItem.received_quantity}{' '}
                  {selectedItem.inventory_item_unit_symbol}
                </Text>
              </div>
            )}

            <Flex justify="flex-end">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                disabled={!selectedItem}
                onClick={handleAddItem}
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

          <Button type="primary" disabled={!canSubmit}>
            Оформити отримання
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default WarehouseIntakeDrawer;
