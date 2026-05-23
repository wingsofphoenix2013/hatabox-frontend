import { Card, Col, Flex, Row, Tag, Typography } from 'antd';

const { Title, Text } = Typography;

function ProductionOrderDetailPage() {
  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={20}>
        <Flex justify="space-between" align="flex-start" gap={16}>
          <Flex align="center" gap={12} wrap>
            <Title level={2} style={{ margin: 0 }}>
              Виріб №serial_number
            </Title>

            <Tag
              color="purple"
              style={{
                fontSize: 20,
                lineHeight: '32px',
                paddingInline: 14,
                paddingBlock: 6,
                borderRadius: 10,
                marginInlineEnd: 0,
              }}
            >
              production_order_status_display
            </Tag>
          </Flex>
        </Flex>

        <Row gutter={20} align="top">
          <Col xs={24} lg={6}>
            <Card title="Серійний номер" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Графік виробництва" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Історія замовлення">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>

          <Col xs={24} lg={18}>
            <Card title="Основна інформація" style={{ marginBottom: 20 }}>
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>

            <Card title="Поточний етап">
              <Text type="secondary">Дані зʼявляться пізніше</Text>
            </Card>
          </Col>
        </Row>
      </Flex>
    </div>
  );
}

export default ProductionOrderDetailPage;
