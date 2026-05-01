import { useEffect, useState } from 'react';
import {
  ApartmentOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Input,
  Row,
  Skeleton,
  Typography,
} from 'antd';
import { useParams } from 'react-router-dom';
import api from '../api/client';

const { Title, Text } = Typography;

function WarehouseLocationDetailPage() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingField, setSavingField] = useState(null);

  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStartEditField = (fieldName, currentValue) => {
    setIsEditingComment(false);
    setEditingComment('');

    setEditingField(fieldName);
    setEditingValue(currentValue || '');
  };

  const handleSaveField = async (fieldName) => {
    try {
      setSavingField(fieldName);

      const response = await api.patch(`warehouse-locations/${id}/`, {
        [fieldName]: editingValue,
      });

      setData((prevData) => ({
        ...prevData,
        location: response.data,
      }));

      setEditingField(null);
      setEditingValue('');
    } catch (err) {
      console.error(`Failed to update warehouse location ${fieldName}:`, err);
    } finally {
      setSavingField(null);
    }
  };

  const handleStartEditComment = () => {
    setEditingField(null);
    setEditingValue('');

    setIsEditingComment(true);
    setEditingComment(data?.location?.comment || '');
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setEditingComment('');
  };

  const handleSaveComment = async () => {
    try {
      setSavingComment(true);

      const response = await api.patch(`warehouse-locations/${id}/`, {
        comment: editingComment,
      });

      setData((prevData) => ({
        ...prevData,
        location: response.data,
      }));

      setIsEditingComment(false);
      setEditingComment('');
    } catch (err) {
      console.error('Failed to update warehouse location comment:', err);
    } finally {
      setSavingComment(false);
    }
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`warehouse-locations/${id}/detail-view/`);
      setData(response.data || null);
    } catch (err) {
      console.error('Failed to load warehouse location detail page:', err);
      setError('Не вдалося завантажити дані локації.');
      setData(null);
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

  if (error && !data) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!data?.location) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Локацію не знайдено." showIcon />
      </div>
    );
  }

  const location = data.location;
  const directStock = data.direct_stock || [];
  const directReservedStock = data.direct_reserved_stock || [];

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Title level={2} style={{ margin: 0 }}>
            Інформація про локацію
          </Title>

          <Button type="primary" size="large" icon={<PlusOutlined />}>
            Додати місце зберігання
          </Button>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Локація" style={{ marginBottom: 20 }}>
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
                <span
                  style={{
                    fontSize: 120,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#000000',
                  }}
                >
                  {location.code || '—'}
                </span>
              </div>
            </Card>

            <Card title="Навігація">
              <Flex vertical gap={8}>
                <Button
                  block
                  icon={<ApartmentOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення місць зберігання
                </Button>

                <Button
                  block
                  icon={<SwapOutlined style={{ color: '#1677ff' }} />}
                >
                  Переміщення товару
                </Button>
              </Flex>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Flex vertical gap={16}>
                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      key: 'name',
                      label: 'Назва',
                      children:
                        editingField === 'name' ? (
                          <Flex align="center" gap={8}>
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              autoFocus
                              style={{ maxWidth: 420 }}
                            />

                            <SaveOutlined
                              style={{
                                color:
                                  savingField === 'name'
                                    ? '#bfbfbf'
                                    : '#8c8c8c',
                                cursor:
                                  savingField === 'name'
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() => {
                                if (savingField !== 'name') {
                                  handleSaveField('name');
                                }
                              }}
                            />
                          </Flex>
                        ) : (
                          <Flex align="center" gap={8}>
                            <Text strong style={{ fontSize: 20 }}>
                              {location.name || '—'}
                            </Text>

                            <EditOutlined
                              style={{
                                color: '#8c8c8c',
                                cursor: 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() =>
                                handleStartEditField('name', location.name)
                              }
                            />
                          </Flex>
                        ),
                    },
                  ]}
                />

                <Descriptions
                  column={1}
                  size="small"
                  items={[
                    {
                      key: 'address',
                      label: 'Адреса',
                      children:
                        editingField === 'address' ? (
                          <Flex align="center" gap={8}>
                            <Input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              autoFocus
                              style={{ maxWidth: 520 }}
                            />

                            <SaveOutlined
                              style={{
                                color:
                                  savingField === 'address'
                                    ? '#bfbfbf'
                                    : '#8c8c8c',
                                cursor:
                                  savingField === 'address'
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() => {
                                if (savingField !== 'address') {
                                  handleSaveField('address');
                                }
                              }}
                            />
                          </Flex>
                        ) : (
                          <Flex align="center" gap={8}>
                            <Text>{location.address || '—'}</Text>

                            <EditOutlined
                              style={{
                                color: '#8c8c8c',
                                cursor: 'pointer',
                                fontSize: 16,
                              }}
                              onClick={() =>
                                handleStartEditField(
                                  'address',
                                  location.address,
                                )
                              }
                            />
                          </Flex>
                        ),
                    },
                  ]}
                />

                <Alert
                  type="warning"
                  showIcon
                  message={
                    <Flex vertical gap={12}>
                      <Flex justify="space-between" align="center">
                        <Text strong>Коментар до локації</Text>

                        {!isEditingComment && (
                          <EditOutlined
                            style={{
                              color: '#8c8c8c',
                              cursor: 'pointer',
                              fontSize: 16,
                            }}
                            onClick={handleStartEditComment}
                          />
                        )}
                      </Flex>

                      {!isEditingComment ? (
                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                          {location.comment
                            ? location.comment
                            : 'Додати коментар'}
                        </Text>
                      ) : (
                        <Flex vertical gap={8}>
                          <Input.TextArea
                            value={editingComment}
                            onChange={(e) => setEditingComment(e.target.value)}
                            rows={3}
                            autoFocus
                          />

                          <Flex gap={8}>
                            <Button
                              type="primary"
                              size="small"
                              loading={savingComment}
                              onClick={handleSaveComment}
                            >
                              Зберегти
                            </Button>

                            <Button
                              size="small"
                              onClick={handleCancelEditComment}
                            >
                              Скасувати
                            </Button>
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  }
                />
              </Flex>
            </Card>
            {directStock.length > 0 && (
              <Card
                title="Доступні товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            {directReservedStock.length > 0 && (
              <Card
                title="Зарезервовані товари на локації"
                style={{ marginBottom: 20 }}
              >
                <Text type="secondary">Вміст буде додано пізніше.</Text>
              </Card>
            )}

            <Card title="Ієрархія місць зберігання">
              <Text type="secondary">Вміст буде додано пізніше.</Text>
            </Card>
          </Col>
        </Row>
      </Flex>
    </div>
  );
}

export default WarehouseLocationDetailPage;
