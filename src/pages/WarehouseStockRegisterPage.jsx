import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Divider,
  Dropdown,
  Flex,
  Input,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import WarehouseAddItemToMovementDrawer from '../components/WarehouseAddItemToMovementDrawer';
import { formatQuantity } from '../utils/formatNumber';
import { renderStoragePlaceChain } from '../utils/warehousePlacementRenderers';

const { Title, Text } = Typography;

const CATEGORY_ENDPOINT = 'categories/';

const getLocationTagStyle = () => ({
  color: '#595959',
  background: '#fafafa',
  borderColor: '#d9d9d9',
  fontWeight: 500,
  marginInlineEnd: 6,
  marginBottom: 6,
});

function WarehouseStockRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [storagePlaces, setStoragePlaces] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [movementDrawerOpen, setMovementDrawerOpen] = useState(false);
  const [movementStockDetail, setMovementStockDetail] = useState(null);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(
    searchParams.getAll('category'),
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState(
    searchParams.getAll('location'),
  );
  const [selectedStoragePlaceIds, setSelectedStoragePlaceIds] = useState(
    searchParams.getAll('storage_place'),
  );
  const [selectedVariants, setSelectedVariants] = useState(
    searchParams.getAll('variant'),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [storagePlacesLoading, setStoragePlacesLoading] = useState(true);

  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const pageSize = 50;

  useEffect(() => {
    loadCategories();
    loadLocations();
    loadStoragePlaces();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    loadStockOverview(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchText,
    selectedCategoryIds,
    selectedLocationIds,
    selectedStoragePlaceIds,
    selectedVariants,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    const normalizedSearch = debouncedSearchText.trim();
    if (normalizedSearch) {
      params.set('search', normalizedSearch);
    }

    selectedCategoryIds.forEach((categoryId) => {
      params.append('category', categoryId);
    });

    selectedLocationIds.forEach((locationId) => {
      params.append('location', locationId);
    });

    selectedStoragePlaceIds.forEach((storagePlaceId) => {
      params.append('storage_place', storagePlaceId);
    });

    selectedVariants.forEach((variant) => {
      params.append('variant', variant);
    });

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    debouncedSearchText,
    selectedCategoryIds,
    selectedLocationIds,
    selectedStoragePlaceIds,
    selectedVariants,
    currentPage,
    setSearchParams,
  ]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);

      const response = await api.get(CATEGORY_ENDPOINT);
      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setCategories(results);
    } catch (err) {
      console.error('Failed to load inventory item categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      setLocationsLoading(true);

      const response = await api.get('warehouse-locations/', {
        params: { is_active: true },
      });

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setLocations(results);
    } catch (err) {
      console.error('Failed to load warehouse locations:', err);
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  const loadStoragePlaces = async () => {
    try {
      setStoragePlacesLoading(true);

      const response = await api.get('warehouse-storage-places/', {
        params: { is_active: true },
      });

      const results = Array.isArray(response.data?.results)
        ? response.data.results
        : [];

      setStoragePlaces(results);
    } catch (err) {
      console.error('Failed to load warehouse storage places:', err);
      setStoragePlaces([]);
    } finally {
      setStoragePlacesLoading(false);
    }
  };

  const openMovementDrawer = async (record) => {
    if (!record?.inventory_item_id) return;

    try {
      setError('');

      const response = await api.get(
        `warehouse-stock-detail/${record.inventory_item_id}/`,
      );

      setMovementStockDetail(response.data || null);
      setMovementDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load stock detail for movement:', err);
      setError('Не вдалося завантажити дані товару для переміщення.');
      setMovementStockDetail(null);
    }
  };

  const loadStockOverview = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('has_any_activity', 'true');

      const normalizedSearch = debouncedSearchText.trim();
      if (normalizedSearch) {
        params.append('search', normalizedSearch);
      }

      selectedCategoryIds.forEach((categoryId) => {
        params.append('category', categoryId);
      });

      selectedLocationIds.forEach((locationId) => {
        params.append('location', locationId);
      });

      selectedStoragePlaceIds.forEach((storagePlaceId) => {
        params.append('storage_place', storagePlaceId);
      });

      if (selectedVariants.includes('has_stock')) {
        params.append('has_stock', 'true');
      }
      if (selectedVariants.includes('has_reserved')) {
        params.append('has_reserved', 'true');
      }
      if (selectedVariants.includes('has_pending_intake')) {
        params.append('has_pending_intake', 'true');
      }
      if (selectedVariants.includes('has_incoming')) {
        params.append('has_incoming', 'true');
      }

      const response = await api.get(
        `warehouse-stock-overview/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setTotal(Number(response.data?.count) || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load warehouse stock overview:', err);
      setError('Не вдалося завантажити складські залишки.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((item) => item.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({
          value: String(item.id),
          label: item.name || '—',
        })),
    [categories],
  );

  const locationOptions = useMemo(
    () =>
      locations.map((item) => ({
        value: String(item.id),
        label: `${item.code || '—'} - ${item.name || '—'}`,
      })),
    [locations],
  );

  const storagePlaceOptions = useMemo(
    () =>
      storagePlaces
        .filter((item) => {
          if (selectedLocationIds.length === 0) return true;

          return selectedLocationIds.includes(String(item.location));
        })
        .map((item) => ({
          value: String(item.id),
          label: (
            item.display_name_verbose ||
            item.display_name ||
            '—'
          ).replace(/\s+на локації\s*$/i, ''),
        })),
    [storagePlaces, selectedLocationIds],
  );

  const columns = [
    {
      title: 'Компонент',
      key: 'inventory_item',
      width: 430,
      render: (_, record) => {
        const detailsHref = `/production/components/${record.inventory_item_id}`;

        return (
          <Flex vertical gap={2} style={{ minWidth: 0 }}>
            <Link
              to={`/inventory/stock/${record.inventory_item_id}`}
              state={{
                inventoryItemLabel: record.inventory_item_name || undefined,
              }}
              style={{
                fontWeight: 600,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
              title={record.inventory_item_name || '—'}
            >
              {record.inventory_item_name || '—'}
            </Link>

            <Flex align="center" gap={6} style={{ minWidth: 0 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  lineHeight: 1.2,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={`${record.inventory_item_category_name || '—'} | ${record.inventory_item_code || '—'}`}
              >
                {record.inventory_item_category_name || '—'} |{' '}
                {record.inventory_item_code || '—'}
              </Text>

              {record.inventory_item_id ? (
                <Tooltip title="Відкрити картку компонента">
                  <a
                    href={detailsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InfoCircleOutlined
                      style={{
                        color: '#1677ff',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    />
                  </a>
                </Tooltip>
              ) : null}
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: 'В наявності',
      key: 'available_quantity',
      width: 150,
      align: 'center',
      onCell: (record) => {
        const quantity = Number(record.available_quantity) || 0;

        return quantity > 0
          ? {
              style: {
                backgroundColor: '#f0f7ff',
              },
            }
          : {};
      },
      render: (_, record) => {
        const unit = record.inventory_item_unit_symbol || '';
        const reserved = Number(record.reserved_quantity) || 0;

        return (
          <Flex vertical gap={2} align="center">
            <Text strong>
              {formatQuantity(record.available_quantity)} {unit}
            </Text>

            {reserved > 0 && (
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.2 }}>
                {formatQuantity(record.reserved_quantity)} {unit} в резерві
              </Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: 'Оформлення',
      key: 'pending_intake_quantity',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const quantity = Number(record.pending_intake_quantity) || 0;
        const hasUnconverted = Boolean(record.has_unconverted_pending_intake);
        const unit = record.inventory_item_unit_symbol || '';
        const canOpenPendingIntake = quantity > 0 || hasUnconverted;

        return (
          <Flex align="center" justify="center" gap={6}>
            {/* Основной контент */}
            {quantity <= 0 && hasUnconverted ? (
              <Tooltip title="Є отримана позиція, що очікує конвертації одиниць">
                <QuestionCircleOutlined
                  style={{
                    color: '#ff4d4f',
                    fontSize: 16,
                  }}
                />
              </Tooltip>
            ) : (
              <>
                <Text strong>
                  {formatQuantity(record.pending_intake_quantity)} {unit}
                </Text>

                {hasUnconverted && (
                  <Tooltip title="Є отримана позиція, що очікує конвертації одиниць">
                    <QuestionCircleOutlined
                      style={{
                        color: '#ff4d4f',
                        fontSize: 16,
                      }}
                    />
                  </Tooltip>
                )}
              </>
            )}

            {/* Иконка перехода */}
            {canOpenPendingIntake &&
              record.inventory_item_id &&
              record.has_procurement_pending_intake &&
              !record.has_tolling_pending_intake && (
                <Tooltip title="Перейти до первинного отримання">
                  <Link
                    to={`/inventory/pending-intake?inventory_item_id=${record.inventory_item_id}`}
                  >
                    <InfoCircleOutlined
                      style={{
                        color: '#1677ff',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    />
                  </Link>
                </Tooltip>
              )}

            {canOpenPendingIntake &&
              record.inventory_item_id &&
              !record.has_procurement_pending_intake &&
              record.has_tolling_pending_intake && (
                <Tooltip title="Перейти до давальчих поставок">
                  <Link
                    to={`/inventory/tolling-pending-intake?inventory_item_id=${record.inventory_item_id}`}
                  >
                    <InfoCircleOutlined
                      style={{
                        color: '#1677ff',
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    />
                  </Link>
                </Tooltip>
              )}

            {canOpenPendingIntake &&
              record.inventory_item_id &&
              record.has_procurement_pending_intake &&
              record.has_tolling_pending_intake && (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'procurement',
                        label: (
                          <Link
                            to={`/inventory/pending-intake?inventory_item_id=${record.inventory_item_id}`}
                          >
                            Комерційне отримання
                          </Link>
                        ),
                      },
                      {
                        key: 'tolling',
                        label: (
                          <Link
                            to={`/inventory/tolling-pending-intake?inventory_item_id=${record.inventory_item_id}`}
                          >
                            Давальчі поставки
                          </Link>
                        ),
                      },
                    ],
                  }}
                  trigger={['click']}
                >
                  <InfoCircleOutlined
                    style={{
                      color: '#1677ff',
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  />
                </Dropdown>
              )}
          </Flex>
        );
      },
    },
    {
      title: 'Закупівля',
      key: 'incoming_quantity',
      width: 160,
      align: 'center',
      render: (_, record) => {
        const quantity = Number(record.incoming_quantity) || 0;
        const hasUnconverted = Boolean(record.has_unconverted_incoming);
        const unit = record.inventory_item_unit_symbol || '';

        if (quantity <= 0 && hasUnconverted) {
          return (
            <Tooltip title="Є очікувана поставка, що потребує конвертації одиниць">
              <QuestionCircleOutlined
                style={{
                  color: '#ff4d4f',
                  fontSize: 16,
                }}
              />
            </Tooltip>
          );
        }

        return (
          <Flex align="center" justify="center" gap={6}>
            <Text strong>
              {formatQuantity(record.incoming_quantity)} {unit}
            </Text>

            {hasUnconverted ? (
              <Tooltip title="Є очікувана поставка, що потребує конвертації одиниць">
                <QuestionCircleOutlined
                  style={{
                    color: '#ff4d4f',
                    fontSize: 16,
                  }}
                />
              </Tooltip>
            ) : null}
          </Flex>
        );
      },
    },
    {
      title: 'Локації',
      key: 'locations',
      width: 320,
      render: (_, record) => {
        const availableQuantity = Number(record.available_quantity) || 0;
        const reservedQuantity = Number(record.reserved_quantity) || 0;
        const placements = Array.isArray(record.available_placements)
          ? record.available_placements
          : [];

        if (availableQuantity <= 0 && reservedQuantity > 0) {
          return <Text type="secondary">У резерві</Text>;
        }

        if (availableQuantity <= 0 || placements.length === 0) {
          return '—';
        }

        const renderPlacement = (placement) => {
          const locationCode = placement.location_code || '—';
          const locationName = placement.location_name || '—';
          const locationTagStyle = {
            ...getLocationTagStyle(),
            marginInlineEnd: 0,
            marginBottom: 0,
          };

          if (!placement.storage_place_full_display) {
            return (
              <Tag style={locationTagStyle}>
                {`${locationCode} - ${locationName}`}
              </Tag>
            );
          }

          return (
            <Flex align="center" gap={6} wrap={false}>
              <Tag style={locationTagStyle}>{locationCode}</Tag>
              <Text type="secondary">:</Text>
              <div
                title={placement.storage_place_display_name || undefined}
                style={{
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {renderStoragePlaceChain(placement.storage_place_full_display)}
              </div>
            </Flex>
          );
        };

        const [firstPlacement, ...otherPlacements] = placements;

        return (
          <Flex align="center" gap={6} wrap={false} style={{ minWidth: 0 }}>
            {renderPlacement(firstPlacement)}

            {otherPlacements.length > 0 && (
              <Tooltip
                title={
                  <Flex vertical gap={4}>
                    {otherPlacements.map((placement, index) => (
                      <Flex
                        key={`${placement.location_code}-${index}`}
                        align="center"
                        gap={6}
                        wrap={false}
                      >
                        <Tag
                          style={{
                            ...getLocationTagStyle(),
                            marginInlineEnd: 0,
                            marginBottom: 0,
                          }}
                        >
                          {placement.storage_place_full_display
                            ? placement.location_code || '—'
                            : `${placement.location_code || '—'} - ${
                                placement.location_name || '—'
                              }`}
                        </Tag>

                        {placement.storage_place_full_display ? (
                          <>
                            <Text type="secondary">:</Text>
                            {renderStoragePlaceChain(
                              placement.storage_place_full_display,
                            )}
                          </>
                        ) : null}
                      </Flex>
                    ))}
                  </Flex>
                }
              >
                <Tag color="default" style={{ marginInlineEnd: 0 }}>
                  +{otherPlacements.length}
                </Tag>
              </Tooltip>
            )}
          </Flex>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_, record) => {
        const hasAvailableStock = Number(record.available_quantity) > 0;

        const dropdownItems = [
          {
            key: 'move',
            label: hasAvailableStock ? (
              'Переміщення товару'
            ) : (
              <Tooltip title="Немає доступного залишку для переміщення">
                <span style={{ color: '#bfbfbf' }}>Переміщення товару</span>
              </Tooltip>
            ),
            onClick: () => {
              if (!hasAvailableStock) return;
              openMovementDrawer(record);
            },
          },
        ];

        return (
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
            <AppstoreAddOutlined
              style={{
                fontSize: 17,
                color: hasAvailableStock ? '#1677ff' : '#bfbfbf',
                cursor: hasAvailableStock ? 'pointer' : 'not-allowed',
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Складські залишки
            </Title>

            <Text type="secondary">
              Стан компонентів: залишки на складі, очікуване оформлення та
              поставки.
            </Text>
          </Flex>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Text>
              Обрано: <strong>{selectedRowKeys.length}</strong>
            </Text>

            <Select
              placeholder="Дії"
              style={{ width: 180 }}
              disabled={selectedRowKeys.length === 0}
              value={undefined}
              options={[
                {
                  value: 'placeholder',
                  label: 'Дії будуть додані пізніше',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по компоненту"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Категорія"
              style={{ minWidth: 240 }}
              value={selectedCategoryIds}
              onChange={(values) => {
                setSelectedCategoryIds(values);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              optionFilterProp="label"
              loading={categoriesLoading}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Локація"
              style={{ minWidth: 240 }}
              value={selectedLocationIds}
              onChange={(values) => {
                setSelectedLocationIds(values);

                if (values.length > 0) {
                  const allowedStoragePlaceIds = storagePlaces
                    .filter((item) => values.includes(String(item.location)))
                    .map((item) => String(item.id));

                  setSelectedStoragePlaceIds((currentValues) =>
                    currentValues.filter((storagePlaceId) =>
                      allowedStoragePlaceIds.includes(storagePlaceId),
                    ),
                  );
                }

                setCurrentPage(1);
              }}
              options={locationOptions}
              optionFilterProp="label"
              loading={locationsLoading}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Місце зберігання"
              style={{ minWidth: 260 }}
              value={selectedStoragePlaceIds}
              onChange={(values) => {
                setSelectedStoragePlaceIds(values);
                setCurrentPage(1);
              }}
              options={storagePlaceOptions}
              optionFilterProp="label"
              loading={storagePlacesLoading}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Варіанти"
              style={{ minWidth: 240 }}
              value={selectedVariants}
              onChange={(values) => {
                setSelectedVariants(values);
                setCurrentPage(1);
              }}
              options={[
                { value: 'has_stock', label: 'Є на складі' },
                { value: 'has_reserved', label: 'Є в резерві' },
                {
                  value: 'has_pending_intake',
                  label: 'Очікує оформлення',
                },
                {
                  value: 'has_incoming',
                  label: 'Очікується поставка',
                },
              ]}
              optionFilterProp="label"
            />
          </Flex>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="inventory_item_id"
            loading={loading}
            columns={columns}
            dataSource={items}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: false,
              onChange: (page) => setCurrentPage(page),
              showTotal: (totalValue, range) => (
                <span>
                  Показано{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {range[0]}–{range[1]}
                  </span>{' '}
                  з{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {totalValue}
                  </span>{' '}
                  позицій
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає позицій для відображення.',
            }}
            scroll={{ x: 1280 }}
          />
        </Card>
      </Flex>

      <WarehouseAddItemToMovementDrawer
        open={movementDrawerOpen}
        onClose={() => {
          setMovementDrawerOpen(false);
          setMovementStockDetail(null);
        }}
        stockDetail={movementStockDetail}
      />
    </div>
  );
}

export default WarehouseStockRegisterPage;
