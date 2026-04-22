import { Typography } from 'antd';
import { useParams } from 'react-router-dom';

const { Title, Text } = Typography;

function OrderTollingDetailsPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <Title level={2} style={{ marginTop: 0 }}>
        Деталі давальчої передачі
      </Title>

      <Text type="secondary">Заглушка сторінки. ID документа: {id}</Text>
    </div>
  );
}

export default OrderTollingDetailsPage;
