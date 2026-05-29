import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  Select,
  Switch,
  Typography,
  message,
} from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;
const { TextArea } = Input;

const compactLabelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  lineHeight: 1.2,
};

function ProductionProductCreateDrawer({ open, onClose, onCompleted }) {
  const navigate = useNavigate();

  const [families, setFamilies] = useState([]);
  const [familiesLoading, setFamiliesLoading] = useState(false);

  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [createInfo, setCreateInfo] = useState(null);

  const [version, setVersion] = useState('');
  const [checkingVersion, setCheckingVersion] = useState(false);
  const [versionAvailable, setVersionAvailable] = useState(null);

  const [workTracking, setWorkTracking] = useState(true);
  const [hrTracking] = useState(false);
  const [description, setDescription] = useState('');

  const [step1Error, setStep1Error] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [creating, setCreating] = useState(false);

  const familyOptions = useMemo(
    () =>
      families.map((family) => ({
        value: family.id,
        label: `${family.code || '—'} — ${family.name || '—'}`,
      })),
    [families],
  );

  const formUnlocked =
    Boolean(selectedFamilyId) &&
    Boolean(version.trim()) &&
    versionAvailable === true;

  const canCreate = formUnlocked && !creating;

  useEffect(() => {
    if (!open) return;

    resetAll();
    loadFamilies();
  }, [open]);

  const resetVersionCheck = () => {
    setCreateInfo((prev) =>
      prev
        ? {
            ...prev,
            generated_code: null,
            version_available: null,
          }
        : prev,
    );
    setVersionAvailable(null);
    setSubmitError('');
  };

  const resetAll = () => {
    setFamilies([]);
    setSelectedFamilyId(null);
    setCreateInfo(null);
    setVersion('');
    setCheckingVersion(false);
    setVersionAvailable(null);
    setWorkTracking(true);
    setDescription('');
    setStep1Error('');
    setSubmitError('');
    setCreating(false);
  };

  const loadFamilies = async () => {
    try {
      setFamiliesLoading(true);

      const response = await api.get('product-families/');
      setFamilies(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
    } catch (err) {
      console.error('Failed to load product families:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data);
      setStep1Error(
        backendMessage || 'Не вдалося завантажити сімейства продуктів.',
      );
      setFamilies([]);
    } finally {
      setFamiliesLoading(false);
    }
  };

  const loadCreateInfo = async (familyId) => {
    if (!familyId) {
      setCreateInfo(null);
      return;
    }

    try {
      setStep1Error('');

      const response = await api.get('products/create-info/', {
        params: {
          product_family: familyId,
        },
      });

      setCreateInfo(response.data || null);
    } catch (err) {
      console.error('Failed to load product create info:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'product_family',
      ]);

      setStep1Error(
        backendMessage || 'Не вдалося отримати дані для створення продукту.',
      );
      setCreateInfo(null);
    }
  };

  const handleFamilyChange = (value) => {
    const nextFamilyId = value ?? null;

    setSelectedFamilyId(nextFamilyId);
    setVersion('');
    setVersionAvailable(null);
    setCreateInfo(null);
    setStep1Error('');
    setSubmitError('');

    if (nextFamilyId) {
      void loadCreateInfo(nextFamilyId);
    }
  };

  const handleVersionChange = (event) => {
    const nextValue = event.target.value.replace(/[^\d.]/g, '');

    setVersion(nextValue);
    resetVersionCheck();
  };

  const handleCheckVersion = async () => {
    const trimmedVersion = version.trim();

    if (!selectedFamilyId) {
      setStep1Error('Оберіть сімейство продукту.');
      return;
    }

    if (!trimmedVersion) {
      setStep1Error('Вкажіть версію продукту.');
      return;
    }

    try {
      setCheckingVersion(true);
      setStep1Error('');
      setSubmitError('');

      const response = await api.get('products/create-info/', {
        params: {
          product_family: selectedFamilyId,
          version: trimmedVersion,
        },
      });

      const nextCreateInfo = response.data || null;

      setCreateInfo(nextCreateInfo);
      setVersionAvailable(nextCreateInfo?.version_available ?? null);
    } catch (err) {
      console.error('Failed to check product version:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'product_family',
        'version',
      ]);

      setStep1Error(backendMessage || 'Не вдалося перевірити версію продукту.');
      setVersionAvailable(null);
    } finally {
      setCheckingVersion(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!canCreate) return;

    try {
      setCreating(true);
      setSubmitError('');

      const payload = {
        product_family: selectedFamilyId,
        version: version.trim(),
        work_tracking: workTracking,
      };

      if (description.trim()) {
        payload.description = description.trim();
      }

      const response = await api.post('products/', payload);
      const createdProduct = response.data || null;

      if (!createdProduct?.id) {
        setSubmitError('Продукт створено, але backend не повернув id.');
        return;
      }

      message.success('Продукт створено.');

      if (onCompleted) {
        await onCompleted();
      }

      onClose();
      navigate(`/production/products/${createdProduct.id}`);
    } catch (err) {
      console.error('Failed to create product:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'product_family',
        'version',
        'work_tracking',
        'description',
      ]);

      setSubmitError(backendMessage || 'Не вдалося створити продукт.');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  return (
    <Drawer
      title="Створити новий продукт"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Оберіть сімейство">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Оберіть тип продукту</Text>

              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Оберіть сімейство продукту"
                style={{ width: '100%' }}
                value={selectedFamilyId}
                loading={familiesLoading}
                options={familyOptions}
                onChange={handleFamilyChange}
              />
            </div>

            {createInfo && (
              <Alert
                type="info"
                showIcon
                message={`Поточна базова версія продукту — ${
                  createInfo.base_version || 'відсутня'
                }`}
              />
            )}

            <div>
              <Text style={compactLabelStyle}>Оберіть версію продукту</Text>

              <Flex align="center" gap={10}>
                <Input
                  placeholder="Наприклад: 1.5"
                  value={version}
                  onChange={handleVersionChange}
                  style={{ maxWidth: 180 }}
                  disabled={!selectedFamilyId}
                />

                <SyncOutlined
                  spin={checkingVersion}
                  style={{
                    color:
                      selectedFamilyId && version.trim()
                        ? '#1677ff'
                        : '#bfbfbf',
                    cursor:
                      selectedFamilyId && version.trim()
                        ? 'pointer'
                        : 'not-allowed',
                    fontSize: 17,
                  }}
                  onClick={() => {
                    if (
                      selectedFamilyId &&
                      version.trim() &&
                      !checkingVersion
                    ) {
                      void handleCheckVersion();
                    }
                  }}
                />

                {versionAvailable === true && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    Версія вільна
                  </Text>
                )}

                {versionAvailable === false && (
                  <Text type="danger" style={{ fontSize: 12 }}>
                    Версія вже зайнята
                  </Text>
                )}
              </Flex>
            </div>

            {createInfo?.generated_code && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Код буде створено backend: {createInfo.generated_code}
              </Text>
            )}

            {step1Error && <Alert type="error" showIcon message={step1Error} />}
          </Flex>
        </Card>

        <Card
          title="2. Налаштування"
          styles={{
            body: {
              opacity: formUnlocked ? 1 : 0.65,
              pointerEvents: formUnlocked ? 'auto' : 'none',
            },
          }}
        >
          <Flex vertical gap={14}>
            <Flex justify="space-between" align="center" gap={12}>
              <Text>Використання переліку робіт</Text>

              <Switch
                checked={workTracking}
                checkedChildren="Так"
                unCheckedChildren="Ні"
                onChange={setWorkTracking}
              />
            </Flex>

            <Flex justify="space-between" align="center" gap={12}>
              <Text>Використання погодинних графіків</Text>

              <Switch
                checked={hrTracking}
                checkedChildren="Так"
                unCheckedChildren="Ні"
                disabled
              />
            </Flex>
          </Flex>
        </Card>

        <Card
          title="3. Опис"
          styles={{
            body: {
              opacity: formUnlocked ? 1 : 0.65,
              pointerEvents: formUnlocked ? 'auto' : 'none',
            },
          }}
        >
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Додайте опис версії</Text>

              <TextArea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Опис продукту"
              />
            </div>

            {submitError && (
              <Alert type="error" showIcon message={submitError} />
            )}
          </Flex>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose}>Закрити</Button>

          <Button
            type="primary"
            disabled={!canCreate}
            loading={creating}
            onClick={() => {
              void handleCreateProduct();
            }}
          >
            Створити продукт
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductCreateDrawer;
