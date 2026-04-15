import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  BankOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SettingOutlined,
  StopOutlined,
  UploadOutlined,
  WarningOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Dropdown,
  Flex,
  Image,
  Popconfirm,
  Popover,
  Progress,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

import OrderReceiptDrawer from '../components/OrderReceiptDrawer';
import OrderPaymentsDrawer from '../components/OrderPaymentsDrawer';
import OrderItemsDrawer from '../components/OrderItemsDrawer';

import PdfPreview from '../components/PdfPreview';

import { formatQuantity } from '../utils/formatNumber';
import {
  formatDateDisplay,
  formatDateUa,
  formatMoney,
} from '../utils/orderFormatters';
import {
  getAvailablePaymentStatusOptions,
  getPaymentStatusTagColor,
  getProgressStrokeColor,
  getStatusTagColor,
  PAYMENT_STATUS_LABELS,
} from '../constants/orderStatus';
import {
  extractFileFromUploadEvent,
  getFileNameFromUrl,
  isImageFile,
  validateFileType,
} from '../utils/fileHelpers';
import { getApiErrorMessage } from '../utils/apiError';

const { Title, Text } = Typography;

function OrderDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [receiptDocuments, setReceiptDocuments] = useState([]);
  const [vendorWebsite, setVendorWebsite] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingToWork, setSubmittingToWork] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);

  const [isPaymentsDrawerOpen, setIsPaymentsDrawerOpen] = useState(false);
  const [isReceiptDrawerOpen, setIsReceiptDrawerOpen] = useState(false);
  const [isOrderItemsDrawerOpen, setIsOrderItemsDrawerOpen] = useState(false);
  const [selectedReceiptDocumentId, setSelectedReceiptDocumentId] =
    useState(null);

  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(null);
  const [editingPaymentDate, setEditingPaymentDate] = useState(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);

  const [recipientAccountOptions, setRecipientAccountOptions] = useState([]);
  const [recipientAccountsLoading, setRecipientAccountsLoading] =
    useState(false);
  const [selectedRecipientAccountId, setSelectedRecipientAccountId] =
    useState(null);
  const [paymentTransferFile, setPaymentTransferFile] = useState(null);

  const MAX_FILE_SIZE_MB = 30;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  useEffect(() => {
    loadOrderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);

  const isDraft = order?.status === 'draft';
  const isInProgress = order?.status === 'in_progress';
  const hasOrderItems = Array.isArray(order?.items) && order.items.length > 0;
  const hasReceiptDocuments =
    Array.isArray(receiptDocuments) && receiptDocuments.length > 0;
  const canSendToWork = isDraft && hasOrderItems;

  const selectedPaymentDocument = useMemo(() => {
    const docs = Array.isArray(order?.payment_documents)
      ? order.payment_documents
      : [];

    return docs.find((item) => item.id === selectedPaymentId) || null;
  }, [order, selectedPaymentId]);

  useEffect(() => {
    if (!selectedPaymentDocument) {
      setEditingPaymentStatus(null);
      setEditingPaymentDate(null);
      setEditingPaymentAmount(null);
      setSelectedRecipientAccountId(null);
      setPaymentTransferFile(null);
      return;
    }

    setEditingPaymentStatus(selectedPaymentDocument.status || null);
    setEditingPaymentDate(
      selectedPaymentDocument.payment_date
        ? dayjs(selectedPaymentDocument.payment_date, 'YYYY-MM-DD')
        : null,
    );
    setEditingPaymentAmount(
      selectedPaymentDocument.payment_amount !== null &&
        selectedPaymentDocument.payment_amount !== undefined
        ? Number(selectedPaymentDocument.payment_amount)
        : null,
    );
    setSelectedRecipientAccountId(null);
    setPaymentTransferFile(null);
  }, [selectedPaymentDocument]);

  useEffect(() => {
    const loadRecipientAccounts = async () => {
      if (!isPaymentsDrawerOpen || !order?.vendor) {
        setRecipientAccountOptions([]);
        setSelectedRecipientAccountId(null);
        return;
      }

      try {
        setRecipientAccountsLoading(true);

        const response = await api.get(
          `vendor-payment-details/?vendor=${order.vendor}&is_active=true`,
        );

        const results = Array.isArray(response.data.results)
          ? response.data.results
          : [];

        setRecipientAccountOptions(
          results.map((item) => ({
            value: item.id,
            label: `${item.label || '—'} — ${item.iban || '—'}`,
          })),
        );
      } catch (err) {
        console.error('Failed to load vendor payment details:', err);
        setRecipientAccountOptions([]);
      } finally {
        setRecipientAccountsLoading(false);
      }
    };

    loadRecipientAccounts();
  }, [isPaymentsDrawerOpen, order?.vendor]);

  const loadReceiptDocuments = async (orderId) => {
    try {
      const response = await api.get(`receipt-documents/?order=${orderId}`);

      setReceiptDocuments(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load receipt documents:', err);
      setReceiptDocuments([]);
    }
  };

  const loadVendorWebsite = async (vendorId) => {
    if (!vendorId) {
      setVendorWebsite('');
      return;
    }

    try {
      const response = await api.get(`vendors/${vendorId}/`);
      setVendorWebsite(response.data?.website || '');
    } catch (err) {
      console.error('Failed to load vendor website:', err);
      setVendorWebsite('');
    }
  };

  const loadOrderPage = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError('');

      const response = await api.get(`orders/${id}/`);
      setOrder(response.data);
      await loadReceiptDocuments(response.data.id);
      await loadVendorWebsite(response.data.vendor);
    } catch (err) {
      console.error('Failed to load order page:', err);
      setError('Не вдалося завантажити дані замовлення.');
      setOrder(null);
      setVendorWebsite('');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const resetSelectedFile = () => {
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }

    setSelectedFile(null);
    setSelectedFilePreview('');
  };

  const isPdfFile = (fileNameOrUrl = '', mimeType = '') => {
    const normalizedName = String(fileNameOrUrl).toLowerCase();
    const normalizedType = String(mimeType).toLowerCase();

    return (
      normalizedType === 'application/pdf' || normalizedName.endsWith('.pdf')
    );
  };

  const handleFileChange = ({ fileList }) => {
    const fileObj = extractFileFromUploadEvent(fileList);

    if (!fileObj) {
      resetSelectedFile();
      return;
    }

    const { valid, error: validationError } = validateFileType(
      fileObj,
      ACCEPTED_FILE_TYPES,
    );

    if (!valid) {
      message.error(validationError);
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

    setSelectedFilePreview(URL.createObjectURL(fileObj));
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

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, ['image']);

      message.error(backendMessage || 'Не вдалося завантажити файл.');
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

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(backendMessage || 'Не вдалося видалити файл.');
    } finally {
      setDeletingFile(false);
    }
  };

  const handleSendToWork = async () => {
    try {
      setSubmittingToWork(true);

      const payload = new FormData();
      payload.append('status', 'in_progress');

      await api.patch(`orders/${id}/`, payload);

      message.success('Замовлення передано в роботу');
      loadOrderPage();
    } catch (err) {
      console.error('Failed to send order to work:', err);
      console.error(
        'Failed to send order to work response data:',
        err?.response?.data,
      );
      console.error(
        'Failed to send order to work response status:',
        err?.response?.status,
      );

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData);

      message.error(
        backendMessage || 'Не вдалося передати замовлення в роботу',
      );
    } finally {
      setSubmittingToWork(false);
    }
  };

  const handleOpenPaymentsDrawer = () => {
    setIsPaymentsDrawerOpen(true);
    setSelectedPaymentId(null);
    setEditingPaymentStatus(null);
    setEditingPaymentDate(null);
    setEditingPaymentAmount(null);
    setRecipientAccountOptions([]);
    setRecipientAccountsLoading(false);
    setSelectedRecipientAccountId(null);
    setPaymentTransferFile(null);
  };

  const handleOpenReceiptDrawer = (receiptDocumentId = null) => {
    setSelectedReceiptDocumentId(receiptDocumentId);
    setIsReceiptDrawerOpen(true);
  };

  const handleClosePaymentsDrawer = () => {
    setIsPaymentsDrawerOpen(false);
    setSelectedPaymentId(null);
    setEditingPaymentStatus(null);
    setEditingPaymentDate(null);
    setEditingPaymentAmount(null);
    setRecipientAccountOptions([]);
    setRecipientAccountsLoading(false);
    setSelectedRecipientAccountId(null);
    setPaymentTransferFile(null);
  };

  const handlePaymentTransferFileChange = ({ fileList }) => {
    const fileObj = extractFileFromUploadEvent(fileList);

    if (!fileObj) {
      setPaymentTransferFile(null);
      return;
    }

    const { valid, error: validationError } = validateFileType(fileObj);

    if (!valid) {
      message.error(validationError);
      setPaymentTransferFile(null);
      return;
    }

    setPaymentTransferFile(fileObj);
  };

  const handleSavePayment = async () => {
    if (!selectedPaymentDocument) {
      message.error('Оберіть платіжну інструкцію.');
      return;
    }

    if (
      editingPaymentAmount === null ||
      editingPaymentAmount === undefined ||
      Number(editingPaymentAmount) <= 0
    ) {
      message.error('Сума платежу повинна бути більшою за 0.');
      return;
    }

    if (editingPaymentStatus === 'paid') {
      if (!selectedRecipientAccountId) {
        message.error('Оберіть розрахунковий рахунок отримувача.');
        return;
      }

      if (!editingPaymentDate) {
        message.error('Вкажіть дату платежу.');
        return;
      }

      if (!paymentTransferFile) {
        message.error('Завантажте файл переказу.');
        return;
      }
    }

    try {
      setSavingPayment(true);

      const payload = new FormData();
      payload.append('status', editingPaymentStatus);
      payload.append('payment_amount', String(editingPaymentAmount));

      if (editingPaymentStatus === 'paid') {
        payload.append('payment_date', editingPaymentDate.format('YYYY-MM-DD'));
        payload.append('image', paymentTransferFile);
      }

      const response = await api.patch(
        `payment-documents/${selectedPaymentDocument.id}/`,
        payload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      message.success('Платіжну інструкцію оновлено.');

      const updatedPayment = response.data;

      setEditingPaymentStatus(updatedPayment.status || null);
      setEditingPaymentDate(
        updatedPayment.payment_date
          ? dayjs(updatedPayment.payment_date, 'YYYY-MM-DD')
          : null,
      );
      setEditingPaymentAmount(
        updatedPayment.payment_amount !== null &&
          updatedPayment.payment_amount !== undefined
          ? Number(updatedPayment.payment_amount)
          : null,
      );

      await loadOrderPage({ silent: true });

      setSelectedRecipientAccountId(null);
      setPaymentTransferFile(null);

      handleClosePaymentsDrawer();
    } catch (err) {
      console.error('Failed to update payment document:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, [
        'payment_amount',
        'payment_date',
        'status',
      ]);

      message.error(
        backendMessage || 'Не вдалося оновити платіжну інструкцію.',
      );
    } finally {
      setSavingPayment(false);
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

  const paymentColumns = [
    {
      title: 'Дата',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 130,
      align: 'center',
      render: (value) => formatDateDisplay(value),
    },
    {
      title: '№ документа',
      dataIndex: 'payment_no',
      key: 'payment_no',
      render: (value, record) => {
        if (!value) return '—';

        return (
          <Flex align="center" gap={6}>
            <span>{value}</span>

            {record.status === 'paid' && record.image && (
              <FileImageOutlined
                style={{
                  color: '#1677ff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => window.open(record.image, '_blank')}
              />
            )}
          </Flex>
        );
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status_name',
      key: 'status_name',
      width: 140,
      align: 'center',
      render: (value, record) => (
        <Tag color={getPaymentStatusTagColor(record.status)}>
          {value || '—'}
        </Tag>
      ),
    },
    {
      title: 'Сума',
      dataIndex: 'payment_amount',
      key: 'payment_amount',
      width: 140,
      align: 'center',
      render: (value) => (value ? `${value} ₴` : '—'),
    },
  ];

  const receiptColumns = [
    {
      title: 'Дата',
      dataIndex: 'receipt_date',
      key: 'receipt_date',
      width: 130,
      align: 'center',
      render: (value) => formatDateDisplay(value),
    },
    {
      title: '№ документа',
      dataIndex: 'receipt_no',
      key: 'receipt_no',
      render: (value, record) => {
        if (!value) return '—';

        return (
          <Flex align="center" gap={6}>
            <span>{value}</span>

            {record.image && (
              <FileImageOutlined
                style={{
                  color: '#1677ff',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                onClick={() => window.open(record.image, '_blank')}
              />
            )}
          </Flex>
        );
      },
    },
    {
      title: 'Обробка',
      key: 'completed',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const isCompleted = Boolean(record.completed);

        return (
          <Tooltip title={isCompleted ? 'Оброблена' : 'Чернетка'}>
            {isCompleted ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
            )}
          </Tooltip>
        );
      },
    },
    {
      title: 'Склад',
      key: 'sent_to_warehouse',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const isSent = Boolean(record.sent_to_warehouse);

        return (
          <Tooltip
            title={isSent ? 'Передано на склад' : 'Не передано на склад'}
          >
            {isSent ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
            )}
          </Tooltip>
        );
      },
    },
    {
      title: 'Дія',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const items = [
          {
            key: 'open',
            label: 'Переглянути накладну',
            onClick: () => {
              handleOpenReceiptDrawer(record.id);
            },
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <AppstoreAddOutlined
              style={{
                fontSize: 18,
                color: '#8c8c8c',
                cursor: 'pointer',
              }}
            />
          </Dropdown>
        );
      },
    },
  ];

  const orderItemsColumns = [
    {
      title: 'Товар',
      key: 'vendor_item_name',
      render: (_, record) => (
        <div
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={record.vendor_item_name || '—'}
        >
          {record.vendor_item_name || '—'}
        </div>
      ),
    },
    {
      title: 'К-сть',
      key: 'quantity',
      width: 100,
      align: 'center',
      render: (_, record) => formatQuantity(record.quantity),
    },
    {
      title: 'Ціна',
      key: 'agreed_price',
      width: 110,
      align: 'center',
      render: (_, record) =>
        record.agreed_price ? `${record.agreed_price} ₴` : '—',
    },
    {
      title: 'Поставка',
      key: 'expected_delivery_date',
      width: 140,
      align: 'center',
      render: (_, record) => formatDateDisplay(record.expected_delivery_date),
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

  const currentFileUrl = order?.image || '';
  const currentFileName = getFileNameFromUrl(currentFileUrl);
  const selectedFileName = selectedFile?.name || '';

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
            {`Заказ № ${order.order_no} від ${formatDateUa(order.created_at)}`}
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
                    onClick={() => window.open(currentFileUrl, '_blank')}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      margin: '0 auto',
                      display: 'block',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.85';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  />
                ) : (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ width: '100%' }}
                  >
                    <PdfPreview
                      fileUrl={currentFileUrl}
                      width={220}
                      clickable
                    />

                    <Text
                      strong
                      style={{ wordBreak: 'break-word', textAlign: 'center' }}
                    >
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
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.85';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  />
                ) : isPdfFile(selectedFile.name, selectedFile.type) &&
                  selectedFilePreview ? (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ width: '100%' }}
                  >
                    <PdfPreview
                      fileUrl={selectedFilePreview}
                      width={220}
                      clickable
                    />

                    <Text
                      strong
                      style={{ wordBreak: 'break-word', textAlign: 'center' }}
                    >
                      {selectedFileName}
                    </Text>
                  </Flex>
                ) : (
                  <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={12}
                    style={{ textAlign: 'center' }}
                  >
                    <FileImageOutlined
                      style={{ fontSize: 52, color: '#1677ff' }}
                    />

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

          {order?.status !== 'completed' && (
            <Card title="Навігація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={8}>
                {isDraft && (
                  <>
                    {canSendToWork ? (
                      <Popconfirm
                        title="Увага!"
                        description="Ви не зможете редагувати склад замовлення після передачі його в роботу! Ви впевнені, що склад замовлення вже остаточний?"
                        okText="Так"
                        cancelText="Ні"
                        onConfirm={handleSendToWork}
                        disabled={submittingToWork}
                      >
                        <Button block type="primary" loading={submittingToWork}>
                          Передати в роботу
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button block type="primary" disabled>
                        Передати в роботу
                      </Button>
                    )}

                    <Divider style={{ margin: '4px 0 8px 0' }} />
                  </>
                )}

                {isInProgress && (
                  <Button
                    block
                    icon={<DownloadOutlined style={{ color: '#1677ff' }} />}
                    onClick={() => handleOpenReceiptDrawer()}
                  >
                    Отримання товару
                  </Button>
                )}

                {isInProgress && (
                  <Button
                    block
                    icon={<BankOutlined style={{ color: '#1677ff' }} />}
                    onClick={handleOpenPaymentsDrawer}
                  >
                    Редагувати оплати
                  </Button>
                )}

                <Button
                  block
                  icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => setIsOrderItemsDrawerOpen(true)}
                >
                  Комплектація замовлення
                </Button>

                <Divider style={{ margin: '4px 0 8px 0' }} />

                <Popconfirm
                  title="Увага!"
                  description="Ця операція незворотна! Ви впевнені?"
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={() => {}}
                >
                  <Button block danger icon={<StopOutlined />}>
                    Відміна замовлення
                  </Button>
                </Popconfirm>
              </Flex>
            </Card>
          )}

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

                      {vendorWebsite && (
                        <LinkOutlined
                          style={{
                            color: '#1677ff',
                            fontSize: 16,
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(vendorWebsite, '_blank')}
                        />
                      )}
                    </>
                  )}
                </Flex>
              </Flex>
            }
            style={{ marginBottom: 20 }}
          >
            {order.comment && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message={
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    <Text strong>Коментар до замовлення:</Text> {order.comment}
                  </Text>
                }
              />
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

          {!isDraft && hasReceiptDocuments && (
            <Card title="Отримання" style={{ marginBottom: 20 }}>
              <Table
                rowKey="id"
                columns={receiptColumns}
                dataSource={receiptDocuments}
                pagination={false}
                size="small"
                tableLayout="fixed"
              />
            </Card>
          )}

          {!isDraft && (
            <Card
              title={
                <Flex justify="space-between" align="center" wrap>
                  <span>Оплата</span>

                  <Text>
                    Баланс:{' '}
                    <strong
                      style={{
                        color:
                          Number(order.remaining_amount) > 0
                            ? '#ff4d4f'
                            : undefined,
                      }}
                    >
                      {formatMoney(order.remaining_amount)} ₴
                    </strong>
                  </Text>
                </Flex>
              }
              style={{ marginBottom: 20 }}
            >
              <Table
                rowKey="id"
                columns={paymentColumns}
                dataSource={
                  Array.isArray(order.payment_documents)
                    ? order.payment_documents
                    : []
                }
                pagination={false}
                size="small"
                tableLayout="fixed"
              />
            </Card>
          )}

          <Card title="Замовлення">
            <Table
              rowKey="id"
              columns={orderItemsColumns}
              dataSource={Array.isArray(order.items) ? order.items : []}
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </Card>
        </Col>
      </Row>

      <OrderReceiptDrawer
        open={isReceiptDrawerOpen}
        onClose={() => {
          setIsReceiptDrawerOpen(false);
          setSelectedReceiptDocumentId(null);
        }}
        order={order}
        initialReceiptDocumentId={selectedReceiptDocumentId}
        onReceiptSaved={() => loadOrderPage({ silent: true })}
      />

      <OrderPaymentsDrawer
        open={isPaymentsDrawerOpen}
        onClose={handleClosePaymentsDrawer}
        order={order}
        paymentState={{
          selectedPaymentId,
          selectedPaymentDocument,
          editingPaymentStatus,
          editingPaymentDate,
          editingPaymentAmount,
          selectedRecipientAccountId,
          paymentTransferFile,
        }}
        paymentActions={{
          setSelectedPaymentId,
          setEditingPaymentStatus,
          setEditingPaymentDate,
          setEditingPaymentAmount,
          setSelectedRecipientAccountId,
        }}
        recipientAccountOptions={recipientAccountOptions}
        recipientAccountsLoading={recipientAccountsLoading}
        savingPayment={savingPayment}
        handleSavePayment={handleSavePayment}
        handlePaymentTransferFileChange={handlePaymentTransferFileChange}
        getPaymentStatusTagColor={getPaymentStatusTagColor}
        getAvailablePaymentStatusOptions={getAvailablePaymentStatusOptions}
        PAYMENT_STATUS_LABELS={PAYMENT_STATUS_LABELS}
        formatMoney={formatMoney}
        formatDateDisplay={formatDateDisplay}
      />

      <OrderItemsDrawer
        open={isOrderItemsDrawerOpen}
        onClose={() => setIsOrderItemsDrawerOpen(false)}
        order={order}
        onOrderUpdated={() => loadOrderPage({ silent: true })}
      />
    </div>
  );
}

export default OrderDetailPage;
