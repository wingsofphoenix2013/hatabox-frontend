import { useEffect, useState } from 'react';
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

function VendorDetailPage() {
  const { id } = useParams();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVendor();
  }, [id]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`vendors/${id}/`);
      setVendor(response.data);
    } catch (err) {
      console.error('Failed to load vendor:', err);
      setError('Не вдалося завантажити дані постачальника.');
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
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

  if (!vendor) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type="warning"
          description="Постачальника не знайдено."
          showIcon
        />
      </div>
    );
  }

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
            {vendor.name}
          </Title>
          <Text type="secondary">{vendor.legal_name || '—'}</Text>
        </div>

        <Button>Редагувати</Button>
      </Flex>

      <Row gutter={20} align="top">
        {/* Левая колонка */}
        <Col xs={24} lg={6}>
          <Card title="Лого" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        {/* Центральная колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>

          <Card title="Податкова інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>

          <Card title="Комплектуючі">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        {/* Правая колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Історія змін з’явиться пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default VendorDetailPage;
