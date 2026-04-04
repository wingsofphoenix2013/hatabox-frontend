import { useEffect, useMemo, useState } from 'react';
import { CopyOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Flex,
  Form,
  Image,
  Input,
  Row,
  Select,
  Skeleton,
  Table,
  Typography,
  message,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

const formatPhoneUa = (value) => {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('380')) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }

  return value;
};

function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [vendor, setVendor] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);

  const [form] = Form.useForm();

  const [brandOptions, setBrandOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [invItemOptions, setInvItemOptions] = useState([]);
  const [selectedInvItem, setSelectedInvItem] = useState(null);
  const [suggestedVendorSku, setSuggestedVendorSku] = useState('');
  const [isNameTouched, setIsNameTouched] = useState(false);

  useEffect(() => {
    loadVendorPage();
  }, [id]);

  const loadVendorPage = async () => {
    try {
      setLoading(true);
      setError('');

      const [vendorResponse, vendorItemsResponse] = await Promise.all([
        api.get(`vendors/${id}/`),
        api.get(`vendor-items/?vendor=${id}`),
      ]);

      setVendor(vendorResponse.data);
      setVendorItems(
        Array.isArray(vendorItemsResponse.data.results)
          ? vendorItemsResponse.data.results
          : [],
      );
    } catch (err) {
      console.error('Failed to load vendor page:', err);
      setError('Не вдалося завантажити дані постачальника.');
      setVendor(null);
      setVendorItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorItems = async () => {
    try {
      setItemsLoading(true);

      const response = await api.get(`vendor-items/?vendor=${id}`);

      setVendorItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load vendor items:', err);
      message.error('Не вдалося оновити список комплектуючих');
      setVendorItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleCopy = async (value, successText = 'Скопійовано') => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      message.success(successText);
    } catch {
      message.error('Не вдалося скопіювати');
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

  const openCreateDrawer = async () => {
    setIsDrawerOpen(true);
    form.resetFields();
    setSelectedInvItem(null);
    setSuggestedVendorSku('');
    setInvItemOptions([]);
    setIsNameTouched(false);

    try {
      const [brandsResponse, countriesResponse] = await Promise.all([
        api.get('brands/'),
        api.get('countries/'),
      ]);

      setBrandOptions(
        Array.isArray(brandsResponse.data.results)
          ? brandsResponse.data.results.map((item) => ({
              value: item.id,
              label: item.name,
            }))
          : [],
      );

      setCountryOptions(
        Array.isArray(countriesResponse.data.results)
          ? countriesResponse.data.results.map((item) => ({
              value: item.id,
              label: item.name,
            }))
          : [],
      );
    } catch (err) {
      console.error('Failed to load drawer dictionaries:', err);
      setBrandOptions([]);
      setCountryOptions([]);
      message.error('Не вдалося завантажити довідники форми');
    }
  };

  const closeCreateDrawer = () => {
    setIsDrawerOpen(false);
    form.resetFields();
    setSelectedInvItem(null);
    setSuggestedVendorSku('');
    setInvItemOptions([]);
    setIsNameTouched(false);
  };

  const handleSearchInvItems = async (searchValue) => {
    const query = searchValue?.trim();

    if (!query || query.length < 2) {
      setInvItemOptions([]);
      return;
    }

    try {
      const response = await api.get(
        `items/?search=${encodeURIComponent(query)}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      setInvItemOptions(
        results.map((item) => ({
          value: item.id,
          label: `${item.name}`,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to search inv items:', err);
      setInvItemOptions([]);
    }
  };

  const buildSuggestedVendorSku = async (invItem) => {
    if (!vendor || !invItem) {
      setSuggestedVendorSku('');
      return;
    }

    try {
      const response = await api.get(
        `vendor-items/?vendor=${vendor.id}&inv_item=${invItem.id}`,
      );

      const existing = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      const prefix = `${vendor.code}_${invItem.internal_code}_`;

      const usedVariants = existing
        .map((row) => row.vendor_sku || '')
        .filter((sku) => sku.startsWith(prefix))
        .map((sku) => {
          const raw = sku.slice(prefix.length);
          const parsed = Number(raw);
          return Number.isInteger(parsed) ? parsed : null;
        })
        .filter((value) => value !== null);

      const nextVariant =
        usedVariants.length > 0 ? Math.max(...usedVariants) + 1 : 1;

      setSuggestedVendorSku(`${prefix}${nextVariant}`);
    } catch (err) {
      console.error('Failed to build suggested vendor_sku:', err);
      setSuggestedVendorSku('');
    }
  };

  const handleSelectInvItem = async (value, option) => {
    const item = option?.item || null;

    setSelectedInvItem(item);
    form.setFieldValue('inv_item', value);

    if (item && !isNameTouched) {
      form.setFieldValue('name', item.name || '');
    }

    await buildSuggestedVendorSku(item);
  };

  const handleInsertSuggestedSku = () => {
    if (!suggestedVendorSku) return;
    form.setFieldValue('vendor_sku', suggestedVendorSku);
  };

  const handleSaveVendorItem = async (values) => {
    try {
      setDrawerSaving(true);

      await api.post('vendor-items/', {
        vendor: Number(id),
        inv_item: values.inv_item,
        vendor_sku: values.vendor_sku,
        name: values.name,
        brand: values.brand,
        country_of_origin: values.country_of_origin,
      });

      message.success('Позицію постачальника створено');

      closeCreateDrawer();
      loadVendorItems();
    } catch (err) {
      console.error('Failed to create vendor item:', err);

      const data = err?.response?.data;

      if (data && typeof data === 'object') {
        const fieldErrors = Object.entries(data)
          .map(([field, msgs]) => {
            const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
            return `${field}: ${text}`;
          })
          .join(' | ');

        message.error(fieldErrors || 'Не вдалося створити позицію');
      } else {
        message.error('Не вдалося створити позицію');
      }
    } finally {
      setDrawerSaving(false);
    }
  };

  const vendorItemsColumns = useMemo(
    () => [
      {
        title: 'Код',
        dataIndex: 'item_internal_code',
        key: 'item_internal_code',
        width: 140,
        render: (value) => value || '—',
      },
      {
        title: 'Назва',
        dataIndex: 'name',
        key: 'name',
        render: (value) => value || '—',
      },
      {
        title: 'SKU постачальника',
        dataIndex: 'vendor_sku',
        key: 'vendor_sku',
        width: 220,
        render: (value) => value || '—',
      },
      {
        title: 'Бренд',
        dataIndex: 'brand_name',
        key: 'brand_name',
        width: 180,
        render: (value) => value || '—',
      },
      {
        title: 'Країна',
        dataIndex: 'country_of_origin_name',
        key: 'country_of_origin_name',
        width: 180,
        render: (value) => value || '—',
      },
    ],
    [],
  );

  const taxInfoColumns = [
    {
      title: 'Форма оподаткування',
      dataIndex: 'tax_type_name',
      key: 'tax_type_name',
      render: (value) => value || '—',
    },
    {
      title: 'Код ЄДРПОУ',
      dataIndex: 'edrpou',
      key: 'edrpou',
      align: 'center',
      render: (value) => {
        if (!value) return '—';

        return (
          <Flex align="center" justify="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => handleCopy(value, 'Код ЄДРПОУ скопійовано')}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Код ІПН',
      dataIndex: 'ipn',
      key: 'ipn',
      align: 'center',
      render: (value) => {
        if (!value) return '—';

        return (
          <Flex align="center" justify="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => handleCopy(value, 'Код ІПН скопійовано')}
            />
          </Flex>
        );
      },
    },
  ];

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

        <Button
          icon={<EditOutlined style={{ color: '#1677ff' }} />}
          onClick={() =>
            navigate(`/orders/vendors/${vendor.id}/edit`, {
              state: {
                vendorLabel: vendor.name,
                fromSearch: location.search,
              },
            })
          }
        >
          Редагувати
        </Button>
      </Flex>

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
            {renderField(
              'Повна назва',
              <Paragraph style={{ marginBottom: 0 }}>
                {vendor.legal_name || '—'}
              </Paragraph>,
            )}

            {renderField(
              'Номер телефона',
              <Paragraph style={{ marginBottom: 0 }}>
                {formatPhoneUa(vendor.phone)}
              </Paragraph>,
            )}

            {renderField(
              'Адрес e-mail',
              vendor.email ? (
                <Flex align="center" gap={6}>
                  <span>{vendor.email}</span>
                  <CopyOutlined
                    style={{ color: '#8c8c8c', cursor: 'pointer' }}
                    onClick={() =>
                      handleCopy(vendor.email, 'E-mail скопійовано')
                    }
                  />
                </Flex>
              ) : (
                <Paragraph style={{ marginBottom: 0 }}>—</Paragraph>
              ),
            )}
          </Card>

          <Card title="Податкова інформація" style={{ marginBottom: 20 }}>
            <Table
              columns={taxInfoColumns}
              dataSource={[vendor]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Постачувані комплектуючі">
            <Table
              rowKey="id"
              loading={itemsLoading}
              columns={vendorItemsColumns}
              dataSource={vendorItems}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 16 }}>
              <Flex
                align="center"
                gap={8}
                style={{
                  color: '#595959',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}
                onClick={openCreateDrawer}
              >
                <FileAddOutlined />
                <Text style={{ color: '#595959' }}>Створити нову запис</Text>
              </Flex>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Історія змін з’явиться пізніше</Text>
          </Card>
        </Col>
      </Row>

      <Drawer
        title="Створення нового запису"
        placement="right"
        size="default"
        onClose={closeCreateDrawer}
        open={isDrawerOpen}
      >
        <Form layout="vertical" form={form} onFinish={handleSaveVendorItem}>
          <Form.Item
            label="Номенклатура"
            name="inv_item"
            rules={[{ required: true, message: 'Оберіть номенклатуру' }]}
          >
            <Select
              showSearch
              filterOption={false}
              placeholder="Почніть вводити назву або код"
              onSearch={handleSearchInvItems}
              onChange={handleSelectInvItem}
              options={invItemOptions}
            />
          </Form.Item>

          <Form.Item
            label="Назва позиції постачальника"
            name="name"
            rules={[{ required: true, message: 'Вкажіть назву позиції' }]}
          >
            <Input
              placeholder="Назва"
              onChange={() => setIsNameTouched(true)}
            />
          </Form.Item>

          <Form.Item
            label="Vendor SKU"
            name="vendor_sku"
            rules={[{ required: true, message: 'Вкажіть vendor SKU' }]}
          >
            <Input
              placeholder="SKU постачальника"
              addonAfter={
                <span
                  style={{
                    color: suggestedVendorSku ? '#1677ff' : '#bfbfbf',
                    cursor: suggestedVendorSku ? 'pointer' : 'default',
                  }}
                  onClick={handleInsertSuggestedSku}
                >
                  <CopyOutlined />
                </span>
              }
            />
          </Form.Item>

          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Наприклад — {suggestedVendorSku || 'XXX_XXXXX_1'}
            </Text>
          </div>

          <Form.Item
            label="Бренд"
            name="brand"
            rules={[{ required: true, message: 'Оберіть бренд' }]}
          >
            <Select
              showSearch
              placeholder="Оберіть бренд"
              options={brandOptions}
            />
          </Form.Item>

          <Form.Item
            label="Країна походження"
            name="country_of_origin"
            rules={[{ required: true, message: 'Оберіть країну' }]}
          >
            <Select
              showSearch
              placeholder="Оберіть країну"
              options={countryOptions}
            />
          </Form.Item>

          <Flex gap={8}>
            <Button onClick={closeCreateDrawer}>Відміна</Button>
            <Button type="primary" htmlType="submit" loading={drawerSaving}>
              Зберегти
            </Button>
          </Flex>
        </Form>
      </Drawer>
    </div>
  );
}

export default VendorDetailPage;
