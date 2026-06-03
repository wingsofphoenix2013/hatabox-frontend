import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  CopyOutlined,
  FileImageOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PrinterOutlined,
  SettingOutlined,
  StopOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import ProductionProductStepWorkCreateDrawer from '../components/ProductionProductStepWorkCreateDrawer';

const { Title, Text } = Typography;

const getDevelopmentStatusTagColor = (status) => {
  switch (status) {
    case 'in_development':
      return 'processing';
    case 'finished':
      return 'success';
    default:
      return 'default';
  }
};

function ProductionProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStepWorkCreateDrawerOpen, setIsStepWorkCreateDrawerOpen] =
    useState(false);
  const [stepWorkDrawerMode, setStepWorkDrawerMode] = useState('create');
  const [selectedStepForDrawer, setSelectedStepForDrawer] = useState(null);
  const [expandedStepDescriptionId, setExpandedStepDescriptionId] =
    useState(null);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`products/${id}/`);
      setProduct(response.data || null);
    } catch (err) {
      console.error('Failed to load product detail page:', err);
      setError('Не вдалося завантажити дані продукту.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProduct = async () => {
    try {
      const response = await api.get(`products/${id}/`);
      setProduct(response.data || null);
    } catch (err) {
      console.error('Failed to refresh product detail page:', err);
    }
  };

  const handleFinishDevelopment = async () => {
    try {
      setLoading(true);
      setError('');

      await api.post(`products/${id}/finish-development/`);
      await loadProduct();
    } catch (err) {
      console.error('Failed to finish product development:', err);
      setError('Не вдалося завершити розробку продукту.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setLoading(true);
      setError('');

      await api.delete(`products/${id}/`);

      message.success('Продукт видалено.');
      navigate('/production/products');
    } catch (err) {
      console.error('Failed to delete product:', err);
      setError('Не вдалося видалити продукт.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Продукт не знайдено." showIcon />
      </div>
    );
  }

  const steps = Array.isArray(product.steps) ? product.steps : [];

  const getStepDescriptionPreview = (value, maxLength = 220) => {
    if (!value) return '—';

    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength).trim()}...`;
  };

  const getStepColumns = (step) => [
    {
      title: (
        <Flex justify="space-between" align="center" gap={12}>
          <Text strong>
            Етап №{step.sort_order}. {step.name || '—'}
          </Text>

          <Link
            to={`/production/product-steps/${step.id}`}
            state={{
              productId: product.id,
              productLabel: `${product.product_family_code || '—'} v.${
                product.version || '—'
              }`,
              stepLabel: `Етап ${step.sort_order || '—'}. ${step.name || '—'}`,
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              style={{
                color: '#595959',
                paddingInline: 0,
              }}
            >
              Інформація
            </Button>
          </Link>
        </Flex>
      ),
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => {
        const works = Array.isArray(record.works) ? record.works : [];
        const isExpanded = expandedStepDescriptionId === record.id;
        const hasLongDescription = value && value.length > 220;

        return (
          <Flex vertical gap={10}>
            <Flex vertical gap={6}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>
                {isExpanded ? value || '—' : getStepDescriptionPreview(value)}
              </Text>

              {hasLongDescription && (
                <Button
                  type="link"
                  size="small"
                  style={{ paddingInline: 0, width: 'fit-content' }}
                  onClick={() =>
                    setExpandedStepDescriptionId(isExpanded ? null : record.id)
                  }
                >
                  {isExpanded ? 'Приховати повний опис' : 'Бачити повний опис'}
                </Button>
              )}
            </Flex>

            {product.development_status === 'in_development' && (
              <Flex justify="flex-end" align="center" gap={8} wrap>
                <Tag
                  style={{
                    marginInlineEnd: 0,
                    cursor: 'pointer',
                    color: '#595959',
                    fontSize: 12,
                  }}
                  onClick={() => {
                    setExpandedStepDescriptionId(null);
                    setStepWorkDrawerMode('edit');
                    setSelectedStepForDrawer(record);
                    setIsStepWorkCreateDrawerOpen(true);
                  }}
                >
                  <SettingOutlined /> Налаштування етапу
                </Tag>

                {works.length > 0 && (
                  <Tag
                    style={{
                      marginInlineEnd: 0,
                      cursor: 'pointer',
                      color: '#595959',
                      fontSize: 12,
                    }}
                    onClick={() => {
                      setExpandedStepDescriptionId(null);
                      setStepWorkDrawerMode('works');
                      setSelectedStepForDrawer(record);
                      setIsStepWorkCreateDrawerOpen(true);
                    }}
                  >
                    <ToolOutlined /> Налаштування робіт
                  </Tag>
                )}
              </Flex>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex vertical gap={4}>
          <Flex align="center" gap={12} wrap>
            <Title level={2} style={{ margin: 0 }}>
              {`${product.product_family_code || '—'} v.${
                product.version || '—'
              }`}
            </Title>

            <Tag
              color={getDevelopmentStatusTagColor(product.development_status)}
              style={{
                fontSize: 20,
                lineHeight: '32px',
                paddingInline: 14,
                paddingBlock: 6,
                borderRadius: 10,
                marginInlineEnd: 0,
              }}
            >
              {product.development_status_display ||
                product.development_status ||
                '—'}
            </Tag>
          </Flex>

          <Text type="secondary">{product.product_family_name || '—'}</Text>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card style={{ marginBottom: 20 }}>
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
                padding: 12,
              }}
            >
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              {product.development_status === 'in_development' && (
                <Popconfirm
                  title="Завершити розробку продукту?"
                  description="Після завершення розробки буде заборонено змінювати продукт, етапи, комплектацію та бібліотеку продукту."
                  okText="Так, завершити"
                  cancelText="Скасувати"
                  onConfirm={handleFinishDevelopment}
                >
                  <Button block type="primary" icon={<CheckCircleOutlined />}>
                    Завершити розробку
                  </Button>
                </Popconfirm>
              )}

              {product.development_status === 'finished' &&
                !product.is_base_modification && (
                  <Tooltip title="Функціонал перебуває в стадії розробки">
                    <Button
                      block
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      disabled
                    >
                      Зробити базовою версією
                    </Button>
                  </Tooltip>
                )}

              {!(
                product.development_status === 'finished' &&
                product.is_base_modification
              ) && <Divider dashed style={{ margin: '8px 0' }} />}

              {product.development_status === 'in_development' && (
                <Button
                  block
                  icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => {
                    setStepWorkDrawerMode('create');
                    setSelectedStepForDrawer(null);
                    setIsStepWorkCreateDrawerOpen(true);
                  }}
                >
                  Налаштування етапів
                </Button>
              )}

              <Link
                to={`/production/products/${product.id}/material-plan`}
                state={{
                  productId: product.id,
                  productCode: `${product.product_family_code || '—'} v.${
                    product.version || '—'
                  }`,
                }}
              >
                <Button
                  block
                  icon={<FileTextOutlined style={{ color: '#1677ff' }} />}
                >
                  Загальна комплектація
                </Button>
              </Link>

              <Tooltip title="Функціонал перебуває в стадії розробки">
                <Button
                  block
                  disabled
                  icon={<FileImageOutlined style={{ color: '#1677ff' }} />}
                >
                  Галерея продукту
                </Button>
              </Tooltip>

              <Tooltip title="Функціонал перебуває в стадії розробки">
                <Button
                  block
                  disabled
                  icon={<PrinterOutlined style={{ color: '#1677ff' }} />}
                >
                  Роздрукувати комплектацію
                </Button>
              </Tooltip>
              {product.development_status === 'finished' &&
                product.is_base_modification && (
                  <>
                    <Divider dashed style={{ margin: '8px 0' }} />

                    <Tooltip title="Функціонал перебуває в стадії розробки">
                      <Button
                        block
                        disabled
                        icon={<CopyOutlined style={{ color: '#1677ff' }} />}
                      >
                        Зробити дублікат
                      </Button>
                    </Tooltip>
                  </>
                )}

              {product.development_status === 'in_development' && (
                <>
                  <Divider dashed style={{ margin: '8px 0' }} />

                  <Popconfirm
                    title="Видалити продукт?"
                    description="Буде видалено всі етапи, роботи та компоненти продукту. Цю дію неможливо скасувати."
                    okText="Так, видалити"
                    cancelText="Скасувати"
                    okButtonProps={{ danger: true }}
                    onConfirm={handleDeleteProduct}
                  >
                    <Button block danger icon={<StopOutlined />}>
                      Видалити версію
                    </Button>
                  </Popconfirm>
                </>
              )}
            </Flex>
          </Card>

          <Card title="Історія">
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Етапи виробництва">
            {steps.length === 0 ? (
              <Text type="secondary">Етапи поки відсутні</Text>
            ) : (
              <Flex vertical gap={16}>
                {steps.map((step) => (
                  <Table
                    key={step.id}
                    rowKey="id"
                    columns={getStepColumns(step)}
                    dataSource={[step]}
                    pagination={false}
                    size="small"
                    tableLayout="fixed"
                  />
                ))}
              </Flex>
            )}
          </Card>
        </Col>
      </Row>
      <ProductionProductStepWorkCreateDrawer
        open={isStepWorkCreateDrawerOpen}
        onClose={() => setIsStepWorkCreateDrawerOpen(false)}
        product={product}
        initialMode={stepWorkDrawerMode}
        initialStep={selectedStepForDrawer}
        onCompleted={refreshProduct}
      />
    </div>
  );
}

export default ProductionProductDetailPage;
