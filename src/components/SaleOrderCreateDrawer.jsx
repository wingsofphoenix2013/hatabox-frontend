import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Switch,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

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

  const [saving, setSaving] = useState(false);
  const [createdSaleOrder, setCreatedSaleOrder] = useState(null);
  const [usesCustomerGoods, setUsesCustomerGoods] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [responsiblePersonsLoading, setResponsiblePersonsLoading] =
    useState(false);

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [responsiblePersonOptions, setResponsiblePersonOptions] = useState([]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSaving(false);
      setOrganizationsLoading(false);
      setProductsLoading(false);
      setResponsiblePersonsLoading(false);
      setOrganizationOptions([]);
      setProductOptions([]);
      setResponsiblePersonOptions([]);
      setCreatedSaleOrder(null);
      setUsesCustomerGoods(false);
    }
  }, [open, form]);

  const handleCloseDrawer = () => {
    form.resetFields();
    setResponsiblePersonOptions([]);
    setCreatedSaleOrder(null);
    setUsesCustomerGoods(false);
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

  const loadResponsiblePersonOptions = async (organizationId) => {
    if (!organizationId) {
      setResponsiblePersonOptions([]);
      return;
    }

    try {
      setResponsiblePersonsLoading(true);

      const response = await api.get(
        `organization-person-assignments/?organization=${organizationId}&is_current=true`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : Array.isArray(response.data)
          ? response.data
          : [];

      setResponsiblePersonOptions(
        results.map((item) => ({
          value: item.person,
          label: `${item.person_full_name || '—'} — ${
            item.position_name || '—'
          }`,
        })),
      );
    } catch (err) {
      console.error('Failed to load responsible person options:', err);
      setResponsiblePersonOptions([]);
    } finally {
      setResponsiblePersonsLoading(false);
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

      const payload = {
        organization: values.organization,
        product: values.product,
        comment: values.comment || '',
      };

      if (values.customer_responsible_person) {
        payload.customer_responsible_person =
          values.customer_responsible_person;
      }

      const response = await api.post('sales-orders/', payload);

      message.success('Замовлення створено.');
      setCreatedSaleOrder(response.data);
    } catch (err) {
      console.error('Failed to create sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'organization',
        'product',
        'customer_responsible_person',
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
                    onChange={(value) => {
                      form.setFieldValue(
                        'customer_responsible_person',
                        undefined,
                      );
                      loadResponsiblePersonOptions(value);
                    }}
                  />
                </Form.Item>
              </div>
              <div>
                <Text style={compactLabelStyle}>
                  Відповідальний від замовника
                </Text>
                <Form.Item
                  name="customer_responsible_person"
                  style={{ marginBottom: 0 }}
                >
                  <Select
                    allowClear
                    placeholder={
                      form.getFieldValue('organization')
                        ? 'Оберіть відповідального'
                        : 'Спочатку оберіть замовника'
                    }
                    options={responsiblePersonOptions}
                    loading={responsiblePersonsLoading}
                    disabled={!form.getFieldValue('organization')}
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
                  <TextArea rows={2} placeholder="Коментар до замовлення" />
                </Form.Item>
              </div>

              {!createdSaleOrder && (
                <Flex justify="flex-end">
                  <Button type="primary" htmlType="submit" loading={saving}>
                    Створити замовлення
                  </Button>
                </Flex>
              )}
            </Flex>
          </Card>

          <Card
            title={
              <Flex justify="space-between" align="center" gap={12}>
                <span>2. Товар замовника</span>

                <Flex align="center" gap={8}>
                  <Text type="secondary">Використовуємо</Text>
                  <Switch
                    checked={usesCustomerGoods}
                    checkedChildren="Так"
                    unCheckedChildren="Ні"
                    disabled={!createdSaleOrder}
                    onChange={setUsesCustomerGoods}
                  />
                </Flex>
              </Flex>
            }
            style={{
              opacity: createdSaleOrder ? 1 : 0.55,
            }}
          >
            <Text type="secondary">
              Після створення замовлення тут буде налаштування товарів
              замовника.
            </Text>
          </Card>

          {createdSaleOrder && (
            <Flex justify="space-between" gap={8}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>
              <Button type="primary">
                {usesCustomerGoods ? 'Зберегти зміни' : 'Перевірка складу'}
              </Button>
            </Flex>
          )}
        </Flex>
      </Form>
    </Drawer>
  );
}

export default SaleOrderCreateDrawer;
