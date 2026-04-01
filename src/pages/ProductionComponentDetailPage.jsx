import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Image,
  Input,
  Row,
  Skeleton,
  Typography,
} from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ProductionComponentDetailPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_name: '',
    unit_symbol: '',
    description: '',
    internal_code: '',
    image: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`items/${id}/`);
      const data = response.data;

      setItem(data);
      setFormData({
        name: data.name || '',
        category_name: data.category_name || '',
        unit_symbol: data.unit_symbol || '',
        description: data.description || '',
        internal_code: data.internal_code || '',
        image: data.image || '',
      });
    } catch (err) {
      console.error('Failed to load component detail:', err);
      setError('Не вдалося завантажити дані компонента.');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  if (!item) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Компонент не знайдено." showIcon />
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
            {formData.name || '—'}
          </Title>
          <Text type="secondary">
            Внутрішній код: {formData.internal_code || '—'}
          </Text>
        </div>

        <Button type="primary" onClick={handleToggleEdit}>
          {isEditing ? 'Зберегти' : 'Редагувати'}
        </Button>
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
                background: '#ffffff', // ← белый фон
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {formData.image ? (
                <Image
                  src={formData.image}
                  alt={formData.name}
                  preview
                  style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain',
                    margin: '0 auto', // ← ключ к центрированию
                    display: 'block', // ← фикс поведения inline-image
                  }}
                />
              ) : (
                <Text type="secondary">Немає зображення</Text>
              )}
            </div>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        {/* Центральна колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація">
            {renderField(
              'Назва',
              isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              ) : (
                <Paragraph style={{ marginBottom: 0 }}>
                  {formData.name || '—'}
                </Paragraph>
              ),
            )}

            {renderField(
              'Внутрішній код',
              <Paragraph style={{ marginBottom: 0 }}>
                {formData.internal_code || '—'}
              </Paragraph>,
            )}

            {renderField(
              'Категорія',
              isEditing ? (
                <Input
                  value={formData.category_name}
                  onChange={(e) =>
                    handleChange('category_name', e.target.value)
                  }
                />
              ) : (
                <Paragraph style={{ marginBottom: 0 }}>
                  {formData.category_name || '—'}
                </Paragraph>
              ),
            )}

            {renderField(
              'Од. вим.',
              isEditing ? (
                <Input
                  value={formData.unit_symbol}
                  onChange={(e) => handleChange('unit_symbol', e.target.value)}
                />
              ) : (
                <Paragraph style={{ marginBottom: 0 }}>
                  {formData.unit_symbol || '—'}
                </Paragraph>
              ),
            )}

            {renderField(
              'Опис',
              isEditing ? (
                <TextArea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              ) : (
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {formData.description || '—'}
                </Paragraph>
              ),
            )}
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Історія змін з’явиться пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionComponentDetailPage;
