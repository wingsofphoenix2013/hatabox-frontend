import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Table,
  Input,
  Typography,
  Card,
  Alert,
  Select,
  Divider,
  Flex,
} from 'antd';
import {
  AppstoreAddOutlined,
  SearchOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [productFamilyCodeFilter, setProductFamilyCodeFilter] = useState(
    searchParams.get('product_family_code') || '',
  );
  const [searchText, setSearchText] = useState(
    searchParams.get('search') || '',
  );

  useEffect(() => {
    loadFamilies();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (productFamilyCodeFilter) {
      params.set('product_family_code', productFamilyCodeFilter);
    }

    if (searchText) {
      params.set('search', searchText);
    }

    setSearchParams(params);
  }, [productFamilyCodeFilter, searchText, setSearchParams]);

  useEffect(() => {
    loadProducts();
  }, [productFamilyCodeFilter, searchText]);

  const loadFamilies = async () => {
    try {
      const response = await api.get('product-families/');
      setFamilies(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load product families:', err);
      setFamilies([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();

      if (productFamilyCodeFilter) {
        params.set('product_family_code', productFamilyCodeFilter);
      }

      if (searchText) {
        params.set('search', searchText);
      }

      const response = await api.get(`products/?${params.toString()}`);

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Не вдалося завантажити каталог продукції.');
      setItems([]);
      setSelectedRowKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '№№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Код продукта',
      dataIndex: 'product_family_code',
      key: 'product_family_code',
    },
    {
      title: 'Назва та версія продукта',
      key: 'product_name_version',
      render: (_, record) => (
        <Link
          to={`/production/products/${record.id}?${searchParams.toString()}`}
          state={{ productLabel: record.code }}
        >
          {record.product_family_name} {record.version}
        </Link>
      ),
    },
    {
      title: 'База',
      dataIndex: 'is_base_modification',
      key: 'is_base_modification',
      width: 110,
      align: 'center',
      render: (value) => (
        <Flex align="center" justify="center" gap={6}>
          {value ? (
            <>
              <CheckCircleFilled style={{ color: '#52c41a' }} />
              <span>Так</span>
            </>
          ) : (
            <>
              <CloseCircleFilled style={{ color: '#ff4d4f' }} />
              <span>Ні</span>
            </>
          )}
        </Flex>
      ),
    },
    {
      title: 'В роботі',
      key: 'in_work',
      width: 120,
      align: 'center',
      render: () => 'ХХ',
    },
    {
      title: 'Виготовлено',
      key: 'produced',
      width: 140,
      align: 'center',
      render: () => 'ХХ',
    },
    {
      title: 'Дія',
      key: 'action',
      width: 80,
      align: 'center',
      render: () => <AppstoreAddOutlined />,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        Каталог продукції
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Flex align="center" wrap gap={12}>
          <Text>
            Обрано: <strong>{selectedRowKeys.length}</strong>
          </Text>

          <Select
            placeholder="Дії"
            style={{ width: 160 }}
            disabled={selectedRowKeys.length === 0}
            options={[{ value: 'placeholder', label: 'Дії' }]}
          />

          <Divider type="vertical" style={{ height: 28 }} />

          <Select
            allowClear
            showSearch
            placeholder="Фільтр по коду сімейства"
            style={{ width: 220 }}
            value={productFamilyCodeFilter || undefined}
            onChange={(value) => setProductFamilyCodeFilter(value || '')}
            optionLabelProp="value"
            options={families.map((family) => ({
              value: family.code,
              label: `${family.code} — ${family.name}`,
            }))}
          />

          <Divider type="vertical" style={{ height: 28 }} />

          <Input
            placeholder="Пошук по назві"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Flex>
      </Card>

      {error && (
        <Alert
          type="error"
          description={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    </div>
  );
}

export default ProductionProductPage;
