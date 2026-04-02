import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Typography,
  message,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ProductionProductStepCreatePage() {
  const { id } = useParams(); // id продукта
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [steps, setSteps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sort_order: 1,
    description: '',
  });

  useEffect(() => {
    loadCreatePage();
  }, [id]);

  const loadCreatePage = async () => {
    try {
      setLoading(true);
      setError('');

      const [productResponse, stepsResponse] = await Promise.all([
        api.get(`products/${id}/`),
        api.get(`product-steps/?product=${id}`),
      ]);

      const productData = productResponse.data;
      const stepsData = Array.isArray(stepsResponse.data.results)
        ? stepsResponse.data.results
        : [];

      setProduct(productData);
      setSteps(stepsData);

      const maxSortOrder = stepsData.length
        ? Math.max(...stepsData.map((step) => Number(step.sort_order) || 0))
        : 0;

      setFormData({
        name: '',
        sort_order: maxSortOrder + 1,
        description: '',
      });
    } catch (err) {
      console.error('Failed to load step create page:', err);
      setError('Не вдалося завантажити дані для створення етапу.');
      setProduct(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      message.error('Заповніть поле "Назва".');
      return;
    }

    if (!formData.sort_order || Number(formData.sort_order) < 1) {
      message.error('Вкажіть коректний порядок етапу.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        product: Number(id),
        name: formData.name.trim(),
        sort_order: Number(formData.sort_order),
        description: formData.description || '',
      };

      const response = await api.post('product-steps/', payload);

      message.success('Етап створено.');
      navigate(`/production/product-steps/${response.data.id}`);
    } catch (err) {
      console.error('Failed to create step:', err);
      message.error('Не вдалося створити етап.');
    } finally {
      setSaving(false);
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
            Новий етап
          </Title>
          <Text type="secondary">{productDisplayName}</Text>
        </div>

        <Button type="primary" onClick={handleCreate} loading={saving}>
          Створити етап
        </Button>
      </Flex>

      <Row gutter={20} align="top">
        {/* Левая колонка */}
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
            <Text type="secondary">Блок буде доступний після створення</Text>
          </Card>
        </Col>

        {/* Центральная колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація">
            {renderField(
              'Назва *',
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Введіть назву етапу"
              />,
            )}

            {renderField(
              'Порядок етапу *',
              <InputNumber
                min={1}
                value={formData.sort_order}
                onChange={(value) => handleChange('sort_order', value)}
                style={{ width: 180 }}
              />,
            )}

            {renderField(
              'Опис',
              <TextArea
                rows={6}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Введіть опис етапу"
              />,
            )}
          </Card>

          {steps.length > 0 && (
            <Card title="Поточні етапи продукту" style={{ marginTop: 20 }}>
              {steps.map((step) => (
                <div key={step.id} style={{ marginBottom: 12 }}>
                  <Paragraph style={{ marginBottom: 0 }}>
                    <strong>
                      {step.sort_order}. {step.name}
                    </strong>
                  </Paragraph>
                </div>
              ))}
            </Card>
          )}
        </Col>

        {/* Правая колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepCreatePage;
