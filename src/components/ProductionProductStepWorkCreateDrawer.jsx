import { useEffect, useMemo, useState } from 'react';
import {
  DownOutlined,
  EditOutlined,
  HolderOutlined,
  ToolOutlined,
  UpOutlined,
} from '@ant-design/icons';
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
  Switch,
  Tooltip,
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

  const [addWorksToStep, setAddWorksToStep] = useState(false);
  const [createdStep, setCreatedStep] = useState(null);
  const [isEditingStep, setIsEditingStep] = useState(false);

  const [workSortOrder, setWorkSortOrder] = useState(null);
  const [workName, setWorkName] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [savingWork, setSavingWork] = useState(false);
  const [workSubmitError, setWorkSubmitError] = useState('');
  const [reorderingWorks, setReorderingWorks] = useState(false);

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

  const resetForm = () => {
    setSortOrder(suggestedSortOrder);
    setName('');
    setDescription('');
    setSaving(false);
    setSubmitError('');
    setAddWorksToStep(false);
    setCreatedStep(null);
    setIsEditingStep(false);
    setWorkSortOrder(null);
    setWorkName('');
    setWorkDescription('');
    setSavingWork(false);
    setWorkSubmitError('');
    setReorderingWorks(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isWorkTrackingMode = product?.work_tracking === true;
  const isStepCreatedWithWorks = Boolean(createdStep) && addWorksToStep;

  const isSortOrderDuplicate =
    !isStepCreatedWithWorks &&
    !isEditingStep &&
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

  const currentWorks = Array.isArray(createdStep?.works)
    ? [...createdStep.works].sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
      )
    : [];

  const usedWorkSortOrders = new Set(
    currentWorks.map((work) => Number(work.sort_order)),
  );

  const suggestedWorkSortOrder = currentWorks.length
    ? Math.max(...currentWorks.map((work) => Number(work.sort_order) || 0)) + 1
    : 1;

  useEffect(() => {
    if (isStepCreatedWithWorks && workSortOrder === null) {
      setWorkSortOrder(suggestedWorkSortOrder);
    }
  }, [isStepCreatedWithWorks, workSortOrder, suggestedWorkSortOrder]);

  const isWorkSortOrderDuplicate =
    workSortOrder !== null &&
    workSortOrder !== undefined &&
    usedWorkSortOrders.has(Number(workSortOrder));

  const canCreateWork =
    createdStep?.id &&
    workSortOrder !== null &&
    workSortOrder !== undefined &&
    String(workName).trim() &&
    !isWorkSortOrderDuplicate &&
    !savingWork;

  const handleSelectStepForWorks = (step) => {
    setCreatedStep(step);
    setAddWorksToStep(true);
    setIsEditingStep(false);
    setSortOrder(step.sort_order ?? null);
    setName(step.name || '');
    setDescription(step.description || '');
    setSubmitError('');
    setWorkSubmitError('');
    setWorkSortOrder(null);
    setWorkName('');
    setWorkDescription('');
  };

  const handleSelectStepForEdit = (step) => {
    setCreatedStep(step);
    setAddWorksToStep(false);
    setIsEditingStep(true);
    setSortOrder(step.sort_order ?? null);
    setName(step.name || '');
    setDescription(step.description || '');
    setSubmitError('');
    setWorkSubmitError('');
    setWorkSortOrder(null);
    setWorkName('');
    setWorkDescription('');
  };

  const handleUpdateStep = async () => {
    if (!createdStep?.id || !String(name).trim() || saving) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      await api.patch(`product-steps/${createdStep.id}/`, {
        name: name.trim(),
        description: description.trim(),
      });

      message.success('Етап оновлено.');

      if (onCompleted) {
        await onCompleted();
      }

      resetForm();
    } catch (err) {
      console.error('Failed to update product step:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'name',
        'description',
      ]);

      setSubmitError(backendMessage || 'Не вдалося оновити етап.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStep = async () => {
    if (!canCreateStep) {
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      const response = await api.post('product-steps/', {
        product: product.id,
        name: name.trim(),
        sort_order: sortOrder,
        description: description.trim(),
      });

      const nextCreatedStep = response.data || null;

      message.success('Етап створено.');

      if (isWorkTrackingMode && addWorksToStep) {
        setCreatedStep(nextCreatedStep);

        if (onCompleted) {
          await onCompleted();
        }

        return;
      }

      resetForm();
      onClose();

      if (onCompleted) {
        await onCompleted();
      }
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

  const resetWorkForm = () => {
    setWorkSortOrder(suggestedWorkSortOrder);
    setWorkName('');
    setWorkDescription('');
    setWorkSubmitError('');
  };

  const handleCreateWork = async () => {
    if (!canCreateWork) {
      return;
    }

    try {
      setSavingWork(true);
      setWorkSubmitError('');

      const response = await api.post('product-works/', {
        product_step: createdStep.id,
        name: workName.trim(),
        sort_order: workSortOrder,
        description: workDescription.trim(),
      });

      const nextWork = response.data || null;

      setWorkSortOrder(
        nextWork?.sort_order !== undefined && nextWork?.sort_order !== null
          ? Number(nextWork.sort_order) + 1
          : suggestedWorkSortOrder + 1,
      );
      setWorkName('');
      setWorkDescription('');
      setWorkSubmitError('');

      setCreatedStep((prev) =>
        prev
          ? {
              ...prev,
              works: [
                ...(Array.isArray(prev.works) ? prev.works : []),
                nextWork,
              ],
            }
          : prev,
      );

      message.success('Роботу додано.');

      if (onCompleted) {
        await onCompleted();
      }
    } catch (err) {
      console.error('Failed to create product work:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, [
        'product_step',
        'name',
        'sort_order',
        'description',
      ]);

      setWorkSubmitError(backendMessage || 'Не вдалося додати роботу.');
    } finally {
      setSavingWork(false);
    }
  };

  const handleReorderWorks = async (nextWorks) => {
    try {
      setReorderingWorks(true);
      resetWorkForm();

      await api.post('product-works/reorder/', {
        works: nextWorks.map((work) => work.id),
      });

      setCreatedStep((prev) =>
        prev
          ? {
              ...prev,
              works: nextWorks.map((work, index) => ({
                ...work,
                sort_order: (index + 1) * 10,
              })),
            }
          : prev,
      );

      message.success('Порядок робіт оновлено.');

      if (onCompleted) {
        await onCompleted();
      }
    } catch (err) {
      console.error('Failed to reorder product works:', err);

      const backendMessage = getApiErrorMessage(err?.response?.data, ['works']);
      message.error(backendMessage || 'Не вдалося змінити порядок робіт.');
    } finally {
      setReorderingWorks(false);
    }
  };

  const moveWork = (workId, direction) => {
    if (reorderingWorks) return;

    const currentIndex = currentWorks.findIndex((work) => work.id === workId);

    if (currentIndex === -1) return;

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= currentWorks.length) return;

    const nextWorks = [...currentWorks];
    const [movedWork] = nextWorks.splice(currentIndex, 1);
    nextWorks.splice(nextIndex, 0, movedWork);

    void handleReorderWorks(nextWorks);
  };

  const stepColumns = [
    {
      title: '№',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      align: 'center',
      render: (value) => (
        <Text
          type={
            !isStepCreatedWithWorks &&
            !isEditingStep &&
            Number(value) === Number(sortOrder)
              ? 'danger'
              : undefined
          }
        >
          {value ?? '—'}
        </Text>
      ),
    },
    {
      title: 'Назва',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Flex justify="space-between" align="center" gap={12}>
          <Text
            type={
              !isStepCreatedWithWorks &&
              !isEditingStep &&
              Number(record.sort_order) === Number(sortOrder)
                ? 'danger'
                : undefined
            }
            style={{
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={value || '—'}
          >
            {value || '—'}
          </Text>

          <Flex align="center" gap={10} style={{ flex: '0 0 auto' }}>
            {isWorkTrackingMode && (
              <Tooltip title="Відкрити перелік робіт етапу">
                <ToolOutlined
                  style={{
                    color: '#595959',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                  onClick={() => handleSelectStepForWorks(record)}
                />
              </Tooltip>
            )}

            <Tooltip title="Редагувати інформацію про етап">
              <EditOutlined
                style={{
                  color: '#595959',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
                onClick={() => handleSelectStepForEdit(record)}
              />
            </Tooltip>
          </Flex>
        </Flex>
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

  const workColumns = [
    {
      title: '№',
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 80,
      align: 'center',
      render: (value) => (
        <Text
          type={Number(value) === Number(workSortOrder) ? 'danger' : undefined}
        >
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
            Number(record.sort_order) === Number(workSortOrder)
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
              color: index === 0 || reorderingWorks ? '#d9d9d9' : '#1677ff',
              cursor:
                index === 0 || reorderingWorks ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (index > 0 && !reorderingWorks) {
                moveWork(record.id, 'up');
              }
            }}
          />

          <DownOutlined
            style={{
              color:
                index === currentWorks.length - 1 || reorderingWorks
                  ? '#d9d9d9'
                  : '#1677ff',
              cursor:
                index === currentWorks.length - 1 || reorderingWorks
                  ? 'not-allowed'
                  : 'pointer',
            }}
            onClick={() => {
              if (index < currentWorks.length - 1 && !reorderingWorks) {
                moveWork(record.id, 'down');
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
            rowClassName={(record) => {
              if (isStepCreatedWithWorks && record.id === createdStep?.id) {
                return 'ant-table-row-selected';
              }

              if (
                !isStepCreatedWithWorks &&
                !isEditingStep &&
                Number(record.sort_order) === Number(sortOrder)
              ) {
                return 'ant-table-row-selected';
              }

              return '';
            }}
          />
        </Card>

        <Card
          title={
            isEditingStep
              ? '2. Редагування етапу'
              : isStepCreatedWithWorks
                ? '2. Інформація про етап'
                : '2. Створення етапу'
          }
        >
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
                disabled={isStepCreatedWithWorks || isEditingStep}
              />

              {isSortOrderDuplicate && !isStepCreatedWithWorks && (
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
                disabled={isStepCreatedWithWorks && !isEditingStep}
              />
            </div>

            <div>
              <Text style={compactLabelStyle}>Опис етапу</Text>

              <TextArea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Опис етапу"
                disabled={isStepCreatedWithWorks && !isEditingStep}
              />
            </div>
            {isWorkTrackingMode && !isEditingStep && (
              <Flex justify="space-between" align="center" gap={12}>
                <Text>Додати перелік робіт до етапу</Text>

                <Switch
                  checked={addWorksToStep}
                  checkedChildren="Так"
                  unCheckedChildren="Ні"
                  disabled={Boolean(createdStep)}
                  onChange={setAddWorksToStep}
                />
              </Flex>
            )}
            {submitError && (
              <Alert type="error" showIcon message={submitError} />
            )}
          </Flex>
        </Card>
        {isStepCreatedWithWorks && !isEditingStep && (
          <>
            <Card title="3. Поточний перелік робіт етапу">
              <Table
                rowKey="id"
                columns={workColumns}
                dataSource={currentWorks}
                loading={reorderingWorks}
                pagination={false}
                size="small"
                tableLayout="fixed"
                locale={{
                  emptyText: 'Роботи поки відсутні.',
                }}
              />
            </Card>

            <Card title="4. Створення робочого процесу">
              <Flex vertical gap={14}>
                <div>
                  <Text style={compactLabelStyle}>Порядковий номер роботи</Text>

                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: 180 }}
                    value={workSortOrder}
                    status={isWorkSortOrderDuplicate ? 'error' : undefined}
                    onChange={setWorkSortOrder}
                  />

                  {isWorkSortOrderDuplicate && (
                    <Alert
                      type="error"
                      showIcon
                      message="Такий номер роботи вже використовується."
                      style={{ marginTop: 10 }}
                    />
                  )}
                </div>

                <div>
                  <Text style={compactLabelStyle}>Назва роботи</Text>

                  <Input
                    value={workName}
                    onChange={(event) => setWorkName(event.target.value)}
                    placeholder="Вкажіть назву роботи"
                  />
                </div>

                <div>
                  <Text style={compactLabelStyle}>Опис роботи</Text>

                  <TextArea
                    rows={5}
                    value={workDescription}
                    onChange={(event) => setWorkDescription(event.target.value)}
                    placeholder="Опис роботи"
                  />
                </div>

                {workSubmitError && (
                  <Alert type="error" showIcon message={workSubmitError} />
                )}
              </Flex>
            </Card>
          </>
        )}

        <Flex justify="space-between" align="center" gap={12} wrap>
          <Button
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Закрити
          </Button>

          {isEditingStep ? (
            <Button
              type="primary"
              loading={saving}
              disabled={!createdStep?.id || !String(name).trim() || saving}
              onClick={() => {
                void handleUpdateStep();
              }}
            >
              Зберегти етап
            </Button>
          ) : isStepCreatedWithWorks ? (
            <Button
              type="primary"
              loading={savingWork}
              disabled={!canCreateWork}
              onClick={() => {
                void handleCreateWork();
              }}
            >
              Додати роботу
            </Button>
          ) : (
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
          )}
        </Flex>
      </Flex>
    </Drawer>
  );
}

export default ProductionProductStepWorkCreateDrawer;
