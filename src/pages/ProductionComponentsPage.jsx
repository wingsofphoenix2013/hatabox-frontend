import { useEffect, useState } from 'react';
import { AppstoreAddOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Image, Space, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionComponentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('items/');
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Не вдалося завантажити номенклатуру компонентів.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const columns = [
    {
      title: 'Internal code',
      dataIndex: 'internal_code',
      key: 'internal_code',
      width: 180,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Link to={`/production/components/${record.id}`}>{record.name}</Link>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 220,
      render: (value) => value || '—',
    },
    {
      title: 'Unit',
      dataIndex: 'unit_symbol',
      key: 'unit_symbol',
      width: 100,
      render: (value) => value || '—',
    },
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 110,
      render: (value, record) => {
        if (!value) {
          return (
            <div
              style={{
                width: 56,
                height: 56,
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
              width: 56,
              height: 56,
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
              width={48}
              height={48}
              preview={true}
              style={{ objectFit: 'contain' }}
            />
          </div>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 70,
      align: 'center',
      render: () => (
        <AppstoreAddOutlined
          style={{
            fontSize: 18,
            color: '#8c8c8c',
            cursor: 'default',
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Номенклатура компонентів
            </Title>
          </div>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати позицію
          </Button>
        </div>

        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <Text>
              Обрано: <strong>{selectedRowKeys.length}</strong>
            </Text>
          </div>
        </Card>

        {error && <Alert type="error" message={error} showIcon />}

        <Card bodyStyle={{ padding: 0 }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns}
            rowSelection={rowSelection}
            pagination={{
              pageSize: 25,
              showSizeChanger: false,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Space>
    </div>
  );
}

export default ProductionComponentsPage;
