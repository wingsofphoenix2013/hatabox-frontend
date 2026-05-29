import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PrinterOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Card,
  Col,
  Flex,
  Row,
  Popconfirm,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
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
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex vertical gap={4}>
          <Flex align="center" gap={12} wrap>
            <Title level={2} style={{ margin: 0 }}>
              {`${product.product_family_code || '—'} v.${
                product.version || '—'
              }`}
            </Title>

            <Tag
              color={getDevelopmentStatusTagColor(product.development_status)}
              style={{
                fontSize: 20,
                lineHeight: '32px',
                paddingInline: 14,
                paddingBlock: 6,
                borderRadius: 10,
                marginInlineEnd: 0,
              }}
            >
              {product.development_status_display ||
                product.development_status ||
                '—'}
            </Tag>
          </Flex>

          <Text type="secondary">{product.product_family_name || '—'}</Text>
        </Flex>
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
            <Flex vertical gap={8}>
              {product.development_status === 'in_development' && (
                <Button block type="primary" icon={<CheckCircleOutlined />}>
                  Завершити розробку
                </Button>
              )}

              {product.development_status === 'finished' &&
                !product.is_base_modification && (
                  <Button block type="primary" icon={<CheckCircleOutlined />}>
                    Зробити базовою версією
                  </Button>
                )}

              {!(
                product.development_status === 'finished' &&
                product.is_base_modification
              ) && <Divider dashed style={{ margin: '8px 0' }} />}

              {product.development_status === 'in_development' && (
                <Button
                  block
                  icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                >
                  Додати етап
                </Button>
              )}

              <Button
                block
                icon={<FileTextOutlined style={{ color: '#1677ff' }} />}
              >
                Загальна комплектація
              </Button>

              <Button
                block
                icon={<FileImageOutlined style={{ color: '#1677ff' }} />}
              >
                Галерея продукту
              </Button>

              <Button
                block
                icon={<PrinterOutlined style={{ color: '#1677ff' }} />}
              >
                Роздрукувати комплектацію
              </Button>

              {product.development_status === 'in_development' && (
                <>
                  <Divider dashed style={{ margin: '8px 0' }} />

                  <Popconfirm
                    title="Видалити версію продукту?"
                    description="Цю дію неможливо скасувати. Версія продукту буде видалена без можливості відновлення."
                    okText="Так, видалити"
                    cancelText="Скасувати"
                    okButtonProps={{ danger: true }}
                  >
                    <Button block danger icon={<StopOutlined />}>
                      Видалити версію
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Flex>
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
    </div>
  );
}

export default ProductionProductDetailPage;
