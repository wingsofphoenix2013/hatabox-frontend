import { useEffect, useState } from 'react';
import {
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Flex,
  Input,
  Popover,
  Select,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StoragePlaceCreateDrawer from '../components/StoragePlaceCreateDrawer';

const { Title, Text } = Typography;

const PLACE_TYPE_OPTIONS = [
  { value: 'area', label: 'Площадка' },
  { value: 'container', label: 'Контейнер' },
  { value: 'rack', label: 'Стелаж' },
  { value: 'shelf', label: 'Полка' },
  { value: 'box', label: 'Коробка' },
];

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

const renderPreferredItem = (item) => (
  <Flex align="center" gap={6} wrap={false}>
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
          if (item.id) {
            window.open(`/inventory/stock/${item.id}`, '_blank');
          }
        }}
      />
    </Tooltip>
  </Flex>
);

function StoragePlacesRegisterPage() {
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState([]);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchText]);

  useEffect(() => {
    loadStoragePlaces(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchText,
    selectedLocationIds,
    selectedPlaceTypes,
  ]);

  const loadLocations = async () => {
    try {
      setLocationsLoading(true);

      const response = await api.get('storage-locations/?is_active=true');
      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      setLocations(results);
    } catch (err) {
      console.error('Failed to load storage locations:', err);
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  };

  const loadStoragePlaces = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      selectedLocationIds.forEach((locationId) => {
        params.append('location', locationId);
      });

      selectedPlaceTypes.forEach((placeType) => {
        params.append('place_type', placeType);
      });

      const response = await api.get(
        `storage-places-summary/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
    } catch (err) {
      console.error('Failed to load storage places summary:', err);
      setError('Не вдалося завантажити топологію складів.');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const locationOptions = locations.map((item) => ({
    value: String(item.id),
    label: `${item.code || '—'} — ${item.name || '—'}`,
  }));

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => (currentPage - 1) * 50 + index + 1,
    },
    {
      title: 'Локація',
      key: 'location',
      width: 220,
      render: (_, record) => (
        <Tag color="default">
          {record.location_code || '—'} - {record.location_name || '—'}
        </Tag>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'place_type_name',
      key: 'place_type_name',
      width: 130,
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
      width: 260,
      render: (value, record) => (
        <div style={{ paddingLeft: Number(record.level || 0) * 20 }}>
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
      width: 360,
      render: (_, record) => {
        const preferredItems = Array.isArray(record.preferred_items)
          ? record.preferred_items
          : [];
        const firstItem = preferredItems[0];
        const restItems = preferredItems.slice(1);
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

            {restCount > 0 ? (
              <Popover
                placement="bottomLeft"
                content={
                  <Flex vertical gap={6}>
                    {restItems.map((item) => (
                      <div key={item.id}>{renderPreferredItem(item)}</div>
                    ))}
                  </Flex>
                }
              >
                <Tag style={{ cursor: 'pointer' }}>+{restCount}</Tag>
              </Popover>
            ) : null}
          </Flex>
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
              Топологія складів
            </Title>

            <Text type="secondary">
              Реєстр місць зберігання по всіх локаціях.
            </Text>
          </Flex>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            Додати місце зберігання
          </Button>
        </Flex>

        <Card size="small">
          <Flex align="center" wrap gap={16}>
            <Input
              placeholder="Пошук по коду, адресі, назві або компоненту"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 360 }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
              }}
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
              placeholder="Тип зберігання"
              style={{ minWidth: 240 }}
              value={selectedPlaceTypes}
              onChange={(values) => {
                setSelectedPlaceTypes(values);
                setCurrentPage(1);
              }}
              options={PLACE_TYPE_OPTIONS}
              optionFilterProp="label"
            />
          </Flex>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={items}
            size="small"
            pagination={{
              current: currentPage,
              pageSize: 50,
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
                  місць зберігання
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає місць зберігання для відображення.',
            }}
            scroll={{ x: 1360 }}
          />
        </Card>
      </Flex>
      <StoragePlaceCreateDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        locations={locations}
        locationsLoading={locationsLoading}
      />
    </div>
  );
}

export default StoragePlacesRegisterPage;
