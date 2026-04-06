import { useEffect, useState } from 'react';
import {
  AppstoreAddOutlined,
  PlusOutlined,
  SearchOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Divider,
  Flex,
  Image,
  Input,
  Select,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const formatPhoneUa = (value) => {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }

  return value;
};

function VendorsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.getAll('item_category').map(Number),
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadVendors(currentPage);
  }, [currentPage, searchText, selectedCategories]);

  useEffect(() => {
    const params = new URLSearchParams();

    selectedCategories.forEach((categoryId) => {
      params.append('item_category', String(categoryId));
    });

    if (searchText) {
      params.set('search', searchText);
    }

    if (currentPage > 1) {
      params.set('page', String(currentPage));
    }

    setSearchParams(params);
  }, [selectedCategories, searchText, currentPage, setSearchParams]);

  const loadCategories = async () => {
    try {
      const response = await api.get('categories/');
      setCategories(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadVendors = async (page) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      params.append('page', page);

      if (searchText) {
        params.append('search', searchText);
      }

      selectedCategories.forEach((categoryId) => {
        params.append('item_category', String(categoryId));
      });

      const response = await api.get(`vendors/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setError('Не вдалося завантажити каталог постачальників.');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    if (pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
  };

  const columns = [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 140,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Link
          to={`/orders/vendors/${record.id}`}
          state={{ vendorLabel: record.name }}
        >
          {value}
        </Link>
      ),
    },
    {
      title: 'Категорії',
      dataIndex: 'item_category_names',
      key: 'item_category_names',
      width: 260,
      render: (value) => {
        const categoriesList = Array.isArray(value) ? value : [];

        if (categoriesList.length === 0) {
          return '—';
        }

        return (
          <Flex gap={6} wrap>
            {categoriesList.map((categoryName) => (
              <Tag key={categoryName}>{categoryName}</Tag>
            ))}
          </Flex>
        );
      },
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 180,
      render: (value) => formatPhoneUa(value),
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (value) => {
        if (!value) return '—';

        const handleCopy = async () => {
          try {
            await navigator.clipboard.writeText(value);
            message.success('E-mail скопійовано');
          } catch {
            message.error('Не вдалося скопіювати');
          }
        };

        return (
          <Flex align="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={handleCopy}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Логотип',
      dataIndex: 'logo',
      key: 'logo',
      width: 120,
      render: (value, record) => {
        if (!value) {
          return (
            <div
              style={{
                width: 44,
                height: 44,
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafafa',
                color: '#bfbfbf',
                fontSize: 12,
              }}
            >
              —
            </div>
          );
        }

        return (
          <div
            style={{
              width: 44,
              height: 44,
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fafafa',
              overflow: 'hidden',
            }}
          >
            <Image
              src={value}
              alt={record.name}
              width={38}
              height={38}
              preview
              style={{ objectFit: 'contain' }}
            />
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: () => (
        <AppstoreAddOutlined
          style={{
            fontSize: 17,
            color: '#8c8c8c',
            cursor: 'default',
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Каталог постачальників
          </Title>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate('/orders/vendors/new')}
          >
            Додати постачальника
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
              placeholder="Пошук..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 220 }}
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
              placeholder="Категорії"
              style={{ minWidth: 260 }}
              value={selectedCategories}
              onChange={(values) => {
                setSelectedCategories(values);
                setCurrentPage(1);
              }}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
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
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            size="small"
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: 50,
              total,
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
                  результатів пошуку
                </span>
              ),
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default VendorsPage;
