import { useEffect, useState } from 'react';
import {
  ApartmentOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Dropdown,
  Flex,
  Input,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import WarehousePlacesDrawer from '../components/WarehousePlacesDrawer';
import WarehouseAddItemToMovementDrawer from '../components/WarehouseAddItemToMovementDrawer';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';
import {
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';

const { Title, Text } = Typography;

function WarehouseLocationDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [movementStockDetail, setMovementStockDetail] = useState(null);

  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingField, setSavingField] = useState(null);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStartEditField = (fieldName, currentValue) => {
    setIsEditingComment(false);
    setEditingComment('');

    setEditingField(fieldName);
    setEditingValue(currentValue || '');
  };

  const handleSaveField = async (fieldName) => {
    try {
      setSavingField(fieldName);

      const response = await api.patch(`warehouse-locations/${id}/`, {
        [fieldName]: editingValue,
      });

      setData((prevData) => ({
        ...prevData,
        location: response.data,
      }));

      setEditingField(null);
      setEditingValue('');
    } catch (err) {
      console.error(`Failed to update warehouse location ${fieldName}:`, err);
    } finally {
      setSavingField(null);
    }
  };

  const handleStartEditComment = () => {
    setEditingField(null);
    setEditingValue('');

    setIsEditingComment(true);
    setEditingComment(data?.location?.comment || '');
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setEditingComment('');
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);

      const response = await api.patch(`warehouse-locations/${id}/`, {
        comment: editingComment,
      });

      setData((prevData) => ({
        ...prevData,
        location: response.data,
      }));

      setIsEditingComment(false);
      setEditingComment('');
    } catch (err) {
      console.error('Failed to update warehouse location comment:', err);
    } finally {
      setSavingComment(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`warehouse-locations/${id}/detail-view/`);
      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse location detail page:', err);
      setError('Не вдалося завантажити дані локації.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!data?.location) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Локацію не знайдено." showIcon />
      </div>
    );
  }

  const location = data.location;
  const directStock = data.direct_stock || [];
  const directReservedStock = data.direct_reserved_stock || [];
  const storagePlaces = data.storage_places || [];

  const storagePlaceLevels = new Map();

  storagePlaces.forEach((item) => {
    let level = 0;
    let parentId = item.parent;

    while (parentId) {
      const parent = storagePlaces.find((place) => place.id === parentId);

      if (!parent) break;

      level += 1;
      parentId = parent.parent;
    }

    storagePlaceLevels.set(item.id, level);
  });

  const openMovementDrawer = (record) => {
    setMovementStockDetail({
      header: {
        inventory_item_id: record.inventory_item_id,
        inventory_item_code: record.inventory_item_code,
        inventory_item_name: record.inventory_item_name,
        inventory_item_category_name: '',
        inventory_item_unit_symbol: record.inventory_item_unit_symbol,
      },
      summary: {
        total_available_quantity: record.quantity,
        reserved_quantity: '0.000',
      },
      stock_rows: [
        {
          location_code: location.code,
          location_name: location.name,
          storage_place_display_name: null,
          storage_place_full_display: null,
          quantity: record.quantity,
        },
      ],
    });
  };

  const directStockColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Товар',
      key: 'item',
      render: (_, record) => (
        <Flex align="center" gap={6} wrap={false}>
          <span>{record.inventory_item_name || '—'}</span>

          {record.inventory_item_id ? (
            <Link
              to={`/inventory/stock/${record.inventory_item_id}`}
              target="_blank"
              rel="noreferrer"
            >
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
            </Link>
          ) : null}
        </Flex>
      ),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.inventory_item_unit_symbol
          ? `${formatQuantity(record.quantity)} ${record.inventory_item_unit_symbol}`
          : formatQuantity(record.quantity),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'move',
                label: (
                  <div style={{ padding: '4px 0' }}>Переміщення товару</div>
                ),
                onClick: () => openMovementDrawer(record),
              },
            ],
          }}
          trigger={['click']}
        >
          <AppstoreAddOutlined
            style={{
              fontSize: 17,
              color: '#1677ff',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  const reservedStockColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Документ',
      key: 'document',
      width: 220,
      render: (_, record) =>
        record.movement_plan_id ? (
          <Link
            to={`/inventory/movements/${record.movement_plan_id}`}
            target="_blank"
            rel="noreferrer"
          >
            {`Накладна №${record.movement_plan_id} від ${formatDateDisplay(
              record.movement_plan_created_at,
            )}`}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      title: 'Товар',
      key: 'item',
      render: (_, record) => (
        <Flex align="center" gap={6} wrap={false}>
          <span>{record.inventory_item_name || '—'}</span>

          {record.inventory_item_id ? (
            <Link
              to={`/inventory/stock/${record.inventory_item_id}`}
              target="_blank"
              rel="noreferrer"
            >
              <InfoCircleOutlined style={{ color: '#1677ff' }} />
            </Link>
          ) : null}
        </Flex>
      ),
    },
    {
      title: 'Куди',
      key: 'target',
      width: 320,
      render: (_, record) =>
        renderWarehousePlacement({
          locationCode: record.target_location_code,
          locationName: record.target_location_name,
          storagePlaceDisplayName: record.target_storage_place_display_name,
          storagePlaceFullDisplay: record.target_storage_place_full_display,
        }),
    },
    {
      title: 'Коли',
      key: 'planned_at',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const date = record.movement_plan_planned_at;

        if (!date) return '—';

        const dateText = formatDateDisplay(date);
        const isOverdue = record.movement_plan_is_overdue;
        const delta = record.movement_plan_days_delta;
        const statusText = record.movement_plan_planned_status_text;

        let content;

        if (isOverdue || (delta !== null && delta < 0)) {
          content = (
            <Tag color="error" style={{ fontWeight: 600 }}>
              {dateText}
            </Tag>
          );
        } else if (delta === 0) {
          content = (
            <Tag color="warning" style={{ fontWeight: 600 }}>
              {dateText}
            </Tag>
          );
        } else {
          content = <span>{dateText}</span>;
        }

        return statusText ? (
          <Tooltip title={statusText}>{content}</Tooltip>
        ) : (
          content
        );
      },
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.inventory_item_unit_symbol
          ? `${formatQuantity(record.quantity)} ${record.inventory_item_unit_symbol}`
          : formatQuantity(record.quantity),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'placeholder',
                label: (
                  <div style={{ padding: '4px 0' }}>
                    Дії будуть додані пізніше
                  </div>
                ),
              },
            ],
          }}
          trigger={['click']}
        >
          <AppstoreAddOutlined
            style={{
              fontSize: 17,
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  const storagePlaceColumns = [
    {
      title: '№',
      key: 'index',
      width: 56,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Місце зберігання',
      key: 'storage_place',
      width: 360,
      render: (_, record) => (
        <div style={{ paddingLeft: storagePlaceLevels.get(record.id) * 16 }}>
          <Link
            to={`/inventory/storage-places/${record.id}`}
            state={{
              locationId: location.id,
              locationLabel: location.code,
              storagePlaceLabel: record.display_name,
            }}
          >
            {renderStoragePlaceChain(record.display_name_verbose)}
          </Link>
        </div>
      ),
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (value) => value || '—',
    },
    {
      title: 'Коментар',
      key: 'comment',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.comment ? (
          <Tooltip
            title={
              <div style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                {record.comment}
              </div>
            }
          >
            <FileTextOutlined
              style={{
                color: '#faad14',
                fontSize: 16,
                cursor: 'pointer',
              }}
            />
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 80,
      align: 'center',
      render: () => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'placeholder',
                label: (
                  <div style={{ padding: '4px 0' }}>
                    Дії будуть додані пізніше
                  </div>
                ),
              },
            ],
          }}
          trigger={['click']}
        >
          <AppstoreAddOutlined
            style={{
              fontSize: 17,
              color: '#8c8c8c',
              cursor: 'pointer',
            }}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Інформація про локацію
          </Title>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Локація" style={{ marginBottom: 20 }}>
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
                  padding: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 120,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#000000',
                  }}
                >
                  {location.code || '—'}
                </span>
              </div>
            </Card>

            <Card title="Навігація">
              <Flex vertical gap={8}>
                <Button
                  block
                  icon={<ApartmentOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення місць зберігання
                </Button>

                <Button
                  block
                  icon={<SwapOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення товару
                </Button>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={16}>
                <Descriptions
                  bordered
                  size="small"
                  column={2}
                  items={[
                    {
                      key: 'name',
                      label: 'Назва',
                      contentStyle: { textAlign: 'center' },
                      children: (
                        <Flex align="center" justify="space-between" gap={8}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingField === 'name' ? (
                              <Input
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                autoFocus
                                style={{ width: '100%' }}
                              />
                            ) : (
                              <Text strong style={{ fontSize: 20 }}>
                                {location.name || '—'}
                              </Text>
                            )}
                          </div>

                          {editingField === 'name' ? (
                            <SaveOutlined
                              style={{
                                color: '#52c41a',
                                cursor:
                                  savingField === 'name'
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() => {
                                if (savingField !== 'name') {
                                  handleSaveField('name');
                                }
                              }}
                            />
                          ) : (
                            <EditOutlined
                              style={{
                                color: '#8c8c8c',
                                cursor: 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() =>
                                handleStartEditField('name', location.name)
                              }
                            />
                          )}
                        </Flex>
                      ),
                    },
                    {
                      key: 'address',
                      label: 'Адреса',
                      contentStyle: { textAlign: 'center' },
                      children: (
                        <Flex align="center" justify="space-between" gap={8}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingField === 'address' ? (
                              <Input
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                autoFocus
                                style={{ width: '100%' }}
                              />
                            ) : (
                              <Text>{location.address || '—'}</Text>
                            )}
                          </div>

                          {editingField === 'address' ? (
                            <SaveOutlined
                              style={{
                                color: '#52c41a',
                                cursor:
                                  savingField === 'address'
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() => {
                                if (savingField !== 'address') {
                                  handleSaveField('address');
                                }
                              }}
                            />
                          ) : (
                            <EditOutlined
                              style={{
                                color: '#8c8c8c',
                                cursor: 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() =>
                                handleStartEditField(
                                  'address',
                                  location.address,
                                )
                              }
                            />
                          )}
                        </Flex>
                      ),
                    },
                  ]}
                />

                <Alert
                  type="warning"
                  showIcon
                  message={
                    <Flex vertical gap={12}>
                      <Flex justify="space-between" align="center">
                        <Text strong>Коментар до локації</Text>

                        {!isEditingComment && (
                          <EditOutlined
                            style={{
                              color: '#8c8c8c',
                              cursor: 'pointer',
                              fontSize: 16,
                            }}
                            onClick={handleStartEditComment}
                          />
                        )}
                      </Flex>

                      {!isEditingComment ? (
                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                          {location.comment
                            ? location.comment
                            : 'Додати коментар'}
                        </Text>
                      ) : (
                        <Flex vertical gap={8}>
                          <Input.TextArea
                            value={editingComment}
                            onChange={(e) => setEditingComment(e.target.value)}
                            rows={3}
                            autoFocus
                          />

                          <Flex gap={8}>
                            <Button
                              type="primary"
                              size="small"
                              loading={savingComment}
                              onClick={handleSaveComment}
                            >
                              Зберегти
                            </Button>

                            <Button
                              size="small"
                              onClick={handleCancelEditComment}
                            >
                              Скасувати
                            </Button>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  }
                />
              </Flex>
            </Card>
            {directStock.length > 0 && (
              <Card
                title="Доступні товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Table
                  rowKey={(record) => record.inventory_item_id}
                  columns={directStockColumns}
                  dataSource={directStock}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}

            {directReservedStock.length > 0 && (
              <Card
                title="Зарезервовані товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Table
                  rowKey={(record) =>
                    `${record.inventory_item_id}-${record.movement_plan_id}`
                  }
                  columns={reservedStockColumns}
                  dataSource={directReservedStock}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              </Card>
            )}

            <Card
              title="Ієрархія місць зберігання"
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsCreateDrawerOpen(true)}
                >
                  Додати місце зберігання
                </Button>
              }
            >
              <Table
                rowKey="id"
                columns={storagePlaceColumns}
                dataSource={storagePlaces}
                pagination={false}
                size="small"
                tableLayout="fixed"
              />
            </Card>
          </Col>
        </Row>
      </Flex>
      <WarehousePlacesDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        locations={[location]}
        initialLocationId={location.id}
        initialPlacementValue="location-root"
        onCreated={loadPage}
      />

      <WarehouseAddItemToMovementDrawer
        open={Boolean(movementStockDetail)}
        onClose={() => setMovementStockDetail(null)}
        stockDetail={movementStockDetail}
      />
    </div>
  );
}

export default WarehouseLocationDetailPage;
