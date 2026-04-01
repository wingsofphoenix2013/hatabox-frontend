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
  Select,
  Switch,
} from 'antd';
import { QrcodeOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ProductionComponentDetailPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: null,
    category_name: '',
    unit: null,
    unit_name: '',
    unit_symbol: '',
    qr_item: false,
    description: '',
    internal_code: '',
    image: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadItem();
    loadCategories();
    loadUnits();
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await api.get('categories/');
      setCategories(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await api.get('units/');
      setUnits(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load units:', err);
      setUnits([]);
    }
  };

  const loadItem = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`items/${id}/`);
      const data = response.data;

      setItem(data);
      setFormData({
        name: data.name || '',
        category: data.category ?? null,
        category_name: data.category_name || '',
        unit: data.unit ?? null,
        unit_name: data.unit_name || '',
        unit_symbol: data.unit_symbol || '',
        qr_item: !!data.qr_item,
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
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
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
          <Card title="Додаткова інформація">
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    Категорія
                  </th>
                  <th
                    style={{
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    Одиниця вимірювання
                  </th>
                  <th
                    style={{
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      padding: '10px 12px',
                      textAlign: 'center',
                      fontWeight: 600,
                    }}
                  >
                    <Flex align="center" justify="center" gap={6}>
                      <QrcodeOutlined />
                      <span>Позиція з QR</span>
                    </Flex>
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    style={{
                      border: '1px solid #f0f0f0',
                      padding: '12px',
                      verticalAlign: 'middle',
                    }}
                  >
                    {isEditing ? (
                      <Select
                        value={formData.category}
                        style={{ width: '100%' }}
                        options={categories.map((category) => ({
                          value: category.id,
                          label: category.name,
                        }))}
                        onChange={(value) => {
                          const selected = categories.find(
                            (c) => c.id === value,
                          );
                          setFormData((prev) => ({
                            ...prev,
                            category: value,
                            category_name: selected ? selected.name : '',
                          }));
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Text>{formData.category_name || '—'}</Text>
                      </div>
                    )}
                  </td>

                  <td
                    style={{
                      border: '1px solid #f0f0f0',
                      padding: '12px',
                      verticalAlign: 'middle',
                    }}
                  >
                    {isEditing ? (
                      <Select
                        value={formData.unit}
                        style={{ width: '100%' }}
                        options={units.map((unit) => ({
                          value: unit.id,
                          label: `${unit.symbol} — ${unit.name}`,
                        }))}
                        onChange={(value) => {
                          const selected = units.find((u) => u.id === value);
                          setFormData((prev) => ({
                            ...prev,
                            unit: value,
                            unit_name: selected ? selected.name : '',
                            unit_symbol: selected ? selected.symbol : '',
                          }));
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Text>
                          {formData.unit_symbol && formData.unit_name
                            ? `${formData.unit_symbol} — ${formData.unit_name}`
                            : '—'}
                        </Text>
                      </div>
                    )}
                  </td>

                  <td
                    style={{
                      border: '1px solid #f0f0f0',
                      padding: '12px',
                      verticalAlign: 'middle',
                    }}
                  >
                    {isEditing ? (
                      <Flex align="center" justify="center" gap={8}>
                        <Switch
                          checked={formData.qr_item}
                          onChange={(checked) =>
                            handleChange('qr_item', checked)
                          }
                        />
                        <Text>{formData.qr_item ? 'Так' : 'Ні'}</Text>
                      </Flex>
                    ) : (
                      <Flex align="center" justify="center" gap={8}>
                        <Text>{formData.qr_item ? '✅ Так' : '❌ Ні'}</Text>
                      </Flex>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
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
