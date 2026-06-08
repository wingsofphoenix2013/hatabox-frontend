import {
  DeleteOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Image,
  Input,
  Select,
  Switch,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';

const { Text } = Typography;

const { Dragger } = Upload;

function ProductionComponentCreateDrawer({ open, onClose, onCompleted }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [unit, setUnit] = useState(null);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [requiresStoragePlace, setRequiresStoragePlace] = useState(true);
  const [isSplittable, setIsSplittable] = useState(false);
  const [qrItem, setQrItem] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadDictionaries = async () => {
      const [categoriesResponse, unitsResponse] = await Promise.all([
        api.get('categories/'),
        api.get('units/'),
      ]);

      setCategories(
        Array.isArray(categoriesResponse.data.results)
          ? categoriesResponse.data.results
          : [],
      );
      setUnits(
        Array.isArray(unitsResponse.data.results)
          ? unitsResponse.data.results
          : [],
      );
    };

    loadDictionaries();
  }, [open]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setCategory(null);
    setUnit(null);
    setRequiresStoragePlace(true);
    setIsSplittable(false);
    setQrItem(false);
    setFileList([]);
    setSaving(false);
    setSubmitError('');
    onClose();
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      const formData = new FormData();

      formData.append('name', name.trim());
      formData.append('category', category);
      formData.append('unit', unit);
      formData.append('requires_storage_place', requiresStoragePlace);
      formData.append('is_splittable', isSplittable);
      formData.append('qr_item', qrItem);
      formData.append('is_required_for_step_start', true);

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const response = await api.post('items/', formData);

      message.success('Компонент створено.');

      if (onCompleted) {
        await onCompleted(response.data);
      }

      handleClose();
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err.response?.data, ['name', 'category', 'unit']) ||
          'Не вдалося створити компонент.',
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = Boolean(name.trim() && category && unit);
  const previewFile = fileList[0];

  return (
    <Drawer
      title="Створення компонента"
      placement="right"
      size="large"
      open={open}
      onClose={handleClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Загальна інформація">
          <Flex vertical gap={14}>
            <div>
              <Text
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                Назва
              </Text>

              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Назва компонента"
              />
            </div>

            <div>
              <Text
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                Опис
              </Text>

              <Input.TextArea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Опис компонента"
              />
            </div>

            <div>
              <Text
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                Оберіть категорію
              </Text>

              <Select
                value={category}
                placeholder="Категорія"
                style={{ width: '100%' }}
                onChange={setCategory}
                options={categories.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
            </div>

            <div>
              <Text
                style={{
                  display: 'block',
                  marginBottom: 6,
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                Оберіть одиницю виміру
              </Text>

              <Select
                value={unit}
                placeholder="Одиниця виміру"
                style={{ width: '100%' }}
                onChange={setUnit}
                options={units.map((item) => ({
                  value: item.id,
                  label: `${item.name} (${item.symbol})`,
                }))}
              />
            </div>
          </Flex>
        </Card>

        <Card title="2. Налаштування">
          <Flex vertical gap={14}>
            <Flex justify="space-between" align="center" gap={12}>
              <Flex align="center" gap={6}>
                <Text>Місце зберігання</Text>
                <Tooltip title="Потребує прив’язки до конкретного місця зберігання на складі.">
                  <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Flex>

              <Switch
                checked={requiresStoragePlace}
                checkedChildren="Так"
                unCheckedChildren="Ні"
                onChange={setRequiresStoragePlace}
              />
            </Flex>

            <Flex justify="space-between" align="center" gap={12}>
              <Flex align="center" gap={6}>
                <Text>Можна ділити</Text>
                <Tooltip title="Допускає облік та операції з частиною товару.">
                  <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Flex>

              <Switch
                checked={isSplittable}
                checkedChildren="Так"
                unCheckedChildren="Ні"
                onChange={setIsSplittable}
              />
            </Flex>

            <Flex justify="space-between" align="center" gap={12}>
              <Flex align="center" gap={6}>
                <Text>Використання QR</Text>
                <Tooltip title="Допускає маркування товару індивідуальним QR-кодом.">
                  <QuestionCircleOutlined style={{ color: '#8c8c8c' }} />
                </Tooltip>
              </Flex>

              <Switch
                checked={qrItem}
                checkedChildren="Так"
                unCheckedChildren="Ні"
                onChange={setQrItem}
              />
            </Flex>
          </Flex>
        </Card>

        <Card title="3. Ілюстрація">
          {!previewFile ? (
            <Dragger
              multiple={false}
              maxCount={1}
              accept="image/jpeg,image/png"
              beforeUpload={(file) => {
                const isAllowed =
                  file.type === 'image/jpeg' || file.type === 'image/png';

                if (!isAllowed) {
                  message.error(
                    'Дозволено завантажувати лише JPG або PNG зображення.',
                  );

                  return Upload.LIST_IGNORE;
                }

                return false;
              }}
              fileList={fileList}
              onChange={({ fileList: nextFileList }) => {
                setFileList(nextFileList);
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>

              <p className="ant-upload-text">
                Натисніть або перетягніть зображення в цю область
              </p>

              <p className="ant-upload-hint">Можна додати лише один файл.</p>
            </Dragger>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                <Image
                  src={URL.createObjectURL(previewFile.originFileObj)}
                  alt={previewFile.name}
                  style={{
                    maxHeight: 260,
                    objectFit: 'contain',
                    maxWidth: '100%',
                  }}
                />

                <DeleteOutlined
                  style={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    color: '#ff4d4f',
                    background: '#ffffff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    padding: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => setFileList([])}
                />
              </div>
            </div>
          )}
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button onClick={handleClose} disabled={saving}>
            Закрити
          </Button>

          <Tooltip
            title={
              canSave
                ? ''
                : 'Для збереження потрібно заповнити назву, категорію та одиницю виміру.'
            }
          >
            <span>
              <Button
                type="primary"
                loading={saving}
                disabled={!canSave}
                onClick={handleSave}
              >
                Зберегти
              </Button>
            </span>
          </Tooltip>
        </Flex>

        {submitError && <Alert type="error" showIcon message={submitError} />}
      </Flex>
    </Drawer>
  );
}

export default ProductionComponentCreateDrawer;
