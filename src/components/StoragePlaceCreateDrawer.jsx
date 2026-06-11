import { useState } from 'react';
import { Button, Card, Drawer, Flex, Select, Tooltip, Typography } from 'antd';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const PLACE_TYPE_OPTIONS = [
  { value: 'area', label: 'Площадка' },
  { value: 'container', label: 'Контейнер' },
  { value: 'rack', label: 'Стелаж' },
  { value: 'shelf', label: 'Полка' },
  { value: 'box', label: 'Коробка' },
];

function StoragePlaceCreateDrawer({
  open,
  onClose,
  locations,
  locationsLoading,
}) {
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedPlaceType, setSelectedPlaceType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const canSelectPlaceType = Boolean(selectedLocationId) && currentStep === 1;
  const canGoNext = Boolean(selectedLocationId && selectedPlaceType);

  const locationOptions = locations.map((item) => ({
    value: item.id,
    label: `${item.code || '—'} — ${item.name || '—'}`,
  }));

  const resetForm = () => {
    setSelectedLocationId(null);
    setSelectedPlaceType(null);
    setCurrentStep(1);
  };

  const handleCloseDrawer = () => {
    resetForm();
    onClose();
  };

  return (
    <Drawer
      title="Додати місце зберігання"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
      maskClosable={false}
      keyboard={false}
    >
      <Flex vertical gap={16}>
        <Card title="Основна інформація">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Оберіть локацію</Text>
              <Select
                showSearch
                placeholder="Локація"
                style={{ width: '100%' }}
                value={selectedLocationId}
                options={locationOptions}
                loading={locationsLoading}
                optionFilterProp="label"
                disabled={currentStep > 1}
                onChange={(value) => {
                  setSelectedLocationId(value);
                  setSelectedPlaceType(null);
                }}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Оберіть тип</Text>
              <Select
                placeholder="Тип місця зберігання"
                style={{ width: '100%' }}
                value={selectedPlaceType}
                options={PLACE_TYPE_OPTIONS}
                optionFilterProp="label"
                disabled={!canSelectPlaceType}
                onChange={setSelectedPlaceType}
              />
            </div>
          </Flex>
        </Card>

        {currentStep >= 2 && <Card title="Налаштування розміщення" />}

        <Flex justify="space-between" align="center">
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Tooltip
            title={
              canGoNext
                ? ''
                : 'Щоб перейти далі, оберіть локацію та тип місця зберігання.'
            }
          >
            <Button
              type="primary"
              disabled={!canGoNext || currentStep >= 2}
              onClick={() => setCurrentStep(2)}
            >
              Наступний крок
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default StoragePlaceCreateDrawer;
