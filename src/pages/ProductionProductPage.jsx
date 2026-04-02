import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Input, Button, Typography, Space, Card, Alert } from 'antd';
import { AppstoreAddOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionProductPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [productFamilyCodeFilter, setProductFamilyCodeFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('products/');

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Не вдалося завантажити каталог продукції.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '№№',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 70,
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
        <Link to={`/production/products/${record.id}`}>
          {record.product_family_name} {record.version}
        </Link>
      ),
    },
    {
      title: 'База',
      dataIndex: 'is_base_modification',
      key: 'is_base_modification',
      render: (value) => (value ? 'Так' : 'Ні'),
      width: 100,
    },
    {
      title: 'В роботі',
      key: 'in_work',
      render: () => 'ХХ',
      width: 120,
    },
    {
      title: 'Виготовлено',
      key: 'produced',
      render: () => 'ХХ',
      width: 140,
    },
    {
      title: 'Дія',
      key: 'action',
      render: () => <AppstoreAddOutlined />,
      width: 80,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        Каталог продукції
      </Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Text>Обрано: {selectedRowKeys.length}</Text>

          <Button disabled>Дія</Button>

          <Input
            placeholder="Фільтр по коду сімейства"
            style={{ width: 200 }}
            value={productFamilyCodeFilter}
            onChange={(e) => setProductFamilyCodeFilter(e.target.value)}
          />

          <Input
            placeholder="Пошук по назві"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
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
