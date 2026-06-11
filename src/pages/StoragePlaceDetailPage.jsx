import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Flex, Spin, Typography, message } from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

function StoragePlaceDetailPage() {
  const { id } = useParams();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
      <Flex justify="center" style={{ padding: 24 }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Точка зберігання</h2>

      <div>
        <Text strong>code: </Text>
        <Text>{summary?.code || '—'}</Text>
      </div>

      <div>
        <Text strong>address: </Text>
        <Text>{summary?.address || '—'}</Text>
      </div>

      <div>
        <Text strong>address_verbose: </Text>
        <Text>{summary?.address_verbose || '—'}</Text>
      </div>

      <Flex gap={8}>
        <Button
          type="primary"
          loading={actionLoading}
          disabled={summary?.is_active === true}
          onClick={() => handleChangeActiveStatus('activate')}
        >
          Активувати
        </Button>

        <Button
          danger
          loading={actionLoading}
          disabled={summary?.is_active === false}
          onClick={() => handleChangeActiveStatus('deactivate')}
        >
          Деактивувати
        </Button>
      </Flex>
    </div>
  );
}

export default StoragePlaceDetailPage;
