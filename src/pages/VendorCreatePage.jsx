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
  Switch,
  Typography,
  Upload,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function VendorCreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [taxTypes, setTaxTypes] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTaxTypes();
  }, []);

  const loadTaxTypes = async () => {
    try {
      const response = await api.get('tax-types/');
      setTaxTypes(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load tax types:', err);
      setTaxTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/orders/vendors');
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      setError('');

      const formData = new FormData();

      formData.append('code', values.code || '');
      formData.append('name', values.name || '');
      formData.append('legal_name', values.legal_name || '');
      formData.append('phone', values.phone || '');
      formData.append('email', values.email || '');
      formData.append('website', values.website || '');
      formData.append('vat', values.vat ? 'true' : 'false');
      formData.append('tax_type', values.tax_type || '');
      formData.append('edrpou', values.edrpou || '');
      formData.append('ipn', values.ipn || '');
      formData.append('is_active', true);

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await api.post('vendors/', formData);

      message.success('Постачальника створено');

      navigate('/orders/vendors');
    } catch (err) {
      console.error('Failed to create vendor:', err);
      setError('Не вдалося створити постачальника.');
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

  return (
    <div style={{ padding: 20 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{ vat: false }}
      >
        <Flex
          justify="space-between"
          align="flex-start"
          gap={16}
          style={{ marginBottom: 20 }}
        >
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 4 }}>
              Новий постачальник
            </Title>
            <Text type="secondary">Заповніть дані нового постачальника</Text>
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
              <Upload
                beforeUpload={(file) => {
                  setLogoFile(file);
                  return false;
                }}
                maxCount={1}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Завантажити логотип</Button>
              </Upload>

              {logoFile && (
                <div style={{ marginTop: 16 }}>
                  <Image
                    src={URL.createObjectURL(logoFile)}
                    alt="preview"
                    width="100%"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </Card>

            <Card title="Статистика">
              <Text type="secondary">Дані з’являться пізніше</Text>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Form.Item label="Код (довільно, латиница)" name="code">
                <Input />
              </Form.Item>

              <Form.Item label="Коротка назва" name="name">
                <Input />
              </Form.Item>

              <Form.Item label="Повна назва" name="legal_name">
                <Input />
              </Form.Item>

              <Form.Item label="Номер телефона повний" name="phone">
                <Input />
              </Form.Item>

              <Form.Item label="Адрес e-mail" name="email">
                <Input />
              </Form.Item>

              <Form.Item label="Сайт" name="website">
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Card>

            <Card title="Податкова інформація" style={{ marginBottom: 20 }}>
              <Form.Item label="Форма оподаткування" name="tax_type">
                <Select
                  options={taxTypes.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                />
              </Form.Item>

              <Form.Item label="Код ЄДРПОУ" name="edrpou">
                <Input />
              </Form.Item>

              <Form.Item label="Код ІПН" name="ipn">
                <Input />
              </Form.Item>

              <Form.Item label="Платник ПДВ" name="vat" valuePropName="checked">
                <Switch />
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

export default VendorCreatePage;
