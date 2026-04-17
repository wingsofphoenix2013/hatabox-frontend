import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;
const { TextArea } = Input;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function WarehousePlacesDrawer({ open, onClose, locations = [], onCreated }) {
  const [form] = Form.useForm();

  const [saving, setSaving] = useState(false);
  const [loadingPlacementOptions, setLoadingPlacementOptions] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedPlacementValue, setSelectedPlacementValue] = useState(null);

  const [placementOptions, setPlacementOptions] = useState([
    { value: 'location-root', label: 'На локації', parentId: null },
  ]);

  const locationOptions = useMemo(() => {
    return locations.map((item) => ({
      value: item.id,
      label: `${item.code || '—'} — ${item.name || '—'}`,
    }));
  }, [locations]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSaving(false);
      setLoadingPlacementOptions(false);
      setSelectedLocationId(null);
      setSelectedPlacementValue(null);
      setPlacementOptions([
        { value: 'location-root', label: 'На локації', parentId: null },
      ]);
      return;
    }

    form.resetFields();
    setSelectedLocationId(null);
    setSelectedPlacementValue(null);
    setPlacementOptions([
      { value: 'location-root', label: 'На локації', parentId: null },
    ]);
  }, [open, form]);

  const loadPlacementOptions = async (locationId) => {
    if (!locationId) {
      setPlacementOptions([
        { value: 'location-root', label: 'На локації', parentId: null },
      ]);
      return;
    }

    try {
      setLoadingPlacementOptions(true);

      const response = await api.get(
        `warehouse-storage-places/?location=${locationId}`,
      );

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      const uniqueMap = new Map();
      uniqueMap.set('На локації', {
        value: 'location-root',
        label: 'На локації',
        parentId: null,
      });

      results.forEach((item) => {
        const placementKey = item.display_name || '';
        const parentId = item.id;

        if (!placementKey || uniqueMap.has(placementKey)) {
          return;
        }

        const verboseLabel = item.display_name_verbose || '';
        const placementLabel =
          verboseLabel && verboseLabel !== 'На локації'
            ? `${placementKey} (${verboseLabel})`
            : placementKey;

        uniqueMap.set(placementKey, {
          value: `parent-${parentId}`,
          label: placementLabel,
          parentId,
        });
      });

      setPlacementOptions(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to load placement options:', err);
      setPlacementOptions([
        { value: 'location-root', label: 'На локації', parentId: null },
      ]);
      message.error('Не вдалося завантажити варіанти розміщення.');
    } finally {
      setLoadingPlacementOptions(false);
    }
  };

  const handleCloseDrawer = () => {
    form.resetFields();
    setSelectedLocationId(null);
    setSelectedPlacementValue(null);
    setPlacementOptions([
      { value: 'location-root', label: 'На локації', parentId: null },
    ]);
    onClose();
  };

  const handleLocationChange = async (value) => {
    setSelectedLocationId(value || null);
    setSelectedPlacementValue('location-root');

    form.setFieldValue('location', value);
    form.setFieldValue('placement', 'location-root');

    await loadPlacementOptions(value);
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const selectedPlacement =
        placementOptions.find((item) => item.value === values.placement) ||
        null;

      const payload = {
        location: values.location,
        parent: selectedPlacement ? selectedPlacement.parentId : null,
        place_type: values.place_type,
        name: values.name || '',
        comment: values.comment || '',
      };

      await api.post('warehouse-storage-places/', payload);

      message.success('Місце зберігання створено.');
      handleCloseDrawer();

      if (onCreated) {
        await onCreated();
      }
    } catch (err) {
      console.error('Failed to create warehouse storage place:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'location',
        'parent',
        'place_type',
        'name',
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося створити місце зберігання.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Створення місця зберігання"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Flex vertical gap={16}>
          <Alert
            type="info"
            showIcon
            message="Спочатку оберіть локацію та розміщення"
            description="Після цього вкажіть тип місця зберігання, назву та коментар."
          />

          <Card title="Шаг 1. Оберіть локацію">
            <Flex vertical gap={14}>
              <div>
                <Text style={compactLabelStyle}>Локація</Text>
                <Form.Item
                  name="location"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: 'Оберіть локацію' }]}
                >
                  <Select
                    placeholder="Оберіть локацію"
                    options={locationOptions}
                    onChange={handleLocationChange}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Розміщення</Text>
                <Form.Item
                  name="placement"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: 'Оберіть розміщення' }]}
                >
                  <Select
                    placeholder={
                      selectedLocationId
                        ? 'Оберіть розміщення'
                        : 'Спочатку оберіть локацію'
                    }
                    options={placementOptions}
                    value={selectedPlacementValue}
                    onChange={setSelectedPlacementValue}
                    loading={loadingPlacementOptions}
                    disabled={!selectedLocationId}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          <Card title="Шаг 2. Оберіть тип, додайте назву та опис">
            <Flex vertical gap={14}>
              <div>
                <Text style={compactLabelStyle}>Тип місця зберігання</Text>
                <Form.Item
                  name="place_type"
                  style={{ marginBottom: 0 }}
                  rules={[
                    {
                      required: true,
                      message: 'Оберіть тип місця зберігання',
                    },
                  ]}
                >
                  <Select
                    placeholder="Оберіть тип"
                    options={[
                      { value: 'container', label: 'Контейнер' },
                      { value: 'rack', label: 'Стелаж' },
                      { value: 'box', label: 'Бокс' },
                    ]}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Назва</Text>
                <Form.Item name="name" style={{ marginBottom: 0 }}>
                  <Input placeholder="Назва місця зберігання" />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Коментар</Text>
                <Form.Item name="comment" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={4}
                    placeholder="Коментар до місця зберігання"
                  />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          <Flex justify="flex-end" gap={8}>
            <Button onClick={handleCloseDrawer}>Скасувати</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Зберегти
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Drawer>
  );
}

export default WarehousePlacesDrawer;
