import { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  StopOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Popconfirm,
  Popover,
  Row,
  Segmented,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import StoragePlaceEditDrawer from '../components/StoragePlaceEditDrawer';
import StoragePlaceCreateDrawer from '../components/StoragePlaceCreateDrawer';
import { getApiErrorMessage } from '../utils/apiError';

const { Text, Title } = Typography;

const getPlaceTypeTagColor = (placeType) => {
  switch (placeType) {
    case 'area':
      return 'purple';
    case 'container':
      return 'blue';
    case 'rack':
      return 'green';
    case 'shelf':
      return 'magenta';
    case 'box':
      return 'orange';
    default:
      return 'default';
  }
};

const renderAddressChain = (summary) => {
  const chain = Array.isArray(summary?.address_chain)
    ? summary.address_chain
    : [];

  if (chain.length === 0) {
    return summary?.address_verbose || '—';
  }

  return (
    <Flex align="center" gap={6} wrap>
      {chain.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === chain.length - 1;
        const tag = (
          <Tag
            color={
              item.place_type === 'location'
                ? 'default'
                : getPlaceTypeTagColor(item.place_type)
            }
            style={{ marginInlineEnd: 0 }}
          >
            {item.code || '—'}
          </Tag>
        );

        return (
          <Flex
            key={`${item.place_type}-${item.code}-${index}`}
            align="center"
            gap={4}
          >
            <span>{item.label || '—'}</span>

            {!isFirst && !isLast && item.id ? (
              <Link
                to={`/inventory/storage-topology/${item.id}`}
                state={{
                  storagePlaceLabel: `${item.code || '—'} ${
                    item.label || ''
                  }`.trim(),
                }}
              >
                {tag}
              </Link>
            ) : (
              tag
            )}

            {!isLast && <span>|</span>}
          </Flex>
        );
      })}
    </Flex>
  );
};

