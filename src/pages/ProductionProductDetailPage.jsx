import { useEffect, useState } from 'react';
import { Alert, Card, Col, Flex, Row, Skeleton, Tag, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

const getDevelopmentStatusTagColor = (status) => {
  switch (status) {
    case 'in_development':
      return 'processing';
    case 'finished':
      return 'success';
    default:
      return 'default';
  }
};

function ProductionProductDetailPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`products/${id}/`);
      setProduct(response.data || null);
    } catch (err) {
      console.error('Failed to load product detail page:', err);
      setError('Не вдалося завантажити дані продукту.');
      setProduct(null);
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

  if (error && !product) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Продукт не знайдено." showIcon />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex vertical gap={4}>
          <Flex align="center" gap={8} wrap>
            <Title level={2} style={{ margin: 0 }}>
              {product.product_family_code || '—'} v.{product.version || '—'}
            </Title>

            <Tag
              color={getDevelopmentStatusTagColor(product.development_status)}
              style={{ marginInlineEnd: 0, fontWeight: 600 }}
            >
              {product.development_status_display ||
                product.development_status ||
                '—'}
            </Tag>
          </Flex>

          <Text type="secondary">{product.product_family_name || '—'}</Text>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card style={{ marginBottom: 20 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  border: '1px solid #f0f0f0',
                  borderRadius: 12,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: 12,
                }}
              >
                <Text type="secondary">Дані зʼявляться пізніше</Text>
              </div>
            </Card>

            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Історія">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Етапи виробництва">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>
        </Row>
      </Flex>
    </div>
  );
}

export default ProductionProductDetailPage;
