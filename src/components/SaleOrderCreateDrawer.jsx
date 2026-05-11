import { useEffect, useState } from 'react';
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleFilled,
  DeleteOutlined,
  InfoCircleFilled,
  SaveOutlined,
  WarningFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Form,
  Input,
  Popconfirm,
  Select,
  Spin,
  Switch,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';

const { Text } = Typography;
const { TextArea } = Input;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function SaleOrderCreateDrawer({ open, onClose, onCreated }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [createdSaleOrder, setCreatedSaleOrder] = useState(null);
  const [saleOrderComponents, setSaleOrderComponents] = useState([]);
  const [usesCustomerGoods, setUsesCustomerGoods] = useState(false);

  const [componentSearchText, setComponentSearchText] = useState('');
  const [debouncedComponentSearchText, setDebouncedComponentSearchText] =
    useState('');
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [customerComponents, setCustomerComponents] = useState([]);
  const [savingCustomerComponents, setSavingCustomerComponents] =
    useState(false);

  const [confirmingOrder, setConfirmingOrder] = useState(false);

  const [confirmationCheckStarted, setConfirmationCheckStarted] =
    useState(false);
  const [confirmationLoading, setConfirmationLoading] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState(null);

  const isMainInfoLocked = Boolean(createdSaleOrder);

  const isCustomerComponentsLocked =
    confirmationCheckStarted && confirmationLoading;
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [responsiblePersonsLoading, setResponsiblePersonsLoading] =
    useState(false);

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [responsiblePersonOptions, setResponsiblePersonOptions] = useState([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedComponentSearchText(componentSearchText);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [componentSearchText]);

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
      setSaleOrderComponents([]);
      setUsesCustomerGoods(false);
      setComponentSearchText('');
      setDebouncedComponentSearchText('');
      setSelectedComponentId(null);
      setCustomerComponents([]);
      setSavingCustomerComponents(false);
      setConfirmingOrder(false);

      setConfirmationCheckStarted(false);
      setConfirmationLoading(false);
      setConfirmationStatus(null);
    }
  }, [open, form]);

  const handleCloseDrawer = () => {
    form.resetFields();
    setResponsiblePersonOptions([]);
    setCreatedSaleOrder(null);
    setSaleOrderComponents([]);
    setUsesCustomerGoods(false);
    setComponentSearchText('');
    setDebouncedComponentSearchText('');
    setSelectedComponentId(null);
    setCustomerComponents([]);
    setSavingCustomerComponents(false);
    setConfirmingOrder(false);

    setConfirmationCheckStarted(false);
    setConfirmationLoading(false);
    setConfirmationStatus(null);
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

  const availableComponentOptions = saleOrderComponents
    .filter(
      (item) =>
        !customerComponents.some((selectedItem) => selectedItem.id === item.id),
    )
    .filter((item) => {
      if (!debouncedComponentSearchText.trim()) return true;

      const normalizedSearch = debouncedComponentSearchText.toLowerCase();

      return (
        String(item.inv_item_name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(item.inv_item_code || '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    })
    .map((item) => ({
      value: item.id,
      label: `${item.inv_item_name || '—'} | ${formatQuantity(item.quantity)}`,
    }));

  const resetConfirmationCheck = () => {
    setConfirmationCheckStarted(false);
    setConfirmationLoading(false);
    setConfirmationStatus(null);
  };

  const handleAddCustomerComponent = () => {
    if (!selectedComponentId || isCustomerComponentsLocked) return;

    const component = saleOrderComponents.find(
      (item) => item.id === selectedComponentId,
    );

    if (!component) return;

    setCustomerComponents((prev) => [...prev, component]);

    setSelectedComponentId(null);
    setComponentSearchText('');
    setDebouncedComponentSearchText('');
    resetConfirmationCheck();
  };

  const handleDeleteCustomerComponent = (componentId) => {
    if (isCustomerComponentsLocked) return;

    setCustomerComponents((prev) =>
      prev.filter((item) => item.id !== componentId),
    );
    resetConfirmationCheck();
  };

  const handleSaveCustomerComponents = async () => {
    if (!createdSaleOrder?.id) return;

    try {
      setSavingCustomerComponents(true);

      await api.post(
        `sales-orders/${createdSaleOrder.id}/set-customer-components/`,
        {
          component_ids: customerComponents.map((item) => item.id),
        },
      );

      const componentsResponse = await api.get(
        `sales-orders/${createdSaleOrder.id}/components/`,
      );

      setSaleOrderComponents(
        Array.isArray(componentsResponse.data) ? componentsResponse.data : [],
      );
      message.success('Компоненти замовника збережено.');
    } catch (err) {
      console.error('Failed to save customer components:', err);

      message.error('Не вдалося зберегти компоненти замовника.');
      return;
    } finally {
      setSavingCustomerComponents(false);
    }

    await handleCheckConfirmationStatus();
  };

  const handleConfirmOrder = async () => {
    if (!createdSaleOrder?.id) return;

    try {
      setConfirmingOrder(true);

      await api.post(`sales-orders/${createdSaleOrder.id}/confirm/`, {});

      message.success('Замовлення підтверджено.');

      handleCloseDrawer();

      navigate(`/sales/orders/${createdSaleOrder.id}`);
    } catch (err) {
      console.error('Failed to confirm sale order:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(backendMessage || 'Не вдалося підтвердити замовлення.');
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleCheckConfirmationStatus = async () => {
    if (!createdSaleOrder?.id) return;

    try {
      setConfirmationCheckStarted(true);
      setConfirmationLoading(true);

      const response = await api.get(
        `sales-orders/${createdSaleOrder.id}/confirmation-status/`,
      );

      setConfirmationStatus(response.data);
    } catch (err) {
      console.error('Failed to check confirmation status:', err);

      message.error('Не вдалося перевірити можливість підтвердження.');
    } finally {
      setConfirmationLoading(false);
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

      const componentsResponse = await api.get(
        `sales-orders/${response.data.id}/components/`,
      );

      message.success('Замовлення створено.');
      setCreatedSaleOrder(response.data);
      setSaleOrderComponents(
        Array.isArray(componentsResponse.data) ? componentsResponse.data : [],
      );

      if (onCreated) {
        await onCreated();
      }
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
                    disabled={isMainInfoLocked}
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
                    disabled={
                      !form.getFieldValue('organization') || isMainInfoLocked
                    }
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
                    disabled={isMainInfoLocked}
                    onSearch={loadProductOptions}
                    onFocus={() => loadProductOptions()}
                  />
                </Form.Item>
              </div>

              <div>
                <Text style={compactLabelStyle}>Коментар</Text>
                <Form.Item name="comment" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    placeholder="Коментар до замовлення"
                    disabled={isMainInfoLocked}
                  />
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

          {(!confirmationCheckStarted || usesCustomerGoods) && (
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
              {!createdSaleOrder ? (
                <Text type="secondary">
                  Після створення замовлення тут буде налаштування товарів
                  замовника.
                </Text>
              ) : !usesCustomerGoods ? (
                <Text type="secondary">
                  Товари замовника не використовуються.
                </Text>
              ) : (
                <Flex vertical gap={16}>
                  <Flex align="center" gap={10}>
                    <Select
                      showSearch
                      allowClear
                      placeholder="Почніть вводити назву компонента"
                      style={{ flex: 1 }}
                      value={selectedComponentId}
                      options={availableComponentOptions}
                      filterOption={false}
                      searchValue={componentSearchText}
                      disabled={isCustomerComponentsLocked}
                      onSearch={setComponentSearchText}
                      onChange={setSelectedComponentId}
                      onClear={() => {
                        setSelectedComponentId(null);
                        setComponentSearchText('');
                        setDebouncedComponentSearchText('');
                      }}
                    />

                    <SaveOutlined
                      style={{
                        color:
                          selectedComponentId && !isCustomerComponentsLocked
                            ? '#52c41a'
                            : '#bfbfbf',
                        fontSize: 20,
                        cursor:
                          selectedComponentId && !isCustomerComponentsLocked
                            ? 'pointer'
                            : 'not-allowed',
                      }}
                      onClick={
                        selectedComponentId && !isCustomerComponentsLocked
                          ? handleAddCustomerComponent
                          : undefined
                      }
                    />
                  </Flex>

                  <Flex vertical gap={10}>
                    <Text strong>Очікуємо від замовника</Text>

                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={customerComponents}
                      locale={{
                        emptyText: 'Компоненти ще не обрані.',
                      }}
                      columns={[
                        {
                          title: '№',
                          key: 'index',
                          width: 60,
                          align: 'center',
                          render: (_, __, index) => index + 1,
                        },
                        {
                          title: 'Назва',
                          dataIndex: 'inv_item_name',
                          key: 'inv_item_name',
                          render: (value) => value || '—',
                        },
                        {
                          title: 'К-сть',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          width: 120,
                          align: 'center',
                          render: (value) => formatQuantity(value),
                        },
                        {
                          title: 'Дії',
                          key: 'actions',
                          width: 80,
                          align: 'center',
                          render: (_, record) => (
                            <DeleteOutlined
                              style={{
                                color: isCustomerComponentsLocked
                                  ? '#bfbfbf'
                                  : '#ff4d4f',
                                cursor: isCustomerComponentsLocked
                                  ? 'not-allowed'
                                  : 'pointer',
                                fontSize: 16,
                              }}
                              onClick={
                                isCustomerComponentsLocked
                                  ? undefined
                                  : () =>
                                      handleDeleteCustomerComponent(record.id)
                              }
                            />
                          ),
                        },
                      ]}
                    />
                  </Flex>
                </Flex>
              )}
            </Card>
          )}

          {confirmationCheckStarted && (
            <Card
              title={`${
                usesCustomerGoods ? '3' : '2'
              }. Перевірка товарів замовника`}
            >
              {confirmationLoading ? (
                <Flex
                  vertical
                  align="center"
                  justify="center"
                  gap={12}
                  style={{ padding: '28px 0' }}
                >
                  <Spin size="large" />
                  <Text type="secondary">
                    Перевіряємо наявність товарів замовника...
                  </Text>
                </Flex>
              ) : confirmationStatus ? (
                <Flex vertical gap={14}>
                  <Flex align="flex-end" gap={10}>
                    <Text strong style={{ fontSize: 18 }}>
                      Компоненти від замовника отримано
                    </Text>

                    <div
                      style={{
                        flex: 1,
                        borderBottom: '1px dotted #262626',
                        transform: 'translateY(-5px)',
                      }}
                    />

                    <Flex align="center" gap={8}>
                      {confirmationStatus.can_confirm ? (
                        <CheckCircleFilled
                          style={{ color: '#52c41a', fontSize: 22 }}
                        />
                      ) : (
                        <CloseCircleFilled
                          style={{ color: '#ff4d4f', fontSize: 22 }}
                        />
                      )}

                      <Text strong style={{ fontSize: 18 }}>
                        {confirmationStatus.can_confirm ? 'Так' : 'Ні'}
                      </Text>
                    </Flex>
                  </Flex>

                  {confirmationStatus.can_confirm === false && (
                    <Alert
                      type="warning"
                      showIcon
                      icon={<InfoCircleFilled />}
                      message="Замовлення не може бути підтверджене: не вистачає товарів замовника."
                    />
                  )}

                  <Text strong>Товари замовника</Text>

                  <Table
                    rowKey="component_id"
                    size="small"
                    pagination={false}
                    dataSource={confirmationStatus.missing_components || []}
                    columns={[
                      {
                        title: 'Назва',
                        key: 'name',
                        render: (_, record) =>
                          `${record.inv_item_name || '—'} | ${
                            record.inv_item_code || '—'
                          }`,
                      },
                      {
                        title: 'Потрібно',
                        dataIndex: 'required_quantity',
                        key: 'required_quantity',
                        width: 120,
                        align: 'center',
                        render: (value) => formatQuantity(value),
                      },
                      {
                        title: 'Наявно',
                        dataIndex: 'available_quantity',
                        key: 'available_quantity',
                        width: 120,
                        align: 'center',
                        render: (value) => formatQuantity(value),
                      },
                      {
                        title: 'Дефіцит',
                        dataIndex: 'missing_quantity',
                        key: 'missing_quantity',
                        width: 120,
                        align: 'center',
                        render: (value) => formatQuantity(value),
                      },
                    ]}
                    locale={{
                      emptyText: 'Дефіцит товарів замовника не виявлено.',
                    }}
                  />
                </Flex>
              ) : (
                <Text type="secondary">Дані перевірки ще не отримані.</Text>
              )}
            </Card>
          )}

          {createdSaleOrder && !confirmationCheckStarted && (
            <Flex justify="space-between" gap={8}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>
              <Tooltip
                title={
                  usesCustomerGoods && selectedComponentId
                    ? 'Спочатку потрібно зберегти обраний компонент до списку.'
                    : ''
                }
              >
                <div>
                  <Button
                    type="primary"
                    loading={savingCustomerComponents}
                    disabled={usesCustomerGoods && Boolean(selectedComponentId)}
                    onClick={
                      usesCustomerGoods
                        ? handleSaveCustomerComponents
                        : handleCheckConfirmationStatus
                    }
                  >
                    {usesCustomerGoods ? 'Зберегти зміни' : 'Перевірка складу'}
                  </Button>
                </div>
              </Tooltip>
            </Flex>
          )}

          {confirmationCheckStarted && (
            <Flex justify="space-between" gap={8}>
              <Button onClick={handleCloseDrawer}>Закрити</Button>

              {confirmationStatus?.can_confirm && (
                <Popconfirm
                  title="Підтвердити замовлення?"
                  description="Після підтвердження компоненти будуть заброньовані, а редагування замовлення стане недоступним."
                  okText="Підтвердити"
                  cancelText="Скасувати"
                  onConfirm={handleConfirmOrder}
                >
                  <Button type="primary" loading={confirmingOrder}>
                    Підтвердити замовлення
                  </Button>
                </Popconfirm>
              )}
            </Flex>
          )}
        </Flex>
      </Form>
    </Drawer>
  );
}

export default SaleOrderCreateDrawer;