function StoragePlaceDetailPage() {
  const { id } = useParams();

  const [summary, setSummary] = useState(null);
  const [preferredItems, setPreferredItems] = useState([]);
  const [childItems, setChildItems] = useState([]);
  const [childItemsLoading, setChildItemsLoading] = useState(false);
  const [childActiveStatus, setChildActiveStatus] = useState('true');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [childActionLoadingId, setChildActionLoadingId] = useState(null);
  const [hoveredChildActionRowId, setHoveredChildActionRowId] = useState(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [createParent, setCreateParent] = useState(null);

  const loadChildStoragePlaces = async (
    parentId = id,
    activeStatus = childActiveStatus,
  ) => {
    try {
      setChildItemsLoading(true);

      const response = await api.get('storage-places-summary/', {
        params: {
          root_parent: parentId,
          is_active: activeStatus,
        },
      });

      setChildItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load child storage places:', err);
      message.error('Не вдалося завантажити вкладені місця зберігання.');
      setChildItems([]);
    } finally {
      setChildItemsLoading(false);
    }
  };

  const loadStoragePlace = async () => {
    try {
      setLoading(true);

      const response = await api.get(`storage-places/${id}/detail-view/`);
      const loadedSummary = response.data?.summary || null;

      setSummary(loadedSummary);
      setPreferredItems(
        Array.isArray(response.data?.preferred_items)
          ? response.data.preferred_items
          : [],
      );

      if (loadedSummary?.has_children) {
        loadChildStoragePlaces(loadedSummary.id, childActiveStatus);
      } else {
        setChildItems([]);
      }
    } catch (err) {
      console.error('Failed to load storage place detail:', err);
      message.error('Не вдалося завантажити точку зберігання.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoragePlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (summary?.has_children) {
      loadChildStoragePlaces(summary.id, childActiveStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childActiveStatus]);

  const handleSetDefault = async () => {
    try {
      setActionLoading(true);

      await api.post(`storage-places/${id}/set-default/`, {});

      message.success('Площадку призначено за замовчуванням.');
      await loadStoragePlace();
    } catch (err) {
      console.error('Failed to set default storage place:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(
        backendMessage || 'Не вдалося призначити площадку за замовчуванням.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeActiveStatus = async (action) => {
    try {
      setActionLoading(true);

      await api.post(`storage-places/${id}/${action}/`, {});
      message.success(
        action === 'activate'
          ? 'Точку зберігання активовано.'
          : 'Точку зберігання деактивовано.',
      );

      await loadStoragePlace();
    } catch (err) {
      console.error('Failed to change storage place active status:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, ['is_active']);

      message.error(
        backendMessage || 'Не вдалося змінити статус точки зберігання.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeChildActiveStatus = async (record, action) => {
    try {
      setChildActionLoadingId(record.id);

      await api.post(`storage-places/${record.id}/${action}/`, {});

      message.success(
        action === 'activate'
          ? 'Місце зберігання активовано.'
          : 'Місце зберігання деактивовано.',
      );

      await loadChildStoragePlaces(summary.id, childActiveStatus);
    } catch (err) {
      console.error('Failed to change child storage place active status:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(
        backendMessage || 'Не вдалося змінити статус місця зберігання.',
      );
    } finally {
      setChildActionLoadingId(null);
    }
  };

  const openCreateInsideDrawer = (record) => {
    setCreateParent(record);
    setIsCreateDrawerOpen(true);
  };

  const renderPreferredItem = (item) => (
    <Text>
      {item.internal_code || '—'} {item.name || '—'}
    </Text>
  );

  const getChildActionItems = (record) => {
    const actions = [];

    if (childActiveStatus === 'true' && record.can_add_inside) {
      actions.push({
        key: 'add_inside',
        label: 'Додати вкладене місце',
        onClick: () => openCreateInsideDrawer(record),
      });
    }

    if (childActiveStatus === 'true' && record.can_deactivate) {
      actions.push({
        key: 'deactivate',
        label: 'Вимкнути місце зберігання',
        danger: true,
        action: 'deactivate',
      });
    }

    if (childActiveStatus === 'false' && record.can_activate) {
      actions.push({
        key: 'activate',
        label: 'Увімкнути місце зберігання',
        action: 'activate',
      });
    }

    return actions;
  };

  const childColumns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Тип',
      dataIndex: 'place_type_name',
      key: 'place_type_name',
      width: 110,
      render: (value, record) => (
        <Tag color={getPlaceTypeTagColor(record.place_type)}>
          {value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Код',
      dataIndex: 'address',
      key: 'address',
      width: 220,
      render: (value, record) => (
        <div style={{ paddingLeft: Number(record.level || 0) * 10 }}>
          <Tooltip title={record.address_verbose || value || '—'}>
            <Link
              to={`/inventory/storage-topology/${record.id}`}
              state={{
                storagePlaceLabel: `${record.address || '—'} ${
                  record.name || ''
                }`.trim(),
              }}
            >
              {value || '—'}
            </Link>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Компоненти',
      key: 'preferred_items',
      ellipsis: true,
      render: (_, record) => {
        const childPreferredItems = Array.isArray(record.preferred_items)
          ? record.preferred_items
          : [];
        const firstItem = childPreferredItems[0];
        const restCount = Math.max(
          Number(record.preferred_items_count || 0) - 1,
          0,
        );

        if (!firstItem) {
          return record.name ? (
            <span style={{ fontStyle: 'italic' }}>{record.name}</span>
          ) : (
            '—'
          );
        }

        return (
          <Flex align="center" gap={8} wrap={false}>
            {renderPreferredItem(firstItem)}

            {restCount > 0 && <Tag>+{restCount}</Tag>}
          </Flex>
        );
      },
    },
    {
      title: 'Дії',
      key: 'actions',
      width: 70,
      align: 'center',
      render: (_, record) => {
        const actions = getChildActionItems(record);
        const hasActions = actions.length > 0;
        const iconColor = hasActions
          ? hoveredChildActionRowId === record.id
            ? '#1677ff'
            : '#595959'
          : '#bfbfbf';

        const content = (
          <Flex vertical gap={8} align="flex-start">
            {actions.map((actionItem) =>
              actionItem.action ? (
                <Popconfirm
                  key={actionItem.key}
                  title={
                    actionItem.action === 'activate'
                      ? 'Увімкнути місце зберігання?'
                      : 'Вимкнути місце зберігання?'
                  }
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={() =>
                    handleChangeChildActiveStatus(record, actionItem.action)
                  }
                  disabled={childActionLoadingId === record.id}
                >
                  <Button
                    type="link"
                    danger={actionItem.danger}
                    loading={childActionLoadingId === record.id}
                    style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                  >
                    {actionItem.label}
                  </Button>
                </Popconfirm>
              ) : (
                <Button
                  key={actionItem.key}
                  type="link"
                  style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                  onClick={actionItem.onClick}
                >
                  {actionItem.label}
                </Button>
              ),
            )}
          </Flex>
        );

        return hasActions ? (
          <Popover placement="bottomRight" content={content} trigger="click">
            <AppstoreOutlined
              style={{
                color: iconColor,
                cursor: 'pointer',
                fontSize: 17,
              }}
              onMouseEnter={() => setHoveredChildActionRowId(record.id)}
              onMouseLeave={() => setHoveredChildActionRowId(null)}
            />
          </Popover>
        ) : (
          <Tooltip title="Для цього місця зберігання немає доступних дій.">
            <AppstoreOutlined
              style={{
                color: iconColor,
                cursor: 'default',
                fontSize: 17,
              }}
            />
          </Tooltip>
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
            Місце зберігання {summary?.code || '—'}
          </Title>

          <Tag
            color={getPlaceTypeTagColor(summary?.place_type)}
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
            }}
          >
            {summary?.place_type_name || '—'}
          </Tag>
        </Flex>

        {summary?.is_active === false && (
          <Tag
            color="default"
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              border: '1px solid #d9d9d9',
              background: '#fafafa',
              color: '#595959',
            }}
          >
            <WarningFilled
              style={{
                color: '#ff4d4f',
                marginRight: 6,
              }}
            />
            ВІДКЛЮЧЕНО
          </Tag>
        )}
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Стікер" style={{ marginBottom: 20 }}>
            <Flex justify="center" align="center">
              <Title
                level={1}
                style={{
                  margin: 0,
                  lineHeight: 1,
                  fontSize: 32,
                }}
              >
                {summary?.address || '—'}
              </Title>
            </Flex>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              {summary?.place_type === 'area' && summary?.can_set_default && (
                <Popconfirm
                  title="Призначити за замовчуванням?"
                  description="Ця площадка стане площадкою за замовчуванням для локації. Ви впевнені?"
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={handleSetDefault}
                  disabled={actionLoading}
                >
                  <Button block type="primary" loading={actionLoading}>
                    За замовчуванням
                  </Button>
                </Popconfirm>
              )}

              {summary?.is_active === false &&
                (summary?.can_activate ? (
                  <Popconfirm
                    title="Активувати місце зберігання?"
                    description="Місце зберігання знову стане доступним для використання. Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={() => handleChangeActiveStatus('activate')}
                    disabled={actionLoading}
                  >
                    <Button block type="primary" loading={actionLoading}>
                      Активувати місце зберігання
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip
                    title={
                      summary?.activate_block_reason ||
                      'Активація зараз недоступна.'
                    }
                  >
                    <Button block disabled>
                      Активувати місце зберігання
                    </Button>
                  </Tooltip>
                ))}

              <Button
                block
                icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                onClick={() => setIsEditDrawerOpen(true)}
                style={{ color: '#1677ff' }}
              >
                Налаштування місця зберігання
              </Button>

              <Divider dashed style={{ margin: '4px 0 8px 0' }} />

              {summary?.is_active === true &&
                (summary?.can_deactivate ? (
                  <Popconfirm
                    title="Вимкнути місце зберігання?"
                    description="Місце зберігання буде деактивовано. Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={() => handleChangeActiveStatus('deactivate')}
                    disabled={actionLoading}
                  >
                    <Button
                      block
                      danger
                      icon={<StopOutlined />}
                      loading={actionLoading}
                    >
                      Вимкнути
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip
                    title={
                      summary?.deactivate_block_reason ||
                      'Деактивація зараз недоступна.'
                    }
                  >
                    <Button block disabled icon={<StopOutlined />}>
                      Вимкнути
                    </Button>
                  </Tooltip>
                ))}
            </Flex>
          </Card>

          <Card title="Історія місця зберігання">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card
            title="Основна інформація"
            extra={
              <Button
                type="link"
                icon={<SettingOutlined />}
                onClick={() => setIsEditDrawerOpen(true)}
                style={{
                  color: '#595959',
                  paddingInline: 0,
                }}
              >
                Налаштування місця зберігання
              </Button>
            }
            style={{ marginBottom: 20 }}
          >
            <Flex vertical gap={16}>
              {summary?.name ? (
                <div>
                  <Text
                    type="secondary"
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Назва місця зберігання
                  </Text>

                  <Text>{summary.name}</Text>
                </div>
              ) : null}

              {summary?.comment ? (
                <div>
                  <Text
                    type="secondary"
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    Опис місця зберігання
                  </Text>

                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {summary.comment}
                  </Text>
                </div>
              ) : null}
              <Descriptions
                column={1}
                size="small"
                styles={{
                  label: {
                    width: 180,
                  },
                }}
              >
                <Descriptions.Item label="Локація">
                  <Tag color="default">
                    {summary?.location_code || '—'} -{' '}
                    {summary?.location_name || '—'}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label="Розміщення">
                  {renderAddressChain(summary)}
                </Descriptions.Item>

                <Descriptions.Item label="Бажані компоненти">
                  {preferredItems.length > 0 ? (
                    <Flex vertical gap={6} align="flex-start">
                      {preferredItems.map((item) => (
                        <Flex key={item.id} align="center" gap={6} wrap={false}>
                          <Text>
                            {item.internal_code || '—'} {item.name || '—'}
                          </Text>

                          <Tooltip title="Відкрити картку залишку">
                            <InfoCircleOutlined
                              style={{
                                color: '#8c8c8c',
                                cursor: 'pointer',
                              }}
                              onClick={() => {
                                if (item.inv_item_id) {
                                  window.open(
                                    `/inventory/stock/${item.inv_item_id}`,
                                    '_blank',
                                  );
                                }
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      ))}
                    </Flex>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Flex>
          </Card>

          {summary?.has_children && (
            <Card
              title={
                <Flex justify="space-between" align="center" gap={12}>
                  <span>Вкладені місця зберігання</span>

                  <Segmented
                    size="small"
                    value={childActiveStatus}
                    options={[
                      { label: 'Активні', value: 'true' },
                      { label: 'Неактивні', value: 'false' },
                    ]}
                    onChange={setChildActiveStatus}
                  />
                </Flex>
              }
            >
              <Table
                rowKey="id"
                columns={childColumns}
                dataSource={childItems}
                loading={childItemsLoading}
                pagination={false}
                size="small"
                tableLayout="fixed"
                locale={{
                  emptyText: 'Вкладених місць зберігання немає.',
                }}
              />
            </Card>
          )}
        </Col>
      </Row>

      <StoragePlaceEditDrawer
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        storagePlace={summary}
        preferredItems={preferredItems}
        onUpdated={loadStoragePlace}
      />

      <StoragePlaceCreateDrawer
        open={isCreateDrawerOpen}
        onClose={() => {
          setIsCreateDrawerOpen(false);
          setCreateParent(null);
        }}
        locations={[]}
        locationsLoading={false}
        initialParent={createParent}
      />
    </div>
  );
}

export default StoragePlaceDetailPage;
