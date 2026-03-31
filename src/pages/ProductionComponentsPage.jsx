import { useEffect, useState } from 'react';
import { AppstoreAddOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Image, Table, Typography, Flex } from 'antd';
import { Link } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionComponentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadItems(currentPage);
  }, [currentPage]);

  const loadItems = async (page) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('items/', {
        params: { page },
      });

      setItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setTotal(response.data.count || 0);
      setSelectedRowKeys([]);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError('Не вдалося завантажити номенклатуру компонентів!');
      setItems([]);
      setTotal(0);
      setSelectedRowKeys([]);
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

  const handleTableChange = (pagination) => {
    if (pagination.current !== currentPage) {
      setCurrentPage(pagination.current);
    }
  };

  const columns = [
    {
      title: 'Код',
      dataIndex: 'internal_code',
      key: 'internal_code',
      width: 160,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Link to={`/production/components/${record.id}`}>{record.name}</Link>
      ),
    },
    {
      title: 'Категорія',
      dataIndex: 'category_name',
      key: 'category_name',
      width: 220,
      render: (value) => value || '—',
    },
    {
      title: 'Од. вим.',
      dataIndex: 'unit_symbol',
      key: 'unit_symbol',
      width: 100,
      render: (value) => value || '—',
    },
    {
      title: 'Превʼю',
      dataIndex: 'image',
      key: 'image',
      width: 96,
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
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Номенклатура компонентів
            </Title>
          </div>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати позицію
          </Button>
        </Flex>

        <Card size="small">
          <Text>
            Обрано: <strong>{selectedRowKeys.length}</strong>
          </Text>
        </Card>

        {error && <Alert type="error" description={error} showIcon />}

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={loading}
            dataSource={items}
            columns={columns}
            rowSelection={rowSelection}
            size="small"
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize: 50,
              total: total,
              showSizeChanger: false,
            }}
            scroll={{ x: 900 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default ProductionComponentsPage;
