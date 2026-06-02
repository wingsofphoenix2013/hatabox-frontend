import { useEffect, useState } from 'react';
import {
  CloseOutlined,
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
  Row,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function ProductionProductStepDetailPage() {
  const { id } = useParams();

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);

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
                {isEditingDescription ? (
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
                )}
              </Flex>
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepDetailPage;
