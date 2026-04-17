import { useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
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
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const MOCK_STORAGE_PLACES = [
  {
    id: 1,
    display_name: 'A01',
    place_type: 'container',
    location_code: 'A',
    placement_label: 'На локації',
    name: 'Контейнер витратних матеріалів',
    comment:
      'Всередині зберігаються ходові витратні матеріали та дрібні господарські позиції.',
  },
  {
    id: 2,
    display_name: 'A01-01',
    place_type: 'rack',
    location_code: 'A',
    placement_label: 'Контейнер 01',
    name: 'Стелаж дрібних комплектуючих',
    comment: '',
  },
  {
    id: 3,
    display_name: 'A01-01-008',
    place_type: 'box',
    location_code: 'A',
    placement_label: 'Контейнер 01, стелаж 01',
    name: 'Кріплення та метизи',
    comment:
      'Потрібно перевірити актуальність підпису після останнього переміщення.',
  },
  {
    id: 4,
    display_name: 'A02',
    place_type: 'container',
    location_code: 'A',
    placement_label: 'На локації',
    name: 'Контейнер кабельної продукції',
    comment: '',
  },
  {
    id: 5,
    display_name: 'A-03',
    place_type: 'rack',
    location_code: 'A',
    placement_label: 'На локації',
    name: 'Великий інструмент',
    comment: '',
  },
  {
    id: 6,
    display_name: 'A-03-001',
    place_type: 'box',
    location_code: 'A',
    placement_label: 'Стелаж 03',
    name: 'Ручний інструмент',
    comment: 'Уточнити склад вмісту.',
  },
  {
    id: 7,
    display_name: 'B01',
    place_type: 'container',
    location_code: 'B',
    placement_label: 'На локації',
    name: 'Контейнер сезонного запасу',
    comment: '',
  },
  {
    id: 8,
    display_name: 'B01-002',
    place_type: 'box',
    location_code: 'B',
    placement_label: 'Контейнер 01',
    name: 'Кабельна продукція',
    comment: '',
  },
  {
    id: 9,
    display_name: 'B-02',
    place_type: 'rack',
    location_code: 'B',
    placement_label: 'На локації',
    name: 'Стелаж електрики',
    comment: '',
  },
];

const PLACE_TYPE_LABELS = {
  container: 'Контейнер',
  rack: 'Стелаж',
  box: 'Бокс',
};

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

const getLocationTagStyle = (locationCode) => {
  if (locationCode === 'A') {
    return {
      color: '#0958d9',
      background: '#e6f4ff',
      borderColor: '#91caff',
      fontWeight: 600,
      minWidth: 34,
      textAlign: 'center',
    };
  }

  if (locationCode === 'B') {
    return {
      color: '#389e0d',
      background: '#f6ffed',
      borderColor: '#b7eb8f',
      fontWeight: 600,
      minWidth: 34,
      textAlign: 'center',
    };
  }

  return {
    fontWeight: 600,
    minWidth: 34,
    textAlign: 'center',
  };
};

function WarehouseRegisterPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState([]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return MOCK_STORAGE_PLACES.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.display_name.toLowerCase().includes(normalizedSearch) ||
        (item.name || '').toLowerCase().includes(normalizedSearch);

      const matchesLocation =
        selectedLocations.length === 0 ||
        selectedLocations.includes(item.location_code);

      const matchesPlaceType =
        selectedPlaceTypes.length === 0 ||
        selectedPlaceTypes.includes(item.place_type);

      return matchesSearch && matchesLocation && matchesPlaceType;
    });
  }, [searchText, selectedLocations, selectedPlaceTypes]);

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
      dataIndex: 'place_type',
      key: 'place_type',
      width: 140,
      align: 'center',
      render: (value) => (
        <Tag color={getPlaceTypeTagColor(value)}>
          {PLACE_TYPE_LABELS[value] || value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Розміщення',
      dataIndex: 'placement_label',
      key: 'placement_label',
      width: 280,
      render: (value) => value || '—',
    },
    {
      title: 'Локація',
      dataIndex: 'location_code',
      key: 'location_code',
      width: 110,
      align: 'center',
      render: (value) => (
        <Tag style={getLocationTagStyle(value)}>{value || '—'}</Tag>
      ),
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      width: 320,
      render: (value) => value || '—',
    },
    {
      title: '',
      key: 'comment',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (!record.comment) {
          return null;
        }

        return (
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
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_, record) => {
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

            <Input
              placeholder="Пошук по маркуванню або назві"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Локація"
              style={{ minWidth: 180 }}
              value={selectedLocations}
              onChange={setSelectedLocations}
              options={[
                { value: 'A', label: 'Локація A' },
                { value: 'B', label: 'Локація B' },
              ]}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Тип"
              style={{ minWidth: 220 }}
              value={selectedPlaceTypes}
              onChange={setSelectedPlaceTypes}
              options={[
                { value: 'container', label: 'Контейнер' },
                { value: 'rack', label: 'Стелаж' },
                { value: 'box', label: 'Бокс' },
              ]}
              optionFilterProp="label"
            />
          </Flex>
        </Card>

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredItems}
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              pageSize: 50,
              showSizeChanger: false,
              showTotal: (total, range) => (
                <span>
                  Показано{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {range[0]}–{range[1]}
                  </span>{' '}
                  з{' '}
                  <span style={{ color: '#1677ff', fontWeight: 600 }}>
                    {total}
                  </span>{' '}
                  місць зберігання
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає місць зберігання для відображення.',
            }}
            scroll={{ x: 1200 }}
          />
        </Card>

        <Card size="small">
          <Flex align="center" gap={8}>
            <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">
              Це тимчасовий мокап реєстру. Дані зараз локальні, без інтеграції з
              API.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
}

export default WarehouseRegisterPage;
