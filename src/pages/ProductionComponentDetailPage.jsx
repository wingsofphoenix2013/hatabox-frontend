import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Skeleton, Typography } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionComponentDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComponent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadComponent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`items/${id}/`);
      setComponent(response.data?.summary || null);
    } catch (err) {
      console.error('Failed to load component detail page:', err);
      setError('Не вдалося завантажити дані компонента.');
      setComponent(null);
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

  if (error && !component) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!component) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Компонент не знайдено." showIcon />
      </div>
    );
  }

  const componentLabel =
    component.name || location.state?.componentLabel || `Компонент ID ${id}`;

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginTop: 0, marginBottom: 20 }}>
        {componentLabel}
      </Title>

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
              {component.image ? (
                <img
                  src={component.image}
                  alt={component.name || ''}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <Text type="secondary">Зображення не додано</Text>
              )}
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Пропозиції постачальників" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Інформація про використання">
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionComponentDetailPage;
