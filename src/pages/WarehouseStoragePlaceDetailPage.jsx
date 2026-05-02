import { useEffect, useState } from 'react';
import {
  ApartmentOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  QrcodeOutlined,
  SaveOutlined,
  StopOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Dropdown,
  Flex,
  Input,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import WarehousePlacesDrawer from '../components/WarehousePlacesDrawer';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';
import { formatDateDisplay } from '../utils/orderFormatters';
import {
  renderStoragePlaceChain,
  renderWarehousePlacement,
} from '../utils/warehousePlacementRenderers';

const { Title, Text } = Typography;

const getPlaceTypeTagColor = (placeType) => {
  switch (placeType) {
    case 'container':
      return 'processing';
    case 'rack':
      return 'success';
    case 'box':
      return 'warning';
    default:
      return 'default';
  }
};

function WarehouseStoragePlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingField, setSavingField] = useState(null);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

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

      const response = await api.patch(`warehouse-storage-places/${id}/`, {
        [fieldName]: editingValue,
      });

      setData((prevData) => ({
        ...prevData,
        storage_place: response.data,
      }));

      setEditingField(null);
      setEditingValue('');
    } catch (err) {
      console.error(
        `Failed to update warehouse storage place ${fieldName}:`,
        err,
      );
    } finally {
      setSavingField(null);
    }
  };

  const handleStartEditComment = () => {
    setEditingField(null);
    setEditingValue('');

    setIsEditingComment(true);
    setEditingComment(data?.storage_place?.comment || '');
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setEditingComment('');
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);

      const response = await api.patch(`warehouse-storage-places/${id}/`, {
        comment: editingComment,
      });

      setData((prevData) => ({
        ...prevData,
        storage_place: response.data,
      }));

      setIsEditingComment(false);
      setEditingComment('');
    } catch (err) {
      console.error('Failed to update warehouse storage place comment:', err);
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteStoragePlace = async () => {
    try {
      setDeleting(true);
      setDeleteError('');

      await api.delete(`warehouse-storage-places/${id}/`);

      navigate(`/inventory/warehouses/${data.storage_place.location_id}`, {
        state: {
          locationLabel: data.storage_place.location_code,
        },
      });
    } catch (err) {
      console.error('Failed to delete warehouse storage place:', err);

      setDeleteError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося видалити місце зберігання.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `warehouse-storage-places/${id}/detail-view/`,
      );

      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse storage place detail page:', err);
      setError('Не вдалося завантажити дані місця зберігання.');
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

  if (!data?.storage_place) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type="warning"
          description="Місце зберігання не знайдено."
          showIcon
        />
      </div>
    );
  }

  const storagePlace = data.storage_place;
  const parentStoragePlace = storagePlace.parent_storage_place;
  const children = data.children || [];

  const allowedPlaceTypes = (() => {
    if (!storagePlace) return [];

    if (storagePlace.place_type === 'container') {
      return ['rack', 'box'];
    }

    if (storagePlace.place_type === 'rack') {
      return ['box'];
    }

    if (storagePlace.place_type === 'box') {
      if (parentStoragePlace?.place_type === 'box') {
        return [];
      }
      return ['box'];
    }

    return [];
  })();

  const canCreateChild = allowedPlaceTypes.length > 0;
  const directStock = data.direct_stock || [];
  const directReservedStock = data.direct_reserved_stock || [];
  const nestedStock = data.nested_stock || [];
  const nestedReservedStock = data.nested_reserved_stock || [];

  const nestedStockGroups = Object.values(
    nestedStock.reduce((acc, item) => {
      const key = item.storage_place_id;

      if (!acc[key]) {
        acc[key] = {
          storagePlaceId: item.storage_place_id,
          storagePlaceFullDisplay: item.storage_place_full_display,
          items: [],
        };
      }

      acc[key].items.push(item);

      return acc;
    }, {}),
  );

  const nestedReservedStockGroups = Object.values(
    nestedReservedStock.reduce((acc, item) => {
      const key = item.storage_place_id;

      if (!acc[key]) {
        acc[key] = {
          storagePlaceId: item.storage_place_id,
          storagePlaceFullDisplay: item.storage_place_full_display,
          items: [],
        };
      }

      acc[key].items.push(item);

      return acc;
    }, {}),
  );

  const childrenColumns = [
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
      width: 320,
      render: (_, record) => (
        <Link
          to={`/inventory/storage-places/${record.id}`}
          state={{
            locationId: storagePlace.location_id,
            locationLabel: storagePlace.location_code,
            storagePlaceLabel: record.display_name,
          }}
        >
          {renderStoragePlaceChain(record.display_name_verbose)}
        </Link>
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
      width: 100,
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
            <FileTextOutlined style={{ color: '#faad14' }} />
          </Tooltip>
        ) : (
          '—'
        ),
    },
    {
      title: 'Товари',
      key: 'stock',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const hasStock = nestedStock.some(
          (item) => item.storage_place_id === record.id,
        );

        return hasStock ? (
          <Link
            to={`/inventory/storage-places/${storagePlace.id}#nested-stock-${record.id}`}
            state={{
              locationId: storagePlace.location_id,
              locationLabel: storagePlace.location_code,
              storagePlaceLabel: storagePlace.display_name,
            }}
          >
            <EyeOutlined style={{ marginRight: 4 }} />
            Переглянути
          </Link>
        ) : (
          '—'
        );
      },
    },
    {
      title: 'Резерв',
      key: 'reserved',
      width: 140,
      align: 'center',
      render: (_, record) => {
        const hasReserved = nestedReservedStock.some(
          (item) => item.storage_place_id === record.id,
        );

        return hasReserved ? (
          <Link
            to={`/inventory/storage-places/${storagePlace.id}#nested-reserved-${record.id}`}
            state={{
              locationId: storagePlace.location_id,
              locationLabel: storagePlace.location_code,
              storagePlaceLabel: storagePlace.display_name,
            }}
          >
            <EyeOutlined style={{ marginRight: 4 }} />
            Переглянути
          </Link>
        ) : (
          '—'
        );
      },
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

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex align="center" gap={12} wrap>
            <Title level={2} style={{ margin: 0, lineHeight: 1.2 }}>
              Інформація про місце зберігання:{' '}
              {storagePlace.display_name || '—'}
            </Title>

            <Tag
              color={getPlaceTypeTagColor(storagePlace.place_type)}
              style={{
                fontSize: 18,
                padding: '6px 14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                marginInlineEnd: 0,
              }}
            >
              {storagePlace.place_type_name || '—'}
            </Tag>
          </Flex>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="QR код" style={{ marginBottom: 20 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1.414 / 1',
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
                <Text type="secondary">Дані з’являться пізніше</Text>
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

                <Button
                  block
                  icon={<QrcodeOutlined style={{ color: '#1677ff' }} />}
                >
                  Згенерувати QR код
                </Button>

                <Divider style={{ margin: '8px 0' }} />

                {deleteError && (
                  <Alert type="error" description={deleteError} showIcon />
                )}

                {storagePlace.can_delete ? (
                  <Popconfirm
                    title="Видалити місце зберігання?"
                    description="Цю дію неможливо скасувати."
                    okText="Видалити"
                    cancelText="Скасувати"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDeleteStoragePlace}
                  >
                    <Button
                      block
                      danger
                      loading={deleting}
                      icon={<StopOutlined />}
                    >
                      Видалити місце
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip
                    title={
                      storagePlace.delete_block_reasons?.length > 0 ? (
                        <Flex vertical gap={4}>
                          {storagePlace.delete_block_reasons.map((reason) => (
                            <span key={reason}>{reason}</span>
                          ))}
                        </Flex>
                      ) : (
                        'Це місце не можна видалити.'
                      )
                    }
                  >
                    <Button block disabled icon={<StopOutlined />}>
                      Видалити місце
                    </Button>
                  </Tooltip>
                )}
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card
              title="Основна інформація"
              extra={renderStoragePlaceChain(storagePlace.display_name_verbose)}
              style={{ marginBottom: 20 }}
            >
              <Flex vertical gap={16}>
                <Descriptions
                  bordered
                  size="small"
                  column={3}
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
                              <Text strong>{storagePlace.name || '—'}</Text>
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
                                handleStartEditField('name', storagePlace.name)
                              }
                            />
                          )}
                        </Flex>
                      ),
                    },
                    {
                      key: 'location',
                      label: 'Локація',
                      contentStyle: { textAlign: 'center' },
                      children: (
                        <Link
                          to={`/inventory/warehouses/${storagePlace.location_id}`}
                          state={{
                            locationLabel: storagePlace.location_code,
                          }}
                        >
                          <Tag color="default" style={{ marginInlineEnd: 0 }}>
                            {`${storagePlace.location_code || '—'} - ${
                              storagePlace.location_name || '—'
                            }`}
                          </Tag>
                        </Link>
                      ),
                    },
                    {
                      key: 'parent_storage_place',
                      label: 'Знаходиться',
                      contentStyle: { textAlign: 'center' },
                      children: parentStoragePlace ? (
                        <Link
                          to={`/inventory/storage-places/${parentStoragePlace.id}`}
                          state={{
                            locationId: storagePlace.location_id,
                            locationLabel: storagePlace.location_code,
                            storagePlaceLabel: parentStoragePlace.display_name,
                          }}
                        >
                          {renderStoragePlaceChain(
                            parentStoragePlace.display_name_verbose,
                          )}
                        </Link>
                      ) : (
                        <Tag color="default">на локації</Tag>
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
                        <Text strong>Коментар до місця зберігання</Text>

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
                          {storagePlace.comment
                            ? storagePlace.comment
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
                title="Доступні товари у місці зберігання"
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
                title="Зарезервовані товари у місці зберігання"
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
              style={{ marginBottom: 20 }}
              extra={
                canCreateChild ? (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateDrawerOpen(true)}
                  >
                    Додати місце зберігання
                  </Button>
                ) : (
                  <Tooltip title="У цьому місці зберігання не можна створювати вкладені точки.">
                    <Button icon={<PlusOutlined />} disabled>
                      Додати місце зберігання
                    </Button>
                  </Tooltip>
                )
              }
            >
              {children.length > 0 ? (
                <Table
                  rowKey="id"
                  columns={childrenColumns}
                  dataSource={children}
                  pagination={false}
                  size="small"
                  tableLayout="fixed"
                />
              ) : (
                <Text type="secondary">
                  Вкладені місця зберігання відсутні.
                </Text>
              )}
            </Card>

            {nestedStockGroups.length > 0 && (
              <Card
                title="Доступні товари у вкладених місцях зберігання"
                style={{ marginBottom: 20 }}
              >
                <Flex vertical gap={20}>
                  {nestedStockGroups.map((group) => (
                    <div
                      key={group.storagePlaceId}
                      id={`nested-stock-${group.storagePlaceId}`}
                    >
                      <div style={{ marginBottom: 8 }}>
                        {renderStoragePlaceChain(group.storagePlaceFullDisplay)}
                      </div>

                      <Table
                        rowKey={(record) => record.inventory_item_id}
                        columns={directStockColumns}
                        dataSource={group.items}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                      />
                    </div>
                  ))}
                </Flex>
              </Card>
            )}

            {nestedReservedStockGroups.length > 0 && (
              <Card title="Зарезервовані товари у вкладених місцях зберігання">
                <Flex vertical gap={20}>
                  {nestedReservedStockGroups.map((group) => (
                    <div
                      key={group.storagePlaceId}
                      id={`nested-reserved-${group.storagePlaceId}`}
                    >
                      <div style={{ marginBottom: 8 }}>
                        {renderStoragePlaceChain(group.storagePlaceFullDisplay)}
                      </div>

                      <Table
                        rowKey={(record) =>
                          `${record.inventory_item_id}-${record.movement_plan_id}`
                        }
                        columns={reservedStockColumns}
                        dataSource={group.items}
                        pagination={false}
                        size="small"
                        tableLayout="fixed"
                      />
                    </div>
                  ))}
                </Flex>
              </Card>
            )}
          </Col>
        </Row>
      </Flex>
      <WarehousePlacesDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        locations={[
          {
            id: storagePlace.location_id,
            code: storagePlace.location_code,
            name: storagePlace.location_name,
          },
        ]}
        initialLocationId={storagePlace.location_id}
        initialPlacementValue={`parent-${storagePlace.id}`}
        allowedPlaceTypes={allowedPlaceTypes}
        onCreated={loadPage}
      />
    </div>
  );
}

export default WarehouseStoragePlaceDetailPage;
