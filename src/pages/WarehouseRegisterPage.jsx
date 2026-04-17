import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
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

function WarehouseRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState(
    searchParams.getAll('place_type'),
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState(
    searchParams.getAll('location'),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadStoragePlaces(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchText, selectedPlaceTypes, selectedLocationIds]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchText) {
      params.set('search', searchText);
    }

    selectedPlaceTypes.forEach((placeType) => {
      params.append('place_type', placeType);
    });

    selectedLocationIds.forEach((locationId) => {
      params.append('location', locationId);
    });

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    searchText,
    selectedPlaceTypes,
    selectedLocationIds,
    currentPage,
    setSearchParams,
  ]);

  const loadLocations = async () => {
    try {
      setLocationsLoading(true);

      const response = await api.get('warehouse-locations/');
      const results = Array.isArray(response.data.results)
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

  const loadStoragePlaces = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', String(page));

      if (searchText) {
        params.append('search', searchText);
      }

      selectedPlaceTypes.forEach((placeType) => {
        params.append('place_type', placeType);
      });

      selectedLocationIds.forEach((locationId) => {
        params.append('location', locationId);
      });

      const response = await api.get(
        `warehouse-storage-places/?${params.toString()}`,
      );

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load warehouse storage places:', err);
      setError('Не вдалося завантажити каталог складів.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
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
      title: 'Маркування',
      dataIndex: 'display_name',
      key: 'display_name',
      width: 180,
      render: (value, record) => (
        <Link to={`/inventory/warehouses/${record.id}`}>{value}</Link>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'place_type_name',
      key: 'place_type_name',
      width: 160,
      render: (value, record) => (
        <div style={{ textAlign: 'left' }}>
          <Tag color={getPlaceTypeTagColor(record.place_type)}>
            {value || '—'}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Розміщення',
      dataIndex: 'placement_display',
      key: 'placement_display',
      width: 330,
      render: (value) => value || '—',
    },
    {
      title: 'Локація',
      dataIndex: 'location_code',
      key: 'location_code',
      width: 110,
      align: 'center',
      render: (value) => (
        <Tag
          style={{
            color: '#595959',
            background: '#fafafa',
            borderColor: '#d9d9d9',
            fontWeight: 600,
            minWidth: 34,
            textAlign: 'center',
          }}
        >
          {value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      width: 340,
      render: (value, record) => (
        <Flex align="center" gap={8} style={{ minWidth: 0 }}>
          <div
            style={{
              width: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {record.comment ? (
              <Tooltip
                title={
                  <div style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>
                    <strong>Коментар:</strong>
                    <br />
                    {record.comment}
                  </div>
                }
              >
                <InfoCircleOutlined
                  style={{
                    color: '#faad14',
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            ) : null}
          </div>

          <div
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={value || '—'}
          >
            {value || '—'}
          </div>
        </Flex>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => {
        const items = [
          {
            key: 'open',
            label: (
              <div style={{ padding: '4px 0' }}>Відкрити точку зберігання</div>
            ),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <AppstoreAddOutlined
              style={{
                fontSize: 17,
                color: '#8c8c8c',
                cursor: 'pointer',
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
              Каталог складів
            </Title>

            <Text type="secondary">
              Реєстр місць зберігання по всіх локаціях.
            </Text>
          </Flex>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати місце зберігання
          </Button>
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
              options={[{ value: 'placeholder', label: 'Дії' }]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Тип"
              style={{ minWidth: 220 }}
              value={selectedPlaceTypes}
              onChange={(values) => {
                setSelectedPlaceTypes(values);
                setCurrentPage(1);
              }}
              options={[
                { value: 'container', label: 'Контейнер' },
                { value: 'rack', label: 'Стелаж' },
                { value: 'box', label: 'Бокс' },
              ]}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по маркуванню або назві"
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
              placeholder="Локація"
              style={{ minWidth: 220 }}
              value={selectedLocationIds}
              onChange={(values) => {
                setSelectedLocationIds(values);
                setCurrentPage(1);
              }}
              options={locationOptions}
              optionFilterProp="label"
              loading={locationsLoading}
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
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
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
            scroll={{ x: 1280 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default WarehouseRegisterPage;
