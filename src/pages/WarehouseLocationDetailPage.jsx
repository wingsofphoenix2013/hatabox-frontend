import { useEffect, useState } from 'react';
import {
  ApartmentOutlined,
  PlusOutlined,
  SwapOutlined,
} from '@ant-design/icons';
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
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function WarehouseLocationDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`warehouse-locations/${id}/detail-view/`);
      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse location detail page:', err);
      setError('Не вдалося завантажити дані локації.');
      setData(null);
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

  if (error && !data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!data?.location) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Локацію не знайдено." showIcon />
      </div>
    );
  }

  const location = data.location;
  const directStock = data.direct_stock || [];
  const directReservedStock = data.direct_reserved_stock || [];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Інформація про локацію
          </Title>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати місце зберігання
          </Button>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Локація" style={{ marginBottom: 20 }}>
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
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#595959',
                  }}
                >
                  {location.code || '—'}
                </span>
              </div>
            </Card>

            <Card title="Навігація">
              <Flex vertical gap={8}>
                <Button block icon={<ApartmentOutlined />}>
                  Переміщення місць зберігання
                </Button>

                <Button block icon={<SwapOutlined />}>
                  Переміщення товару
                </Button>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Вміст буде додано пізніше.</Text>
            </Card>

            {directStock.length > 0 && (
              <Card
                title="Доступні товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            {directReservedStock.length > 0 && (
              <Card
                title="Зарезервовані товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            <Card title="Ієрархія місць зберігання">
              <Text type="secondary">Вміст буде додано пізніше.</Text>
            </Card>
          </Col>
        </Row>
      </Flex>
    </div>
  );
}

export default WarehouseLocationDetailPage;
