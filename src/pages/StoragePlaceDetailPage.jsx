import { useEffect, useState } from 'react';
import { SettingOutlined, StopOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Popconfirm,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text, Title } = Typography;

const getPlaceTypeTagColor = (placeType) => {
  switch (placeType) {
    case 'area':
      return 'purple';
    case 'container':
      return 'blue';
    case 'rack':
      return 'green';
    case 'shelf':
      return 'magenta';
    case 'box':
      return 'orange';
    default:
      return 'default';
  }
};

function StoragePlaceDetailPage() {
  const { id } = useParams();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const loadStoragePlace = async () => {
    try {
      setLoading(true);

      const response = await api.get(`storage-places/${id}/detail-view/`);
      setSummary(response.data?.summary || null);
    } catch (err) {
      console.error('Failed to load storage place detail:', err);
      message.error('Не вдалося завантажити точку зберігання.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoragePlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSetDefault = async () => {
    try {
      setActionLoading(true);

      await api.post(`storage-places/${id}/set-default/`, {});

      message.success('Площадку призначено за замовчуванням.');
      await loadStoragePlace();
    } catch (err) {
      console.error('Failed to set default storage place:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);

      message.error(
        backendMessage || 'Не вдалося призначити площадку за замовчуванням.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeActiveStatus = async (action) => {
    try {
      setActionLoading(true);

      await api.post(`storage-places/${id}/${action}/`, {});
      message.success(
        action === 'activate'
          ? 'Точку зберігання активовано.'
          : 'Точку зберігання деактивовано.',
      );

      await loadStoragePlace();
    } catch (err) {
      console.error('Failed to change storage place active status:', err);

      const responseData = err?.response?.data;
      const backendMessage = getApiErrorMessage(responseData, ['is_active']);

      message.error(
        backendMessage || 'Не вдалося змінити статус точки зберігання.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
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
            Місце зберігання {summary?.code || '—'}
          </Title>

          <Tag
            color={getPlaceTypeTagColor(summary?.place_type)}
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
            }}
          >
            {summary?.place_type_name || '—'}
          </Tag>
        </Flex>

        {summary?.is_active === false && (
          <Tag
            color="default"
            style={{
              fontSize: 20,
              lineHeight: '32px',
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 10,
              marginInlineEnd: 0,
              border: '1px solid #d9d9d9',
              background: '#fafafa',
              color: '#595959',
            }}
          >
            ВІДКЛЮЧЕНО
          </Tag>
        )}
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Стікер" style={{ marginBottom: 20 }}>
            <Flex justify="center" align="center">
              <Title
                level={1}
                style={{
                  margin: 0,
                  lineHeight: 1,
                  fontSize: 32,
                }}
              >
                {summary?.address || '—'}
              </Title>
            </Flex>
          </Card>

          <Card title="Навігація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={8}>
              {summary?.place_type === 'area' && summary?.can_set_default && (
                <Popconfirm
                  title="Призначити за замовчуванням?"
                  description="Ця площадка стане площадкою за замовчуванням для локації. Ви впевнені?"
                  okText="Так"
                  cancelText="Ні"
                  onConfirm={handleSetDefault}
                  disabled={actionLoading}
                >
                  <Button block type="primary" loading={actionLoading}>
                    За замовчуванням
                  </Button>
                </Popconfirm>
              )}

              {summary?.is_active === false &&
                (summary?.can_activate ? (
                  <Popconfirm
                    title="Активувати місце зберігання?"
                    description="Місце зберігання знову стане доступним для використання. Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={() => handleChangeActiveStatus('activate')}
                    disabled={actionLoading}
                  >
                    <Button block type="primary" loading={actionLoading}>
                      Активувати місце зберігання
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip
                    title={
                      summary?.activate_block_reason ||
                      'Активація зараз недоступна.'
                    }
                  >
                    <Button block disabled>
                      Активувати місце зберігання
                    </Button>
                  </Tooltip>
                ))}

              <Button
                block
                icon={<SettingOutlined style={{ color: '#1677ff' }} />}
                onClick={() => setIsEditDrawerOpen(true)}
                style={{ color: '#1677ff' }}
              >
                Налаштування місця зберігання
              </Button>

              <Divider dashed style={{ margin: '4px 0 8px 0' }} />

              {summary?.is_active === true &&
                (summary?.can_deactivate ? (
                  <Popconfirm
                    title="Вимкнути місце зберігання?"
                    description="Місце зберігання буде деактивовано. Ви впевнені?"
                    okText="Так"
                    cancelText="Ні"
                    onConfirm={() => handleChangeActiveStatus('deactivate')}
                    disabled={actionLoading}
                  >
                    <Button
                      block
                      danger
                      icon={<StopOutlined />}
                      loading={actionLoading}
                    >
                      Вимкнути
                    </Button>
                  </Popconfirm>
                ) : (
                  <Tooltip
                    title={
                      summary?.deactivate_block_reason ||
                      'Деактивація зараз недоступна.'
                    }
                  >
                    <Button block disabled icon={<StopOutlined />}>
                      Вимкнути
                    </Button>
                  </Tooltip>
                ))}
            </Flex>
          </Card>

          <Card title="Історія місця зберігання">
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані з’являться пізніше.</Text>
          </Card>

          {summary?.has_children && (
            <Card title="Вкладені місця зберігання">
              <Text type="secondary">Дані з’являться пізніше.</Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default StoragePlaceDetailPage;
