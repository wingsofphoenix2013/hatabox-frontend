import { useEffect, useState } from 'react';
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
  Flex,
  Input,
  Select,
  Table,
  Typography,
} from 'antd';
import api from '../api/client';

const { Title, Text } = Typography;

function VendorsPage() {
  const [items, setItems] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('vendors/');

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

  const columns = [
    {
      title: 'Код',
      dataIndex: 'code',
      key: 'code',
      width: 160,
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (value) => value,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 180,
      render: (value) => value || '—',
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      render: (value) => value || '—',
    },
    {
      title: 'Логотип',
      dataIndex: 'logo',
      key: 'logo',
      width: 120,
      render: () => '—',
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

          <Button type="primary" size="large" icon={<PlusOutlined />}>
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
            pagination={{
              current: 1,
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
            scroll={{ x: 900 }}
          />
        </Card>
      </Flex>
    </div>
  );
}

export default VendorsPage;
