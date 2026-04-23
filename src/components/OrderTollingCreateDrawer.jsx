import { useEffect, useMemo, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Flex,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';

const { Text } = Typography;

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

const ORGANIZATION_TYPE_LABELS = {
  military: 'Військова частина',
  commercial: 'Комерційна організація',
  charity: 'Благодійна організація',
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

function OrderTollingCreateDrawer({
  open,
  onClose,
  organizations = [],
  onCompleted,
  mode = 'create',
  order = null,
}) {
  const navigate = useNavigate();

  const isEditMode = mode === 'edit';
  const isActive = order?.status === 'active';

  const step2DisabledInActive = isEditMode && isActive;

  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [organizationDraftId, setOrganizationDraftId] = useState(null);
  const [createdOrderId, setCreatedOrderId] = useState(null);

  const [selectedInvItemId, setSelectedInvItemId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(null);
  const [selectedExpectedDate, setSelectedExpectedDate] = useState(null);

  const [draftRows, setDraftRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [editingExpectedDate, setEditingExpectedDate] = useState(null);

  const [creatingOrder, setCreatingOrder] = useState(false);
  const [savingRow, setSavingRow] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [step1Error, setStep1Error] = useState('');
  const [step2Error, setStep2Error] = useState('');

  const organizationOptions = useMemo(() => {
    return (Array.isArray(organizations) ? organizations : []).map((item) => ({
      value: item.value ?? item.id,
      label: item.label ?? item.name,
      type: item.type || null,
      legalName: item.legalName || item.legal_name || item.label || item.name,
    }));
  }, [organizations]);

  const selectedOrganizationDraft = useMemo(() => {
    return (
      organizationOptions.find((item) => item.value === organizationDraftId) ||
      null
    );
  }, [organizationOptions, organizationDraftId]);

  const availableInventoryOptions = useMemo(() => {
    const usedIds = new Set(draftRows.map((row) => row.inv_item_id));

    return inventoryOptions.filter((item) => !usedIds.has(item.id));
  }, [inventoryOptions, draftRows]);

  const selectedInventoryItem = useMemo(() => {
    return (
      availableInventoryOptions.find((item) => item.id === selectedInvItemId) ||
      null
    );
  }, [availableInventoryOptions, selectedInvItemId]);

  const step1Locked = Boolean(createdOrderId);
  const step2Enabled = isEditMode
    ? Boolean(order?.id)
    : Boolean(createdOrderId);

  const canAddRow =
    step2Enabled &&
    Boolean(selectedInvItemId) &&
    selectedQuantity !== null &&
    selectedQuantity !== undefined &&
    Number(selectedQuantity) > 0 &&
    Boolean(selectedExpectedDate) &&
    !savingRow;

  const submitButtonDisabled =
    !createdOrderId || draftRows.length === 0 || finalizing;

  const resetStep2AndBelow = () => {
    setSelectedInvItemId(null);
    setSelectedQuantity(null);
    setSelectedExpectedDate(null);
    setDraftRows([]);
    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingExpectedDate(null);
    setStep2Error('');
  };

  const resetAll = () => {
    setOrganizationDraftId(null);
    setCreatedOrderId(null);
    setSelectedInvItemId(null);
    setSelectedQuantity(null);
    setSelectedExpectedDate(null);
    setDraftRows([]);
    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingExpectedDate(null);
    setCreatingOrder(false);
    setSavingRow(false);
    setFinalizing(false);
    setStep1Error('');
    setStep2Error('');
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEditMode) {
      setOrganizationDraftId(order?.organization ?? null);
      setCreatedOrderId(order?.id ?? null);

      setSelectedInvItemId(null);
      setSelectedQuantity(null);
      setSelectedExpectedDate(null);

      setDraftRows(
        Array.isArray(order?.items)
          ? order.items.map((item) => ({
              id: item.id,
              inv_item_id: item.inv_item,
              item_name: item.inv_item_name || '—',
              internal_code: item.inv_item_internal_code || '',
              unit_symbol: item.inv_item_unit_symbol || '',
              quantity: item.quantity,
              expected_delivery_date: item.expected_delivery_date || null,
              received_quantity: item.received_quantity,
            }))
          : [],
      );

      setEditingRowId(null);
      setEditingQuantity(null);
      setEditingExpectedDate(null);
      setCreatingOrder(false);
      setSavingRow(false);
      setFinalizing(false);
      setStep1Error('');
      setStep2Error('');
      return;
    }

    resetAll();
  }, [open, isEditMode, order]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadInventoryOptions();
  }, [open]);

  const loadInventoryOptions = async (searchValue = '') => {
    try {
      setInventoryLoading(true);

      const params = new URLSearchParams();

      if (searchValue?.trim()) {
        params.set('search', searchValue.trim());
      }

      const query = params.toString();
      const response = await api.get(
        `inventory-item-options/${query ? `?${query}` : ''}`,
      );

      const results = Array.isArray(response.data) ? response.data : [];
      setInventoryOptions(results);
    } catch (err) {
      console.error('Failed to load inventory item options:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      message.error(
        backendMessage ||
          'Не вдалося завантажити номенклатурні позиції для передачі.',
      );
      setInventoryOptions([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const performCloseDrawer = async () => {
    if (!isEditMode) {
      resetAll();
    }

    onClose();

    if (onCompleted) {
      await onCompleted();
    }
  };

  const handleCloseAttempt = () => {
    if (isEditMode) {
      onClose();
      return;
    }
    if (!createdOrderId) {
      void performCloseDrawer();
      return;
    }

    if (draftRows.length > 0) {
      void performCloseDrawer();
      return;
    }

    Modal.confirm({
      title: 'Видалити чернетку?',
      content:
        'Накладну вже створено, але рядки не додані. Чернетку буде видалено.',
      okText: 'Видалити чернетку',
      cancelText: 'Скасувати',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`tolling-orders/${createdOrderId}/`);
          message.success('Порожню чернетку видалено.');
          await performCloseDrawer();
        } catch (err) {
          console.error('Failed to delete empty tolling draft:', err);

          const backendMessage = getApiErrorMessage(err?.response?.data);
          message.error(
            backendMessage || 'Не вдалося видалити порожню чернетку.',
          );
        }
      },
    });
  };

  const handleCreateOrder = async () => {
    if (!organizationDraftId) {
      setStep1Error('Оберіть організацію.');
      return;
    }

    try {
      setCreatingOrder(true);
      setStep1Error('');

      const response = await api.post('tolling-orders/', {
        organization: organizationDraftId,
      });

      const createdOrder = response.data;

      setCreatedOrderId(createdOrder?.id || null);
      resetStep2AndBelow();

      message.success('Накладну створено.');
    } catch (err) {
      console.error('Failed to create tolling order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'organization',
      ]);

      setStep1Error(backendMessage || 'Не вдалося створити накладну.');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleAddRow = async () => {
    const currentOrderId = isEditMode ? order?.id : createdOrderId;

    if (!canAddRow || !selectedInventoryItem || !currentOrderId) {
      return;
    }

    try {
      setSavingRow(true);
      setStep2Error('');

      const payload = {
        order: currentOrderId,
        inv_item: selectedInventoryItem.id,
        quantity: String(selectedQuantity),
        expected_delivery_date: selectedExpectedDate.format('YYYY-MM-DD'),
      };

      const response = await api.post('tolling-order-items/', payload);
      const createdItem = response.data || {};

      const nextRow = {
        id: createdItem.id,
        inv_item_id: selectedInventoryItem.id,
        item_name:
          createdItem.inv_item_name || selectedInventoryItem.name || '—',
        internal_code: selectedInventoryItem.internal_code || '',
        category_name: selectedInventoryItem.category_name || '',
        unit_symbol:
          createdItem.inv_item_unit_symbol ||
          selectedInventoryItem.unit_symbol ||
          '',
        description: selectedInventoryItem.description || '',
        quantity:
          createdItem.quantity !== undefined && createdItem.quantity !== null
            ? createdItem.quantity
            : String(selectedQuantity),
        expected_delivery_date:
          createdItem.expected_delivery_date ||
          selectedExpectedDate.format('YYYY-MM-DD'),
      };

      setDraftRows((prev) => [...prev, nextRow]);

      setSelectedInvItemId(null);
      setSelectedQuantity(null);
      setSelectedExpectedDate(null);

      message.success('Рядок додано.');
    } catch (err) {
      console.error('Failed to create tolling order item:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'order',
        'inv_item',
        'quantity',
        'expected_delivery_date',
      ]);

      setStep2Error(backendMessage || 'Не вдалося додати рядок.');
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteRow = async (rowId) => {
    try {
      setSavingRow(true);
      setStep2Error('');

      await api.delete(`tolling-order-items/${rowId}/`);

      setDraftRows((prev) => prev.filter((item) => item.id !== rowId));

      if (editingRowId === rowId) {
        setEditingRowId(null);
        setEditingQuantity(null);
        setEditingExpectedDate(null);
      }

      message.success('Рядок видалено.');
    } catch (err) {
      console.error('Failed to delete tolling order item:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      message.error(backendMessage || 'Не вдалося видалити рядок.');
    } finally {
      setSavingRow(false);
    }
  };

  const handleStartEditRow = (row) => {
    setEditingRowId(row.id);

    if (isEditMode && isActive) {
      setEditingQuantity(null);
    } else {
      setEditingQuantity(
        row.quantity !== null && row.quantity !== undefined
          ? Number(row.quantity)
          : null,
      );
    }

    setEditingExpectedDate(
      row.expected_delivery_date
        ? dayjs(row.expected_delivery_date, 'YYYY-MM-DD')
        : null,
    );
  };

  const handleSaveRow = async (rowId) => {
    const isEditActiveMode = isEditMode && isActive;

    const currentRow = draftRows.find((row) => row.id === rowId);

    if (!isEditActiveMode) {
      if (
        editingQuantity === null ||
        editingQuantity === undefined ||
        Number(editingQuantity) <= 0
      ) {
        message.error('Кількість повинна бути більшою за 0.');
        return;
      }
    }

    if (!editingExpectedDate) {
      message.error('Оберіть дату поставки.');
      return;
    }

    try {
      setSavingRow(true);

      const payload = {
        quantity: String(
          isEditActiveMode ? currentRow?.quantity : editingQuantity,
        ),
        expected_delivery_date: editingExpectedDate.format('YYYY-MM-DD'),
      };

      const response = await api.patch(
        `tolling-order-items/${rowId}/`,
        payload,
      );
      const updatedItem = response.data || {};

      setDraftRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                quantity:
                  updatedItem.quantity !== undefined &&
                  updatedItem.quantity !== null
                    ? updatedItem.quantity
                    : isEditActiveMode
                      ? row.quantity
                      : String(editingQuantity),
                expected_delivery_date:
                  updatedItem.expected_delivery_date ||
                  editingExpectedDate.format('YYYY-MM-DD'),
              }
            : row,
        ),
      );

      setEditingRowId(null);
      setEditingQuantity(null);
      setEditingExpectedDate(null);

      message.success('Рядок оновлено.');
    } catch (err) {
      console.error('Failed to update tolling order item:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'quantity',
        'expected_delivery_date',
      ]);

      message.error(backendMessage || 'Не вдалося оновити рядок.');
    } finally {
      setSavingRow(false);
    }
  };

  const step3Columns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва компонента',
      dataIndex: 'item_name',
      key: 'item_name',
      render: (value) => value || '—',
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 170,
      render: (_, record) => {
        if (editingRowId === record.id && !(isEditMode && isActive)) {
          return (
            <InputNumber
              min={0.001}
              step={0.001}
              precision={3}
              style={{ width: 120 }}
              value={editingQuantity}
              onChange={setEditingQuantity}
            />
          );
        }

        return `${formatQuantity(record.quantity)} ${
          record.unit_symbol || record.inv_item_unit_symbol || ''
        }`;
      },
    },
    {
      title: 'Поставка',
      key: 'expected_delivery_date',
      width: 180,
      render: (_, record) => {
        if (editingRowId === record.id) {
          return (
            <DatePicker
              format="DD-MM-YYYY"
              value={editingExpectedDate}
              onChange={setEditingExpectedDate}
            />
          );
        }

        return formatDateDisplay(record.expected_delivery_date);
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size={10}>
          {editingRowId === record.id ? (
            <SaveOutlined
              style={{
                color: '#52c41a',
                cursor: savingRow ? 'default' : 'pointer',
                fontSize: 16,
                opacity: savingRow ? 0.55 : 1,
              }}
              onClick={() => {
                if (!savingRow) {
                  void handleSaveRow(record.id);
                }
              }}
            />
          ) : (
            <EditOutlined
              style={{
                color: '#1677ff',
                cursor: savingRow ? 'default' : 'pointer',
                fontSize: 16,
                opacity: savingRow ? 0.55 : 1,
              }}
              onClick={() => {
                if (!savingRow) {
                  handleStartEditRow(record);
                }
              }}
            />
          )}

          <DeleteOutlined
            style={{
              color: '#ff4d4f',
              cursor:
                isEditMode && isActive
                  ? 'not-allowed'
                  : savingRow
                    ? 'default'
                    : 'pointer',
              fontSize: 16,
              opacity: isEditMode && isActive ? 0.4 : savingRow ? 0.55 : 1,
            }}
            onClick={() => {
              if (!savingRow && !(isEditMode && isActive)) {
                void handleDeleteRow(record.id);
              }
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title={isEditMode ? 'Редагувати передачу' : 'Створити нову передачу'}
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseAttempt}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        {!isEditMode && (
          <Card
            title="1. Оберіть організацію"
            styles={{
              body: {
                opacity: step1Locked ? 0.7 : 1,
                pointerEvents: step1Locked ? 'none' : 'auto',
              },
            }}
          >
            <Flex vertical gap={14}>
              <div>
                <Text style={compactLabelStyle}>Організація</Text>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Почніть вводити назву організації"
                  style={{ width: '100%' }}
                  value={organizationDraftId}
                  options={organizationOptions}
                  onChange={(value) => {
                    setOrganizationDraftId(value ?? null);
                    setStep1Error('');
                  }}
                  disabled={step1Locked}
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
                  <div style={{ flex: '1 1 260px' }}>
                    <InfoCell
                      label="Повна назва організації"
                      value={selectedOrganizationDraft?.legalName}
                      compact
                    />
                  </div>

                  <div style={{ flex: '1 1 220px' }}>
                    <InfoCell
                      label="Тип організації"
                      value={
                        selectedOrganizationDraft?.type
                          ? ORGANIZATION_TYPE_LABELS[
                              selectedOrganizationDraft.type
                            ]
                          : '—'
                      }
                      compact
                    />
                  </div>
                </Flex>
              </div>

              {step1Error && (
                <Alert type="error" showIcon message={step1Error} />
              )}

              <Flex justify="flex-end">
                <Button
                  type="primary"
                  onClick={() => {
                    void handleCreateOrder();
                  }}
                  disabled={!organizationDraftId || step1Locked}
                  loading={creatingOrder}
                >
                  Створити накладну
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        <Card
          title={
            isEditMode
              ? '1. Оберіть номенклатурну позицію'
              : '2. Оберіть номенклатурну позицію'
          }
          styles={{
            body: {
              opacity: step2Enabled && !step2DisabledInActive ? 1 : 0.65,
              pointerEvents:
                step2Enabled && !step2DisabledInActive ? 'auto' : 'none',
            },
          }}
        >
          <Flex vertical gap={14}>
            {!step2Enabled && (
              <Alert
                type="info"
                showIcon
                message="Спочатку створіть накладну"
                description="Наступний крок стане доступним після створення накладної на кроці 1."
              />
            )}

            {isEditMode && isActive && (
              <Alert
                type="warning"
                showIcon
                message="Додавання нових рядків недоступне"
                description="Передача вже в роботі. Додавання нових позицій заборонено."
              />
            )}

            <div>
              <Text style={compactLabelStyle}>Номенклатурна позиція</Text>
              <Select
                showSearch
                filterOption={false}
                optionFilterProp="label"
                placeholder="Почніть вводити назву або артикул"
                style={{ width: '100%' }}
                value={selectedInvItemId}
                loading={inventoryLoading}
                onSearch={loadInventoryOptions}
                onChange={(value) => {
                  setSelectedInvItemId(value ?? null);
                  setStep2Error('');
                }}
                options={availableInventoryOptions.map((item) => ({
                  value: item.id,
                  label: `${item.name || '—'}${
                    item.internal_code ? ` — ${item.internal_code}` : ''
                  }`,
                }))}
                disabled={!step2Enabled || savingRow}
              />
            </div>

            <Flex gap={16} wrap>
              <div style={{ flex: '1 1 220px' }}>
                <Text style={compactLabelStyle}>Кількість</Text>
                <InputNumber
                  min={0.001}
                  step={0.001}
                  precision={3}
                  placeholder="Вкажіть кількість"
                  style={{ width: '100%' }}
                  value={selectedQuantity}
                  onChange={(value) => {
                    setSelectedQuantity(value);
                    setStep2Error('');
                  }}
                  disabled={!step2Enabled || savingRow}
                />
              </div>

              <div style={{ flex: '1 1 220px' }}>
                <Text style={compactLabelStyle}>Дата очікуваної поставки</Text>
                <DatePicker
                  format="DD-MM-YYYY"
                  placeholder="Оберіть дату"
                  style={{ width: '100%' }}
                  value={selectedExpectedDate}
                  onChange={(value) => {
                    setSelectedExpectedDate(value);
                    setStep2Error('');
                  }}
                  disabled={!step2Enabled || savingRow}
                />
              </div>
            </Flex>

            <div
              style={{
                padding: '10px 12px',
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              <Flex vertical gap={10}>
                <Flex wrap gap={16} align="flex-start">
                  <div style={{ flex: '1 1 180px' }}>
                    <InfoCell
                      label="Артікул"
                      value={selectedInventoryItem?.internal_code}
                      compact
                    />
                  </div>

                  <div style={{ flex: '1 1 220px' }}>
                    <InfoCell
                      label="Категорія"
                      value={selectedInventoryItem?.category_name}
                      compact
                    />
                  </div>

                  <div style={{ flex: '0 1 120px' }}>
                    <InfoCell
                      label="Од.вим."
                      value={selectedInventoryItem?.unit_symbol}
                      compact
                    />
                  </div>
                </Flex>

                <Divider style={{ margin: 0 }} />

                <div>
                  <InfoCell
                    label="Опис"
                    value={selectedInventoryItem?.description}
                    compact
                  />
                </div>
              </Flex>
            </div>

            {step2Error && <Alert type="error" showIcon message={step2Error} />}

            <Flex justify="flex-end">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  void handleAddRow();
                }}
                disabled={!canAddRow || step2DisabledInActive}
                loading={savingRow}
              >
                Додати рядок
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card title={isEditMode ? '2. Склад передачі' : '3. Склад передачі'}>
          <Table
            rowKey="id"
            columns={step3Columns}
            dataSource={draftRows}
            pagination={false}
            size="small"
            locale={{
              emptyText: 'Немає доданих рядків.',
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

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleCloseAttempt}>Закрити</Button>

          {!isEditMode && (
            <Button
              type="primary"
              loading={finalizing}
              disabled={submitButtonDisabled}
              onClick={async () => {
                if (!createdOrderId) {
                  return;
                }

                try {
                  setFinalizing(true);
                  resetAll();

                  if (onCompleted) {
                    await onCompleted();
                  }

                  onClose();
                  navigate(`/orders/tolling/${createdOrderId}`);
                } finally {
                  setFinalizing(false);
                }
              }}
            >
              Оформити передачу
            </Button>
          )}
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderTollingCreateDrawer;
