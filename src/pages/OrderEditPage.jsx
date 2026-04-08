import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  LinkOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  InputNumber,
  Progress,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const formatDateUa = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatDateDisplay = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getProgressStrokeColor = (percent, isOverdue = false) => {
  if (isOverdue) return '#ff4d4f';

  if (percent === 0) return '#bfbfbf';
  if (percent <= 24) return '#d9f7be';
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a';
};

function OrderEditPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingExpectedDeliveryDate, setEditingExpectedDeliveryDate] =
    useState(null);

  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [creatingVendorItemId, setCreatingVendorItemId] = useState(null);
  const [creatingQuantity, setCreatingQuantity] = useState(null);
  const [creatingPrice, setCreatingPrice] = useState(null);
  const [creatingExpectedDeliveryDate, setCreatingExpectedDeliveryDate] =
    useState(null);
  const [creatingRowSaving, setCreatingRowSaving] = useState(false);

  const [vendorItemOptions, setVendorItemOptions] = useState([]);
  const [creatingSelectedVendorItem, setCreatingSelectedVendorItem] =
    useState(null);

  const [lastUsedExpectedDeliveryDate, setLastUsedExpectedDeliveryDate] =
    useState(null);

  useEffect(() => {
    loadOrderPage();
  }, [id]);

  const loadOrderPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`orders/${id}/`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to load order edit page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const summaryColumns = [
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      align: 'center',
      width: '28%',
      render: (value, record) => (
        <Tag color={getStatusTagColor(record.status)}>{value || '—'}</Tag>
      ),
    },
    {
      title: 'Оплата',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      align: 'center',
      width: '36%',
      render: (value) => {
        const percent = Number(value) || 0;

        return (
          <div style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={getProgressStrokeColor(percent)}
            />
          </div>
        );
      },
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      align: 'center',
      width: '36%',
      render: (value, record) => {
        const percent = Number(value) || 0;
        const isOverdue = Boolean(record.is_receipt_overdue);

        const progress = (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(percent, isOverdue)}
          />
        );

        let tooltipText = null;

        if (isOverdue) {
          tooltipText = `Прострочено на ${record.receipt_overdue_days} дн.`;
        } else {
          tooltipText = `Очікується за ${record.receipt_expected_days} дн.`;
        }

        return (
          <Tooltip title={tooltipText}>
            <div style={{ width: '100%' }}>{progress}</div>
          </Tooltip>
        );
      },
    },
  ];

  const isDraft = order?.status === 'draft';
  const isInProgress = order?.status === 'in_progress';
  const canAddOrderItems = isDraft;
  const canDeleteOrderItems = isDraft;
  const canEditOrderItems = isDraft || isInProgress;

  const handleStartCreateRow = () => {
    setIsCreatingRow(true);
    setCreatingVendorItemId(null);
    setCreatingQuantity(null);
    setCreatingPrice(null);
    setCreatingExpectedDeliveryDate(lastUsedExpectedDeliveryDate);
  };

  const handleSearchVendorItems = async (searchValue) => {
    const query = searchValue?.trim();

    if (!query || query.length < 2 || !order?.vendor) {
      setVendorItemOptions([]);
      return;
    }

    try {
      const response = await api.get(
        `vendor-items/?vendor=${order.vendor}&search=${encodeURIComponent(query)}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      // исключаем уже добавленные товары
      const existingIds = new Set(
        (order.items || []).map((item) => item.vendor_item),
      );

      const filtered = results.filter((item) => !existingIds.has(item.id));

      setVendorItemOptions(
        filtered.map((item) => ({
          value: item.id,
          label: item.name,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to search vendor items:', err);
      setVendorItemOptions([]);
    }
  };

  const handleCancelCreateRow = () => {
    setIsCreatingRow(false);
    setCreatingVendorItemId(null);
    setCreatingQuantity(null);
    setCreatingPrice(null);
    setCreatingExpectedDeliveryDate(null);
    setVendorItemOptions([]);
    setCreatingSelectedVendorItem(null);
  };

  const handleSaveCreateRow = async () => {
    if (!creatingVendorItemId) {
      message.error('Оберіть товар');
      return;
    }

    if (
      creatingQuantity === null ||
      creatingQuantity === undefined ||
      Number(creatingQuantity) <= 0
    ) {
      message.error('Кількість має бути більше 0');
      return;
    }

    if (
      creatingPrice === null ||
      creatingPrice === undefined ||
      Number(creatingPrice) <= 0
    ) {
      message.error('Ціна має бути більше 0');
      return;
    }

    if (!creatingExpectedDeliveryDate) {
      message.error('Вкажіть дату поставки');
      return;
    }

    try {
      setCreatingRowSaving(true);

      await api.post('order-items/', {
        order: Number(id),
        vendor_item: creatingVendorItemId,
        quantity: creatingQuantity,
        agreed_price: creatingPrice,
        expected_delivery_date: creatingExpectedDeliveryDate,
      });

      message.success('Товар додано до замовлення');

      setLastUsedExpectedDeliveryDate(creatingExpectedDeliveryDate);
      handleCancelCreateRow();
      loadOrderPage();
    } catch (err) {
      console.error('Failed to create order item:', err);
      message.error('Не вдалося додати товар');
    } finally {
      setCreatingRowSaving(false);
    }
  };

  const handleStartEditRow = (record) => {
    setEditingRowId(record.id);

    if (isDraft) {
      setEditingQuantity(record.quantity ? Number(record.quantity) : null);
      setEditingPrice(record.agreed_price ? Number(record.agreed_price) : null);
    }

    setEditingExpectedDeliveryDate(record.expected_delivery_date || null);
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
    setEditingQuantity(null);
    setEditingPrice(null);
    setEditingExpectedDeliveryDate(null);
  };

  const orderItemsColumns = [
    {
      title: '',
      key: 'edit',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (!canEditOrderItems) {
          return null;
        }

        if (record.id === 'new-row') {
          return (
            <SaveOutlined
              style={{
                color: creatingRowSaving ? '#bfbfbf' : '#52c41a',
                cursor: creatingRowSaving ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!creatingRowSaving) {
                  handleSaveCreateRow();
                }
              }}
            />
          );
        }

        return editingRowId === record.id ? (
          <SaveOutlined
            style={{
              color: '#52c41a',
              cursor: 'pointer',
            }}
          />
        ) : (
          <EditOutlined
            style={{ color: '#8c8c8c', cursor: 'pointer' }}
            onClick={() => handleStartEditRow(record)}
          />
        );
      },
    },
    {
      title: 'Товар',
      key: 'vendor_item',
      width: '52%',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Select
              showSearch
              placeholder="Оберіть товар"
              value={creatingVendorItemId}
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              filterOption={false}
              onSearch={handleSearchVendorItems}
              onChange={(value, option) => {
                setCreatingVendorItemId(value);
                setCreatingSelectedVendorItem(option?.item || null);

                setCreatingQuantity(null);
                setCreatingPrice(null);
                setCreatingExpectedDeliveryDate(lastUsedExpectedDeliveryDate);
              }}
              options={vendorItemOptions}
            />
          );
        }

        return (
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={record.vendor_item_name || '—'}
          >
            {record.vendor_item_name || '—'}
          </div>
        );
      },
    },
    {
      title: 'Кількість',
      key: 'quantity',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return isDraft ? (
            <InputNumber
              min={0}
              value={creatingQuantity}
              onChange={(val) => setCreatingQuantity(val)}
              style={{ width: 110 }}
            />
          ) : (
            '—'
          );
        }

        if (editingRowId === record.id && isDraft) {
          return (
            <InputNumber
              min={0}
              value={editingQuantity}
              onChange={(val) => setEditingQuantity(val)}
              style={{ width: 110 }}
            />
          );
        }

        return record.quantity ?? '—';
      },
    },
    {
      title: 'Ціна за одиницю',
      key: 'agreed_price',
      width: 160,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return isDraft ? (
            <InputNumber
              min={0}
              value={creatingPrice}
              onChange={(val) => setCreatingPrice(val)}
              style={{ width: 120 }}
            />
          ) : (
            '—'
          );
        }

        if (editingRowId === record.id && isDraft) {
          return (
            <InputNumber
              min={0}
              value={editingPrice}
              onChange={(val) => setEditingPrice(val)}
              style={{ width: 120 }}
            />
          );
        }

        return record.agreed_price ?? '—';
      },
    },
    {
      title: 'Дата поставки',
      key: 'expected_delivery_date',
      width: 190,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return canEditOrderItems ? (
            <DatePicker
              format="DD-MM-YYYY"
              value={
                creatingExpectedDeliveryDate
                  ? dayjs(creatingExpectedDeliveryDate)
                  : null
              }
              onChange={(value) =>
                setCreatingExpectedDeliveryDate(
                  value ? value.format('YYYY-MM-DD') : null,
                )
              }
              suffixIcon={<CalendarOutlined />}
              style={{ width: 150 }}
            />
          ) : (
            '—'
          );
        }

        if (editingRowId === record.id) {
          return (
            <DatePicker
              format="DD-MM-YYYY"
              value={
                editingExpectedDeliveryDate
                  ? dayjs(editingExpectedDeliveryDate)
                  : null
              }
              onChange={(value) =>
                setEditingExpectedDeliveryDate(
                  value ? value.format('YYYY-MM-DD') : null,
                )
              }
              suffixIcon={<CalendarOutlined />}
              style={{ width: 150 }}
            />
          );
        }

        return formatDateDisplay(record.expected_delivery_date);
      },
    },
    {
      title: '',
      key: 'delete',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (!canDeleteOrderItems) {
          return null;
        }

        if (record.id === 'new-row') {
          return (
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={handleCancelCreateRow}
            />
          );
        }

        if (editingRowId === record.id) {
          return (
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={handleCancelEditRow}
            />
          );
        }

        return (
          <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Замовлення не знайдено." showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex align="center" gap={12} wrap>
          <Title level={2} style={{ margin: 0 }}>
            {`Редагування замовлення № ${order.order_no} від ${formatDateUa(
              order.created_at,
            )}`}
          </Title>

          <Tag
            color={isDraft ? undefined : getStatusTagColor(order.status)}
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              ...(isDraft
                ? {
                    border: '1px solid #d9d9d9',
                    background: '#fafafa',
                    color: '#595959',
                  }
                : {}),
            }}
          >
            {order.status_name || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Файли" style={{ marginBottom: 20 }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <Text type="secondary">Дані з’являться пізніше</Text>
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              <Button block>Перейти до оплати</Button>
              <Button block>Перейти до замовлення</Button>
              <Button block>Перейти до історії</Button>
            </Flex>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <Text
                type="secondary"
                style={{ display: 'block', marginBottom: 6, fontSize: 12 }}
              >
                Назва постачальника
              </Text>

              <Flex align="center" gap={8}>
                <Title level={4} style={{ margin: 0 }}>
                  {order.vendor_name || '—'}
                </Title>

                {order.vendor && (
                  <Link
                    to={`/orders/vendors/${order.vendor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LinkOutlined
                      style={{
                        color: '#8c8c8c',
                        fontSize: 16,
                        cursor: 'pointer',
                      }}
                    />
                  </Link>
                )}
              </Flex>
            </div>

            <Table
              columns={summaryColumns}
              dataSource={[order]}
              rowKey="id"
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>

          <Card title="Оплата" style={{ marginBottom: 20 }}>
            <Text type="secondary">No data</Text>
          </Card>

          <Card title="Замовлення">
            <Table
              rowKey="id"
              columns={orderItemsColumns}
              dataSource={[
                ...(Array.isArray(order.items) ? order.items : []),
                ...(isCreatingRow ? [{ id: 'new-row' }] : []),
              ]}
              pagination={false}
              size="small"
              tableLayout="fixed"
              className="order-items-table"
            />

            {canAddOrderItems && (
              <div style={{ marginTop: 16 }}>
                <Flex
                  align="center"
                  gap={8}
                  style={{
                    color: isCreatingRow ? '#bfbfbf' : '#595959',
                    cursor: isCreatingRow ? 'default' : 'pointer',
                    width: 'fit-content',
                  }}
                  onClick={() => {
                    if (!isCreatingRow) {
                      handleStartCreateRow();
                    }
                  }}
                >
                  <FileAddOutlined />
                  <Text
                    style={{ color: isCreatingRow ? '#bfbfbf' : '#595959' }}
                  >
                    Додати товар
                  </Text>
                </Flex>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Історія змін з’явиться пізніше</Text>
          </Card>
        </Col>
      </Row>
      <style>
        {`
          .order-items-table .ant-select-selector {
            overflow: hidden;
          }

          .order-items-table .ant-select-selection-item {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        `}
      </style>
    </div>
  );
}

export default OrderEditPage;
