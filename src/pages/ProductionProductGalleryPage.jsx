import { useEffect, useState } from 'react';
import {
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Image,
  Popconfirm,
  Popover,
  Row,
  Skeleton,
  Tag,
  Typography,
  message,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import ProductionProductGalleryCreateDrawer from '../components/ProductionProductGalleryCreateDrawer';
import ProductionProductGalleryEditDrawer from '../components/ProductionProductGalleryEditDrawer';

const { Title, Text } = Typography;

const ATTACHMENT_GROUP_PREVIEW_LIMIT = 15;

function ProductionProductGalleryPage() {
  const { id } = useParams();

  const [attachmentsOverview, setAttachmentsOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [activeGroupFilters, setActiveGroupFilters] = useState({});
  const [expandedAttachmentGroups, setExpandedAttachmentGroups] = useState({});
  const [editingAttachment, setEditingAttachment] = useState(null);

  useEffect(() => {
    loadAttachmentsOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadAttachmentsOverview = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`products/${id}/attachments-overview/`);
      setAttachmentsOverview(response.data || null);
    } catch (err) {
      console.error('Failed to load product gallery page:', err);
      setError('Не вдалося завантажити галерею продукту.');
      setAttachmentsOverview(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (error && !attachmentsOverview) {
    return (
      <div style={{ padding: 20 }}>
        <Alert type="error" description={error} showIcon />
      </div>
    );
  }

  const product = attachmentsOverview?.product;
  const attachmentGroups = Array.isArray(attachmentsOverview?.attachment_groups)
    ? attachmentsOverview.attachment_groups
    : [];

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`product-attachments/${attachmentId}/`);

      message.success('Файл видалено.');
      await loadAttachmentsOverview();
    } catch (err) {
      console.error('Failed to delete product attachment:', err);
      message.error('Не вдалося видалити файл.');
    }
  };

  const getAttachmentIcon = (attachment) => {
    const fileName = String(attachment?.file || '')
      .split('?')[0]
      .toLowerCase();

    if (fileName.endsWith('.pdf')) {
      return <FilePdfOutlined style={{ fontSize: 48, color: '#595959' }} />;
    }

    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      return <FileWordOutlined style={{ fontSize: 48, color: '#595959' }} />;
    }

    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
      return <FileExcelOutlined style={{ fontSize: 48, color: '#595959' }} />;
    }

    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return <FilePptOutlined style={{ fontSize: 48, color: '#595959' }} />;
    }

    if (
      fileName.endsWith('.mp4') ||
      fileName.endsWith('.mov') ||
      fileName.endsWith('.avi') ||
      fileName.endsWith('.webm')
    ) {
      return <PlayCircleOutlined style={{ fontSize: 48, color: '#595959' }} />;
    }

    return null;
  };

  const isImageAttachment = (attachment) => {
    const fileName = String(attachment?.file || '')
      .split('?')[0]
      .toLowerCase();

    return (
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.gif')
    );
  };

  const getGroupAttachments = (group) => {
    const productAttachments = Array.isArray(group.product_attachments)
      ? group.product_attachments.map((attachment) => ({
          ...attachment,
          targetLabel: product?.code || '—',
          targetFilterKey: 'product',
        }))
      : [];

    const stepAttachments = (
      Array.isArray(group.steps) ? group.steps : []
    ).flatMap((step) => [
      ...(Array.isArray(step.attachments) ? step.attachments : []).map(
        (attachment) => ({
          ...attachment,
          targetLabel: `${step.sort_order || '—'}. ${step.name || '—'}`,
          targetFilterKey: `step:${step.id}`,
        }),
      ),
      ...(Array.isArray(step.works) ? step.works : []).flatMap((work) =>
        (Array.isArray(work.attachments) ? work.attachments : []).map(
          (attachment) => ({
            ...attachment,
            targetLabel: `${step.sort_order || '—'}. ${step.name || '—'} ${
              work.sort_order || '—'
            }. ${work.name || '—'}`,
            targetFilterKey: `step:${step.id}`,
          }),
        ),
      ),
    ]);

    const attachments = [...productAttachments, ...stepAttachments];

    const activeFilters = activeGroupFilters[group.attachment_type] || [];

    if (activeFilters.length === 0) {
      return attachments;
    }

    return attachments.filter((attachment) =>
      activeFilters.includes(attachment.targetFilterKey),
    );
  };

  const toggleGroupFilter = (attachmentType, filterKey) => {
    setActiveGroupFilters((prev) => {
      const currentFilters = prev[attachmentType] || [];

      return {
        ...prev,
        [attachmentType]: currentFilters.includes(filterKey)
          ? currentFilters.filter((item) => item !== filterKey)
          : [...currentFilters, filterKey],
      };
    });
  };

  const toggleAttachmentGroupExpanded = (attachmentType) => {
    setExpandedAttachmentGroups((prev) => ({
      ...prev,
      [attachmentType]: !prev[attachmentType],
    }));
  };

  const renderAttachmentGroupExtra = (group) => {
    const hasProductAttachments =
      Array.isArray(group.product_attachments) &&
      group.product_attachments.length > 0;

    const stepSortOrders = Array.from(
      new Set(
        (Array.isArray(group.steps) ? group.steps : [])
          .map((step) => step.sort_order)
          .filter((sortOrder) => sortOrder !== null && sortOrder !== undefined),
      ),
    );

    return (
      <Flex align="center" gap={8} wrap justify="flex-end">
        {hasProductAttachments && (
          <Tag
            color={
              (activeGroupFilters[group.attachment_type] || []).includes(
                'product',
              )
                ? 'processing'
                : 'default'
            }
            style={{
              marginInlineEnd: 0,
              cursor: 'pointer',
              color: '#595959',
              fontSize: 12,
            }}
            onClick={() => toggleGroupFilter(group.attachment_type, 'product')}
          >
            {(activeGroupFilters[group.attachment_type] || []).includes(
              'product',
            ) && <CloseCircleOutlined />}{' '}
            {product?.code || '—'}
          </Tag>
        )}

        {stepSortOrders.map((sortOrder) => {
          const step = (Array.isArray(group.steps) ? group.steps : []).find(
            (item) => item.sort_order === sortOrder,
          );

          const filterKey = `step:${step?.id}`;

          const isActive = (
            activeGroupFilters[group.attachment_type] || []
          ).includes(filterKey);

          return (
            <Tag
              key={sortOrder}
              color={isActive ? 'processing' : 'default'}
              style={{
                marginInlineEnd: 0,
                cursor: 'pointer',
                color: '#595959',
                fontSize: 12,
              }}
              onClick={() =>
                toggleGroupFilter(group.attachment_type, filterKey)
              }
            >
              {isActive && <CloseCircleOutlined />} Етап {sortOrder}
            </Tag>
          );
        })}
      </Flex>
    );
  };

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
            {`Галерея ${product?.code || '—'}`}
          </Title>

          <Text type="secondary">Зведена медіа бібліотека продукту</Text>
        </Flex>
      </Flex>

      <Row gutter={20} align="top">
        <Col xs={24} lg={6}>
          <Card title="Навігація">
            <Flex vertical gap={8}>
              <Link
                to={`/production/products/${product?.id || id}`}
                state={{
                  productLabel: product?.code,
                }}
              >
                <Button
                  block
                  icon={<RollbackOutlined style={{ color: '#1677ff' }} />}
                >
                  Повернутись до продукту
                </Button>
              </Link>

              {product?.development_status === 'in_development' && (
                <>
                  <Divider dashed style={{ margin: '8px 0' }} />

                  <Button
                    block
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateDrawerOpen(true)}
                  >
                    Додати файли
                  </Button>
                </>
              )}
            </Flex>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="Основна інформація" style={{ marginBottom: 20 }}>
            <Text type="secondary">Дані зʼявляться пізніше</Text>
          </Card>

          <Flex vertical gap={20}>
            {attachmentGroups.map((group) => (
              <Card
                key={group.attachment_type}
                title={group.attachment_type_display || '—'}
                extra={renderAttachmentGroupExtra(group)}
              >
                <Flex wrap gap={12}>
                  {(() => {
                    const groupAttachments = getGroupAttachments(group);
                    const isGroupFiltered =
                      (activeGroupFilters[group.attachment_type] || []).length >
                      0;
                    const isGroupExpanded =
                      expandedAttachmentGroups[group.attachment_type] === true;

                    const visibleAttachments =
                      isGroupFiltered ||
                      isGroupExpanded ||
                      groupAttachments.length <= ATTACHMENT_GROUP_PREVIEW_LIMIT
                        ? groupAttachments
                        : groupAttachments.slice(
                            0,
                            ATTACHMENT_GROUP_PREVIEW_LIMIT,
                          );

                    const previewImageItems = groupAttachments
                      .filter(isImageAttachment)
                      .map((attachment) => attachment.file);

                    return (
                      <Image.PreviewGroup items={previewImageItems}>
                        {visibleAttachments.map((attachment) => (
                          <Flex key={attachment.id} vertical gap={6}>
                            <div
                              style={{
                                position: 'relative',
                                width: 120,
                                height: 120,
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid #f0f0f0',
                                background: '#fafafa',
                                cursor: isImageAttachment(attachment)
                                  ? 'default'
                                  : 'pointer',
                              }}
                              onClick={() => {
                                if (!isImageAttachment(attachment)) {
                                  window.open(
                                    attachment.file,
                                    '_blank',
                                    'noreferrer',
                                  );
                                }
                              }}
                            >
                              {isImageAttachment(attachment) ? (
                                <Image
                                  src={attachment.file}
                                  alt={attachment.name || ''}
                                  width={120}
                                  height={120}
                                  style={{
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              ) : (
                                <Flex
                                  justify="center"
                                  align="center"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                  }}
                                >
                                  {getAttachmentIcon(attachment)}
                                </Flex>
                              )}

                              <Popover
                                trigger="click"
                                content={
                                  <Flex
                                    vertical
                                    gap={8}
                                    style={{ minWidth: 300 }}
                                  >
                                    <Flex vertical gap={2}>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                      >
                                        Назва
                                      </Text>
                                      <Text strong>
                                        {attachment.name || '—'}
                                      </Text>
                                    </Flex>

                                    <Divider
                                      dashed
                                      style={{ margin: '4px 0' }}
                                    />

                                    <Flex vertical gap={2}>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                      >
                                        Опис
                                      </Text>
                                      <Text>
                                        {attachment.description ||
                                          'Опис відсутній'}
                                      </Text>
                                    </Flex>

                                    <Divider
                                      dashed
                                      style={{ margin: '4px 0' }}
                                    />

                                    <Flex vertical gap={2}>
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                      >
                                        Привʼязка
                                      </Text>
                                      <Text>
                                        {attachment.targetLabel || '—'}
                                      </Text>
                                    </Flex>

                                    <Divider
                                      dashed
                                      style={{ margin: '4px 0' }}
                                    />

                                    <Flex justify="flex-end">
                                      <Tag
                                        style={{
                                          marginInlineEnd: 0,
                                          cursor: 'pointer',
                                          color: '#595959',
                                          fontSize: 12,
                                        }}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setEditingAttachment(attachment);
                                        }}
                                      >
                                        <EditOutlined /> Редагувати
                                      </Tag>
                                    </Flex>
                                  </Flex>
                                }
                              >
                                <InfoCircleOutlined
                                  onClick={(event) => event.stopPropagation()}
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: 8,
                                    color: '#595959',
                                    background: 'rgba(255, 255, 255, 0.85)',
                                    borderRadius: '50%',
                                    padding: 4,
                                    cursor: 'pointer',
                                  }}
                                />
                              </Popover>

                              {product?.development_status ===
                                'in_development' && (
                                <span
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <Popconfirm
                                    title="Видалити файл?"
                                    description="Файл буде видалено без можливості відновлення."
                                    okText="Так, видалити"
                                    cancelText="Скасувати"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() =>
                                      handleDeleteAttachment(attachment.id)
                                    }
                                  >
                                    <DeleteOutlined
                                      style={{
                                        position: 'absolute',
                                        right: 8,
                                        bottom: 8,
                                        color: '#595959',
                                        background: 'rgba(255, 255, 255, 0.85)',
                                        borderRadius: '50%',
                                        padding: 4,
                                        cursor: 'pointer',
                                      }}
                                    />
                                  </Popconfirm>
                                </span>
                              )}
                            </div>

                            {!isImageAttachment(attachment) && (
                              <Text
                                style={{
                                  width: 120,
                                  fontSize: 12,
                                  lineHeight: 1.2,
                                  textAlign: 'center',
                                }}
                                ellipsis={{
                                  tooltip:
                                    attachment.name ||
                                    attachment.display_filename ||
                                    '—',
                                }}
                              >
                                {attachment.name ||
                                  attachment.display_filename ||
                                  '—'}
                              </Text>
                            )}
                          </Flex>
                        ))}

                        {!isGroupFiltered &&
                          groupAttachments.length >
                            ATTACHMENT_GROUP_PREVIEW_LIMIT && (
                            <Flex vertical gap={6}>
                              <div
                                style={{
                                  width: 120,
                                  height: 120,
                                  borderRadius: 8,
                                  border: '1px solid #f0f0f0',
                                  background: '#fafafa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  toggleAttachmentGroupExpanded(
                                    group.attachment_type,
                                  )
                                }
                              >
                                {isGroupExpanded ? (
                                  <MinusCircleOutlined
                                    style={{
                                      fontSize: 48,
                                      color: '#595959',
                                    }}
                                  />
                                ) : (
                                  <PlusCircleOutlined
                                    style={{
                                      fontSize: 48,
                                      color: '#595959',
                                    }}
                                  />
                                )}
                              </div>

                              <Text
                                style={{
                                  width: 120,
                                  fontSize: 12,
                                  lineHeight: 1.2,
                                  textAlign: 'center',
                                }}
                              >
                                {isGroupExpanded ? 'Приховати...' : 'Ще...'}
                              </Text>
                            </Flex>
                          )}
                      </Image.PreviewGroup>
                    );
                  })()}
                </Flex>
              </Card>
            ))}
          </Flex>
        </Col>
      </Row>

      <ProductionProductGalleryCreateDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        productId={product?.id || id}
        onCompleted={loadAttachmentsOverview}
      />

      <ProductionProductGalleryEditDrawer
        open={Boolean(editingAttachment)}
        onClose={() => setEditingAttachment(null)}
        attachment={editingAttachment}
        onCompleted={loadAttachmentsOverview}
      />
    </div>
  );
}

export default ProductionProductGalleryPage;
