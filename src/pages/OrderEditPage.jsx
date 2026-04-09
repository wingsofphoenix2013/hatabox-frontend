import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SaveOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Image,
  InputNumber,
  Popconfirm,
  Progress,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import { formatQuantity } from '../utils/formatNumber';
import api from '../api/client';

const { Title, Text } = Typography;

const formatDateUa = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const getStatusTagColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getProgressStrokeColor = (percent, isOverdue = false) => {
  if (isOverdue) return '#ff4d4f';

  if (percent === 0) return '#bfbfbf';
  if (percent <= 24) return '#d9f7be';
  if (percent <= 49) return '#b7eb8f';
  if (percent <= 74) return '#95de64';
  if (percent <= 99) return '#73d13d';

  return '#52c41a';
};

function OrderEditPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);

  const [isCreatingOrderItem, setIsCreatingOrderItem] = useState(false);
  const [creatingVendorItemId, setCreatingVendorItemId] = useState(null);
  const [creatingVendorItemData, setCreatingVendorItemData] = useState(null);
  const [creatingQuantity, setCreatingQuantity] = useState(null);
  const [creatingPrice, setCreatingPrice] = useState(null);
  const [creatingExpectedDate, setCreatingExpectedDate] = useState(null);
  const [creatingVendorItemOptions, setCreatingVendorItemOptions] = useState(
    [],
  );
  const [creatingOrderItemLoading, setCreatingOrderItemLoading] =
    useState(false);
  const [lastUsedExpectedDate, setLastUsedExpectedDate] = useState(null);

  useEffect(() => {
    loadOrderPage();
  }, [id]);

  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

  const loadOrderPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`orders/${id}/`);
      setOrder(response.data);
      resetSelectedFile();

      const items = Array.isArray(response.data?.items)
        ? response.data.items
        : [];
      const lastItemWithDate = [...items]
        .reverse()
        .find((item) => item.expected_delivery_date);

      setLastUsedExpectedDate(lastItemWithDate?.expected_delivery_date || null);
    } catch (err) {
      console.error('Failed to load order edit page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const MAX_FILE_SIZE_MB = 30;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  const currentFileUrl = order?.image || '';
  const selectedFileName = selectedFile?.name || '';
  const currentFileName = useMemo(() => {
    if (!currentFileUrl) return '';

    try {
      const cleanUrl = currentFileUrl.split('?')[0];
      const parts = cleanUrl.split('/');
      return decodeURIComponent(parts[parts.length - 1] || '');
    } catch {
      return '';
    }
  }, [currentFileUrl]);

  const isPdfFile = (fileNameOrUrl = '', mimeType = '') => {
    const normalizedName = String(fileNameOrUrl).toLowerCase();
    const normalizedType = String(mimeType).toLowerCase();

    return (
      normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf')
    );
  };

  const isImageFile = (fileNameOrUrl = '', mimeType = '') => {
    const normalizedName = String(fileNameOrUrl).toLowerCase();
    const normalizedType = String(mimeType).toLowerCase();

    return (
      normalizedType === 'image/jpeg' ||
      normalizedType === 'image/png' ||
      normalizedName.endsWith('.jpg') ||
      normalizedName.endsWith('.jpeg') ||
      normalizedName.endsWith('.png')
    );
  };

  const resetSelectedFile = () => {
    setSelectedFile(null);
    setSelectedFilePreview('');
  };

  const handleFileChange = ({ fileList }) => {
    const fileObj = fileList[0]?.originFileObj || null;

    if (!fileObj) {
      resetSelectedFile();
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(fileObj.type)) {
      message.error('Дозволено завантажувати лише JPG, JPEG, PNG або PDF.');
      resetSelectedFile();
      return;
    }

    if (fileObj.size > MAX_FILE_SIZE_BYTES) {
      message.error(
        `Розмір файлу не повинен перевищувати ${MAX_FILE_SIZE_MB} МБ.`,
      );
      resetSelectedFile();
      return;
    }

    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }

    setSelectedFile(fileObj);

    if (isImageFile(fileObj.name, fileObj.type)) {
      setSelectedFilePreview(URL.createObjectURL(fileObj));
    } else {
      setSelectedFilePreview('');
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      message.error('Спочатку оберіть файл.');
      return;
    }

    try {
      setUploadingFile(true);

      const payload = new FormData();
      payload.append('image', selectedFile);

      const response = await api.patch(`orders/${id}/`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOrder(response.data);
      resetSelectedFile();
      message.success('Файл успішно завантажено.');
    } catch (err) {
      console.error('Failed to upload order file:', err);
      message.error('Не вдалося завантажити файл.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async () => {
    try {
      setDeletingFile(true);

      const payload = new FormData();
      payload.append('clear_image', 'true');

      const response = await api.patch(`orders/${id}/`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setOrder(response.data);
      resetSelectedFile();
      message.success('Файл видалено.');
    } catch (err) {
      console.error('Failed to delete order file:', err);
      message.error('Не вдалося видалити файл.');
    } finally {
      setDeletingFile(false);
    }
  };

  const handleStartCreateOrderItem = () => {
    if (isCreatingOrderItem) return;

    setIsCreatingOrderItem(true);
    setCreatingVendorItemId(null);
    setCreatingVendorItemData(null);
    setCreatingQuantity(null);
    setCreatingPrice(null);
    setCreatingVendorItemOptions([]);
    setCreatingExpectedDate(
      lastUsedExpectedDate ? dayjs(lastUsedExpectedDate, 'YYYY-MM-DD') : null,
    );
  };

  const handleCancelCreateOrderItem = () => {
    setIsCreatingOrderItem(false);
    setCreatingVendorItemId(null);
    setCreatingVendorItemData(null);
    setCreatingQuantity(null);
    setCreatingPrice(null);
    setCreatingExpectedDate(null);
    setCreatingVendorItemOptions([]);
  };

  const handleSearchVendorItems = async (searchValue) => {
    const query = searchValue?.trim();

    if (!query || !order?.vendor) {
      setCreatingVendorItemOptions([]);
      return;
    }

    try {
      const response = await api.get(
        `vendor-items/?search=${encodeURIComponent(query)}&vendor=${order.vendor}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      const existingVendorItemIds = new Set(
        (Array.isArray(order?.items) ? order.items : []).map(
          (item) => item.vendor_item,
        ),
      );

      const filteredResults = results.filter((item) => {
        if (item.id === creatingVendorItemId) return true;

        return !existingVendorItemIds.has(item.id);
      });

      setCreatingVendorItemOptions(
        filteredResults.map((item) => ({
          value: item.id,
          label: item.item_name || item.name || `ID ${item.id}`,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to search vendor items:', err);
      setCreatingVendorItemOptions([]);
    }
  };

  const handleSaveCreateOrderItem = async () => {
    if (!creatingVendorItemId) {
      message.error('Оберіть позицію постачальника.');
      return;
    }

    if (
      creatingQuantity === null ||
      creatingQuantity === undefined ||
      Number(creatingQuantity) <= 0
    ) {
      message.error('Кількість повинна бути більшою за 0.');
      return;
    }

    if (creatingPrice === null || creatingPrice === undefined) {
      message.error('Вкажіть ціну.');
      return;
    }

    if (!creatingExpectedDate) {
      message.error('Вкажіть дату очікуваної поставки.');
      return;
    }

    try {
      setCreatingOrderItemLoading(true);

      await api.post('order-items/', {
        order: Number(id),
        vendor_item: creatingVendorItemId,
        quantity: creatingQuantity,
        agreed_price: creatingPrice,
        expected_delivery_date: creatingExpectedDate.format('YYYY-MM-DD'),
      });

      setLastUsedExpectedDate(creatingExpectedDate.format('YYYY-MM-DD'));
      message.success('Рядок замовлення додано.');

      handleCancelCreateOrderItem();
      loadOrderPage();
    } catch (err) {
      console.error('Failed to create order item:', err);
      message.error('Не вдалося додати рядок замовлення.');
    } finally {
      setCreatingOrderItemLoading(false);
    }
  };

  const summaryColumns = [
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      align: 'center',
      width: '28%',
      render: (value, record) => (
        <Tag color={getStatusTagColor(record.status)}>{value || '—'}</Tag>
      ),
    },
    {
      title: 'Оплата',
      dataIndex: 'payment_percent',
      key: 'payment_percent',
      align: 'center',
      width: '36%',
      render: (value) => {
        const percent = Number(value) || 0;

        return (
          <div style={{ width: '100%' }}>
            <Progress
              percent={percent}
              size="small"
              strokeColor={getProgressStrokeColor(percent)}
            />
          </div>
        );
      },
    },
    {
      title: 'Отримання',
      dataIndex: 'receipt_percent',
      key: 'receipt_percent',
      align: 'center',
      width: '36%',
      render: (value, record) => {
        const percent = Number(value) || 0;
        const isOverdue = Boolean(record.is_receipt_overdue);

        const progress = (
          <Progress
            percent={percent}
            size="small"
            strokeColor={getProgressStrokeColor(percent, isOverdue)}
          />
        );

        if (percent === 100 && !isOverdue) {
          return <div style={{ width: '100%' }}>{progress}</div>;
        }

        let tooltipText = null;

        if (isOverdue) {
          tooltipText = `Прострочено на ${record.receipt_overdue_days} дн.`;
        } else {
          tooltipText = `Очікується за ${record.receipt_expected_days} дн.`;
        }

        const content = (
          <Flex align="center" justify="space-between" gap={8}>
            <div style={{ flex: 1 }}>{progress}</div>

            {isOverdue && (
              <WarningOutlined
                style={{
                  color: '#ff4d4f',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              />
            )}
          </Flex>
        );

        if (isOverdue) {
          return (
            <Tooltip title={tooltipText}>
              <div
                style={{
                  width: '100%',
                  background: '#fff1f0',
                  border: '1px solid #ffccc7',
                  borderRadius: 8,
                  padding: '6px 8px',
                }}
              >
                {content}
              </div>
            </Tooltip>
          );
        }

        return (
          <Tooltip title={tooltipText}>
            <div style={{ width: '100%' }}>{content}</div>
          </Tooltip>
        );
      },
    },
  ];

  const orderItemsColumns = [
    {
      title: '',
      key: 'edit',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <SaveOutlined
              style={{
                color: creatingOrderItemLoading ? '#bfbfbf' : '#52c41a',
                cursor: creatingOrderItemLoading ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!creatingOrderItemLoading) {
                  handleSaveCreateOrderItem();
                }
              }}
            />
          );
        }

        return null;
      },
    },
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, record, index) => {
        const itemsCount = Array.isArray(order?.items) ? order.items.length : 0;

        if (record.id === 'new-row') {
          return itemsCount + 1;
        }

        return index + 1;
      },
    },
    {
      title: 'Назва компонента',
      key: 'vendor_item_name',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Select
              showSearch
              value={creatingVendorItemId}
              placeholder="Почніть вводити назву"
              style={{ width: '100%' }}
              filterOption={false}
              onSearch={handleSearchVendorItems}
              onChange={(value, option) => {
                setCreatingVendorItemId(value);
                setCreatingVendorItemData(option?.item || null);
                setCreatingQuantity(null);
                setCreatingPrice(null);
              }}
              options={creatingVendorItemOptions}
              optionLabelProp="label"
            />
          );
        }

        return (
          record.vendor_item_inv_item_name || record.vendor_item_name || '—'
        );
      },
    },
    {
      title: 'vendor_sku',
      key: 'vendor_item_sku',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return creatingVendorItemData?.vendor_sku || '—';
        }

        return record.vendor_item_sku || '—';
      },
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <InputNumber
              min={0.001}
              step={0.001}
              controls={false}
              value={creatingQuantity}
              onChange={(value) => setCreatingQuantity(value)}
              style={{ width: 100 }}
            />
          );
        }

        return formatQuantity(record.quantity);
      },
    },
    {
      title: 'Ціна',
      key: 'agreed_price',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <InputNumber
              min={0}
              step={0.01}
              precision={2}
              controls={false}
              value={creatingPrice}
              onChange={(value) => setCreatingPrice(value)}
              style={{ width: 110 }}
            />
          );
        }

        return record.agreed_price !== null && record.agreed_price !== undefined
          ? `${record.agreed_price} ₴`
          : '—';
      },
    },
    {
      title: 'Поставка',
      key: 'expected_delivery_date',
      width: 170,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <DatePicker
              value={creatingExpectedDate}
              format="DD-MM-YYYY"
              onChange={(value) => setCreatingExpectedDate(value)}
              style={{ width: '100%' }}
              suffixIcon={<CalendarOutlined />}
            />
          );
        }

        if (!record.expected_delivery_date) return '—';

        const date = dayjs(record.expected_delivery_date, 'YYYY-MM-DD');
        return date.isValid() ? date.format('DD-MM-YYYY') : '—';
      },
    },
    {
      title: '',
      key: 'delete',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={handleCancelCreateOrderItem}
            />
          );
        }

        return null;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Замовлення не знайдено." showIcon />
      </div>
    );
  }

  const isDraft = order.status === 'draft';

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex align="center" gap={12} wrap>
          <Title level={2} style={{ margin: 0 }}>
            {`Редагування замовлення № ${order.order_no} від ${formatDateUa(order.created_at)}`}
          </Title>

          <Tag
            color={isDraft ? undefined : getStatusTagColor(order.status)}
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              ...(isDraft
                ? {
                    border: '1px solid #d9d9d9',
                    background: '#fafafa',
                    color: '#595959',
                  }
                : {}),
            }}
          >
            {order.status_name || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Файли" style={{ marginBottom: 20 }}>
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
                padding: 12,
              }}
            >
              {currentFileUrl ? (
                isImageFile(currentFileUrl) ? (
                  <Image
                    src={currentFileUrl}
                    alt="Order file"
                    preview={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ textAlign: 'center' }}
                  >
                    <FilePdfOutlined
                      style={{ fontSize: 52, color: '#cf1322' }}
                    />
                    <Text strong style={{ wordBreak: 'break-word' }}>
                      {currentFileName || 'PDF файл'}
                    </Text>
                  </Flex>
                )
              ) : selectedFile ? (
                isImageFile(selectedFile.name, selectedFile.type) &&
                selectedFilePreview ? (
                  <Image
                    src={selectedFilePreview}
                    alt="Selected file preview"
                    preview={false}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ textAlign: 'center' }}
                  >
                    {isPdfFile(selectedFile.name, selectedFile.type) ? (
                      <FilePdfOutlined
                        style={{ fontSize: 52, color: '#cf1322' }}
                      />
                    ) : (
                      <FileImageOutlined
                        style={{ fontSize: 52, color: '#1677ff' }}
                      />
                    )}

                    <Text strong style={{ wordBreak: 'break-word' }}>
                      {selectedFileName}
                    </Text>
                  </Flex>
                )
              ) : (
                <Text type="secondary">Файл не завантажено</Text>
              )}
            </div>

            {currentFileUrl ? (
              <Flex vertical gap={8}>
                <Button
                  block
                  onClick={() => window.open(currentFileUrl, '_blank')}
                >
                  Відкрити файл
                </Button>

                <Popconfirm
                  title="Видалити файл?"
                  description="Після видалення можна буде завантажити новий файл."
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={handleDeleteFile}
                  disabled={deletingFile}
                >
                  <Button
                    block
                    danger
                    icon={<DeleteOutlined />}
                    loading={deletingFile}
                  >
                    Видалити файл
                  </Button>
                </Popconfirm>
              </Flex>
            ) : (
              <Flex vertical gap={8}>
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  showUploadList={false}
                >
                  <Button block icon={<UploadOutlined />}>
                    Обрати файл
                  </Button>
                </Upload>

                {selectedFile && (
                  <>
                    <div
                      style={{
                        padding: '10px 12px',
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        strong
                        style={{ display: 'block', marginBottom: 4 }}
                      >
                        Обраний файл
                      </Text>
                      <Text style={{ wordBreak: 'break-word' }}>
                        {selectedFileName}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Максимальний розмір: {MAX_FILE_SIZE_MB} МБ
                        </Text>
                      </div>
                    </div>

                    <Flex vertical gap={8}>
                      <Button
                        type="primary"
                        block
                        loading={uploadingFile}
                        onClick={handleUploadFile}
                      >
                        Завантажити файл
                      </Button>

                      <Button block onClick={resetSelectedFile}>
                        Скасувати
                      </Button>
                    </Flex>
                  </>
                )}
              </Flex>
            )}
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Дані з’являться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card
            title={
              <Flex justify="space-between" align="center">
                <span>Основна інформація</span>

                <Flex align="center" gap={8}>
                  <Title
                    level={5}
                    style={{
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {order.vendor_name || '—'}
                  </Title>

                  {order.vendor && (
                    <>
                      <Link
                        to={`/orders/vendors/${order.vendor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <InfoCircleOutlined
                          style={{
                            color: '#1677ff',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                        />
                      </Link>

                      <LinkOutlined
                        style={{
                          color: '#8c8c8c',
                          fontSize: 16,
                          cursor: 'pointer',
                        }}
                      />
                    </>
                  )}
                </Flex>
              </Flex>
            }
            style={{ marginBottom: 20 }}
          >
            {order.comment && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 12px',
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                }}
              >
                <Flex align="flex-start" gap={8}>
                  <InfoCircleOutlined
                    style={{
                      color: '#8c8c8c',
                      marginTop: 3,
                    }}
                  />

                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    <Text strong>Коментар до замовлення:</Text> {order.comment}
                  </Text>
                </Flex>
              </div>
            )}

            <Table
              columns={summaryColumns}
              dataSource={[order]}
              rowKey="id"
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>

          <Card title="Оплата" style={{ marginBottom: 20 }}>
            <Text type="secondary">
              Редагування платежів буде доступне на наступному етапі
            </Text>
          </Card>

          <Card title="Замовлення">
            <Table
              rowKey="id"
              columns={orderItemsColumns}
              dataSource={[
                ...(Array.isArray(order.items) ? order.items : []),
                ...(isCreatingOrderItem ? [{ id: 'new-row' }] : []),
              ]}
              pagination={false}
              size="small"
            />

            {order.status === 'draft' && (
              <div style={{ marginTop: 16 }}>
                <Flex
                  align="center"
                  gap={8}
                  style={{
                    color: isCreatingOrderItem ? '#bfbfbf' : '#1677ff',
                    cursor: isCreatingOrderItem ? 'default' : 'pointer',
                    width: 'fit-content',
                  }}
                  onClick={() => {
                    if (!isCreatingOrderItem) {
                      handleStartCreateOrderItem();
                    }
                  }}
                >
                  <FileAddOutlined />
                  <Text
                    style={{
                      color: isCreatingOrderItem ? '#bfbfbf' : '#000',
                    }}
                  >
                    Створити новий запис
                  </Text>
                </Flex>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default OrderEditPage;
