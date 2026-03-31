import { Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

function ProductionComponentDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginBottom: 8 }}>
        Деталі компонента
      </Title>
      <Text type="secondary">ID: {id}</Text>
    </div>
  );
}

export default ProductionComponentDetailPage;
