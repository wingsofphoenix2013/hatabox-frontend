import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileImageOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';

import OrderReclamationPhotoDrawer from '../components/OrderReclamationPhotoDrawer';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Image,
  Popconfirm,
  Row,
  Skeleton,
  Tag,
  Typography,
  message,
} from 'antd';
import { getStatusTagColor } from '../constants/orderStatus';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';

const { Title, Text } = Typography;

function OrderReclamationPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const reclamationId = location.state?.reclamationId || null;

  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(Boolean(reclamationId));
  const [error, setError] = useState('');
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);

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
      <Title level={2} style={{ marginTop: 0, marginBottom: 20 }}>
        {`Повернення №${reclamation.return_no || '—'} від ${formatDateUa(
          reclamation.return_date,
        )}`}{' '}
        <Tag
          color={
            reclamation.status === 'draft'
              ? undefined
              : getStatusTagColor(reclamation.status)
          }
          style={{
            fontSize: 16,
            lineHeight: '24px',
            paddingInline: 12,
            borderRadius: 8,
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
      </Title>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <>
              {reclamation.status !== 'completed' && (
                <>
                  <Button block type="primary" icon={<CheckCircleOutlined />}>
                    Повернення виконане
                  </Button>

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
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Card title="Рекламація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
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
