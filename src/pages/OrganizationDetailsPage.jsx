import { useLocation, useParams } from 'react-router-dom';
import { Card, Flex, Typography } from 'antd';

const { Title, Text } = Typography;

function OrganizationDetailsPage() {
  const { id } = useParams();
  const location = useLocation();

  const organizationLabel = location.state?.organizationLabel;

  return (
    <div style={{ padding: 20 }}>
      <Flex vertical gap={16}>
        <Flex vertical gap={4}>
          <Title level={2} style={{ margin: 0 }}>
            {organizationLabel || 'Організація'}
          </Title>

          <Text type="secondary">
            ID: {id}
          </Text>
        </Flex>

        <Card>
          <Text>Сторінка деталей організації (заглушка)</Text>
        </Card>
      </Flex>
    </div>
  );
}

export default OrganizationDetailsPage;