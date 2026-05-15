import { useEffect, useMemo, useState } from 'react';
import { DownOutlined, UpOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  Select,
  Skeleton,
  Typography,
  Upload,
  message,
} from 'antd';

import api from '../api/client';

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

  const [entriesLoading, setEntriesLoading] = useState(false);

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
  };

  const loadEntries = async () => {
    if (!salesOrderId) return;

    try {
      setEntriesLoading(true);

      await api.get(`production-diary-entries/?sales_order=${salesOrderId}`);
    } catch (err) {
      console.error('Failed to load production diary entries:', err);
      message.error('Не вдалося завантажити щоденник виробництва.');
    } finally {
      setEntriesLoading(false);
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
            ) : (
              <Text type="secondary">
                Натисніть, щоб додати коментар або файли до щоденника.
              </Text>
            )}
          </Card>
        )}

        <Card title="Щоденник виробництва">
          {entriesLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Text type="secondary">Дані з’являться пізніше.</Text>
          )}
        </Card>
      </Flex>
    </Drawer>
  );
}

export default SaleOrderDiaryDrawer;
