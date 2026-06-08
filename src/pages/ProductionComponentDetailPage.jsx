import { Typography } from 'antd';
import { useLocation, useParams } from 'react-router-dom';

const { Title } = Typography;

function ProductionComponentDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  const componentLabel = location.state?.componentLabel || `Компонент ID ${id}`;

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>{componentLabel}</Title>
    </div>
  );
}

export default ProductionComponentDetailPage;
