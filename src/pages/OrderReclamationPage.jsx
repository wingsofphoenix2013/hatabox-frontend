import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileImageOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';

import OrderReclamationPhotoDrawer from '../components/OrderReclamationPhotoDrawer';
import {
  Alert,
  Button,
  Input,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Image,
  Popconfirm,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { getStatusTagColor } from '../constants/orderStatus';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

function OrderReclamationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const reclamationId = location.state?.reclamationId || null;

  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(Boolean(reclamationId));
  const [error, setError] = useState('');
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editingComment, setEditingComment] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const loadReclamation = async () => {
    if (!reclamationId) {
      setError('Не передано ID документа повернення.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.get(
        `reclamation-return-documents/${reclamationId}/`,
      );

      setReclamation(response.data);
    } catch (err) {
      console.error('Failed to load reclamation return document:', err);
      setError('Не вдалося завантажити документ повернення.');
      setReclamation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReclamation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reclamationId]);

  const handleStartEditComment = () => {
    setEditingComment(reclamation?.comment || '');
    setIsEditingComment(true);
  };

  const handleCancelEditComment = () => {
    setIsEditingComment(false);
    setEditingComment('');
  };

  const handleSaveComment = async () => {
    if (!reclamation?.id) {
      message.error('Документ повернення не знайдено.');
      return;
    }

    try {
      setSavingComment(true);

      const response = await api.patch(
        `reclamation-return-documents/${reclamation.id}/`,
        {
          comment: editingComment || '',
        },
      );

      setReclamation(response.data);
      message.success('Коментар збережено.');
      setIsEditingComment(false);
    } catch (err) {
      console.error('Failed to update reclamation comment:', err);
      message.error('Не вдалося зберегти коментар.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeletePhotoFixationItem = async (itemId) => {
    try {
      setDeletingPhotoId(itemId);

      await api.delete(`reclamation-return-library-items/${itemId}/`);

      message.success('Файл видалено.');
      await loadReclamation();
    } catch (err) {
      console.error('Failed to delete reclamation file:', err);
      message.error('Не вдалося видалити файл.');
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleExecuteReclamation = async () => {
    if (!reclamation?.id) {
      message.error('Документ повернення не знайдено.');
      return;
    }

    try {
      setExecuting(true);

      await api.post(`reclamation-return-documents/${reclamation.id}/execute/`);

      message.success('Повернення виконано.');

      navigate(`/orders/${reclamation.order}`);
    } catch (err) {
      console.error('Failed to execute reclamation return:', err);
      message.error('Не вдалося виконати повернення.');
    } finally {
      setExecuting(false);
    }
  };

  const handleCancelReclamation = async () => {
    if (!reclamation?.id) {
      message.error('Документ повернення не знайдено.');
      return;
    }

    try {
      setCancelling(true);

      await api.post(`reclamation-return-documents/${reclamation.id}/cancel/`);

      message.success('Повернення скасовано.');

      navigate(`/orders/${reclamation.order}`);
    } catch (err) {
      console.error('Failed to cancel reclamation return:', err);
      message.error('Не вдалося скасувати повернення.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !reclamation) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  const photoFixationItems = Array.isArray(reclamation?.library?.items)
    ? reclamation.library.items
    : [];

  const reclamationItems = Array.isArray(reclamation?.items)
    ? reclamation.items
    : [];

  const reclamationColumns = [
    {
      title: '№',
      key: 'index',
      width: 70,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Товар',
      key: 'item',
      render: (_, record) => (
        <Flex vertical gap={2}>
          <Text strong>
            {record.vendor_item_name || '—'}

            {record.reason_name ? ` | ${record.reason_name}` : ''}
          </Text>

          <Flex align="center" gap={6} wrap={false}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.inventory_item_name || '—'}
            </Text>

            {record.inventory_item_id && (
              <InfoCircleOutlined
                style={{
                  color: '#1677ff',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onClick={() =>
                  window.open(
                    `/inventory/stock/${record.inventory_item_id}`,
                    '_blank',
                  )
                }
              />
            )}
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Знаходження',
      key: 'source',
      render: (_, record) => {
        const hasStoragePlace = Boolean(record.source_storage_place);

        return (
          <Flex vertical gap={2}>
            <Text strong>
              {hasStoragePlace
                ? record.source_storage_place_display_name || '—'
                : record.source_location_code || '—'}
            </Text>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {hasStoragePlace
                ? record.source_storage_place_full_display || '—'
                : record.source_location_name || '—'}
            </Text>
          </Flex>
        );
      },
    },
    {
      title: 'К-сть.',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value) => formatQuantity(value),
    },
  ];

  if (!reclamation) {
    return (
      <div style={{ padding: 20 }}>
        <Alert
          type="warning"
          description="Документ повернення не знайдено."
          showIcon
        />
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
        <Flex align="center" gap={12} wrap>
          <Title level={2} style={{ margin: 0 }}>
            {`Повернення №${reclamation.return_no || '—'} від ${formatDateUa(
              reclamation.return_date,
            )}`}
          </Title>

          <Tag
            color={
              reclamation.status === 'draft'
                ? undefined
                : getStatusTagColor(reclamation.status)
            }
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              ...(reclamation.status === 'draft'
                ? {
                    border: '1px solid #d9d9d9',
                    background: '#fafafa',
                    color: '#595959',
                  }
                : {}),
            }}
          >
            {reclamation.status_name || '—'}
          </Tag>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <>
              {reclamation.status !== 'completed' && (
                <>
                  <Popconfirm
                    title="Увага!"
                    description="Після виконання повернення товар буде списано зі складу. Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={handleExecuteReclamation}
                    disabled={executing}
                  >
                    <Button
                      block
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={executing}
                    >
                      Виконати повернення
                    </Button>
                  </Popconfirm>

                  <Divider dashed style={{ margin: '12px 0' }} />
                </>
              )}

              <Button
                block
                icon={<FileImageOutlined style={{ color: '#1677ff' }} />}
                onClick={() => setIsPhotoDrawerOpen(true)}
              >
                Фотофіксація
              </Button>

              {reclamation.status !== 'completed' && (
                <>
                  <Divider dashed style={{ margin: '12px 0' }} />

                  <Popconfirm
                    title="Увага!"
                    description="Ця операція незворотна! Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={handleCancelReclamation}
                    disabled={cancelling}
                  >
                    <Button
                      block
                      danger
                      icon={<StopOutlined />}
                      loading={cancelling}
                    >
                      Відміна повернення
                    </Button>
                  </Popconfirm>
                </>
              )}
            </>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Alert
              type="warning"
              showIcon
              message={
                <Flex vertical gap={12}>
                  <Flex justify="space-between" align="center">
                    <Text strong>Коментар до повернення</Text>

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
                      {reclamation.comment
                        ? reclamation.comment
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

                        <Button size="small" onClick={handleCancelEditComment}>
                          Скасувати
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </Flex>
              }
            />
          </Card>

          <Card title="Рекламація" style={{ marginBottom: 20 }}>
            <Table
              rowKey={(record, index) =>
                `${record.order_item_id}-${record.inventory_item_id}-${index}`
              }
              columns={reclamationColumns}
              dataSource={reclamationItems}
              pagination={false}
              size="small"
            />
          </Card>

          <Card title="Фотофіксація">
            {photoFixationItems.length === 0 ? (
              <Empty description="Фото або відео ще не додано." />
            ) : (
              <Row gutter={[12, 12]}>
                {photoFixationItems.map((item) => (
                  <Col key={item.id}>
                    <div
                      style={{
                        position: 'relative',
                        width: 96,
                        height: 96,
                      }}
                    >
                      {item.attachment_type === 'video' ? (
                        <a
                          href={item.file}
                          target="_blank"
                          rel="noreferrer"
                          style={{ textDecoration: 'none' }}
                        >
                          <Flex
                            vertical
                            align="center"
                            justify="center"
                            gap={4}
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 8,
                              border: '1px solid #f0f0f0',
                              color: '#595959',
                              background: '#fafafa',
                            }}
                          >
                            <PlayCircleOutlined />
                            <Text style={{ fontSize: 11 }}>Відео</Text>
                          </Flex>
                        </a>
                      ) : (
                        <Image
                          src={item.file}
                          alt={item.attachment_type_name || 'Фотофіксація'}
                          width={72}
                          height={72}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #f0f0f0',
                          }}
                        />
                      )}

                      <Popconfirm
                        title="Видалити файл?"
                        description="Ви впевнені, що хочете видалити цей файл?"
                        okText="Так"
                        cancelText="Ні"
                        onConfirm={() => handleDeletePhotoFixationItem(item.id)}
                        disabled={deletingPhotoId === item.id}
                      >
                        <DeleteOutlined
                          style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            color: '#ff4d4f',
                            background: '#ffffff',
                            borderRadius: '50%',
                            padding: 4,
                            cursor:
                              deletingPhotoId === item.id
                                ? 'default'
                                : 'pointer',
                          }}
                        />
                      </Popconfirm>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <OrderReclamationPhotoDrawer
        open={isPhotoDrawerOpen}
        onClose={() => setIsPhotoDrawerOpen(false)}
        reclamation={reclamation}
        onSaved={loadReclamation}
      />
    </div>
  );
}

export default OrderReclamationPage;
