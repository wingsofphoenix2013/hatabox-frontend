import { useEffect, useState } from 'react';
import { CloseCircleOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Image,
  Input,
  Row,
  Select,
  Skeleton,
  Typography,
  message,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function VendorEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [form] = Form.useForm();

  const [vendor, setVendor] = useState(null);
  const [taxTypes, setTaxTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPage();
  }, [id]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const [vendorResponse, taxTypesResponse] = await Promise.all([
        api.get(`vendors/${id}/`),
        api.get('tax-types/'),
      ]);

      const vendorData = vendorResponse.data;
      const taxTypesData = Array.isArray(taxTypesResponse.data.results)
        ? taxTypesResponse.data.results
        : [];

      setVendor(vendorData);
      setTaxTypes(taxTypesData);

      form.setFieldsValue({
        legal_name: vendorData.legal_name || '',
        phone: vendorData.phone || '',
        email: vendorData.email || '',
        website: vendorData.website || '',
        tax_type: vendorData.tax_type || undefined,
        edrpou: vendorData.edrpou || '',
        ipn: vendorData.ipn || '',
      });
    } catch (err) {
      console.error('Failed to load vendor edit page:', err);
      setError('Не вдалося завантажити дані постачальника.');
      setVendor(null);
      setTaxTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/orders/vendors/${id}`, {
      state: {
        vendorLabel: vendor?.name,
        fromSearch: location.state?.fromSearch || '',
      },
    });
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      setError('');

      await api.patch(`vendors/${id}/`, {
        legal_name: values.legal_name,
        phone: values.phone,
        email: values.email,
        website: values.website,
        tax_type: values.tax_type,
        edrpou: values.edrpou,
        ipn: values.ipn,
      });

      message.success('Зміни збережено');

      navigate(`/orders/vendors/${id}`, {
        state: {
          vendorLabel: vendor?.name,
          fromSearch: location.state?.fromSearch || '',
        },
      });
    } catch (err) {
      console.error('Failed to save vendor:', err);
      setError('Не вдалося зберегти зміни.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !vendor) {
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
      <Form form={form} layout="vertical" onFinish={handleSave}>
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

          <Flex gap={8} wrap>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCancel}
            >
              Відміна
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={saving}
            >
              Зберегти
            </Button>
          </Flex>
        </Flex>

        {error && (
          <Alert
            type="error"
            description={error}
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

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
              <Form.Item
                label="Повна назва"
                name="legal_name"
                style={{ marginBottom: 20 }}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Номер телефона"
                name="phone"
                style={{ marginBottom: 20 }}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Адрес e-mail"
                name="email"
                style={{ marginBottom: 20 }}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Сайт"
                name="website"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Card>

            <Card title="Податкова інформація" style={{ marginBottom: 20 }}>
              <Form.Item
                label="Форма оподаткування"
                name="tax_type"
                style={{ marginBottom: 20 }}
              >
                <Select
                  placeholder="Оберіть форму оподаткування"
                  options={taxTypes.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Код ЄДРПОУ"
                name="edrpou"
                style={{ marginBottom: 20 }}
              >
                <Input />
              </Form.Item>

              <Form.Item label="Код ІПН" name="ipn" style={{ marginBottom: 0 }}>
                <Input />
              </Form.Item>
            </Card>

            <Card title="Постачувані комплектуючі">
              <Text type="secondary">Дані з’являться пізніше</Text>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card title="Історія">
              <Text type="secondary">Історія змін з’явиться пізніше</Text>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

export default VendorEditPage;
