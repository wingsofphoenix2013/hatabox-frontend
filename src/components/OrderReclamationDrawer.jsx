import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { CloseOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Select,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateUa } from '../utils/orderFormatters';

const { Text } = Typography;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

const RECLAMATION_REASON_OPTIONS = [
  {
    value: 'defective_product',
    label: 'Браковане майно / неналежна якість',
  },
  {
    value: 'procurement_error',
    label: 'Помилка замовлення',
  },
];

function OrderReclamationDrawer({ open, onClose, order, onOrderUpdated }) {
  const navigate = useNavigate();

  const [availabilityItems, setAvailabilityItems] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [reason, setReason] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedOrderItemIds = useMemo(() => {
    return new Set(cartItems.map((item) => item.order_item_id));
  }, [cartItems]);

  const availableOptions = useMemo(() => {
    return availabilityItems
      .filter((item) => !selectedOrderItemIds.has(item.order_item_id))
      .map((item) => ({
        value: item.order_item_id,
        label: item.vendor_item_name || item.inventory_item_name || '—',
      }));
  }, [availabilityItems, selectedOrderItemIds]);

  const selectedAvailabilityItem = useMemo(() => {
    return (
      availabilityItems.find(
        (item) => item.order_item_id === selectedOrderItemId,
      ) || null
    );
  }, [availabilityItems, selectedOrderItemId]);

  const canSubmit = cartItems.length > 0 && reason;

  const resetDrawer = () => {
    setAvailabilityItems([]);
    setAvailabilityLoading(false);
    setSelectedOrderItemId(null);
    setCartItems([]);
    setReason(null);
    setComment('');
    setSaving(false);
  };

  const handleCloseDrawer = () => {
    resetDrawer();
    onClose();
  };

  const loadAvailability = async () => {
    if (!order?.id) {
      setAvailabilityItems([]);
      return;
    }

    try {
      setAvailabilityLoading(true);

      const response = await api.get(
        `reclamation-return-documents/availability/?order=${order.id}`,
      );

      setAvailabilityItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load reclamation availability:', err);
      setAvailabilityItems([]);
      message.error('Не вдалося завантажити товари для повернення.');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  const handleAddToCart = () => {
    if (!selectedAvailabilityItem) {
      message.error('Оберіть товар для повернення.');
      return;
    }

    const availableQuantity = Number(
      selectedAvailabilityItem.available_quantity,
    );

    if (!availableQuantity || availableQuantity <= 0) {
      message.error('Для цієї позиції немає доступної кількості.');
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        ...selectedAvailabilityItem,
        return_quantity: null,
      },
    ]);

    setSelectedOrderItemId(null);
  };

  const handleResetSelectedItem = () => {
    setSelectedOrderItemId(null);
  };

  const handleChangeReturnQuantity = (orderItemId, value) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.order_item_id === orderItemId
          ? {
              ...item,
              return_quantity: value,
            }
          : item,
      ),
    );
  };

  const handleDeleteCartItem = (orderItemId) => {
    setCartItems((prev) =>
      prev.filter((item) => item.order_item_id !== orderItemId),
    );
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      message.error('Оберіть товари для повернення.');
      return;
    }

    if (!reason) {
      message.error('Оберіть причину повернення.');
      return;
    }

    const invalidItem = cartItems.find((item) => {
      const quantity = Number(item.return_quantity);
      const availableQuantity = Number(item.available_quantity);

      return !quantity || quantity <= 0 || quantity > availableQuantity;
    });

    if (invalidItem) {
      message.error('Перевірте кількість товарів для повернення.');
      return;
    }

    try {
      setSaving(true);

      await api.post('reclamation-return-documents/create-from-cart/', {
        order: Number(order.id),
        return_date: dayjs().format('YYYY-MM-DD'),
        reason,
        comment,
        items: cartItems.map((item) => ({
          order_item: item.order_item_id,
          quantity: String(item.return_quantity),
        })),
      });

      message.success('Повернення оформлено.');

      if (onOrderUpdated) {
        await onOrderUpdated();
      }

      handleCloseDrawer();

      navigate(`/orders/${order.id}/reclamation`, {
        state: {
          orderLabel: `№ ${order.order_no} від ${formatDateUa(order.created_at)}`,
        },
      });
    } catch (err) {
      console.error('Failed to create reclamation return:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'order',
        'return_date',
        'reason',
        'comment',
        'items',
      ]);

      message.error(backendMessage || 'Не вдалося оформити повернення.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва компоненту',
      key: 'vendor_item_name',
      render: (_, record) =>
        record.vendor_item_name || record.inventory_item_name || '—',
    },
    {
      title: 'Доступно',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      width: 130,
      align: 'center',
      render: (value) => formatQuantity(value),
    },
    {
      title: 'Повернути',
      key: 'return_quantity',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <InputNumber
          min={0.001}
          max={Number(record.available_quantity) || 0}
          step={0.001}
          controls={false}
          value={record.return_quantity}
          onChange={(value) =>
            handleChangeReturnQuantity(record.order_item_id, value)
          }
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <DeleteOutlined
          style={{ color: '#ff4d4f', cursor: 'pointer' }}
          onClick={() => handleDeleteCartItem(record.order_item_id)}
        />
      ),
    },
  ];

  return (
    <Drawer
      title="Оформлення повернення"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Оберіть товари">
          <Flex align="flex-end" gap={8}>
            <div style={{ flex: 1 }}>
              <Text style={compactLabelStyle}>
                Оберіть товари для повернення
              </Text>

              <Select
                showSearch
                placeholder="Оберіть товар"
                style={{ width: '100%' }}
                value={selectedOrderItemId}
                options={availableOptions}
                loading={availabilityLoading}
                optionFilterProp="label"
                onChange={setSelectedOrderItemId}
              />
            </div>

            <SaveOutlined
              style={{
                color: selectedOrderItemId ? '#52c41a' : '#d9d9d9',
                fontSize: 18,
                cursor: selectedOrderItemId ? 'pointer' : 'default',
                marginBottom: 8,
              }}
              onClick={() => {
                if (selectedOrderItemId) {
                  handleAddToCart();
                }
              }}
            />

            <CloseOutlined
              style={{
                color: selectedOrderItemId ? '#8c8c8c' : '#d9d9d9',
                fontSize: 18,
                cursor: selectedOrderItemId ? 'pointer' : 'default',
                marginBottom: 8,
              }}
              onClick={() => {
                if (selectedOrderItemId) {
                  handleResetSelectedItem();
                }
              }}
            />
          </Flex>
        </Card>

        <Card title="2. Оберіть кількість">
          {cartItems.length === 0 ? (
            <Text type="secondary">Спочатку оберіть товар для повернення.</Text>
          ) : (
            <Table
              rowKey="order_item_id"
              columns={columns}
              dataSource={cartItems}
              pagination={false}
              size="small"
            />
          )}
        </Card>

        <Card title="3. Вкажіть деталі">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>
                З якої причини оформлюється повернення
              </Text>

              <Select
                placeholder="Оберіть причину"
                style={{ width: '100%' }}
                value={reason}
                options={RECLAMATION_REASON_OPTIONS}
                onChange={setReason}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Додайте коментар</Text>

              <Input.TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </Flex>
        </Card>

        <Flex justify="space-between" gap={8}>
          <Button onClick={handleCloseDrawer}>Закрити</Button>

          <Tooltip
            title={
              canSubmit
                ? ''
                : 'Оберіть товари для повернення та вкажіть причину.'
            }
          >
            <Button
              type="primary"
              disabled={!canSubmit}
              loading={saving}
              onClick={handleSubmit}
            >
              Оформити повернення
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default OrderReclamationDrawer;
