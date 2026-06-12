import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Select,
  Spin,
  Tooltip,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const CREATE_HERE_VALUE = '__create_here__';

const PLACE_TYPE_OPTIONS = [
  { value: 'area', label: 'Площадка' },
  { value: 'container', label: 'Контейнер' },
  { value: 'rack', label: 'Стелаж' },
  { value: 'shelf', label: 'Полка' },
  { value: 'box', label: 'Коробка' },
];

const buildParentOptionValue = (item) =>
  item.id === null ? CREATE_HERE_VALUE : String(item.id);

const buildParentOptions = (items) => {
  const options = items.map((item) => ({
    value: buildParentOptionValue(item),
    label: item.label || '—',
    item,
  }));

  if (options.length <= 1) {
    return options;
  }

  return [
    options[0],
    {
      value: '__divider__',
      label: <div style={{ borderTop: '1px solid #f0f0f0' }} />,
      disabled: true,
    },
    ...options.slice(1),
  ];
};

function StoragePlaceCreateDrawer({
  open,
  onClose,
  locations,
  locationsLoading,
}) {
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedPlaceType, setSelectedPlaceType] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [parentLevels, setParentLevels] = useState([]);
  const [parentOptionsLoading, setParentOptionsLoading] = useState(false);
  const [parentOptionsError, setParentOptionsError] = useState('');
  const [finalPlacement, setFinalPlacement] = useState(null);

  const [saving, setSaving] = useState(false);

  const canSelectPlaceType = Boolean(selectedLocationId) && currentStep === 1;
  const canGoNextFromStep1 = Boolean(selectedLocationId && selectedPlaceType);
  const canGoNextFromStep2 = Boolean(finalPlacement);
  const canGoNext = currentStep === 1 ? canGoNextFromStep1 : canGoNextFromStep2;

  const locationOptions = locations.map((item) => ({
    value: item.id,
    label: `${item.code || '—'} — ${item.name || '—'}`,
  }));

  const resetForm = () => {
    setSelectedLocationId(null);
    setSelectedPlaceType(null);
    setCurrentStep(1);
    setParentLevels([]);
    setParentOptionsLoading(false);
    setParentOptionsError('');
    setFinalPlacement(null);
    setSaving(false);
  };

  const handleCloseDrawer = () => {
    resetForm();
    onClose();
  };

  const loadParentOptions = async (parentId = null, levelIndex = 0) => {
    try {
      setParentOptionsLoading(true);
      setParentOptionsError('');

      const params = new URLSearchParams();
      params.append('location', String(selectedLocationId));
      params.append('place_type', selectedPlaceType);

      if (parentId) {
        params.append('parent', String(parentId));
      }

      const response = await api.get(
        `storage-parent-options/?${params.toString()}`,
      );

      const results = Array.isArray(response.data) ? response.data : [];
      const options = buildParentOptions(results);
      const actionOptions = results.filter((item) => item.id === null);
      const realOptions = results.filter((item) => item.id !== null);
      const shouldAutoSelectCreateHere =
        levelIndex > 0 &&
        actionOptions.length === 1 &&
        realOptions.length === 0;

      setParentLevels((prevLevels) => [
        ...prevLevels.slice(0, levelIndex),
        {
          parentId,
          value: shouldAutoSelectCreateHere ? CREATE_HERE_VALUE : null,
          options,
        },
      ]);

      if (shouldAutoSelectCreateHere) {
        setFinalPlacement({
          location: null,
          parent: parentId,
        });
      }
    } catch (err) {
      console.error('Failed to load storage parent options:', err);
      setParentOptionsError('Не вдалося завантажити варіанти розміщення.');
      setParentLevels((prevLevels) => prevLevels.slice(0, levelIndex));
    } finally {
      setParentOptionsLoading(false);
    }
  };

  const handleCreateStoragePlace = async () => {
    if (!finalPlacement) {
      return;
    }

    try {
      setSaving(true);

      const response = await api.post('storage-places/', {
        location: finalPlacement.location,
        parent: finalPlacement.parent,
        place_type: selectedPlaceType,
      });

      const createdStoragePlace = response.data || {};

      message.success('Місце зберігання створено.');

      resetForm();
      onClose();

      navigate(`/inventory/storage-topology/${createdStoragePlace.id}`, {
        state: {
          storagePlaceLabel: `${createdStoragePlace.address || '—'} ${
            createdStoragePlace.name || ''
          }`.trim(),
        },
      });
    } catch (err) {
      console.error('Failed to create storage place:', err);

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

  const handleGoNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setFinalPlacement(null);
      setParentLevels([]);
      await loadParentOptions();
      return;
    }

    if (currentStep === 2) {
      await handleCreateStoragePlace();
    }
  };

  const handleChangeParentLevel = async (levelIndex, value, option) => {
    const selectedItem = option?.item || null;

    setFinalPlacement(null);

    setParentLevels((prevLevels) =>
      prevLevels.map((level, index) =>
        index === levelIndex ? { ...level, value } : level,
      ),
    );

    if (!selectedItem) {
      setParentLevels((prevLevels) => prevLevels.slice(0, levelIndex + 1));
      return;
    }

    if (value === CREATE_HERE_VALUE) {
      setFinalPlacement({
        location: levelIndex === 0 ? selectedLocationId : null,
        parent: levelIndex === 0 ? null : parentLevels[levelIndex]?.parentId,
      });
      setParentLevels((prevLevels) => prevLevels.slice(0, levelIndex + 1));
      return;
    }

    setParentLevels((prevLevels) => prevLevels.slice(0, levelIndex + 1));
    await loadParentOptions(selectedItem.id, levelIndex + 1);
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

        {currentStep >= 2 && (
          <Card title="Налаштування розміщення">
            <Flex vertical gap={14}>
              {parentOptionsError && (
                <Alert type="error" description={parentOptionsError} showIcon />
              )}

              {parentOptionsLoading && parentLevels.length === 0 && (
                <Flex justify="center" style={{ padding: '24px 0' }}>
                  <Spin />
                </Flex>
              )}

              {parentLevels.map((level, index) => (
                <div key={`${level.parentId || 'root'}-${index}`}>
                  <Text style={compactLabelStyle}>
                    {index === 0 ? 'Оберіть розміщення' : 'Уточнення'}
                  </Text>

                  <Select
                    placeholder={
                      index === 0 ? 'Оберіть розміщення' : 'Уточніть розміщення'
                    }
                    style={{ width: '100%' }}
                    value={level.value}
                    options={level.options}
                    loading={parentOptionsLoading}
                    optionFilterProp="label"
                    onChange={(value, option) =>
                      handleChangeParentLevel(index, value, option)
                    }
                  />
                </div>
              ))}
            </Flex>
          </Card>
        )}

        <Flex justify="space-between" align="center">
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Tooltip
            title={
              canGoNext
                ? ''
                : currentStep === 1
                  ? 'Щоб перейти далі, оберіть локацію та тип місця зберігання.'
                  : currentStep === 2
                    ? 'Щоб перейти далі, оберіть місце створення.'
                    : 'Щоб створити місце зберігання, оберіть місце створення.'
            }
          >
            <Button
              type="primary"
              disabled={!canGoNext}
              loading={parentOptionsLoading || saving}
              onClick={handleGoNext}
            >
              {currentStep === 2
                ? 'Створити місце зберігання'
                : 'Наступний крок'}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default StoragePlaceCreateDrawer;
