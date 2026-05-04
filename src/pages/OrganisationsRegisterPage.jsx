// src/pages/OrganisationsRegisterPage.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  AppstoreAddOutlined,
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
  Typography,
} from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import OrganizationCreateDrawer from '../components/OrganizationCreateDrawer';

const { Title, Text } = Typography;

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'commercial', label: 'Комерційна' },
  { value: 'charity', label: 'Благодійна' },
  { value: 'military', label: 'Військова' },
  { value: 'vendor', label: 'Постачальник' },
];

const getOrganizationTypeTagColor = (type) => {
  switch (type) {
    case 'commercial':
      return 'default';
    case 'charity':
      return 'processing';
    case 'military':
      return 'success';
    case 'vendor':
      return 'warning';
    default:
      return 'default';
  }
};

function OrganisationsRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [debouncedSearchText, setDebouncedSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedTypes, setSelectedTypes] = useState(
    searchParams.getAll('type'),
  );
  const [selectedMilitaryTypes, setSelectedMilitaryTypes] = useState(
    searchParams.getAll('military_type'),
  );
  const [selectedMilitaryBranches, setSelectedMilitaryBranches] = useState(
    searchParams.getAll('military_branch'),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const isMilitaryFiltersDisabled =
    selectedTypes.length > 0 && !selectedTypes.includes('military');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchText]);

  useEffect(() => {
    loadOrganizations(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    debouncedSearchText,
    selectedTypes,
    selectedMilitaryTypes,
    selectedMilitaryBranches,
    isMilitaryFiltersDisabled,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearchText) {
      params.set('search', debouncedSearchText);
    }

    selectedTypes.forEach((type) => {
      params.append('type', type);
    });

    if (!isMilitaryFiltersDisabled) {
      selectedMilitaryTypes.forEach((type) => {
        params.append('military_type', type);
      });

      selectedMilitaryBranches.forEach((branch) => {
        params.append('military_branch', branch);
      });
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [
    debouncedSearchText,
    selectedTypes,
    selectedMilitaryTypes,
    selectedMilitaryBranches,
    isMilitaryFiltersDisabled,
    currentPage,
    setSearchParams,
  ]);

  const loadOrganizations = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('paginated', 'true');
      params.append('page', String(page));

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      selectedTypes.forEach((type) => {
        params.append('type', type);
      });

      if (!isMilitaryFiltersDisabled) {
        selectedMilitaryTypes.forEach((type) => {
          params.append('military_type', type);
        });

        selectedMilitaryBranches.forEach((branch) => {
          params.append('military_branch', branch);
        });
      }

      const response = await api.get(`organizations/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Не вдалося завантажити каталог організацій.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = () => {
    setIsCreateDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    setIsCreateDrawerOpen(false);
  };

  const columns = useMemo(
    () => [
      {
        title: '№',
        key: 'row_number',
        width: 70,
        align: 'center',
        render: (_, __, index) => (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: 'Коротка назва',
        dataIndex: 'name',
        key: 'name',
        width: 260,
        render: (value, record) => (
          <Link
            to={`/organizations/${record.id}`}
            state={{
              organizationLabel: record.name,
            }}
          >
            {value || '—'}
          </Link>
        ),
      },
      {
        title: 'Юридична назва',
        dataIndex: 'legal_name',
        key: 'legal_name',
        width: 420,
        render: (value) => (
          <div
            title={value || '—'}
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || '—'}
          </div>
        ),
      },
      {
        title: 'Тип',
        dataIndex: 'type_display',
        key: 'type',
        width: 260,
        render: (value, record) => (
          <Flex align="center" gap={6} wrap>
            <Tag color={getOrganizationTypeTagColor(record.type)}>
              {value || record.type || '—'}
            </Tag>

            {record.military_type_display ? (
              <Tag color="default">{record.military_type_display}</Tag>
            ) : null}

            {record.military_branch_display ? (
              <Tag color="default">{record.military_branch_display}</Tag>
            ) : null}
          </Flex>
        ),
      },
      {
        title: 'ЄДРПОУ',
        dataIndex: 'edrpou',
        key: 'edrpou',
        width: 150,
        render: (value) => value || '—',
      },
      {
        title: 'Дії',
        key: 'actions',
        width: 70,
        align: 'center',
        render: () => {
          const menuItems = [
            {
              key: 'placeholder',
              label: (
                <div style={{ padding: '4px 0' }}>
                  Дії будуть додані пізніше
                </div>
              ),
            },
          ];

          return (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
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
    ],
    [currentPage],
  );

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Каталог організацій
            </Title>

            <Text type="secondary">
              Реєстр організацій, з якими працює система.
            </Text>
          </Flex>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openCreateDrawer}
          >
            Додати організацію
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
              options={[
                {
                  value: 'placeholder',
                  label: 'Дії',
                },
              ]}
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Input
              placeholder="Пошук по назві або ЄДРПОУ"
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 320 }}
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
              placeholder="Тип"
              style={{ minWidth: 220 }}
              value={selectedTypes}
              onChange={(values) => {
                setSelectedTypes(values);
                setCurrentPage(1);
              }}
              options={ORGANIZATION_TYPE_OPTIONS}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Військовий тип"
              style={{ minWidth: 220 }}
              value={selectedMilitaryTypes}
              disabled={isMilitaryFiltersDisabled}
              onChange={(values) => {
                setSelectedMilitaryTypes(values);
                setCurrentPage(1);
              }}
              options={[
                { value: 'zsu', label: 'ЗСУ' },
                { value: 'ngu', label: 'НГУ' },
                { value: 'dpsu', label: 'ДПСУ' },
                { value: 'dsns', label: 'ДСНС' },
                { value: 'mvs', label: 'МВС' },
                { value: 'sbu', label: 'СБУ' },
              ]}
              optionFilterProp="label"
            />

            <Divider type="vertical" style={{ height: 28 }} />

            <Select
              mode="multiple"
              allowClear
              placeholder="Вид військ"
              style={{ minWidth: 220 }}
              value={selectedMilitaryBranches}
              disabled={isMilitaryFiltersDisabled}
              onChange={(values) => {
                setSelectedMilitaryBranches(values);
                setCurrentPage(1);
              }}
              options={[
                { value: 'sv', label: 'СВ' },
                { value: 'ps', label: 'ПС' },
                { value: 'vms', label: 'ВМС' },
                { value: 'dshv', label: 'ДШВ' },
                { value: 'sbs', label: 'СБС' },
                { value: 'sp', label: 'СП' },
                { value: 'sl', label: 'СЛ' },
                { value: 'gur', label: 'ГУР' },
                { value: 'sso', label: 'ССО' },
                { value: 'tro', label: 'ТРО' },
                { value: 'kms', label: 'КМС' },
              ]}
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
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
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
                  організацій
                </span>
              ),
            }}
            locale={{
              emptyText: 'Немає організацій для відображення.',
            }}
            scroll={{ x: 1280 }}
          />
        </Card>
      </Flex>
      <OrganizationCreateDrawer
        open={isCreateDrawerOpen}
        onClose={closeCreateDrawer}
        onCreated={() => loadOrganizations(currentPage)}
      />
    </div>
  );
}

export default OrganisationsRegisterPage;
