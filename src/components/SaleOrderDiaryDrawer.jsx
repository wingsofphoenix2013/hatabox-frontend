import { useEffect, useMemo, useState } from 'react';
import {
  DownOutlined,
  PlayCircleOutlined,
  UpOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Image,
  Input,
  Select,
  Skeleton,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';

import api from '../api/client';
import { formatDateTimeDisplay } from '../utils/orderFormatters';

const { Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const PRODUCTION_STEP_STATUS_LABELS = {
  draft: 'Чернетка',
  in_progress: 'В роботі',
  ready: 'Готово',
  cancelled: 'Скасовано',
};

function SaleOrderDiaryDrawer({
  open,
  onClose,
  salesOrderId,
  productionReadiness,
  onSaved,
}) {
  const [isCreateExpanded, setIsCreateExpanded] = useState(false);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [comment, setComment] = useState('');
  const [fileList, setFileList] = useState([]);
  const [saving, setSaving] = useState(false);

  const [entries, setEntries] = useState([]);
  const [entriesNextUrl, setEntriesNextUrl] = useState(null);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [loadingMoreEntries, setLoadingMoreEntries] = useState(false);

  const canCreateEntry = Boolean(
    productionReadiness?.production_order &&
    productionReadiness?.can_edit_production_diary,
  );

  const stepOptions = useMemo(() => {
    const steps = Array.isArray(productionReadiness?.steps)
      ? productionReadiness.steps
      : [];

    return [
      {
        value: null,
        label: 'Загальний запис',
      },
      ...steps.map((step) => ({
        value: step.production_order_step,
        label: `Етап ${step.sequence_number}: ${step.name} [${
          PRODUCTION_STEP_STATUS_LABELS[step.status] || step.status || '—'
        }]`,
      })),
    ];
  }, [productionReadiness]);

  const resetCreateForm = () => {
    setIsCreateExpanded(false);
    setSelectedStepId(null);
    setComment('');
    setFileList([]);
    setSaving(false);
    setEntries([]);
    setEntriesNextUrl(null);
    setLoadingMoreEntries(false);
  };

  const loadEntries = async () => {
    if (!salesOrderId) return;

    try {
      setEntriesLoading(true);

      const response = await api.get(
        `production-diary-entries/?sales_order=${salesOrderId}`,
      );

      setEntries(
        Array.isArray(response.data?.results) ? response.data.results : [],
      );
      setEntriesNextUrl(response.data?.next || null);
    } catch (err) {
      console.error('Failed to load production diary entries:', err);
      message.error('Не вдалося завантажити щоденник виробництва.');
      setEntries([]);
      setEntriesNextUrl(null);
    } finally {
      setEntriesLoading(false);
    }
  };

  const loadMoreEntries = async () => {
    if (!entriesNextUrl) return;

    try {
      setLoadingMoreEntries(true);

      const response = await api.get(entriesNextUrl);

      setEntries((prev) => [
        ...prev,
        ...(Array.isArray(response.data?.results) ? response.data.results : []),
      ]);
      setEntriesNextUrl(response.data?.next || null);
    } catch (err) {
      console.error('Failed to load more production diary entries:', err);
      message.error('Не вдалося завантажити наступні записи.');
    } finally {
      setLoadingMoreEntries(false);
    }
  };

  useEffect(() => {
    if (!open) {
      resetCreateForm();
      return;
    }

    const activeStep = (productionReadiness?.steps || []).find(
      (step) => step.status === 'in_progress',
    );

    setSelectedStepId(activeStep?.production_order_step || null);
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, salesOrderId, productionReadiness?.production_order]);

  const handleCreateEntry = async () => {
    const normalizedComment = comment.trim();

    if (!normalizedComment && fileList.length === 0) {
      message.error('Додайте коментар або файл.');
      return;
    }

    if (!productionReadiness?.production_order) {
      message.error('Виробничий процес ще не створено.');
      return;
    }

    const formData = new FormData();

    formData.append('production_order', productionReadiness.production_order);

    if (selectedStepId) {
      formData.append('production_order_step', selectedStepId);
    }

    if (normalizedComment) {
      formData.append('comment', normalizedComment);
    }

    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('attachments[]', file.originFileObj);
      }
    });

    try {
      setSaving(true);

      await api.post('production-diary-entries/', formData);

      message.success('Запис додано.');
      resetCreateForm();

      await loadEntries();

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      console.error('Failed to create production diary entry:', err);
      message.error('Не вдалося створити запис щоденника.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Щоденник виробництва"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
    >
      <Flex vertical gap={16}>
        {canCreateEntry && (
          <Card
            title={
              <Flex justify="space-between" align="center" gap={12}>
                <span>Створіть новий запис</span>

                {isCreateExpanded ? (
                  <UpOutlined
                    style={{ color: '#8c8c8c', cursor: 'pointer' }}
                    onClick={() => setIsCreateExpanded(false)}
                  />
                ) : (
                  <DownOutlined
                    style={{ color: '#8c8c8c', cursor: 'pointer' }}
                    onClick={() => setIsCreateExpanded(true)}
                  />
                )}
              </Flex>
            }
          >
            {isCreateExpanded ? (
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
                    Етап виробництва
                  </Text>

                  <Select
                    style={{ width: '100%' }}
                    value={selectedStepId}
                    options={stepOptions}
                    onChange={setSelectedStepId}
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
                    Коментар
                  </Text>

                  <TextArea
                    rows={4}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Опишіть виконані роботи або поточний стан."
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
                    Файли
                  </Text>

                  <Dragger
                    multiple
                    fileList={fileList}
                    beforeUpload={() => false}
                    onChange={({ fileList: nextFileList }) =>
                      setFileList(nextFileList)
                    }
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Перетягніть файли сюди або натисніть для вибору
                    </p>
                    <p className="ant-upload-hint">
                      Можна додати фото, відео або інші файли.
                    </p>
                  </Dragger>
                </div>

                <Flex justify="flex-end">
                  <Button
                    type="primary"
                    loading={saving}
                    disabled={!comment.trim() && fileList.length === 0}
                    onClick={handleCreateEntry}
                  >
                    Створити запис
                  </Button>
                </Flex>
              </Flex>
            ) : null}
          </Card>
        )}

        <Card title="Щоденник виробництва">
          {entriesLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : entries.length > 0 ? (
            <Flex vertical gap={12}>
              {entries.map((entry) => (
                <Card key={entry.id} size="small">
                  <Flex vertical gap={10}>
                    <Flex justify="space-between" align="flex-start" gap={12}>
                      <Tag color="purple" style={{ marginInlineEnd: 0 }}>
                        {entry.production_order_step_name || 'Загальний запис'}
                      </Tag>

                      <Flex
                        vertical
                        align="flex-end"
                        gap={2}
                        style={{ textAlign: 'right' }}
                      >
                        <Text strong>
                          {formatDateTimeDisplay(entry.created_at)}
                        </Text>

                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {entry.author_username || 'Створено автоматично'}
                        </Text>
                      </Flex>
                    </Flex>

                    {entry.comment ? (
                      <Text style={{ whiteSpace: 'pre-wrap' }}>
                        {entry.comment}
                      </Text>
                    ) : null}

                    {Array.isArray(entry.attachments) &&
                    entry.attachments.length > 0 ? (
                      <Image.PreviewGroup>
                        <Flex gap={8} wrap>
                          {entry.attachments.slice(0, 6).map((attachment) => {
                            const isPhoto =
                              attachment.attachment_type === 'photo';

                            return isPhoto ? (
                              <Image
                                key={attachment.id}
                                src={attachment.file_url}
                                alt={attachment.filename || 'attachment'}
                                width={72}
                                height={72}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                  border: '1px solid #f0f0f0',
                                }}
                              />
                            ) : (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
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
                                  <Text style={{ fontSize: 11 }}>Файл</Text>
                                </Flex>
                              </a>
                            );
                          })}

                          {entry.attachments.length > 6 && (
                            <Flex
                              align="center"
                              justify="center"
                              style={{
                                width: 72,
                                height: 72,
                                borderRadius: 8,
                                border: '1px solid #f0f0f0',
                                background: '#fafafa',
                              }}
                            >
                              <Text strong>
                                +{entry.attachments.length - 6}
                              </Text>
                            </Flex>
                          )}
                        </Flex>
                      </Image.PreviewGroup>
                    ) : null}
                  </Flex>
                </Card>
              ))}

              {entriesNextUrl && (
                <Button
                  block
                  loading={loadingMoreEntries}
                  onClick={loadMoreEntries}
                >
                  Завантажити ще
                </Button>
              )}
            </Flex>
          ) : (
            <Text type="secondary">Записів у щоденнику ще немає.</Text>
          )}
        </Card>
      </Flex>
    </Drawer>
  );
}

export default SaleOrderDiaryDrawer;
