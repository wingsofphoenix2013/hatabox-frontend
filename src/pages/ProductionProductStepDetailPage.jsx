import { useEffect, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  Flex,
  Row,
  Skeleton,
  Table,
  Typography,
  Popconfirm,
  message,
  InputNumber,
  Select,
} from 'antd';
import { useParams } from 'react-router-dom';
import {
  EditOutlined,
  DeleteOutlined,
  FileAddOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

function ProductionProductStepDetailPage() {
  const { id } = useParams();

  const [step, setStep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingRowId, setEditingRowId] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [savingRow, setSavingRow] = useState(false);

  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [creatingItemId, setCreatingItemId] = useState(null);
  const [creatingQuantity, setCreatingQuantity] = useState(null);
  const [creatingItemOptions, setCreatingItemOptions] = useState([]);
  const [creatingSelectedItem, setCreatingSelectedItem] = useState(null);
  const [creatingRowLoading, setCreatingRowLoading] = useState(false);

  useEffect(() => {
    loadStepPage();
  }, [id]);

  const loadStepPage = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`product-steps/${id}/`);
      setStep(response.data);
    } catch (err) {
      console.error('Failed to load product step detail page:', err);
      setError('Не вдалося завантажити дані етапу.');
      setStep(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await api.delete(`product-step-items/${itemId}/`);

      message.success('Компонент видалено');

      // обновляем данные
      loadStepPage();
    } catch (err) {
      console.error('Delete failed:', err);
      message.error('Не вдалося видалити компонент');
    }
  };

  const handleStartEdit = (record) => {
    setEditingRowId(record.id);
    setEditingQuantity(record.quantity);
  };

  const handleSaveEdit = async (record) => {
    try {
      setSavingRow(true);

      await api.patch(`product-step-items/${record.id}/`, {
        quantity: editingQuantity,
      });

      message.success('Кількість оновлено');

      setEditingRowId(null);
      setEditingQuantity(null);

      loadStepPage();
    } catch (err) {
      console.error('Update failed:', err);
      message.error('Не вдалося оновити кількість');
    } finally {
      setSavingRow(false);
    }
  };
  const handleSearchItems = async (searchValue) => {
    try {
      const query = searchValue?.trim();

      if (!query) {
        setCreatingItemOptions([]);
        return;
      }

      const response = await api.get(
        `items/?search=${encodeURIComponent(query)}`,
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];

      setCreatingItemOptions(
        results.map((item) => ({
          value: item.id,
          label: `${item.name}`,
          item,
        })),
      );
    } catch (err) {
      console.error('Failed to search items:', err);
      setCreatingItemOptions([]);
    }
  };
  const handleStartCreateRow = () => {
    setIsCreatingRow(true);
    setCreatingItemId(null);
    setCreatingQuantity(null);
    setCreatingItemOptions([]);
    setCreatingSelectedItem(null);
  };
  const handleCancelCreateRow = () => {
    setIsCreatingRow(false);
    setCreatingItemId(null);
    setCreatingQuantity(null);
    setCreatingItemOptions([]);
    setCreatingSelectedItem(null);
  };
  const handleSaveCreateRow = async () => {
    if (!creatingItemId) {
      message.error('Оберіть компонент');
      return;
    }

    if (creatingQuantity === null || creatingQuantity === undefined) {
      message.error('Вкажіть кількість');
      return;
    }

    try {
      setCreatingRowLoading(true);

      await api.post('product-step-items/', {
        product_step: Number(id),
        inv_item: creatingItemId,
        quantity: creatingQuantity,
      });

      message.success('Компонент додано');

      handleCancelCreateRow();
      loadStepPage();
    } catch (err) {
      console.error('Create failed:', err);
      message.error('Не вдалося додати компонент');
    } finally {
      setCreatingRowLoading(false);
    }
  };
  const renderField = (label, content) => (
    <div style={{ marginBottom: 20 }}>
      <Text
        type="secondary"
        style={{ display: 'block', marginBottom: 6, fontSize: 12 }}
      >
        {label}
      </Text>
      {content}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error) {
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

  const stepDisplayName = `${step.sort_order}. ${step.name}`;
  const productDisplayName = `${step.product_family_name} ${step.product_version}`;

  const stepItemsColumns = [
    {
      title: '',
      key: 'edit',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <SaveOutlined
              style={{
                color: savingRow ? '#bfbfbf' : '#52c41a',
                cursor: savingRow ? 'default' : 'pointer',
              }}
              onClick={() => {
                if (!creatingRowLoading) {
                  handleSaveCreateRow();
                }
              }}
            />
          );
        }

        return editingRowId === record.id ? (
          <SaveOutlined
            style={{
              color: savingRow ? '#bfbfbf' : '#52c41a',
              cursor: savingRow ? 'default' : 'pointer',
            }}
            onClick={() => {
              if (!savingRow) {
                handleSaveEdit(record);
              }
            }}
          />
        ) : (
          <EditOutlined
            style={{ color: '#8c8c8c', cursor: 'pointer' }}
            onClick={() => handleStartEdit(record)}
          />
        );
      },
    },
    {
      title: 'Назва Item',
      key: 'item_name',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <Select
              showSearch
              placeholder="Оберіть компонент"
              value={creatingItemId}
              style={{ width: '100%' }}
              filterOption={false}
              onSearch={handleSearchItems}
              onChange={(value, option) => {
                setCreatingItemId(value);
                setCreatingSelectedItem(option?.item || null);
              }}
              options={creatingItemOptions}
            />
          );
        }

        return record.inv_item_name || '—';
      },
    },
    {
      title: 'Кількість',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.id === 'new-row') {
          return (
            <InputNumber
              min={0}
              step={0.001}
              precision={3}
              value={creatingQuantity}
              onChange={(val) => setCreatingQuantity(val)}
              style={{ width: 100 }}
            />
          );
        }

        return editingRowId === record.id ? (
          <InputNumber
            min={0}
            step={0.001}
            precision={3}
            value={editingQuantity}
            onChange={(val) => setEditingQuantity(val)}
            style={{ width: 100 }}
          />
        ) : (
          value
        );
      },
    },
    {
      title: 'Одиниця вимірювання',
      key: 'unit',
      width: 170,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return creatingSelectedItem?.unit_symbol ||
            creatingSelectedItem?.unit_name
            ? `${creatingSelectedItem.unit_symbol || ''}${
                creatingSelectedItem.unit_symbol &&
                creatingSelectedItem.unit_name
                  ? ' — '
                  : ''
              }${creatingSelectedItem.unit_name || ''}`
            : '—';
        }

        return record.inv_item_unit_symbol || record.inv_item_unit_name
          ? `${record.inv_item_unit_symbol || ''}${
              record.inv_item_unit_symbol && record.inv_item_unit_name
                ? ' — '
                : ''
            }${record.inv_item_unit_name || ''}`
          : '—';
      },
    },
    {
      title: '',
      key: 'delete',
      width: 56,
      align: 'center',
      render: (_, record) => {
        if (record.id === 'new-row') {
          return (
            <DeleteOutlined
              style={{ color: '#ff4d4f', cursor: 'pointer' }}
              onClick={handleCancelCreateRow}
            />
          );
        }

        return (
          <Popconfirm
            title="Видалити компонент?"
            description="Ви впевнені, що хочете видалити цей компонент з етапу?"
            onConfirm={() => handleDelete(record.id)}
            okText="Так"
            cancelText="Ні"
            disabled={editingRowId === record.id || savingRow || isCreatingRow}
          >
            <DeleteOutlined
              style={{
                color:
                  editingRowId === record.id || savingRow || isCreatingRow
                    ? '#d9d9d9'
                    : '#ff4d4f',
                cursor:
                  editingRowId === record.id || savingRow || isCreatingRow
                    ? 'default'
                    : 'pointer',
              }}
            />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        style={{ marginBottom: 20 }}
      >
        <div>
          <Title level={2} style={{ margin: 0, marginBottom: 4 }}>
            {stepDisplayName}
          </Title>
          <Text type="secondary">{productDisplayName}</Text>
        </div>
      </Flex>

      <Row gutter={20} align="top">
        {/* Ліва колонка */}
        <Col xs={24} lg={6}>
          <Card title="Зображення" style={{ marginBottom: 20 }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                border: '1px solid #f0f0f0',
                borderRadius: 12,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text type="secondary">Блок буде реалізовано пізніше</Text>
            </div>
          </Card>

          <Card title="Статистика">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>

        {/* Центральна колонка */}
        <Col xs={24} lg={12}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            {renderField(
              'Назва',
              <Paragraph style={{ marginBottom: 0 }}>
                {stepDisplayName}
              </Paragraph>,
            )}

            {renderField(
              'Опис',
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {step.description || '—'}
              </Paragraph>,
            )}
          </Card>

          <Card title="Комплектація">
            <Table
              rowKey="id"
              columns={stepItemsColumns}
              dataSource={[
                ...(Array.isArray(step.step_items) ? step.step_items : []),
                ...(isCreatingRow ? [{ id: 'new-row' }] : []),
              ]}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 16 }}>
              <Flex
                align="center"
                gap={8}
                style={{
                  color: isCreatingRow ? '#bfbfbf' : '#595959',
                  cursor: isCreatingRow ? 'default' : 'pointer',
                  width: 'fit-content',
                }}
                onClick={() => {
                  if (!isCreatingRow) {
                    handleStartCreateRow();
                  }
                }}
              >
                <FileAddOutlined />
                <Text style={{ color: isCreatingRow ? '#bfbfbf' : '#595959' }}>
                  Додати компонент
                </Text>
              </Flex>
            </div>
          </Card>
        </Col>

        {/* Права колонка */}
        <Col xs={24} lg={6}>
          <Card title="Історія">
            <Text type="secondary">Блок буде реалізовано пізніше</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ProductionProductStepDetailPage;
