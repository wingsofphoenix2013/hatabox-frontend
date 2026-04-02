import { Table, Input, Button, Typography, Space, Card } from 'antd';
import { AppstoreAddOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

function ProductionProductPage() {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const columns = [
    {
      title: '№№',
      render: (_, __, index) => index + 1,
      width: 70,
    },
    {
      title: 'Код продукта',
      dataIndex: 'product_family_code',
    },
    {
      title: 'Назва та версія продукта',
      dataIndex: 'name',
    },
    {
      title: 'База',
      dataIndex: 'is_base_modification',
      render: (value) => (value ? 'Так' : 'Ні'),
      width: 100,
    },
    {
      title: 'В роботі',
      render: () => '—',
      width: 120,
    },
    {
      title: 'Виготовлено',
      render: () => '—',
      width: 140,
    },
    {
      title: 'Дія',
      render: () => <AppstoreAddOutlined />,
      width: 80,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginBottom: 16 }}>
        Каталог продукції
      </Title>

      {/* Toolbar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Text>Обрано: {selectedRowKeys.length}</Text>

          <Button disabled>Дія</Button>

          <Input
            placeholder="Фільтр по коду сімейства"
            style={{ width: 200 }}
          />

          <Input
            placeholder="Пошук по назві"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
          />
        </Space>
      </Card>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={[]}
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
