import { useEffect, useMemo, useState } from 'react';
import {
  CopyOutlined,
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
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
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

const SUGGESTED_DOCUMENT_NO = '22042026_12';

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
}) {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const [organizationDraftId, setOrganizationDraftId] = useState(null);
  const [confirmedOrganizationId, setConfirmedOrganizationId] = useState(null);

  const [documentNoDraft, setDocumentNoDraft] = useState('');
  const [confirmedDocumentNo, setConfirmedDocumentNo] = useState('');

  const [selectedInvItemId, setSelectedInvItemId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(null);
  const [selectedExpectedDate, setSelectedExpectedDate] = useState(null);

  const [draftRows, setDraftRows] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [editingExpectedDate, setEditingExpectedDate] = useState(null);

  const [saving, setSaving] = useState(false);

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

  const step2Enabled =
    Boolean(confirmedOrganizationId) && Boolean(confirmedDocumentNo);

  const step1HasDraftChanges =
    confirmedOrganizationId !== null &&
    (organizationDraftId !== confirmedOrganizationId ||
      documentNoDraft !== confirmedDocumentNo);

  const canAddRow =
    step2Enabled &&
    Boolean(selectedInvItemId) &&
    selectedQuantity !== null &&
    selectedQuantity !== undefined &&
    Number(selectedQuantity) > 0 &&
    Boolean(selectedExpectedDate);

  const submitButtonDisabled = draftRows.length === 0 || saving;

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
    form.resetFields();
    setOrganizationDraftId(null);
    setConfirmedOrganizationId(null);
    setDocumentNoDraft('');
    setConfirmedDocumentNo('');
    setSelectedInvItemId(null);
    setSelectedQuantity(null);
    setSelectedExpectedDate(null);
    setDraftRows([]);
    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingExpectedDate(null);
    setSaving(false);
    setStep1Error('');
    setStep2Error('');
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    form.resetFields();
    setOrganizationDraftId(null);
    setConfirmedOrganizationId(null);
    setDocumentNoDraft('');
    setConfirmedDocumentNo('');
    setSelectedInvItemId(null);
    setSelectedQuantity(null);
    setSelectedExpectedDate(null);
    setDraftRows([]);
    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingExpectedDate(null);
    setSaving(false);
    setStep1Error('');
    setStep2Error('');
  }, [open, form]);

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

  const handleCloseDrawer = () => {
    resetAll();
    onClose();
  };

  const handleConfirmOrganization = () => {
    if (!organizationDraftId) {
      setStep1Error('Оберіть організацію.');
      return;
    }

    if (!documentNoDraft?.trim()) {
      setStep1Error('Вкажіть номер документа.');
      return;
    }

    setStep1Error('');

    const nextConfirmedOrganizationId = organizationDraftId;
    const nextConfirmedDocumentNo = documentNoDraft.trim();

    const step1ActuallyChanged =
      confirmedOrganizationId !== nextConfirmedOrganizationId ||
      confirmedDocumentNo !== nextConfirmedDocumentNo;

    setConfirmedOrganizationId(nextConfirmedOrganizationId);
    setConfirmedDocumentNo(nextConfirmedDocumentNo);

    if (step1ActuallyChanged) {
      resetStep2AndBelow();
    }
  };

  const handleCancelStep1Changes = () => {
    setOrganizationDraftId(confirmedOrganizationId);
    setDocumentNoDraft(confirmedDocumentNo);
    setStep1Error('');
  };

  const handleInsertSuggestedDocumentNo = () => {
    setDocumentNoDraft(SUGGESTED_DOCUMENT_NO);
    form.setFieldValue('document_no', SUGGESTED_DOCUMENT_NO);
  };

  const handleAddRow = () => {
    if (!canAddRow || !selectedInventoryItem) {
      return;
    }

    const nextRow = {
      id: `${selectedInventoryItem.id}-${Date.now()}`,
      inv_item_id: selectedInventoryItem.id,
      item_name: selectedInventoryItem.name || '—',
      internal_code: selectedInventoryItem.internal_code || '',
      category_name: selectedInventoryItem.category_name || '',
      unit_symbol: selectedInventoryItem.unit_symbol || '',
      description: selectedInventoryItem.description || '',
      quantity: Number(selectedQuantity),
      expected_delivery_date: selectedExpectedDate.format('YYYY-MM-DD'),
    };

    setDraftRows((prev) => [...prev, nextRow]);
    setSelectedInvItemId(null);
    setSelectedQuantity(null);
    setSelectedExpectedDate(null);
    setStep2Error('');
  };

  const handleDeleteRow = (rowId) => {
    setDraftRows((prev) => prev.filter((item) => item.id !== rowId));

    if (editingRowId === rowId) {
      setEditingRowId(null);
      setEditingQuantity(null);
      setEditingExpectedDate(null);
    }
  };

  const handleStartEditRow = (row) => {
    setEditingRowId(row.id);
    setEditingQuantity(
      row.quantity !== null && row.quantity !== undefined
        ? Number(row.quantity)
        : null,
    );
    setEditingExpectedDate(
      row.expected_delivery_date
        ? dayjs(row.expected_delivery_date, 'YYYY-MM-DD')
        : null,
    );
  };

  const handleSaveRow = (rowId) => {
    if (
      editingQuantity === null ||
      editingQuantity === undefined ||
      Number(editingQuantity) <= 0
    ) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    if (!editingExpectedDate) {
      message.error('Оберіть дату поставки.');
      return;
    }

    setDraftRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              quantity: Number(editingQuantity),
              expected_delivery_date: editingExpectedDate.format('YYYY-MM-DD'),
            }
          : row,
      ),
    );

    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingExpectedDate(null);
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
        if (editingRowId === record.id) {
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

        return `${formatQuantity(record.quantity)} ${record.unit_symbol || ''}`;
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
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={() => handleSaveRow(record.id)}
            />
          ) : (
            <EditOutlined
              style={{
                color: '#1677ff',
                cursor: 'pointer',
                fontSize: 16,
              }}
              onClick={() => handleStartEditRow(record)}
            />
          )}

          <DeleteOutlined
            style={{
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: 16,
            }}
            onClick={() => handleDeleteRow(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title="Створити нову передачу"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Flex vertical gap={16}>
        <Card title="1. Оберіть організацію">
          <Flex vertical gap={14}>
            <Flex gap={16} wrap>
              <div style={{ flex: '1 1 320px' }}>
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
                />
              </div>

              <div style={{ flex: '0 1 260px' }}>
                <Text style={compactLabelStyle}>Номер документа</Text>
                <Input
                  placeholder="Номер документа"
                  value={documentNoDraft}
                  onChange={(e) => {
                    setDocumentNoDraft(e.target.value);
                    setStep1Error('');
                  }}
                  addonAfter={
                    <span
                      style={{
                        color: '#1677ff',
                        cursor: 'pointer',
                      }}
                      onClick={handleInsertSuggestedDocumentNo}
                    >
                      <CopyOutlined />
                    </span>
                  }
                />
                <div style={{ marginTop: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Наприклад DDMMYYYY_X
                  </Text>
                </div>
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

            {step1HasDraftChanges && draftRows.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message="Зміна організації або номера документа очистить склад передачі"
                description="Якщо підтвердити зміни, усі додані рядки будуть скинуті."
              />
            )}

            {step1Error && <Alert type="error" showIcon message={step1Error} />}

            <Flex justify="flex-end" gap={8}>
              {step1HasDraftChanges && (
                <Button onClick={handleCancelStep1Changes}>Відміна</Button>
              )}

              <Button
                type="primary"
                onClick={handleConfirmOrganization}
                disabled={!organizationDraftId || !documentNoDraft?.trim()}
              >
                Обрати організацію
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card
          title="2. Оберіть номенклатурну позицію"
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
                message="Спочатку підтвердьте організацію та номер документа"
                description="Наступний крок стане доступним після підтвердження даних на кроці 1."
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
                  label: `${item.name || '—'}${item.internal_code ? ` — ${item.internal_code}` : ''}`,
                }))}
                disabled={!step2Enabled}
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
                  disabled={!step2Enabled}
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
                  disabled={!step2Enabled}
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
                onClick={handleAddRow}
                disabled={!canAddRow}
              >
                Додати рядок
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card title="3. Склад передачі">
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
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Button
            type="primary"
            loading={saving}
            disabled={submitButtonDisabled}
            onClick={async () => {
              try {
                setSaving(true);
                handleCloseDrawer();

                if (onCompleted) {
                  await onCompleted();
                }

                navigate('/orders/tolling');
              } finally {
                setSaving(false);
              }
            }}
          >
            Оформити передачу
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderTollingCreateDrawer;
