import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Skeleton,
  Table,
  Typography,
} from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

function ProductionProductDetailPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [steps, setSteps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProductPage();
  }, [id]);

  const loadProductPage = async () => {
    try {
      setLoading(true);
      setError('');

      const [productResponse, stepsResponse] = await Promise.all([
        api.get(`products/${id}/`),
        api.get(`product-steps/?product=${id}`),
      ]);

      setProduct(productResponse.data);
      setSteps(
        Array.isArray(stepsResponse.data.results)
          ? stepsResponse.data.results
          : [],
      );
    } catch (err) {
      console.error('Failed to load product detail page:', err);
      setError('Не вдалося завантажити дані продукту.');
      setProduct(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, content) => (
    <div style={{ marginBottom: 20 }}>
      <Text
        type="secondary"
        style={{ display: 'block', marginBottom: 6, fontSize: 12 }}
      >
        {label}
      </Text>
      {content}
    </div>
  );

  const truncateText = (value, maxLength = 180) => {
    if (!value) return '—';
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength)}...`;
  };

  const additionalInfoColumns = [
    {
      title: 'База',
      key: 'is_base_modification',
      align: 'center',
      render: () => (product?.is_base_modification ? 'Так' : 'Ні'),
    },
    {
      title: 'Розробка з',
      key: 'development_started_at',
      align: 'center',
      render: () => product?.development_started_at || '—',
    },
    {
      title: 'Розробка по',
      key: 'development_finished_at',
      align: 'center',
      render: () => product?.development_finished_at || '—',
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error) {
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

  const productDisplayName = `${product.product_family_name} ${product.version}`;

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 4 }}>
            {productDisplayName}
          </Title>
          <Text type="secondary">{product.code || '—'}</Text>
        </div>
      </Flex>

      <Row gutter={20} align="top">
        {/* Ліва колонка */}
        <Col xs={24} lg={6}>
          <Card title="Зображення" style={{ marginBottom: 20 }}>
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
              }}
            >
              <Text type="secondary">Блок буде реалізовано пізніше</Text>
            </div>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>

        {/* Центральна колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            {renderField(
              'Назва',
              <Paragraph style={{ marginBottom: 0 }}>
                {productDisplayName}
              </Paragraph>,
            )}

            {renderField(
              'Опис',
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {product.description || '—'}
              </Paragraph>,
            )}
          </Card>

          <Card title="Додаткова інформація" style={{ marginBottom: 20 }}>
            <Table
              columns={additionalInfoColumns}
              dataSource={[{ id: product.id }]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card
            title="Етапи виробництва"
            extra={
              <Button type="primary" disabled>
                Додати етап
              </Button>
            }
          >
            {steps.length === 0 ? (
              <Text type="secondary">Етапи поки відсутні</Text>
            ) : (
              steps.map((step, index) => (
                <div key={step.id}>
                  <Flex justify="space-between" align="flex-start" gap={16}>
                    <div style={{ flex: 1 }}>
                      <Title
                        level={5}
                        style={{ marginTop: 0, marginBottom: 8 }}
                      >
                        {step.name}
                      </Title>
                      <Paragraph style={{ marginBottom: 0, color: '#595959' }}>
                        {truncateText(step.description)}
                      </Paragraph>
                    </div>

                    <Button disabled>Деталі</Button>
                  </Flex>

                  {index < steps.length - 1 && (
                    <Divider style={{ margin: '16px 0' }} />
                  )}
                </div>
              ))
            )}
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductDetailPage;
