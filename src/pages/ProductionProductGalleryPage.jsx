import { useEffect, useState } from 'react';
import { PlusOutlined, RollbackOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import ProductionProductGalleryCreateDrawer from '../components/ProductionProductGalleryCreateDrawer';

const { Title, Text } = Typography;

function ProductionProductGalleryPage() {
  const { id } = useParams();

  const [attachmentsOverview, setAttachmentsOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

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
            style={{
              marginInlineEnd: 0,
              color: '#595959',
              fontSize: 12,
            }}
          >
            {product?.code || '—'}
          </Tag>
        )}

        {stepSortOrders.map((sortOrder) => (
          <Tag
            key={sortOrder}
            style={{
              marginInlineEnd: 0,
              color: '#595959',
              fontSize: 12,
            }}
          >
            Етап {sortOrder}
          </Tag>
        ))}
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
                <Text type="secondary">Дані зʼявляться пізніше</Text>
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
    </div>
  );
}

export default ProductionProductGalleryPage;
