import { useEffect, useMemo, useState } from 'react';
import { DownOutlined, HolderOutlined, UpOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Flex,
  Input,
  InputNumber,
  Table,
  Typography,
  message,
} from 'antd';

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

function ProductionProductStepWorkCreateDrawer({
  open,
  onClose,
  product,
  onCompleted,
}) {
  const [sortOrder, setSortOrder] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [reordering, setReordering] = useState(false);
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setSortOrder(suggestedSortOrder);
    setName('');
    setDescription('');
    setSaving(false);
    setSubmitError('');
  };

  useEffect(() => {
    if (open) {
      setSortOrder(suggestedSortOrder);
      setName('');
      setDescription('');
      setSaving(false);
      setSubmitError('');
    }
  }, [open, suggestedSortOrder]);

  const steps = useMemo(() => {
    return Array.isArray(product?.steps)
      ? [...product.steps].sort(
          (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
        )
      : [];
  }, [product]);

  const usedSortOrders = useMemo(
    () => new Set(steps.map((step) => Number(step.sort_order))),
    [steps],
  );

  const suggestedSortOrder = useMemo(() => {
    if (steps.length === 0) {
      return 1;
    }

    const maxSortOrder = Math.max(
      ...steps.map((step) => Number(step.sort_order) || 0),
    );

    return maxSortOrder + 1;
  }, [steps]);

  const isSortOrderDuplicate =
    sortOrder !== null &&
    sortOrder !== undefined &&
    usedSortOrders.has(Number(sortOrder));

  const canCreateStep =
    product?.id &&
    product?.development_status === 'in_development' &&
    sortOrder !== null &&
    sortOrder !== undefined &&
    String(name).trim() &&
    !isSortOrderDuplicate &&
    !saving;

  const handleCreateStep = async () => {
    if (!canCreateStep) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      await api.post('product-steps/', {
        product: product.id,
        name: name.trim(),
        sort_order: sortOrder,
        description: description.trim(),
      });

      message.success('Етап створено.');

      if (onCompleted) {
        await onCompleted();
      }

      resetForm();
      onClose();
    } catch (err) {
      console.error('Failed to create product step:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'product',
        'name',
        'sort_order',
        'description',
      ]);

      setSubmitError(backendMessage || 'Не вдалося створити етап.');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderSteps = async (nextSteps) => {
    try {
      setReordering(true);
      resetForm();

      await api.post('product-steps/reorder/', {
        steps: nextSteps.map((step) => step.id),
      });

      message.success('Порядок етапів оновлено.');

      if (onCompleted) {
        await onCompleted();
      }
    } catch (err) {
      console.error('Failed to reorder product steps:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, ['steps']);
      message.error(backendMessage || 'Не вдалося змінити порядок етапів.');
    } finally {
      setReordering(false);
    }
  };

  const moveStep = (stepId, direction) => {
    if (reordering) return;

    const currentIndex = steps.findIndex((step) => step.id === stepId);

    if (currentIndex === -1) return;

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= steps.length) return;

    const nextSteps = [...steps];
    const [movedStep] = nextSteps.splice(currentIndex, 1);
    nextSteps.splice(nextIndex, 0, movedStep);

    void handleReorderSteps(nextSteps);
  };

  const stepColumns = [
    {
      title: '№',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      align: 'center',
      render: (value) => (
        <Text type={Number(value) === Number(sortOrder) ? 'danger' : undefined}>
          {value ?? '—'}
        </Text>
      ),
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Text
          type={
            Number(record.sort_order) === Number(sortOrder)
              ? 'danger'
              : undefined
          }
        >
          {value || '—'}
        </Text>
      ),
    },
    {
      title: <HolderOutlined />,
      key: 'reorder',
      width: 96,
      align: 'center',
      render: (_, record, index) => (
        <Flex justify="center" gap={10}>
          <UpOutlined
            style={{
              color: index === 0 || reordering ? '#d9d9d9' : '#1677ff',
              cursor: index === 0 || reordering ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (index > 0 && !reordering) {
                moveStep(record.id, 'up');
              }
            }}
          />

          <DownOutlined
            style={{
              color:
                index === steps.length - 1 || reordering
                  ? '#d9d9d9'
                  : '#1677ff',
              cursor:
                index === steps.length - 1 || reordering
                  ? 'not-allowed'
                  : 'pointer',
            }}
            onClick={() => {
              if (index < steps.length - 1 && !reordering) {
                moveStep(record.id, 'down');
              }
            }}
          />
        </Flex>
      ),
    },
  ];

  return (
    <Drawer
      title="Додати етап"
      placement="right"
      size="large"
      open={open}
      onClose={onClose}
      maskClosable={false}
    >
      <Flex vertical gap={16}>
        <Card title="1. Поточний перелік етапів">
          <Table
            rowKey="id"
            columns={stepColumns}
            dataSource={steps}
            loading={reordering}
            pagination={false}
            size="small"
            tableLayout="fixed"
            locale={{
              emptyText: 'Етапи поки відсутні.',
            }}
            rowClassName={(record) =>
              Number(record.sort_order) === Number(sortOrder)
                ? 'ant-table-row-selected'
                : ''
            }
          />
        </Card>

        <Card title="2. Створення етапу">
          <Flex vertical gap={14}>
            <div>
              <Text style={compactLabelStyle}>Порядковий номер етапу</Text>

              <InputNumber
                min={1}
                precision={0}
                style={{ width: 180 }}
                value={sortOrder}
                status={isSortOrderDuplicate ? 'error' : undefined}
                onChange={setSortOrder}
              />

              {isSortOrderDuplicate && (
                <Alert
                  type="error"
                  showIcon
                  message="Такий номер етапу вже використовується."
                  style={{ marginTop: 10 }}
                />
              )}
            </div>

            <div>
              <Text style={compactLabelStyle}>Назва етапу</Text>

              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Вкажіть назву етапу"
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Опис етапу</Text>

              <TextArea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Опис етапу"
              />
            </div>
            {submitError && (
              <Alert type="error" showIcon message={submitError} />
            )}
          </Flex>
        </Card>

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Закрити
          </Button>

          <Button
            type="primary"
            loading={saving}
            disabled={!canCreateStep}
            onClick={() => {
              void handleCreateStep();
            }}
          >
            Створити етап
          </Button>
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductStepWorkCreateDrawer;
