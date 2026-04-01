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
  Select,
  Skeleton,
  Switch,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function ProductionComponentCreatePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    internal_code: '',
    name: '',
    description: '',
    category: null,
    unit: null,
    qr_item: false,
  });

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      setError('');

      const [categoriesResponse, unitsResponse] = await Promise.all([
        api.get('categories/'),
        api.get('units/'),
      ]);

      setCategories(
        Array.isArray(categoriesResponse.data.results)
          ? categoriesResponse.data.results
          : [],
      );

      setUnits(
        Array.isArray(unitsResponse.data.results)
          ? unitsResponse.data.results
          : [],
      );
    } catch (err) {
      console.error('Failed to load dictionaries:', err);
      setError('Не вдалося завантажити довідники для створення позиції.');
      setCategories([]);
      setUnits([]);
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

  const handleImageChange = ({ fileList }) => {
    const fileObj = fileList[0]?.originFileObj || null;
    setImageFile(fileObj);

    if (fileObj) {
      const previewUrl = URL.createObjectURL(fileObj);
      setImagePreview(previewUrl);
    } else {
      setImagePreview('');
    }
  };

  const handleCreate = async () => {
    if (!formData.internal_code.trim()) {
      message.error('Заповніть поле "Внутрішній код".');
      return;
    }

    if (!formData.name.trim()) {
      message.error('Заповніть поле "Назва".');
      return;
    }

    if (!formData.category) {
      message.error('Оберіть категорію.');
      return;
    }

    if (!formData.unit) {
      message.error('Оберіть одиницю вимірювання.');
      return;
    }

    try {
      setSaving(true);

      const payload = new FormData();
      payload.append('internal_code', formData.internal_code);
      payload.append('name', formData.name);
      payload.append('description', formData.description || '');
      payload.append('category', String(formData.category));
      payload.append('unit', String(formData.unit));
      payload.append('qr_item', String(formData.qr_item));
      payload.append('is_active', 'true');

      if (imageFile) {
        payload.append('image', imageFile);
      }

      const response = await api.post('items/', payload);

      message.success('Позицію створено.');
      navigate(`/production/components/${response.data.id}`);
    } catch (err) {
      console.error('Failed to create component:', err);
      message.error('Не вдалося створити позицію.');
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
            Нова позиція
          </Title>
          <Text type="secondary">Створення компонента</Text>
        </div>

        <Button type="primary" onClick={handleCreate} loading={saving}>
          Створити
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
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  preview={false}
                  style={{
                    maxWidth: '80%',
                    maxHeight: '80%',
                    objectFit: 'contain',
                    margin: '0 auto',
                    display: 'block',
                  }}
                />
              ) : (
                <Text type="secondary">Немає зображення</Text>
              )}
            </div>

            <Upload
              beforeUpload={() => false}
              maxCount={1}
              onChange={handleImageChange}
              showUploadList={{
                showPreviewIcon: false,
              }}
            >
              <Button icon={<UploadOutlined />}>Завантажити зображення</Button>
            </Upload>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">
              Статистика буде доступна після створення
            </Text>
          </Card>
        </Col>

        {/* Центральна колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            {renderField(
              'Внутрішній код *',
              <Input
                value={formData.internal_code}
                onChange={(e) => handleChange('internal_code', e.target.value)}
              />,
            )}

            {renderField(
              'Назва *',
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />,
            )}

            {renderField(
              'Опис',
              <TextArea
                rows={6}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />,
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
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Select
                      value={formData.category}
                      style={{ width: '100%' }}
                      placeholder="Оберіть категорію"
                      options={categories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      }))}
                      onChange={(value) => handleChange('category', value)}
                    />
                  </td>

                  <td
                    style={{
                      border: '1px solid #f0f0f0',
                      padding: '12px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Select
                      value={formData.unit}
                      style={{ width: '100%' }}
                      placeholder="Оберіть одиницю"
                      options={units.map((unit) => ({
                        value: unit.id,
                        label: `${unit.symbol} — ${unit.name}`,
                      }))}
                      onChange={(value) => handleChange('unit', value)}
                    />
                  </td>

                  <td
                    style={{
                      border: '1px solid #f0f0f0',
                      padding: '12px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Flex align="center" justify="center" gap={8}>
                      <Switch
                        checked={formData.qr_item}
                        onChange={(checked) => handleChange('qr_item', checked)}
                      />
                      <Text>{formData.qr_item ? 'Так' : 'Ні'}</Text>
                    </Flex>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">
              Історія з’явиться після створення позиції
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionComponentCreatePage;
