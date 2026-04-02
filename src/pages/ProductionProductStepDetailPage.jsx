import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Table,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import { useParams } from 'react-router-dom';
import {
  EditOutlined,
  DeleteOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

function ProductionProductStepDetailPage() {
  const { id } = useParams();

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStepPage();
  }, [id]);

  const loadStepPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`product-steps/${id}/`);
      setStep(response.data);
    } catch (err) {
      console.error('Failed to load product step detail page:', err);
      setError('Не вдалося завантажити дані етапу.');
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`product-step-items/${itemId}/`);

      message.success('Компонент видалено');

      // обновляем данные
      loadStepPage();
    } catch (err) {
      console.error('Delete failed:', err);
      message.error('Не вдалося видалити компонент');
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

  if (!step) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Етап не знайдено." showIcon />
      </div>
    );
  }

  const stepDisplayName = `${step.sort_order}. ${step.name}`;
  const productDisplayName = `${step.product_family_name} ${step.product_version}`;

  const stepItemsColumns = [
    {
      title: '',
      key: 'edit',
      width: 56,
      align: 'center',
      render: () => <EditOutlined style={{ color: '#8c8c8c' }} />,
    },
    {
      title: 'Назва Item',
      key: 'item_name',
      render: (_, record) => record.inv_item_name || '—',
    },
    {
      title: 'Кількість',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
    },
    {
      title: 'Одиниця вимірювання',
      key: 'unit',
      width: 170,
      align: 'center',
      render: (_, record) =>
        record.inv_item_unit_symbol || record.inv_item_unit_name
          ? `${record.inv_item_unit_symbol || ''}${
              record.inv_item_unit_symbol && record.inv_item_unit_name
                ? ' — '
                : ''
            }${record.inv_item_unit_name || ''}`
          : '—',
    },
    {
      title: '',
      key: 'delete',
      width: 56,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="Видалити компонент?"
          description="Ви впевнені, що хочете видалити цей компонент з етапу?"
          onConfirm={() => handleDelete(record.id)}
          okText="Так"
          cancelText="Ні"
        >
          <DeleteOutlined style={{ color: '#ff4d4f', cursor: 'pointer' }} />
        </Popconfirm>
      ),
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
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 4 }}>
            {stepDisplayName}
          </Title>
          <Text type="secondary">{productDisplayName}</Text>
        </div>
      </Flex>

      <Row gutter={20} align="top">
        {/* Ліва колонка */}
        <Col xs={24} lg={6}>
          <Card title="Зображення" style={{ marginBottom: 20 }}>
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

          <Card title="Статистика">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>

        {/* Центральна колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            {renderField(
              'Назва',
              <Paragraph style={{ marginBottom: 0 }}>
                {stepDisplayName}
              </Paragraph>,
            )}

            {renderField(
              'Опис',
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {step.description || '—'}
              </Paragraph>,
            )}
          </Card>

          <Card title="Комплектація">
            <Table
              rowKey="id"
              columns={stepItemsColumns}
              dataSource={Array.isArray(step.step_items) ? step.step_items : []}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 16 }}>
              <Flex align="center" gap={8}>
                <FileAddOutlined style={{ color: '#8c8c8c' }} />
                <Text style={{ color: '#595959' }}>Додати компонент</Text>
              </Flex>
            </div>
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepDetailPage;
