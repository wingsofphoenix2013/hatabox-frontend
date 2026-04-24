import { useCallback, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Select,
  Switch,
  Table,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';

const { Text } = Typography;

const SELECT_ALL_VALUE = '__select_all__';
const SELECT_ALL_DIVIDER_VALUE = '__select_all_divider__';

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const compactValueStyle = {
  display: 'block',
  fontSize: 12,
  lineHeight: 1.3,
  wordBreak: 'break-word',
};

const compactMutedStyle = {
  display: 'block',
  fontSize: 11,
  lineHeight: 1.2,
  marginBottom: 4,
};

function InfoCell({ label, value, compact = false, valueStyle = {} }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text
        type="secondary"
        style={compact ? compactMutedStyle : compactLabelStyle}
      >
        {label}
      </Text>

      <Text
        style={{
          ...(compact
            ? { ...compactValueStyle, fontSize: 12 }
            : compactValueStyle),
          ...valueStyle,
        }}
      >
        {value || '—'}
      </Text>
    </div>
  );
}

function WarehouseIntakeDrawer({
  open,
  onClose,
  locations = [],
  pendingItems = [],
  presetPendingItems = [],
  onCompleted,
  sourceType = 'procurement',
}) {
  const isTollingMode = sourceType === 'tolling';
  const [locationOptions, setLocationOptions] = useState([]);

  const [locationDraftId, setLocationDraftId] = useState(null);
  const [confirmedLocationId, setConfirmedLocationId] = useState(null);

  const [conversionMode, setConversionMode] = useState(false); // false = Ні, true = Так
  const [selectedPendingItemId, setSelectedPendingItemId] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const [saving, setSaving] = useState(false);

  const [step1Error, setStep1Error] = useState('');
  const [submitError, setSubmitError] = useState('');

  const isPresetMode =
    Array.isArray(presetPendingItems) && presetPendingItems.length > 0;

  const allPendingItems = useMemo(() => {
    return Array.isArray(pendingItems) ? pendingItems : [];
  }, [pendingItems]);

  const activeLocationOptionsFromProps = useMemo(() => {
    return (Array.isArray(locations) ? locations : [])
      .filter((location) => location?.is_active !== false)
      .map((location) => ({
        value: location.id,
        label: location.name || location.code || `ID ${location.id}`,
        raw: location,
      }));
  }, [locations]);

  const regularPendingItems = useMemo(() => {
    if (isTollingMode) {
      return allPendingItems;
    }

    return allPendingItems.filter((item) => !item.requires_unit_conversion);
  }, [allPendingItems, isTollingMode]);

  const conversionPendingItems = useMemo(() => {
    if (isTollingMode) {
      return [];
    }

    return allPendingItems.filter((item) =>
      Boolean(item.requires_unit_conversion),
    );
  }, [allPendingItems, isTollingMode]);

  const hasRegularItems = regularPendingItems.length > 0;
  const hasConversionItems = conversionPendingItems.length > 0;
  const hasBothModes = hasRegularItems && hasConversionItems;

  const step2Enabled = Boolean(confirmedLocationId);
  const cartHasItems = cartItems.length > 0;

  const hasLocationDraftChanges =
    confirmedLocationId !== null && locationDraftId !== confirmedLocationId;

  const availableItemsForCurrentMode = useMemo(() => {
    const source = conversionMode
      ? conversionPendingItems
      : regularPendingItems;
    const cartIds = new Set(cartItems.map((item) => item.id));

    return source.filter((item) => !cartIds.has(item.id));
  }, [conversionMode, conversionPendingItems, regularPendingItems, cartItems]);

  const selectedPendingItem = useMemo(() => {
    if (
      !selectedPendingItemId ||
      selectedPendingItemId === SELECT_ALL_VALUE ||
      selectedPendingItemId === SELECT_ALL_DIVIDER_VALUE
    ) {
      return null;
    }

    return (
      availableItemsForCurrentMode.find(
        (item) => item.id === selectedPendingItemId,
      ) || null
    );
  }, [selectedPendingItemId, availableItemsForCurrentMode]);

  const canUseSelectAll =
    !conversionMode && availableItemsForCurrentMode.length > 1;

  const isStep2LockedByPreset = isPresetMode;

  const step2SwitchDisabled =
    isTollingMode ||
    !step2Enabled ||
    cartHasItems ||
    !hasBothModes ||
    isStep2LockedByPreset;

  const isConversionPlaceholderMode = !isTollingMode && conversionMode;
  const canAddSelectedItem =
    step2Enabled &&
    !isConversionPlaceholderMode &&
    (selectedPendingItemId === SELECT_ALL_VALUE ||
      Boolean(selectedPendingItem));

  const submitButtonDisabled =
    !confirmedLocationId || cartItems.length === 0 || saving;

  const addButtonText =
    selectedPendingItemId === SELECT_ALL_VALUE
      ? '+ Додати товари'
      : '+ Додати товар';

  const resetStep2AndBelow = (nextConversionMode = false) => {
    setConversionMode(nextConversionMode);
    setSelectedPendingItemId(null);
    setCartItems(isPresetMode ? presetPendingItems : []);
    setSubmitError('');
  };

  const resetAll = () => {
    setLocationDraftId(null);
    setConfirmedLocationId(null);
    setStep1Error('');
    setSubmitError('');
    setSaving(false);
    setSelectedPendingItemId(null);
    setCartItems([]);

    if (isTollingMode) {
      setConversionMode(false);
    } else if (hasRegularItems && hasConversionItems) {
      setConversionMode(false);
    } else if (!hasRegularItems && hasConversionItems) {
      setConversionMode(true);
    } else {
      setConversionMode(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocationOptions(activeLocationOptionsFromProps);
  }, [open, activeLocationOptionsFromProps]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocationDraftId(null);
    setConfirmedLocationId(null);
    setStep1Error('');
    setSubmitError('');
    setSaving(false);
    setSelectedPendingItemId(null);

    if (isPresetMode) {
      setCartItems(presetPendingItems);
      setConversionMode(false);
    } else {
      setCartItems([]);

      if (isTollingMode) {
        setConversionMode(false);
      } else if (hasRegularItems && hasConversionItems) {
        setConversionMode(false);
      } else if (!hasRegularItems && hasConversionItems) {
        setConversionMode(true);
      } else {
        setConversionMode(false);
      }
    }
  }, [
    open,
    hasRegularItems,
    hasConversionItems,
    isPresetMode,
    presetPendingItems,
    isTollingMode,
  ]);

  useEffect(() => {
    if (!step2Enabled) {
      return;
    }

    if (
      selectedPendingItemId &&
      selectedPendingItemId !== SELECT_ALL_VALUE &&
      selectedPendingItemId !== SELECT_ALL_DIVIDER_VALUE &&
      !availableItemsForCurrentMode.some(
        (item) => item.id === selectedPendingItemId,
      )
    ) {
      setSelectedPendingItemId(null);
    }
  }, [selectedPendingItemId, availableItemsForCurrentMode, step2Enabled]);

  const handleCloseDrawer = () => {
    resetAll();
    onClose();
  };

  const handleConfirmLocation = () => {
    if (!locationDraftId) {
      setStep1Error('Оберіть локацію.');
      return;
    }

    setStep1Error('');

    const nextConfirmedId = locationDraftId;
    const locationActuallyChanged = confirmedLocationId !== nextConfirmedId;

    setConfirmedLocationId(nextConfirmedId);

    if (locationActuallyChanged) {
      const nextMode = isTollingMode
        ? false
        : hasRegularItems && hasConversionItems
          ? false
          : !hasRegularItems && hasConversionItems;

      resetStep2AndBelow(nextMode);
    }
  };

  const handleCancelLocationChange = () => {
    setLocationDraftId(confirmedLocationId);
    setStep1Error('');
  };

  const handleChangeConversionMode = (checked) => {
    if (isTollingMode || step2SwitchDisabled) {
      return;
    }

    setConversionMode(checked);
    setSelectedPendingItemId(null);
  };

  const handleAddItem = () => {
    if (!canAddSelectedItem) {
      return;
    }

    if (selectedPendingItemId === SELECT_ALL_VALUE) {
      setCartItems((prev) => [...prev, ...availableItemsForCurrentMode]);
      setSelectedPendingItemId(null);
      return;
    }

    if (!selectedPendingItem) {
      return;
    }

    setCartItems((prev) => [...prev, selectedPendingItem]);
    setSelectedPendingItemId(null);
  };

  const handleRemoveCartItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSubmit = async () => {
    if (submitButtonDisabled) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      if (cartItems.length === 1) {
        const item = cartItems[0];

        await api.post(
          `${
            isTollingMode
              ? 'warehouse-tolling-pending-intake-items'
              : 'warehouse-pending-intake-items'
          }/${item.id}/accept-to-location/`,
          {
            location: confirmedLocationId,
          },
        );

        message.success('Первинне отримання оформлено.');
      } else {
        await api.post(
          isTollingMode
            ? 'warehouse-tolling-pending-intake-items/bulk-accept-to-location/'
            : 'warehouse-pending-intake-items/bulk-accept-to-location/',
          {
            location: confirmedLocationId,
            receipt_item_ids: cartItems.map((item) => item.id),
          },
        );

        message.success('Групове первинне отримання оформлено.');
      }

      if (onCompleted) {
        await onCompleted();
      }

      handleCloseDrawer();
    } catch (err) {
      console.error('Failed to submit warehouse intake:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'location',
        'receipt_item_ids',
      ]);

      setSubmitError(
        backendMessage || 'Не вдалося оформити первинне отримання.',
      );
    } finally {
      setSaving(false);
    }
  };

  const getPendingItemDisplayName = useCallback(
    (item) => {
      if (!item) return '—';

      return isTollingMode
        ? item.inventory_item_name || `ID ${item.id}`
        : item.vendor_item_name || item.inventory_item_name || `ID ${item.id}`;
    },
    [isTollingMode],
  );

  const getPendingItemCounterpartyName = (item) => {
    if (!item) return '—';

    return isTollingMode ? item.organization_name : item.vendor_name;
  };

  const getPendingItemDocumentDisplay = (item) => {
    if (!item) return '—';

    if (isTollingMode) {
      return `${item.receipt_no || '—'} · ${
        item.receipt_date ? formatDateDisplay(item.receipt_date) : '—'
      }`;
    }

    return `${item.order_no || '—'} · ${
      item.order_created_at ? formatDateDisplay(item.order_created_at) : '—'
    }`;
  };

  const orderItemOptions = useMemo(() => {
    if (!step2Enabled || isConversionPlaceholderMode) {
      return [];
    }

    const regularOptions = availableItemsForCurrentMode.map((item) => ({
      value: item.id,
      label: getPendingItemDisplayName(item),
    }));

    if (!canUseSelectAll) {
      return regularOptions;
    }

    return [
      {
        value: SELECT_ALL_VALUE,
        label: 'Обрати всі',
      },
      {
        value: SELECT_ALL_DIVIDER_VALUE,
        label: '────────────',
        disabled: true,
      },
      ...regularOptions,
    ];
  }, [
    step2Enabled,
    isConversionPlaceholderMode,
    availableItemsForCurrentMode,
    canUseSelectAll,
    getPendingItemDisplayName,
  ]);

  const step3Columns = [
    {
      title: 'Товар',
      dataIndex: 'vendor_item_name',
      key: 'vendor_item_name',
      render: (_, record) => getPendingItemDisplayName(record),
    },
    {
      title: <div style={{ whiteSpace: 'nowrap' }}>К-сть</div>,
      key: 'received_quantity',
      dataIndex: 'received_quantity',
      width: 90,
      align: 'center',
      render: (value, record) => (
        <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
          {formatQuantity(value)} {record.inventory_item_unit_symbol || ''}
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      align: 'center',
      render: (_, record) =>
        isStep2LockedByPreset ? null : (
          <DeleteOutlined
            style={{
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: 14,
            }}
            onClick={() => handleRemoveCartItem(record.id)}
          />
        ),
    },
  ];

  return (
    <Drawer
      title="Первинне отримання"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Flex vertical gap={16}>
        <Card title="1. Оберіть локацію">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Локація</Text>
              <Select
                placeholder="Оберіть локацію"
                style={{ width: '100%' }}
                value={locationDraftId}
                options={locationOptions}
                onChange={(value) => {
                  setLocationDraftId(value);
                  setStep1Error('');
                }}
              />
            </div>

            {hasLocationDraftChanges && cartHasItems && (
              <Alert
                type="warning"
                showIcon
                message="Зміна локації очистить перелік отримання"
                description="Якщо підтвердити нову локацію, усі товари, додані на кроці 2, будуть скинуті."
              />
            )}

            {step1Error && <Alert type="error" showIcon message={step1Error} />}

            <Flex justify="flex-end" gap={8}>
              {hasLocationDraftChanges && (
                <Button onClick={handleCancelLocationChange}>Відміна</Button>
              )}

              <Button
                type="primary"
                onClick={handleConfirmLocation}
                disabled={!locationDraftId}
              >
                Обрати локацію
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card
          title={
            <Flex justify="space-between" align="center" wrap gap={12}>
              <span>2. Оберіть товар</span>

              <Flex align="center" gap={8}>
                <Text style={{ fontSize: 12 }}>Товари з конвертацією</Text>
                <Switch
                  checked={isTollingMode ? false : conversionMode}
                  checkedChildren="Так"
                  unCheckedChildren="Ні"
                  disabled={step2SwitchDisabled}
                  onChange={handleChangeConversionMode}
                />
              </Flex>
            </Flex>
          }
          styles={{
            body: {
              opacity: step2Enabled ? 1 : 0.65,
              pointerEvents: step2Enabled ? 'auto' : 'none',
            },
          }}
        >
          <Flex vertical gap={14}>
            {!step2Enabled && (
              <Alert
                type="info"
                showIcon
                message="Спочатку підтвердьте локацію"
                description="Наступний крок стане доступним після вибору та підтвердження локації."
              />
            )}

            {step2Enabled && isConversionPlaceholderMode && (
              <Alert
                type="warning"
                showIcon
                message="Режим недоступний"
                description="Оформлення товарів з конвертацією поки що не реалізоване на стороні backend."
              />
            )}

            {step2Enabled && isStep2LockedByPreset && (
              <Alert
                type="info"
                showIcon
                message={
                  cartItems.length === 1
                    ? 'Позицію вже додано'
                    : 'Позиції вже додано'
                }
                description={
                  cartItems.length === 1
                    ? 'Відкрито швидке первинне отримання для однієї позиції. Додавання інших товарів недоступне.'
                    : 'Відкрито швидке первинне отримання для обраних позицій. Додавання інших товарів недоступне.'
                }
              />
            )}

            <div>
              <Text style={compactLabelStyle}>Товар</Text>
              <Select
                placeholder="Оберіть товар"
                style={{ width: '100%' }}
                value={selectedPendingItemId}
                options={orderItemOptions}
                onChange={setSelectedPendingItemId}
                disabled={
                  !step2Enabled ||
                  isConversionPlaceholderMode ||
                  isStep2LockedByPreset
                }
              />
            </div>

            <div
              style={{
                padding: '10px 12px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <Flex wrap gap={16} align="flex-start">
                <div style={{ flex: '1 1 180px' }}>
                  <InfoCell
                    label="Постачальник"
                    value={getPendingItemCounterpartyName(selectedPendingItem)}
                    compact
                  />
                </div>

                <div style={{ flex: '1 1 220px' }}>
                  <InfoCell
                    label="Замовлення"
                    value={getPendingItemDocumentDisplay(selectedPendingItem)}
                    compact
                  />
                </div>

                <div style={{ flex: '1 1 260px' }}>
                  <InfoCell
                    label="Інвентарно-номенклатурна назва"
                    value={selectedPendingItem?.inventory_item_name}
                    compact
                  />
                </div>

                <div style={{ flex: '0 1 140px' }}>
                  <InfoCell
                    label="Кількість"
                    value={
                      selectedPendingItem
                        ? `${formatQuantity(selectedPendingItem.received_quantity)} ${
                            selectedPendingItem.inventory_item_unit_symbol || ''
                          }`
                        : '—'
                    }
                    compact
                    valueStyle={{
                      fontSize: 18,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}
                  />
                </div>
              </Flex>
            </div>

            <Flex justify="flex-end">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                disabled={!canAddSelectedItem || isStep2LockedByPreset}
              >
                {addButtonText}
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card title="3. Перелік отримання">
          <Table
            rowKey="id"
            columns={step3Columns}
            dataSource={cartItems}
            pagination={false}
            size="small"
            locale={{
              emptyText: 'Немає доданих товарів.',
            }}
            components={{
              body: {
                cell: (props) => (
                  <td
                    {...props}
                    style={{
                      fontSize: 12.5,
                      padding: '7px 8px',
                    }}
                  />
                ),
              },
            }}
          />
        </Card>

        {submitError && <Alert type="error" showIcon message={submitError} />}

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmit}
            disabled={submitButtonDisabled}
          >
            Оформити отримання
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default WarehouseIntakeDrawer;
