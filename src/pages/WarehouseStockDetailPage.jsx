import { useEffect, useState } from 'react';
import { SwapOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Flex,
  Image,
  Row,
  Skeleton,
  Typography,
} from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function WarehouseStockDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`warehouse-stock-detail/${id}/`);
      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse stock detail page:', err);
      setError('Не вдалося завантажити дані складського залишку.');
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

  if (!data?.header) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Позицію не знайдено." showIcon />
      </div>
    );
  }

  const header = data.header;
  const stockRows = data.stock_rows || [];
  const reservedStockRows = data.reserved_stock_rows || [];
  const pendingIntakeRows = data.pending_intake_rows || [];
  const incomingRows = data.incoming_rows || [];
  const imageUrl = header.image || '';

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            {header.inventory_item_name || '—'}
          </Title>

          <Text type="secondary">
            {header.inventory_item_category_name || '—'}
          </Text>
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
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={header.inventory_item_name || 'Inventory item image'}
                    preview={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Text type="secondary">Зображення відсутнє</Text>
                )}
              </div>
            </Card>

            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                <Button
                  block
                  icon={<SwapOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => setIsMovementDrawerOpen(true)}
                >
                  Переміщення товару
                </Button>
              </Flex>
            </Card>

            <Card title="Історія">
              <Text type="secondary">Дані з’являться пізніше.</Text>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Вміст буде додано пізніше.</Text>
            </Card>

            {stockRows.length > 0 && (
              <Card title="Доступно на складах" style={{ marginBottom: 20 }}>
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            {reservedStockRows.length > 0 && (
              <Card
                title="Зарезервовано на складах"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            {pendingIntakeRows.length > 0 && (
              <Card title="Первинне оформлення" style={{ marginBottom: 20 }}>
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            {incomingRows.length > 0 && (
              <Card title="Закупівля та очікування">
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}
          </Col>
        </Row>
      </Flex>

      <Drawer
        title="Переміщення товару"
        open={isMovementDrawerOpen}
        onClose={() => setIsMovementDrawerOpen(false)}
        width={520}
      >
        <Text>Переміщення товару</Text>
      </Drawer>
    </div>
  );
}

export default WarehouseStockDetailPage;
