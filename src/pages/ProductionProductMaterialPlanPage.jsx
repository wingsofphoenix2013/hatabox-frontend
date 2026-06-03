import { useEffect, useState } from 'react';
import {
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RollbackOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Table,
  Typography,
} from 'antd';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

function ProductionProductMaterialPlanPage() {
  const { id } = useParams();
  const location = useLocation();

  const workTracking = location.state?.workTracking;

  const [materialPlan, setMaterialPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedInvItemId, setExpandedInvItemId] = useState(null);

  useEffect(() => {
    loadMaterialPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMaterialPlan = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = workTracking
        ? `products/${id}/work-material-plan/`
        : `products/${id}/step-material-plan/`;

      const response = await api.get(endpoint);
      setMaterialPlan(response.data || null);
    } catch (err) {
      console.error('Failed to load product material plan page:', err);
      setError('Не вдалося завантажити загальну комплектацію.');
      setMaterialPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const items = Array.isArray(materialPlan?.items) ? materialPlan.items : [];

  const tableData = items.flatMap((item) => {
    if (expandedInvItemId !== item.inv_item_id) {
      return [item];
    }

    const detailRows = workTracking
      ? (item.steps || []).flatMap((step) =>
          (step.works || []).map((work) => ({
            ...work,
            id: `${item.inv_item_id}-${step.product_step_id}-${work.product_work_id}`,
            isDetailRow: true,
            inv_item_id: item.inv_item_id,
            product_step_id: step.product_step_id,
            product_step_name: step.product_step_name,
            product_step_sort_order: step.product_step_sort_order,
            unit_symbol: item.unit_symbol,
          })),
        )
      : (item.steps || []).map((step) => ({
          ...step,
          id: `${item.inv_item_id}-${step.product_step_id}`,
          isDetailRow: true,
          inv_item_id: item.inv_item_id,
          product_step_sort_order: step.product_step_sort_order,
          unit_symbol: item.unit_symbol,
        }));

    return [item, ...detailRows];
  });

  const columns = [
    {
      title: '№',
      width: 70,
      align: 'center',
      render: (_, record, index) => (record.isDetailRow ? null : index + 1),
    },
    {
      title: 'Назва компоненту',
      dataIndex: 'inv_item_name',
      key: 'inv_item_name',
      render: (value, record) =>
        record.isDetailRow ? (
          <Flex justify="flex-end" align="center" gap={6}>
            <span>
              {record.product_step_sort_order || '—'}.{' '}
              {record.product_step_name || '—'}
              {workTracking && (
                <>
                  {' '}
                  | {record.product_work_sort_order || '—'}.{' '}
                  {record.product_work_name || '—'}
                </>
              )}
            </span>

            <Link
              to={
                workTracking
                  ? `/production/product-steps/${record.product_step_id}#work-${record.product_work_id}`
                  : `/production/product-steps/${record.product_step_id}`
              }
              target="_blank"
              style={{ display: 'inline-flex' }}
            >
              <InfoCircleOutlined style={{ color: '#595959' }} />
            </Link>
          </Flex>
        ) : (
          <Flex align="center" gap={6}>
            <span>{value || '—'}</span>
            <a
              href={`/inventory/stock/${record.inv_item_id}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex' }}
            >
              <InfoCircleOutlined style={{ color: '#595959' }} />
            </a>
          </Flex>
        ),
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 160,
      align: 'center',
      render: (_, record) =>
        record.isDetailRow
          ? `${formatQuantity(record.quantity)} ${record.unit_symbol || ''}`
          : `${formatQuantity(record.total_quantity)} ${
              record.unit_symbol || ''
            }`,
    },
    {
      title: <UnorderedListOutlined />,
      key: 'details',
      width: 70,
      align: 'center',
      render: (_, record) => {
        if (record.isDetailRow) return null;

        return expandedInvItemId === record.inv_item_id ? (
          <MenuFoldOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => setExpandedInvItemId(null)}
          />
        ) : (
          <MenuUnfoldOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => setExpandedInvItemId(record.inv_item_id)}
          />
        );
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

  if (error && !materialPlan) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  const product = materialPlan?.product;

  return (
    <>
      <style>
        {`
          .expanded-material-row td {
            background: #f0f5ff !important;
          }
        `}
      </style>

      <div style={{ padding: 20 }}>
        <Flex
          justify="space-between"
          align="flex-start"
          gap={16}
          style={{ marginBottom: 20 }}
        >
          <Flex vertical gap={4}>
            <Title level={2} style={{ margin: 0 }}>
              Загальна комплектація
            </Title>

            <Text type="secondary">{product?.code || '—'}</Text>
          </Flex>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Навігація">
              <Link
                to={`/production/products/${product?.id || id}`}
                state={{
                  productCode: product?.code,
                }}
              >
                <Button
                  block
                  icon={<RollbackOutlined style={{ color: '#1677ff' }} />}
                >
                  Повернутись до продукту
                </Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Комплектація виробу">
              <Table
                rowKey={(record) =>
                  record.isDetailRow ? record.id : record.inv_item_id
                }
                columns={columns}
                dataSource={tableData}
                pagination={false}
                size="small"
                rowClassName={(record) =>
                  !record.isDetailRow &&
                  expandedInvItemId === record.inv_item_id
                    ? 'expanded-material-row'
                    : ''
                }
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default ProductionProductMaterialPlanPage;
