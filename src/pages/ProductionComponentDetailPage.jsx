import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row, Skeleton, Table, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionComponentDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  const [component, setComponent] = useState(null);
  const [productUsage, setProductUsage] = useState({
    usage_count: 0,
    products: [],
  });
  const [vendorAliases, setVendorAliases] = useState([]);
  const [intakeSummary, setIntakeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComponent();
    loadIntakeSummary();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadIntakeSummary = async () => {
    try {
      const response = await api.get(
        `inventory-intake-history/?inv_item=${id}&summary_only=true`,
      );

      setIntakeSummary(response.data || null);
    } catch (err) {
      console.error('Failed to load intake summary:', err);
      setIntakeSummary(null);
    }
  };

  const loadComponent = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`items/${id}/`);
      setComponent(response.data?.summary || null);
      setVendorAliases(
        Array.isArray(response.data?.vendor_aliases)
          ? response.data.vendor_aliases
          : [],
      );
      setProductUsage(
        response.data?.product_usage || {
          usage_count: 0,
          products: [],
        },
      );
    } catch (err) {
      console.error('Failed to load component detail page:', err);
      setError('Не вдалося завантажити дані компонента.');
      setComponent(null);
      setVendorAliases([]);
      setProductUsage({
        usage_count: 0,
        products: [],
      });
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

  if (error && !component) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!component) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Компонент не знайдено." showIcon />
      </div>
    );
  }

  const componentLabel =
    component.name || location.state?.componentLabel || `Компонент ID ${id}`;

  const productUsageRows = Array.isArray(productUsage.products)
    ? productUsage.products
    : [];

  const vendorAliasColumns = [
    {
      title: '№',
      key: 'index',
      width: 64,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Постачальник',
      key: 'vendor',
      render: (_, record) => (
        <span>
          {record.vendor_name || '—'}{' '}
          <a
            href={`/orders/vendors/${record.vendor_id}`}
            target="_blank"
            rel="noreferrer"
          >
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
          </a>
        </span>
      ),
    },
    {
      title: 'Назва',
      key: 'name',
      render: (_, record) =>
        `${record.vendor_sku || '—'} | ${record.vendor_item_name || '—'}`,
    },
  ];

  const productUsageColumns = [
    {
      title: '№',
      key: 'index',
      width: 64,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Назва',
      key: 'name',
      render: (_, record) => (
        <span>
          {record.product_family_name || '—'} | {record.product_code || '—'}{' '}
          <a
            href={`/production/products/${record.product_id}`}
            target="_blank"
            rel="noreferrer"
          >
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
          </a>
        </span>
      ),
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 140,
      align: 'center',
      render: (_, record) =>
        `${record.total_quantity || '—'} ${component.unit_symbol || ''}`.trim(),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginTop: 0, marginBottom: 20 }}>
        {componentLabel}
      </Title>

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
              {component.image ? (
                <img
                  src={component.image}
                  alt={component.name || ''}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <Text type="secondary">Зображення не додано</Text>
              )}
            </div>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Статистика">
            {intakeSummary ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr auto',
                  rowGap: 10,
                  columnGap: 8,
                  alignItems: 'center',
                }}
              >
                <Text strong style={{ textAlign: 'right' }}>
                  Отримано
                </Text>

                <div
                  style={{
                    borderBottom: '1px dotted #bfbfbf',
                    transform: 'translateY(2px)',
                  }}
                />

                <Text strong>
                  {intakeSummary.total_intake_quantity || 0}{' '}
                  {intakeSummary.unit_symbol || ''}
                </Text>

                <Text
                  type="secondary"
                  style={{
                    textAlign: 'right',
                    fontSize: 12,
                  }}
                >
                  закупка
                </Text>

                <div
                  style={{
                    borderBottom: '1px dotted #d9d9d9',
                    transform: 'translateY(2px)',
                  }}
                />

                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                  }}
                >
                  {intakeSummary.external_intake_quantity || 0}{' '}
                  {intakeSummary.unit_symbol || ''}
                </Text>

                <Text
                  type="secondary"
                  style={{
                    textAlign: 'right',
                    fontSize: 12,
                  }}
                >
                  давальче
                </Text>

                <div
                  style={{
                    borderBottom: '1px dotted #d9d9d9',
                    transform: 'translateY(2px)',
                  }}
                />

                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                  }}
                >
                  {intakeSummary.tolling_intake_quantity || 0}{' '}
                  {intakeSummary.unit_symbol || ''}
                </Text>
              </div>
            ) : (
              <Text type="secondary">Дані відсутні</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Пропозиції постачальників" style={{ marginBottom: 20 }}>
            <Table
              rowKey="vendor_item_id"
              columns={vendorAliasColumns}
              dataSource={vendorAliases}
              pagination={false}
              size="small"
              locale={{
                emptyText: 'Пропозиції постачальників відсутні.',
              }}
            />
          </Card>

          <Card title="Інформація про використання">
            <Table
              rowKey="product_id"
              columns={productUsageColumns}
              dataSource={productUsageRows}
              pagination={false}
              size="small"
              locale={{
                emptyText:
                  'Компонент не використовується у завершених продуктах.',
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionComponentDetailPage;
