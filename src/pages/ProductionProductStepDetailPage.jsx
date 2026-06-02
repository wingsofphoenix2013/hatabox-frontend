import { useEffect, useState } from 'react';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  RollbackOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import { formatQuantity } from '../utils/formatNumber';

const { Title, Text } = Typography;

function ProductionProductStepDetailPage() {
  const { id } = useParams();

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [editingStepItemId, setEditingStepItemId] = useState(null);
  const [stepItemQuantityValue, setStepItemQuantityValue] = useState(null);

  const [isAddingStepItem, setIsAddingStepItem] = useState(false);
  const [newStepItemInvItemId, setNewStepItemInvItemId] = useState(null);
  const [newStepItemQuantityValue, setNewStepItemQuantityValue] =
    useState(null);
  const [inventoryItemSearch, setInventoryItemSearch] = useState('');
  const [inventoryItemOptions, setInventoryItemOptions] = useState([]);
  const [loadingInventoryItemOptions, setLoadingInventoryItemOptions] =
    useState(false);

  const [savingStepItem, setSavingStepItem] = useState(false);

  const [editingWorkId, setEditingWorkId] = useState(null);
  const [workDescriptionValue, setWorkDescriptionValue] = useState('');
  const [savingWork, setSavingWork] = useState(false);

  const [editingWorkItemId, setEditingWorkItemId] = useState(null);
  const [workItemQuantityValue, setWorkItemQuantityValue] = useState(null);
  const [addingWorkItemWorkId, setAddingWorkItemWorkId] = useState(null);
  const [newWorkItemInvItemId, setNewWorkItemInvItemId] = useState(null);
  const [newWorkItemQuantityValue, setNewWorkItemQuantityValue] =
    useState(null);
  const [savingWorkItem, setSavingWorkItem] = useState(false);

  const updateStepItemInState = (updatedItem) => {
    setStep((prev) => ({
      ...prev,
      step_items: (prev.step_items || []).map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    }));
  };

  const removeStepItemFromState = (stepItemId) => {
    setStep((prev) => ({
      ...prev,
      step_items: (prev.step_items || []).filter(
        (item) => item.id !== stepItemId,
      ),
    }));
  };

  const addStepItemToState = (newItem) => {
    setStep((prev) => ({
      ...prev,
      step_items: [...(prev.step_items || []), newItem],
    }));
  };

  const handleCreateStepItem = async () => {
    if (!newStepItemInvItemId) {
      setError('Оберіть компонент.');
      return;
    }

    if (!newStepItemQuantityValue || Number(newStepItemQuantityValue) <= 0) {
      setError('Вкажіть кількість більше нуля.');
      return;
    }

    try {
      setSavingStepItem(true);

      const response = await api.post('product-step-items/', {
        product_step: step.id,
        inv_item: newStepItemInvItemId,
        quantity: String(newStepItemQuantityValue),
      });

      addStepItemToState(response.data);
      setError('');

      setIsAddingStepItem(false);
      setNewStepItemInvItemId(null);
      setNewStepItemQuantityValue(null);
      setInventoryItemSearch('');
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося додати компонент.',
      );
    } finally {
      setSavingStepItem(false);
    }
  };

  const handleUpdateStepItem = async (stepItemId) => {
    if (!stepItemQuantityValue || Number(stepItemQuantityValue) <= 0) {
      setError('Вкажіть кількість більше нуля.');
      return;
    }

    try {
      setSavingStepItem(true);

      const response = await api.patch(`product-step-items/${stepItemId}/`, {
        quantity: String(stepItemQuantityValue),
      });

      updateStepItemInState(response.data);
      setError('');

      setEditingStepItemId(null);
      setStepItemQuantityValue(null);
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося оновити компонент.',
      );
    } finally {
      setSavingStepItem(false);
    }
  };

  const handleDeleteStepItem = async (stepItemId) => {
    try {
      setSavingStepItem(true);

      await api.delete(`product-step-items/${stepItemId}/`);

      removeStepItemFromState(stepItemId);
      setError('');

      setEditingStepItemId(null);
      setStepItemQuantityValue(null);
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося видалити компонент.',
      );
    } finally {
      setSavingStepItem(false);
    }
  };

  useEffect(() => {
    loadStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadStep = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`product-steps/${id}/`);

      setStep(response.data || null);
      setDescriptionValue(response.data?.description || '');
    } catch (err) {
      console.error('Failed to load product step detail page:', err);
      setError('Не вдалося завантажити дані етапу.');
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const isProductEditable =
    step?.product_development_status === 'in_development';

  const stepItems = Array.isArray(step?.step_items) ? step.step_items : [];
  const works = Array.isArray(step?.works) ? step.works : [];

  const getWorkItemTableData = (work) => {
    const workItems = Array.isArray(work.work_items) ? work.work_items : [];

    return addingWorkItemWorkId === work.id
      ? [
          ...workItems,
          {
            id: 'new-work-item',
            isNew: true,
            product_work: work.id,
          },
        ]
      : workItems;
  };

  const stepItemTableData = isAddingStepItem
    ? [
        ...stepItems,
        {
          id: 'new-step-item',
          isNew: true,
        },
      ]
    : stepItems;

  useEffect(() => {
    if (!isAddingStepItem && !addingWorkItemWorkId) return;

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingInventoryItemOptions(true);

        const response = await api.get('inventory-item-options/', {
          params: {
            search: inventoryItemSearch,
          },
        });

        setInventoryItemOptions(
          Array.isArray(response.data) ? response.data : [],
        );
      } catch (err) {
        console.error('Failed to load inventory item options:', err);
        setInventoryItemOptions([]);
      } finally {
        setLoadingInventoryItemOptions(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [isAddingStepItem, addingWorkItemWorkId, inventoryItemSearch]);

  const getWorkItemColumns = (work) => {
    const workItems = Array.isArray(work.work_items) ? work.work_items : [];

    return [
      {
        title: '№',
        width: 70,
        align: 'center',
        render: (_, record, index) => {
          if (record.isNew) {
            return (
              <CloseOutlined
                style={{ color: '#595959', cursor: 'pointer' }}
                onClick={() => {
                  if (savingWorkItem) return;

                  setError('');
                  setAddingWorkItemWorkId(null);
                  setNewWorkItemInvItemId(null);
                  setNewWorkItemQuantityValue(null);
                  setInventoryItemSearch('');
                }}
              />
            );
          }

          return editingWorkItemId === record.id ? (
            <DeleteOutlined
              style={{
                color: '#ff4d4f',
                cursor: savingWorkItem ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!savingWorkItem) {
                  handleDeleteWorkItem(work.id, record.id);
                }
              }}
            />
          ) : (
            index + 1
          );
        },
      },
      {
        title: 'Назва',
        dataIndex: 'inv_item_name',
        key: 'inv_item_name',
        render: (value, record) =>
          record.isNew ? (
            <Select
              showSearch
              value={newWorkItemInvItemId}
              placeholder="Оберіть компонент"
              filterOption={false}
              loading={loadingInventoryItemOptions}
              options={inventoryItemOptions
                .filter(
                  (item) =>
                    !workItems.some(
                      (workItem) => workItem.inv_item === item.id,
                    ),
                )
                .map((item) => ({
                  value: item.id,
                  label: `${item.internal_code || '—'} — ${item.name || '—'}`,
                }))}
              style={{ width: '100%' }}
              onSearch={setInventoryItemSearch}
              onChange={setNewWorkItemInvItemId}
            />
          ) : (
            value || '—'
          ),
      },
      {
        title: 'К-сть.',
        key: 'quantity',
        width: 160,
        align: 'center',
        render: (_, record) => {
          if (record.isNew) {
            return (
              <InputNumber
                value={newWorkItemQuantityValue}
                min={0}
                style={{ width: '100%' }}
                onChange={setNewWorkItemQuantityValue}
              />
            );
          }

          return editingWorkItemId === record.id ? (
            <InputNumber
              value={workItemQuantityValue}
              min={0}
              style={{ width: '100%' }}
              onChange={setWorkItemQuantityValue}
            />
          ) : (
            `${formatQuantity(record.quantity)} ${
              record.inv_item_unit_symbol || ''
            }`
          );
        },
      },
      {
        title: '',
        key: 'actions',
        width: 60,
        align: 'center',
        render: (_, record) => {
          if (record.isNew) {
            return (
              <SaveOutlined
                style={{
                  color: '#595959',
                  cursor: savingWorkItem ? 'default' : 'pointer',
                  opacity: savingWorkItem ? 0.6 : 1,
                }}
                onClick={() => {
                  if (!savingWorkItem) {
                    handleCreateWorkItem(work.id);
                  }
                }}
              />
            );
          }

          if (addingWorkItemWorkId) {
            return (
              <Tooltip title="Завершіть додавання компонента перед редагуванням інших рядків.">
                <EditOutlined style={{ color: '#bfbfbf' }} />
              </Tooltip>
            );
          }

          if (!isProductEditable) {
            return (
              <Tooltip title="Редагування компонентів неможливе у продуктах, які вже завершили розробку.">
                <EditOutlined style={{ color: '#bfbfbf' }} />
              </Tooltip>
            );
          }

          if (editingWorkItemId === record.id) {
            return (
              <SaveOutlined
                style={{
                  color: '#595959',
                  cursor: savingWorkItem ? 'default' : 'pointer',
                  opacity: savingWorkItem ? 0.6 : 1,
                }}
                onClick={() => {
                  if (!savingWorkItem) {
                    handleUpdateWorkItem(record.id);
                  }
                }}
              />
            );
          }

          return (
            <EditOutlined
              style={{ color: '#595959', cursor: 'pointer' }}
              onClick={() => {
                setError('');
                setEditingWorkItemId(record.id);
                setWorkItemQuantityValue(Number(record.quantity) || 0);
              }}
            />
          );
        },
      },
    ];
  };

  const stepItemColumns = [
    {
      title: '№',
      width: 70,
      align: 'center',
      render: (_, record, index) => {
        if (record.isNew) {
          return (
            <CloseOutlined
              style={{ color: '#595959', cursor: 'pointer' }}
              onClick={() => {
                if (savingStepItem) return;

                setError('');
                setIsAddingStepItem(false);
                setNewStepItemInvItemId(null);
                setNewStepItemQuantityValue(null);
                setInventoryItemSearch('');
              }}
            />
          );
        }

        return editingStepItemId === record.id ? (
          <DeleteOutlined
            style={{
              color: '#ff4d4f',
              cursor: savingStepItem ? 'default' : 'pointer',
            }}
            onClick={() => {
              if (!savingStepItem) {
                handleDeleteStepItem(record.id);
              }
            }}
          />
        ) : (
          index + 1
        );
      },
    },
    {
      title: 'Назва',
      dataIndex: 'inv_item_name',
      key: 'inv_item_name',
      render: (value, record) =>
        record.isNew ? (
          <Select
            showSearch
            value={newStepItemInvItemId}
            placeholder="Оберіть компонент"
            filterOption={false}
            loading={loadingInventoryItemOptions}
            options={inventoryItemOptions
              .filter(
                (item) =>
                  !stepItems.some((stepItem) => stepItem.inv_item === item.id),
              )
              .map((item) => ({
                value: item.id,
                label: `${item.internal_code || '—'} — ${item.name || '—'}`,
              }))}
            style={{ width: '100%' }}
            onSearch={setInventoryItemSearch}
            onChange={setNewStepItemInvItemId}
          />
        ) : (
          value || '—'
        ),
    },
    {
      title: 'К-сть.',
      key: 'quantity',
      width: 160,
      align: 'center',
      render: (_, record) => {
        if (record.isNew) {
          return (
            <InputNumber
              value={newStepItemQuantityValue}
              min={0}
              style={{ width: '100%' }}
              onChange={setNewStepItemQuantityValue}
            />
          );
        }

        return editingStepItemId === record.id ? (
          <InputNumber
            value={stepItemQuantityValue}
            min={0}
            style={{ width: '100%' }}
            onChange={setStepItemQuantityValue}
          />
        ) : (
          `${formatQuantity(record.quantity)} ${
            record.inv_item_unit_symbol || ''
          }`
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      align: 'center',
      render: (_, record) => {
        if (record.isNew) {
          return (
            <SaveOutlined
              style={{
                color: '#595959',
                cursor: savingStepItem ? 'default' : 'pointer',
                opacity: savingStepItem ? 0.6 : 1,
              }}
              onClick={() => {
                if (!savingStepItem) {
                  handleCreateStepItem();
                }
              }}
            />
          );
        }

        if (isAddingStepItem) {
          return (
            <Tooltip title="Завершіть додавання компонента перед редагуванням інших рядків.">
              <EditOutlined style={{ color: '#bfbfbf' }} />
            </Tooltip>
          );
        }

        if (!isProductEditable) {
          return (
            <Tooltip title="Редагування компонентів неможливе у продуктах, які вже завершили розробку.">
              <EditOutlined style={{ color: '#bfbfbf' }} />
            </Tooltip>
          );
        }

        if (editingStepItemId === record.id) {
          return (
            <SaveOutlined
              style={{
                color: '#595959',
                cursor: savingStepItem ? 'default' : 'pointer',
                opacity: savingStepItem ? 0.6 : 1,
              }}
              onClick={() => {
                if (!savingStepItem) {
                  handleUpdateStepItem(record.id);
                }
              }}
            />
          );
        }

        return (
          <EditOutlined
            style={{ color: '#595959', cursor: 'pointer' }}
            onClick={() => {
              setError('');
              setEditingStepItemId(record.id);
              setStepItemQuantityValue(Number(record.quantity) || 0);
            }}
          />
        );
      },
    },
  ];

  const updateWorkItemInState = (updatedItem) => {
    setStep((prev) => ({
      ...prev,
      works: (prev.works || []).map((work) =>
        work.id === updatedItem.product_work
          ? {
              ...work,
              work_items: (work.work_items || []).map((item) =>
                item.id === updatedItem.id ? updatedItem : item,
              ),
            }
          : work,
      ),
    }));
  };

  const removeWorkItemFromState = (workId, workItemId) => {
    setStep((prev) => ({
      ...prev,
      works: (prev.works || []).map((work) =>
        work.id === workId
          ? {
              ...work,
              work_items: (work.work_items || []).filter(
                (item) => item.id !== workItemId,
              ),
            }
          : work,
      ),
    }));
  };

  const addWorkItemToState = (newItem) => {
    setStep((prev) => ({
      ...prev,
      works: (prev.works || []).map((work) =>
        work.id === newItem.product_work
          ? {
              ...work,
              work_items: [...(work.work_items || []), newItem],
            }
          : work,
      ),
    }));
  };

  const handleCreateWorkItem = async (workId) => {
    if (!newWorkItemInvItemId) {
      setError('Оберіть компонент.');
      return;
    }

    if (!newWorkItemQuantityValue || Number(newWorkItemQuantityValue) <= 0) {
      setError('Вкажіть кількість більше нуля.');
      return;
    }

    try {
      setSavingWorkItem(true);

      const response = await api.post('product-work-items/', {
        product_work: workId,
        inv_item: newWorkItemInvItemId,
        quantity: String(newWorkItemQuantityValue),
      });

      addWorkItemToState(response.data);
      setError('');

      setAddingWorkItemWorkId(null);
      setNewWorkItemInvItemId(null);
      setNewWorkItemQuantityValue(null);
      setInventoryItemSearch('');
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося додати компонент.',
      );
    } finally {
      setSavingWorkItem(false);
    }
  };

  const handleUpdateWorkItem = async (workItemId) => {
    if (!workItemQuantityValue || Number(workItemQuantityValue) <= 0) {
      setError('Вкажіть кількість більше нуля.');
      return;
    }

    try {
      setSavingWorkItem(true);

      const response = await api.patch(`product-work-items/${workItemId}/`, {
        quantity: String(workItemQuantityValue),
      });

      updateWorkItemInState(response.data);
      setError('');

      setEditingWorkItemId(null);
      setWorkItemQuantityValue(null);
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося оновити компонент.',
      );
    } finally {
      setSavingWorkItem(false);
    }
  };

  const handleDeleteWorkItem = async (workId, workItemId) => {
    try {
      setSavingWorkItem(true);

      await api.delete(`product-work-items/${workItemId}/`);

      removeWorkItemFromState(workId, workItemId);
      setError('');

      setEditingWorkItemId(null);
      setWorkItemQuantityValue(null);
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося видалити компонент.',
      );
    } finally {
      setSavingWorkItem(false);
    }
  };

  const updateWorkInState = (updatedWork) => {
    setStep((prev) => ({
      ...prev,
      works: (prev.works || []).map((work) =>
        work.id === updatedWork.id ? updatedWork : work,
      ),
    }));
  };

  const handleSaveWorkDescription = async (workId) => {
    try {
      setSavingWork(true);

      const response = await api.patch(`product-works/${workId}/`, {
        description: workDescriptionValue,
      });

      updateWorkInState(response.data);

      setError('');
      setEditingWorkId(null);
      setWorkDescriptionValue('');
    } catch (err) {
      setError(
        getApiErrorMessage(err.response?.data) ||
          'Не вдалося оновити опис роботи.',
      );
    } finally {
      setSavingWork(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      setSavingDescription(true);

      const response = await api.patch(`product-steps/${id}/`, {
        description: descriptionValue,
      });

      setStep(response.data || null);
      setDescriptionValue(response.data?.description || '');
      setIsEditingDescription(false);
    } catch (err) {
      console.error('Failed to update product step description:', err);
      setError('Не вдалося оновити опис етапу.');
    } finally {
      setSavingDescription(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !step) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  if (!step) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="warning" description="Етап не знайдено." showIcon />
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
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            {`Етап №${step.sort_order || '—'}. ${step.name || '—'}`}
          </Title>

          <Text type="secondary">{step.product_code || '—'}</Text>
        </Flex>
      </Flex>

      {error && (
        <Alert
          type="error"
          description={error}
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація">
            <Link
              to={`/production/products/${step.product_id}`}
              state={{
                productCode: step.product_code,
              }}
            >
              <Button
                block
                icon={<RollbackOutlined style={{ color: '#1677ff' }} />}
              >
                Повернутись до продукту
              </Button>
            </Link>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Flex vertical gap={10}>
              {isEditingDescription ? (
                <Input.TextArea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  autoSize={{ minRows: 4 }}
                />
              ) : (
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {step.description || '—'}
                </Text>
              )}

              <Flex justify="flex-end" gap={8} wrap>
                {step.product_development_status === 'in_development' &&
                  (isEditingDescription ? (
                    <>
                      <Tag
                        style={{
                          marginInlineEnd: 0,
                          cursor: savingDescription ? 'default' : 'pointer',
                          color: '#595959',
                          fontSize: 12,
                          opacity: savingDescription ? 0.6 : 1,
                        }}
                        onClick={() => {
                          if (!savingDescription) {
                            handleSaveDescription();
                          }
                        }}
                      >
                        <SaveOutlined /> Зберегти
                      </Tag>

                      <Tag
                        style={{
                          marginInlineEnd: 0,
                          cursor: 'pointer',
                          color: '#595959',
                          fontSize: 12,
                        }}
                        onClick={() => {
                          setDescriptionValue(step.description || '');
                          setIsEditingDescription(false);
                        }}
                      >
                        <CloseOutlined /> Скасувати
                      </Tag>
                    </>
                  ) : (
                    <Tag
                      style={{
                        marginInlineEnd: 0,
                        cursor: 'pointer',
                        color: '#595959',
                        fontSize: 12,
                      }}
                      onClick={() => setIsEditingDescription(true)}
                    >
                      <EditOutlined /> Редагувати опис етапу
                    </Tag>
                  ))}
              </Flex>
            </Flex>
          </Card>
          {step.product_work_tracking === false && (
            <Card title="Комплектація етапу">
              <Flex vertical gap={10}>
                <Table
                  rowKey="id"
                  columns={stepItemColumns}
                  dataSource={stepItemTableData}
                  pagination={false}
                  size="small"
                  locale={{
                    emptyText: 'Компоненти відсутні',
                  }}
                />

                {isProductEditable && !isAddingStepItem && (
                  <Flex justify="flex-end">
                    <Tag
                      style={{
                        marginInlineEnd: 0,
                        cursor: 'pointer',
                        color: '#595959',
                        fontSize: 12,
                      }}
                      onClick={() => {
                        setError('');
                        setEditingStepItemId(null);
                        setStepItemQuantityValue(null);
                        setIsAddingStepItem(true);
                      }}
                    >
                      Додати компонент
                    </Tag>
                  </Flex>
                )}
              </Flex>
            </Card>
          )}
          {step.product_work_tracking === true && (
            <Flex vertical gap={20}>
              {works.map((work) => (
                <Card
                  key={work.id}
                  title={`Робочій процес №${work.sort_order || '—'}. ${
                    work.name || '—'
                  }`}
                >
                  <Flex vertical gap={10}>
                    {editingWorkId === work.id ? (
                      <Input.TextArea
                        value={workDescriptionValue}
                        onChange={(e) =>
                          setWorkDescriptionValue(e.target.value)
                        }
                        autoSize={{ minRows: 4 }}
                      />
                    ) : (
                      <Text style={{ whiteSpace: 'pre-wrap' }}>
                        {work.description || '—'}
                      </Text>
                    )}

                    <Flex justify="flex-end" gap={8} wrap>
                      {isProductEditable &&
                        (editingWorkId === work.id ? (
                          <>
                            <Tag
                              style={{
                                marginInlineEnd: 0,
                                cursor: savingWork ? 'default' : 'pointer',
                                color: '#595959',
                                fontSize: 12,
                                opacity: savingWork ? 0.6 : 1,
                              }}
                              onClick={() => {
                                if (!savingWork) {
                                  handleSaveWorkDescription(work.id);
                                }
                              }}
                            >
                              <SaveOutlined /> Зберегти
                            </Tag>

                            <Tag
                              style={{
                                marginInlineEnd: 0,
                                cursor: 'pointer',
                                color: '#595959',
                                fontSize: 12,
                              }}
                              onClick={() => {
                                setEditingWorkId(null);
                                setWorkDescriptionValue('');
                              }}
                            >
                              <CloseOutlined /> Скасувати
                            </Tag>
                          </>
                        ) : (
                          <Tag
                            style={{
                              marginInlineEnd: 0,
                              cursor: 'pointer',
                              color: '#595959',
                              fontSize: 12,
                            }}
                            onClick={() => {
                              setError('');
                              setEditingWorkId(work.id);
                              setWorkDescriptionValue(work.description || '');
                            }}
                          >
                            <EditOutlined /> Редагувати опис роботи
                          </Tag>
                        ))}
                    </Flex>

                    <Table
                      rowKey="id"
                      columns={getWorkItemColumns(work)}
                      dataSource={getWorkItemTableData(work)}
                      pagination={false}
                      size="small"
                      locale={{
                        emptyText: 'Компоненти відсутні',
                      }}
                    />

                    {isProductEditable && !addingWorkItemWorkId && (
                      <Flex justify="flex-end">
                        <Tag
                          style={{
                            marginInlineEnd: 0,
                            cursor: 'pointer',
                            color: '#595959',
                            fontSize: 12,
                          }}
                          onClick={() => {
                            setError('');
                            setEditingWorkItemId(null);
                            setWorkItemQuantityValue(null);
                            setAddingWorkItemWorkId(work.id);
                          }}
                        >
                          Додати компонент
                        </Tag>
                      </Flex>
                    )}
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepDetailPage;
