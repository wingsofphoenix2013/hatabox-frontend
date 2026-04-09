import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Flex,
  InputNumber,
  message,
  Popconfirm,
  Progress,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

/* ================= helpers ================= */

const formatDateUa = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}/${d.getFullYear()}`;
};

const formatDateDisplay = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}-${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}-${d.getFullYear()}`;
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

/* ================= component ================= */

function OrderEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* editing */
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [editingDate, setEditingDate] = useState(null);

  /* creating */
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [creatingVendorItemId, setCreatingVendorItemId] = useState(null);
  const [creatingQuantity, setCreatingQuantity] = useState(null);
  const [creatingPrice, setCreatingPrice] = useState(null);
  const [creatingDate, setCreatingDate] = useState(null);

  const [vendorItemOptions, setVendorItemOptions] = useState([]);

  const [lastUsedDate, setLastUsedDate] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`orders/${id}/`);
      setOrder(res.data);
    } catch (e) {
      setError('Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  };

  /* ================= create ================= */

  const handleStartCreate = () => {
    setIsCreatingRow(true);
    setCreatingVendorItemId(null);
    setCreatingQuantity(null);
    setCreatingPrice(null);
    setCreatingDate(lastUsedDate);
  };

  const handleSaveCreate = async () => {
    if (!creatingVendorItemId) {
      message.error('Оберіть товар');
      return;
    }

    if (!creatingQuantity || creatingQuantity <= 0) {
      message.error('Кількість має бути > 0');
      return;
    }

    if (!creatingPrice || creatingPrice <= 0) {
      message.error('Вкажіть ціну');
      return;
    }

    try {
      await api.post('order-items/', {
        order: Number(id),
        vendor_item: creatingVendorItemId,
        quantity: creatingQuantity,
        agreed_price: creatingPrice,
        expected_delivery_date: creatingDate,
      });

      setLastUsedDate(creatingDate);
      setIsCreatingRow(false);
      load();
    } catch {
      message.error('Не вдалося створити позицію');
    }
  };

  /* ================= edit ================= */

  const handleStartEdit = (r) => {
    setEditingRowId(r.id);
    setEditingQuantity(Number(r.quantity));
    setEditingPrice(Number(r.agreed_price));
    setEditingDate(r.expected_delivery_date);
  };

  const handleSaveEdit = async (r) => {
    try {
      await api.patch(`order-items/${r.id}/`, {
        quantity: editingQuantity,
        agreed_price: editingPrice,
        expected_delivery_date: editingDate,
      });

      setLastUsedDate(editingDate);
      setEditingRowId(null);
      load();
    } catch {
      message.error('Не вдалося зберегти');
    }
  };

  /* ================= search vendor items ================= */

  const handleSearch = async (q) => {
    if (!q || q.length < 2) return;

    const res = await api.get(
      `vendor-items/?vendor=${order.vendor}&search=${q}`,
    );

    const existing = new Set(order.items.map((i) => i.vendor_item));

    setVendorItemOptions(
      res.data.results
        .filter((i) => !existing.has(i.id))
        .map((i) => ({
          value: i.id,
          label: i.name,
        })),
    );
  };

  /* ================= table ================= */

  const columns = [
    {
      title: '',
      width: 50,
      align: 'center',
      render: (_, r) => {
        if (r.id === 'new') {
          return <SaveOutlined onClick={handleSaveCreate} />;
        }

        return editingRowId === r.id ? (
          <SaveOutlined onClick={() => handleSaveEdit(r)} />
        ) : (
          <EditOutlined onClick={() => handleStartEdit(r)} />
        );
      },
    },
    {
      title: 'Товар',
      render: (_, r) => {
        if (r.id === 'new') {
          return (
            <Select
              showSearch
              onSearch={handleSearch}
              onChange={(v) => setCreatingVendorItemId(v)}
              options={vendorItemOptions}
            />
          );
        }

        return r.vendor_item_name;
      },
    },
    {
      title: 'К-сть',
      width: 100,
      align: 'center',
      render: (_, r) =>
        editingRowId === r.id ? (
          <InputNumber value={editingQuantity} onChange={setEditingQuantity} />
        ) : r.id === 'new' ? (
          <InputNumber
            value={creatingQuantity}
            onChange={setCreatingQuantity}
          />
        ) : (
          formatQuantity(r.quantity)
        ),
    },
    {
      title: 'Ціна',
      width: 110,
      align: 'center',
      render: (_, r) =>
        editingRowId === r.id ? (
          <InputNumber value={editingPrice} onChange={setEditingPrice} />
        ) : r.id === 'new' ? (
          <InputNumber value={creatingPrice} onChange={setCreatingPrice} />
        ) : (
          `${r.agreed_price} ₴`
        ),
    },
    {
      title: 'Поставка',
      width: 140,
      align: 'center',
      render: (_, r) =>
        editingRowId === r.id ? (
          <DatePicker
            value={editingDate ? dayjs(editingDate) : null}
            onChange={(d) => setEditingDate(d?.format('YYYY-MM-DD'))}
          />
        ) : r.id === 'new' ? (
          <DatePicker
            value={creatingDate ? dayjs(creatingDate) : null}
            onChange={(d) => setCreatingDate(d?.format('YYYY-MM-DD'))}
          />
        ) : (
          formatDateDisplay(r.expected_delivery_date)
        ),
    },
    {
      title: '',
      width: 50,
      render: (_, r) =>
        r.id === 'new' ? (
          <DeleteOutlined onClick={() => setIsCreatingRow(false)} />
        ) : (
          <DeleteOutlined />
        ),
    },
  ];

  /* ================= render ================= */

  if (loading) return <Skeleton />;
  if (!order) return <Alert message="Not found" />;

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>
        Редагування № {order.order_no} від {formatDateUa(order.created_at)}
      </Title>

      <Row gutter={20}>
        <Col lg={6}>
          <Card title="Навігація">
            <Button block onClick={() => navigate(`/orders/${id}`)}>
              Перегляд
            </Button>
          </Card>
        </Col>

        <Col lg={18}>
          <Card
            title={
              <Flex justify="space-between">
                <span>Основна інформація</span>

                <Flex gap={8}>
                  <Title level={5} style={{ margin: 0 }}>
                    {order.vendor_name}
                  </Title>

                  <Link to={`/orders/vendors/${order.vendor}`} target="_blank">
                    <InfoCircleOutlined />
                  </Link>
                </Flex>
              </Flex>
            }
          >
            <Table
              columns={[
                {
                  title: 'Статус',
                  render: () => (
                    <Tag color={getStatusTagColor(order.status)}>
                      {order.status_name}
                    </Tag>
                  ),
                },
                {
                  title: 'Оплата',
                  render: () => <Progress percent={order.payment_percent} />,
                },
                {
                  title: 'Отримання',
                  render: () => <Progress percent={order.receipt_percent} />,
                },
              ]}
              dataSource={[order]}
              pagination={false}
            />
          </Card>

          <Card title="Замовлення">
            <Table
              columns={columns}
              dataSource={[
                ...order.items,
                ...(isCreatingRow ? [{ id: 'new' }] : []),
              ]}
              rowKey="id"
              pagination={false}
            />

            <Button
              icon={<EditOutlined />}
              onClick={handleStartCreate}
              disabled={isCreatingRow}
            >
              Додати товар
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderEditPage;
