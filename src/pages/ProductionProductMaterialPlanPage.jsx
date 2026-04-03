import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Flex,
  Popover,
  Row,
  Skeleton,
  Table,
  Typography,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionProductMaterialPlanPage() {
  const { id } = useParams();

  const [materialPlan, setMaterialPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMaterialPlan();
  }, [id]);

  const loadMaterialPlan = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`products/${id}/material-plan/`);
      setMaterialPlan(response.data);
    } catch (err) {
      console.error('Failed to load material plan:', err);
      setError('Не вдалося завантажити загальну комплектацію продукту.');
      setMaterialPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = useMemo(() => {
    if (!materialPlan?.summary_items) return [];

    const groups = new Map();

    materialPlan.summary_items.forEach((item) => {
      const categoryName = item.inv_item_category_name || 'Без категорії';

      if (!groups.has(categoryName)) {
        groups.set(categoryName, []);
      }

      groups.get(categoryName).push(item);
    });

    return Array.from(groups.entries())
      .map(([categoryName, items]) => ({
        categoryName,
        items: [...items].sort((a, b) =>
          (a.inv_item_name || '').localeCompare(b.inv_item_name || '', 'uk'),
        ),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'uk'));
  }, [materialPlan]);

  const flatDataSource = useMemo(() => {
    let rowIndex = 1;
    const rows = [];

    groupedItems.forEach((group) => {
      rows.push({
        id: `group-${group.categoryName}`,
        isGroupRow: true,
        categoryName: group.categoryName,
      });

      group.items.forEach((item) => {
        rows.push({
          ...item,
          id: `item-${item.inv_item_id}`,
          isGroupRow: false,
          rowNumber: rowIndex,
        });
        rowIndex += 1;
      });
    });

    return rows;
  }, [groupedItems]);

  const renderStepsPopover = (steps) => {
    if (!steps || steps.length === 0) {
      return <Text type="secondary">Немає даних по етапах</Text>;
    }

    const sortedSteps = [...steps].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    );

    return (
      <div style={{ minWidth: 240 }}>
        {sortedSteps.map((step) => (
          <div
            key={`${step.product_step_id}-${step.sort_order}`}
            style={{ marginBottom: 8 }}
          >
            <div>
              <strong>
                {step.sort_order}. {step.product_step_name}
              </strong>
            </div>
            <div>
              {step.quantity} {step.unit_symbol || step.unit_name || ''}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: '№',
      key: 'rowNumber',
      width: 70,
      align: 'center',
      render: (_, record) => (record.isGroupRow ? '' : record.rowNumber),
    },
    {
      title: 'Код',
      key: 'internal_code',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.isGroupRow ? '' : record.inv_item_internal_code || '—',
    },
    {
      title: 'Назва',
      key: 'name',
      render: (_, record) =>
        record.isGroupRow ? (
          <strong>{record.categoryName}</strong>
        ) : (
          record.inv_item_name || '—'
        ),
    },
    {
      title: 'Кількість',
      key: 'total_quantity',
      width: 120,
      align: 'center',
      render: (_, record) => (record.isGroupRow ? '' : record.total_quantity),
    },
    {
      title: 'Од. вим.',
      key: 'unit',
      width: 120,
      align: 'center',
      render: (_, record) =>
        record.isGroupRow ? '' : record.unit_symbol || record.unit_name || '—',
    },
    {
      title: <InfoCircleOutlined />,
      key: 'info',
      width: 70,
      align: 'center',
      render: (_, record) =>
        record.isGroupRow ? null : (
          <Popover
            trigger="click"
            content={renderStepsPopover(record.steps)}
            placement="leftTop"
          >
            <InfoCircleOutlined
              style={{
                color: '#8c8c8c',
                cursor: 'pointer',
                fontSize: 16,
              }}
            />
          </Popover>
        ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
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

  if (!materialPlan?.product) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type="warning"
          description="Дані по загальній комплектації не знайдено."
          showIcon
        />
      </div>
    );
  }

  const productDisplayName = `${materialPlan.product.product_family_name} ${materialPlan.product.version}`;

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ margin: 0, marginBottom: 20 }}>
        Загальна комплектація для {productDisplayName}
      </Title>

      <Row gutter={20} align="top">
        {/* Ліва колонка */}
        <Col xs={24} lg={6}>
          <Card title="Зображення">
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
              }}
            >
              <Text type="secondary">Блок буде реалізовано пізніше</Text>
            </div>
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={18}>
          <Card title="Основна інформація">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={flatDataSource}
              pagination={false}
              size="small"
              rowClassName={(record) =>
                record.isGroupRow ? 'material-plan-group-row' : ''
              }
            />
          </Card>
        </Col>
      </Row>

      <style>
        {`
          .material-plan-group-row td {
            background: #fafafa !important;
            font-weight: 600;
            border-bottom: 1px solid #f0f0f0;
          }
          .material-plan-group-row td:not(:first-child) {
            border-left: none !important;
          }
        `}
      </style>
    </div>
  );
}

export default ProductionProductMaterialPlanPage;
