import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  EditOutlined,
  FileAddOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SaveOutlined,
} from '@ant-design/icons';
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
  Switch,
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
  const [vendorPaymentDetails, setVendorPaymentDetails] = useState([]);

  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPaymentDetailsDrawerOpen, setIsPaymentDetailsDrawerOpen] =
    useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [paymentDetailsSaving, setPaymentDetailsSaving] = useState(false);

  const [vendorItemsPage, setVendorItemsPage] = useState(1);
  const [vendorItemsTotal, setVendorItemsTotal] = useState(0);

  const [isVendorItemDetailDrawerOpen, setIsVendorItemDetailDrawerOpen] =
    useState(false);
  const [selectedVendorItem, setSelectedVendorItem] = useState(null);
  const [isVendorItemDetailEditing, setIsVendorItemDetailEditing] =
    useState(false);

  const [form] = Form.useForm();
  const [paymentDetailsForm] = Form.useForm();

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

      const vendorResponse = await api.get(`vendors/${id}/`);

      setVendor(vendorResponse.data);
      await Promise.all([loadVendorItems(1), loadVendorPaymentDetails()]);
    } catch (err) {
      console.error('Failed to load vendor page:', err);
      setError('Не вдалося завантажити дані постачальника.');
      setVendor(null);
      setVendorItems([]);
      setVendorItemsTotal(0);
      setVendorPaymentDetails([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorItems = async (page = 1) => {
    try {
      setItemsLoading(true);

      const response = await api.get(`vendor-items/?vendor=${id}&page=${page}`);

      setVendorItems(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
      setVendorItemsTotal(response.data.count || 0);
      setVendorItemsPage(page);
    } catch (err) {
      console.error('Failed to load vendor items:', err);
      message.error('Не вдалося оновити список комплектуючих');
      setVendorItems([]);
      setVendorItemsTotal(0);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadVendorPaymentDetails = async () => {
    try {
      setPaymentDetailsLoading(true);

      const response = await api.get(`vendor-payment-details/?vendor=${id}`);

      setVendorPaymentDetails(
        Array.isArray(response.data.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load vendor payment details:', err);
      message.error('Не вдалося завантажити банківські реквізити');
      setVendorPaymentDetails([]);
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const handleSetDefaultPayment = async (record) => {
    try {
      await api.patch(`vendor-payment-details/${record.id}/`, {
        is_default: true,
      });

      message.success('Основний рахунок оновлено');

      await loadVendorPaymentDetails();
    } catch (err) {
      console.error('Failed to set default payment details:', err);
      message.error('Не вдалося оновити основний рахунок');
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

  const openPaymentDetailsDrawer = () => {
    paymentDetailsForm.resetFields();
    paymentDetailsForm.setFieldsValue({
      label: '',
      iban: '',
      is_default: vendorPaymentDetails.length === 0,
    });
    setIsPaymentDetailsDrawerOpen(true);
  };

  const closePaymentDetailsDrawer = () => {
    setIsPaymentDetailsDrawerOpen(false);
    paymentDetailsForm.resetFields();
  };

  const handleSavePaymentDetails = async (values) => {
    try {
      setPaymentDetailsSaving(true);

      await api.post('vendor-payment-details/', {
        vendor: Number(id),
        label: values.label,
        iban: values.iban,
        is_default:
          vendorPaymentDetails.length === 0 ? true : !!values.is_default,
      });

      message.success('Банківський рахунок створено');

      closePaymentDetailsDrawer();
      await loadVendorPaymentDetails();
    } catch (err) {
      console.error('Failed to create vendor payment details:', err);

      const data = err?.response?.data;

      if (data && typeof data === 'object') {
        const fieldErrors = Object.entries(data)
          .map(([field, msgs]) => {
            const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
            return `${field}: ${text}`;
          })
          .join(' | ');

        message.error(fieldErrors || 'Не вдалося створити банківський рахунок');
      } else {
        message.error('Не вдалося створити банківський рахунок');
      }
    } finally {
      setPaymentDetailsSaving(false);
    }
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
        item: values.inv_item,
        vendor_sku: values.vendor_sku,
        name: values.name,
        brand: values.brand,
        country_of_origin: values.country_of_origin,
      });

      message.success('Позицію постачальника створено');

      closeCreateDrawer();
      loadVendorItems(1);
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

  const groupedVendorItems = useMemo(() => {
    const groups = new Map();

    vendorItems.forEach((item) => {
      const categoryName = item.item_category_name || 'Без категорії';

      if (!groups.has(categoryName)) {
        groups.set(categoryName, []);
      }

      groups.get(categoryName).push(item);
    });

    return Array.from(groups.entries())
      .map(([categoryName, items]) => ({
        categoryName,
        items: [...items],
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'uk'));
  }, [vendorItems]);

  const flatVendorItemsDataSource = useMemo(() => {
    let rowIndex = (vendorItemsPage - 1) * 50 + 1;
    const rows = [];

    groupedVendorItems.forEach((group) => {
      rows.push({
        id: `group-${group.categoryName}`,
        isGroupRow: true,
        categoryName: group.categoryName,
      });

      group.items.forEach((item) => {
        rows.push({
          ...item,
          isGroupRow: false,
          rowNumber: rowIndex,
        });
        rowIndex += 1;
      });
    });

    return rows;
  }, [groupedVendorItems, vendorItemsPage]);

  const vendorItemsColumns = useMemo(
    () => [
      {
        title: '№',
        key: 'index',
        width: 70,
        align: 'center',
        render: (_, record) => (record.isGroupRow ? '' : record.rowNumber),
      },
      {
        title: 'Артікул',
        dataIndex: 'vendor_sku',
        key: 'vendor_sku',
        width: 220,
        align: 'center',
        render: (value, record) => (record.isGroupRow ? '' : value || '—'),
      },
      {
        title: 'Назва',
        dataIndex: 'name',
        key: 'name',
        render: (value, record) =>
          record.isGroupRow ? (
            <strong>{record.categoryName}</strong>
          ) : (
            <div
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 300,
              }}
              title={value}
            >
              {value || '—'}
            </div>
          ),
      },
      {
        title: 'Бренд',
        dataIndex: 'brand_name',
        key: 'brand_name',
        width: 180,
        align: 'center',
        render: (value, record) => (record.isGroupRow ? '' : value || '—'),
      },
      {
        title: '',
        key: 'info',
        width: 56,
        align: 'center',
        render: (_, record) =>
          record.isGroupRow ? null : (
            <InfoCircleOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => {
                setSelectedVendorItem(record);
                setIsVendorItemDetailEditing(false);
                setIsVendorItemDetailDrawerOpen(true);
              }}
            />
          ),
      },
    ],
    [vendorItemsPage],
  );

  const taxInfoColumns = [
    {
      title: 'Форма оподаткування',
      dataIndex: 'tax_type_name',
      key: 'tax_type_name',
      render: (value) => value || '—',
    },
    {
      title: 'ПДВ',
      dataIndex: 'vat',
      key: 'vat',
      align: 'center',
      render: (value) =>
        value ? (
          <Flex align="center" justify="center" gap={6}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Так</span>
          </Flex>
        ) : (
          <Flex align="center" justify="center" gap={6}>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Ні</span>
          </Flex>
        ),
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

  const paymentDetailsColumns = [
    {
      title: 'Назва',
      dataIndex: 'label',
      key: 'label',
      render: (value) => value || '—',
    },
    {
      title: 'IBAN',
      dataIndex: 'iban',
      key: 'iban',
      render: (value) => {
        if (!value) return '—';

        return (
          <Flex align="center" gap={6}>
            <span>{value}</span>
            <CopyOutlined
              style={{ color: '#8c8c8c', cursor: 'pointer' }}
              onClick={() => handleCopy(value, 'IBAN скопійовано')}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Головний',
      dataIndex: 'is_default',
      key: 'is_default',
      align: 'center',
      render: (value, record) =>
        value ? (
          <Flex align="center" justify="center" gap={6}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Так</span>
          </Flex>
        ) : (
          <Flex
            align="center"
            justify="center"
            gap={6}
            style={{ cursor: 'pointer' }}
            onClick={() => handleSetDefaultPayment(record)}
          >
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Ні</span>
          </Flex>
        ),
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

            {renderField(
              'Сайт',
              vendor.website ? (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={vendor.website}
                >
                  <Flex align="center" gap={6}>
                    <LinkOutlined style={{ color: '#1677ff' }} />
                    <span>{vendor.website}</span>
                  </Flex>
                </a>
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

          <Card title="Банківські реквізити" style={{ marginBottom: 20 }}>
            <Table
              columns={paymentDetailsColumns}
              dataSource={vendorPaymentDetails}
              rowKey="id"
              loading={paymentDetailsLoading}
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
                onClick={openPaymentDetailsDrawer}
              >
                <FileAddOutlined />
                <Text style={{ color: '#595959' }}>Додати новий рахунок</Text>
              </Flex>
            </div>
          </Card>

          <Card title="Постачувані комплектуючі">
            <Table
              rowKey="id"
              loading={itemsLoading}
              columns={vendorItemsColumns}
              dataSource={flatVendorItemsDataSource}
              size="small"
              rowClassName={(record) =>
                record.isGroupRow ? 'vendor-items-group-row' : ''
              }
              pagination={{
                current: vendorItemsPage,
                pageSize: 50,
                total: vendorItemsTotal,
                showSizeChanger: false,
                showTotal: (total, range) => (
                  <span>
                    Показано{' '}
                    <span style={{ color: '#1677ff', fontWeight: 600 }}>
                      {range[0]}–{range[1]}
                    </span>{' '}
                    з{' '}
                    <span style={{ color: '#1677ff', fontWeight: 600 }}>
                      {total}
                    </span>{' '}
                    результатів
                  </span>
                ),
                onChange: (page) => loadVendorItems(page),
              }}
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
        size="large"
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

      <Drawer
        title="Створити новий рахунок"
        placement="right"
        size="large"
        onClose={closePaymentDetailsDrawer}
        open={isPaymentDetailsDrawerOpen}
      >
        <Form
          layout="vertical"
          form={paymentDetailsForm}
          onFinish={handleSavePaymentDetails}
        >
          <Form.Item
            label="Назва рахунку"
            name="label"
            rules={[{ required: true, message: 'Вкажіть назву рахунку' }]}
          >
            <Input placeholder="Наприклад: Загальний р/р" />
          </Form.Item>

          <Form.Item
            label="IBAN"
            name="iban"
            normalize={(value) =>
              value ? value.replace(/\s+/g, '').toUpperCase() : value
            }
            rules={[
              { required: true, message: 'Вкажіть IBAN' },
              {
                pattern: /^UA\d{27}$/,
                message: 'IBAN має бути у форматі UA + 27 цифр (29 символів)',
              },
            ]}
          >
            <Input placeholder="UA123456789012345678901234567" maxLength={29} />
          </Form.Item>

          <Form.Item
            label="Основний рахунок"
            name="is_default"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <Switch disabled={vendorPaymentDetails.length === 0} />
          </Form.Item>

          {vendorPaymentDetails.length === 0 && (
            <div style={{ marginTop: 0, marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Перший рахунок постачальника автоматично є основним
              </Text>
            </div>
          )}

          <Flex gap={8}>
            <Button onClick={closePaymentDetailsDrawer}>Відміна</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={paymentDetailsSaving}
            >
              Зберегти
            </Button>
          </Flex>
        </Form>
      </Drawer>

      <Drawer
        title="Детальна інформація"
        placement="right"
        size="large"
        onClose={() => {
          setIsVendorItemDetailDrawerOpen(false);
          setSelectedVendorItem(null);
          setIsVendorItemDetailEditing(false);
        }}
        open={isVendorItemDetailDrawerOpen}
        extra={
          isVendorItemDetailEditing ? (
            <Flex gap={8}>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setIsVendorItemDetailEditing(false)}
              >
                Відміна
              </Button>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setIsVendorItemDetailEditing(false)}
              >
                Зберегти
              </Button>
            </Flex>
          ) : (
            <Button
              icon={<EditOutlined style={{ color: '#1677ff' }} />}
              onClick={() => setIsVendorItemDetailEditing(true)}
            >
              Редагувати
            </Button>
          )
        }
      >
        <Flex vertical gap={16}>
          <Card title="Інформація">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>

          <Card title="Статистика заказів">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>

          <Card title="Статистика витрат">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Flex>
      </Drawer>

      <style>
        {`
          .vendor-items-group-row td {
            background: #fafafa !important;
            font-weight: 600;
            border-bottom: 1px solid #f0f0f0;
          }
          .vendor-items-group-row td:not(:first-child) {
            border-left: none !important;
          }
        `}
      </style>
    </div>
  );
}

export default VendorDetailPage;
