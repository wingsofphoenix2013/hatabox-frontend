import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Typography,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatDateUa } from '../utils/orderFormatters';

const { Text } = Typography;
const { TextArea } = Input;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function SaleOrderCreateDrawer({ open, onClose }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSaving(false);
      setOrganizationsLoading(false);
      setProductsLoading(false);
      setOrganizationOptions([]);
      setProductOptions([]);
    }
  }, [open, form]);

  const handleCloseDrawer = () => {
    form.resetFields();
    onClose();
  };

  const loadOrganizationOptions = async (search = '') => {
    try {
      setOrganizationsLoading(true);

      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`organizations/?${params.toString()}`);
      const results = Array.isArray(response.data) ? response.data : [];

      setOrganizationOptions(
        results.map((item) => ({
          value: item.id,
          label: item.name || '—',
        })),
      );
    } catch (err) {
      console.error('Failed to load organization options:', err);
      setOrganizationOptions([]);
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const loadProductOptions = async (search = '') => {
    try {
      setProductsLoading(true);

      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`product-options/?${params.toString()}`);
      const results = Array.isArray(response.data) ? response.data : [];

      setProductOptions(
        results.map((item) => ({
          value: item.id,
          label: `${item.code || '—'} | ${item.product_family_name || '—'}`,
        })),
      );
    } catch (err) {
      console.error('Failed to load product options:', err);
      setProductOptions([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSaving(true);

      const response = await api.post('sales-orders/', {
        organization: values.organization,
        product: values.product,
        comment: values.comment || '',
      });

      message.success('Замовлення створено.');
      handleCloseDrawer();

      const orderLabel = `№ ${response.data.id} від ${formatDateUa(
        response.data.created_at,
      )}`;

      navigate(`/sales/orders/${response.data.id}`, {
        state: {
          orderLabel,
        },
      });
    } catch (err) {
      console.error('Failed to create sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'organization',
        'product',
        'comment',
      ]);

      message.error(backendMessage || 'Не вдалося створити замовлення.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Створення замовлення"
      placement="right"
      size="large"
      open={open}
      onClose={handleCloseDrawer}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Flex vertical gap={16}>
          <Card title="1. Основна інформація">
            <Flex vertical gap={14}>
              <div>
                <Text style={compactLabelStyle}>Замовник</Text>
                <Form.Item
                  name="organization"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: 'Оберіть замовника' }]}
                >
                  <Select
                    showSearch
                    placeholder="Почніть вводити назву організації"
                    options={organizationOptions}
                    loading={organizationsLoading}
                    filterOption={false}
                    onSearch={loadOrganizationOptions}
                    onFocus={() => loadOrganizationOptions()}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Продукція</Text>
                <Form.Item
                  name="product"
                  style={{ marginBottom: 0 }}
                  rules={[{ required: true, message: 'Оберіть продукцію' }]}
                >
                  <Select
                    showSearch
                    placeholder="Почніть вводити код або назву продукції"
                    options={productOptions}
                    loading={productsLoading}
                    filterOption={false}
                    onSearch={loadProductOptions}
                    onFocus={() => loadProductOptions()}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Коментар</Text>
                <Form.Item name="comment" style={{ marginBottom: 0 }}>
                  <TextArea rows={4} placeholder="Коментар до замовлення" />
                </Form.Item>
              </div>
            </Flex>
          </Card>

          <Flex justify="space-between" gap={8}>
            <Button onClick={handleCloseDrawer}>Закрити</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Створити замовлення
            </Button>
          </Flex>
        </Flex>
      </Form>
    </Drawer>
  );
}

export default SaleOrderCreateDrawer;
