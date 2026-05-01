import { useEffect, useState } from 'react';
import { ApartmentOutlined, SwapOutlined } from '@ant-design/icons';
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

function WarehouseStoragePlaceDetailPage() {
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

      const response = await api.get(
        `warehouse-storage-places/${id}/detail-view/`,
      );

      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse storage place detail page:', err);
      setError('Не вдалося завантажити дані місця зберігання.');
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

  if (!data?.storage_place) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type="warning"
          description="Місце зберігання не знайдено."
          showIcon
        />
      </div>
    );
  }

  const directStock = data.direct_stock || [];
  const directReservedStock = data.direct_reserved_stock || [];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Інформація про місце зберігання
          </Title>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Місце зберігання" style={{ marginBottom: 20 }}>
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
                <Text type="secondary">Дані з’являться пізніше</Text>
              </div>
            </Card>

            <Card title="QR код" style={{ marginBottom: 20 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1.414 / 1',
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
                <Text type="secondary">Дані з’являться пізніше</Text>
              </div>
            </Card>

            <Card title="Навігація">
              <Flex vertical gap={8}>
                <Button
                  block
                  icon={<ApartmentOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення місць зберігання
                </Button>

                <Button
                  block
                  icon={<SwapOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення товару
                </Button>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані з’являться пізніше</Text>
            </Card>

            {directStock.length > 0 && (
              <Card
                title="Доступні товари у місці зберігання"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Дані з’являться пізніше</Text>
              </Card>
            )}

            {directReservedStock.length > 0 && (
              <Card
                title="Зарезервовані товари у місці зберігання"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Дані з’являться пізніше</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Flex>
    </div>
  );
}

export default WarehouseStoragePlaceDetailPage;
