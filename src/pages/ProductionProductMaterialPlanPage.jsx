import { useEffect, useState } from 'react';
import {
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RollbackOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Table,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

function ProductionProductMaterialPlanPage() {
  const { id } = useParams();

  const [materialPlan, setMaterialPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedInvItemId, setExpandedInvItemId] = useState(null);

  useEffect(() => {
    loadMaterialPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMaterialPlan = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`products/${id}/work-material-plan/`);
      setMaterialPlan(response.data || null);
    } catch (err) {
      console.error('Failed to load product material plan page:', err);
      setError('Не вдалося завантажити загальну комплектацію.');
      setMaterialPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(materialPlan?.items) ? materialPlan.items : [];

  const columns = [
    {
      title: '№',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва компоненту',
      dataIndex: 'inv_item_name',
      key: 'inv_item_name',
      render: (value, record) => (
        <Flex align="center" gap={6}>
          <span>{value || '—'}</span>
          <a
            href={`/inventory/stock/${record.inv_item_id}`}
            target="_blank"
            rel="noreferrer"
          >
            <InfoCircleOutlined style={{ color: '#595959' }} />
          </a>
        </Flex>
      ),
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 160,
      align: 'center',
      render: (_, record) =>
        `${formatQuantity(record.total_quantity)} ${record.unit_symbol || ''}`,
    },
    {
      title: <UnorderedListOutlined />,
      key: 'details',
      width: 70,
      align: 'center',
      render: (_, record) =>
        expandedInvItemId === record.inv_item_id ? (
          <MenuFoldOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => setExpandedInvItemId(null)}
          />
        ) : (
          <MenuUnfoldOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => setExpandedInvItemId(record.inv_item_id)}
          />
        ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !materialPlan) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  const product = materialPlan?.product;

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            Загальна комплектація
          </Title>

          <Text type="secondary">{product?.code || '—'}</Text>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація">
            <Link
              to={`/production/products/${product?.id || id}`}
              state={{
                productCode: product?.code,
              }}
            >
              <Button
                block
                icon={<RollbackOutlined style={{ color: '#1677ff' }} />}
              >
                Повернутись до продукту
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Комплектація виробу">
            <Table
              rowKey="inv_item_id"
              columns={columns}
              dataSource={items}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductMaterialPlanPage;
