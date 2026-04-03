import { useEffect, useState } from 'react';
import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Image,
  Row,
  Skeleton,
  Table,
  Typography,
  message,
} from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

const formatPhoneUa = (value) => {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }

  return value;
};

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

  const handleCopy = async (value, successText = 'Скопійовано') => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      message.success(successText);
    } catch {
      message.error('Не вдалося скопіювати');
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

  const taxInfoColumns = [
    {
      title: 'Форма оподаткування',
      dataIndex: 'tax_type_name',
      key: 'tax_type_name',
      render: (value) => value || '—',
    },
    {
      title: 'Код ЄДРПОУ',
      dataIndex: 'edrpou',
      key: 'edrpou',
      align: 'center',
      render: (value) => {
        if (!value) return '—';

        return (
          <Flex align="center" justify="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => handleCopy(value, 'Код ЄДРПОУ скопійовано')}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Код ІПН',
      dataIndex: 'ipn',
      key: 'ipn',
      align: 'center',
      render: (value) => {
        if (!value) return '—';

        return (
          <Flex align="center" justify="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => handleCopy(value, 'Код ІПН скопійовано')}
            />
          </Flex>
        );
      },
    },
  ];

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

        <Button icon={<EditOutlined style={{ color: '#1677ff' }} />}>
          Редагувати
        </Button>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Лого" style={{ marginBottom: 20 }}>
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
              }}
            >
              {vendor.logo ? (
                <Image
                  src={vendor.logo}
                  alt={vendor.name}
                  width="100%"
                  height="100%"
                  preview
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <Text type="secondary">Дані з’являться пізніше</Text>
              )}
            </div>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            {renderField(
              'Повна назва',
              <Paragraph style={{ marginBottom: 0 }}>
                {vendor.legal_name || '—'}
              </Paragraph>,
            )}

            {renderField(
              'Номер телефона',
              <Paragraph style={{ marginBottom: 0 }}>
                {formatPhoneUa(vendor.phone)}
              </Paragraph>,
            )}

            {renderField(
              'Адрес e-mail',
              vendor.email ? (
                <Flex align="center" gap={6}>
                  <span>{vendor.email}</span>
                  <CopyOutlined
                    style={{ color: '#8c8c8c', cursor: 'pointer' }}
                    onClick={() =>
                      handleCopy(vendor.email, 'E-mail скопійовано')
                    }
                  />
                </Flex>
              ) : (
                <Paragraph style={{ marginBottom: 0 }}>—</Paragraph>
              ),
            )}
          </Card>

          <Card title="Податкова інформація" style={{ marginBottom: 20 }}>
            <Table
              columns={taxInfoColumns}
              dataSource={[vendor]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Комплектуючі">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

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
