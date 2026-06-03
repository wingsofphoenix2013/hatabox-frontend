import { useEffect, useState } from 'react';
import { RollbackOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionProductMaterialPlanPage() {
  const { id } = useParams();

  const [materialPlan, setMaterialPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductMaterialPlanPage;
