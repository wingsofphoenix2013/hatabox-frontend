import { useEffect, useState } from 'react';
import {
  CheckCircleOutlined,
  FileImageOutlined,
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
  Row,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import { getStatusTagColor } from '../constants/orderStatus';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { formatDateUa } from '../utils/orderFormatters';

const { Title, Text } = Typography;

function OrderReclamationPage() {
  const location = useLocation();

  const reclamationId = location.state?.reclamationId || null;

  const [reclamation, setReclamation] = useState(null);
  const [loading, setLoading] = useState(Boolean(reclamationId));
  const [error, setError] = useState('');
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(false);

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
          color={getStatusTagColor(reclamation.status)}
          style={{
            fontSize: 16,
            lineHeight: '24px',
            paddingInline: 12,
            borderRadius: 8,
            marginInlineEnd: 0,
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

                  <Button block danger icon={<StopOutlined />}>
                    Відміна повернення
                  </Button>
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
                  <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                    {item.attachment_type === 'video' ? (
                      <video
                        src={item.file}
                        controls
                        style={{
                          width: '100%',
                          borderRadius: 8,
                          background: '#000',
                        }}
                      />
                    ) : (
                      <Image
                        src={item.file}
                        alt={item.attachment_type_name || 'Фотофіксація'}
                        style={{
                          width: '100%',
                          borderRadius: 8,
                          objectFit: 'cover',
                        }}
                      />
                    )}
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
