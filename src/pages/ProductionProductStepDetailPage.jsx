import { useEffect, useState } from 'react';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

function ProductionProductStepDetailPage() {
  const { id } = useParams();

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingStepItemId, setEditingStepItemId] = useState(null);
  const [stepItemQuantityValue, setStepItemQuantityValue] = useState(null);

  useEffect(() => {
    loadStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStep = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`product-steps/${id}/`);

      setStep(response.data || null);
      setDescriptionValue(response.data?.description || '');
    } catch (err) {
      console.error('Failed to load product step detail page:', err);
      setError('Не вдалося завантажити дані етапу.');
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const isProductEditable =
    step?.product_development_status === 'in_development';

  const stepItems = Array.isArray(step?.step_items) ? step.step_items : [];

  const stepItemColumns = [
    {
      title: '№',
      width: 70,
      render: (_, record, index) =>
        editingStepItemId === record.id ? (
          <DeleteOutlined style={{ color: '#ff4d4f' }} />
        ) : (
          index + 1
        ),
    },
    {
      title: 'Назва',
      dataIndex: 'inv_item_name',
      key: 'inv_item_name',
      render: (value) => value || '—',
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 160,
      render: (_, record) =>
        editingStepItemId === record.id ? (
          <InputNumber
            value={stepItemQuantityValue}
            min={0}
            style={{ width: '100%' }}
            onChange={setStepItemQuantityValue}
          />
        ) : (
          `${formatQuantity(record.quantity)} ${
            record.inv_item_unit_symbol || ''
          }`
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => {
        if (!isProductEditable) {
          return (
            <Tooltip title="Редагування компонентів неможливе у продуктах, які вже завершили розробку.">
              <EditOutlined style={{ color: '#bfbfbf' }} />
            </Tooltip>
          );
        }

        if (editingStepItemId === record.id) {
          return <SaveOutlined style={{ color: '#595959' }} />;
        }

        return (
          <EditOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => {
              setEditingStepItemId(record.id);
              setStepItemQuantityValue(Number(record.quantity) || 0);
            }}
          />
        );
      },
    },
  ];

  const handleSaveDescription = async () => {
    try {
      setSavingDescription(true);

      const response = await api.patch(`product-steps/${id}/`, {
        description: descriptionValue,
      });

      setStep(response.data || null);
      setDescriptionValue(response.data?.description || '');
      setIsEditingDescription(false);
    } catch (err) {
      console.error('Failed to update product step description:', err);
      setError('Не вдалося оновити опис етапу.');
    } finally {
      setSavingDescription(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !step) {
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

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            {`Етап №${step.sort_order || '—'}. ${step.name || '—'}`}
          </Title>

          <Text type="secondary">{step.product_code || '—'}</Text>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація">
            <Link
              to={`/production/products/${step.product_id}`}
              state={{
                productCode: step.product_code,
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
          <Card title="Основна інформація">
            <Flex vertical gap={10}>
              {isEditingDescription ? (
                <Input.TextArea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  autoSize={{ minRows: 4 }}
                />
              ) : (
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {step.description || '—'}
                </Text>
              )}

              <Flex justify="flex-end" gap={8} wrap>
                {step.product_development_status === 'in_development' &&
                  (isEditingDescription ? (
                    <>
                      <Tag
                        style={{
                          marginInlineEnd: 0,
                          cursor: savingDescription ? 'default' : 'pointer',
                          color: '#595959',
                          fontSize: 12,
                          opacity: savingDescription ? 0.6 : 1,
                        }}
                        onClick={() => {
                          if (!savingDescription) {
                            handleSaveDescription();
                          }
                        }}
                      >
                        <SaveOutlined /> Зберегти
                      </Tag>

                      <Tag
                        style={{
                          marginInlineEnd: 0,
                          cursor: 'pointer',
                          color: '#595959',
                          fontSize: 12,
                        }}
                        onClick={() => {
                          setDescriptionValue(step.description || '');
                          setIsEditingDescription(false);
                        }}
                      >
                        <CloseOutlined /> Скасувати
                      </Tag>
                    </>
                  ) : (
                    <Tag
                      style={{
                        marginInlineEnd: 0,
                        cursor: 'pointer',
                        color: '#595959',
                        fontSize: 12,
                      }}
                      onClick={() => setIsEditingDescription(true)}
                    >
                      <EditOutlined /> Редагувати опис етапу
                    </Tag>
                  ))}
              </Flex>
            </Flex>
          </Card>
          {step.product_work_tracking === false && (
            <Card title="Комплектація етапу">
              <Table
                rowKey="id"
                columns={stepItemColumns}
                dataSource={stepItems}
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepDetailPage;
