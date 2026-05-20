import { useParams } from 'react-router-dom';

function ProductionOrderDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Карта виробництва</h2>
      <div>ID: {id}</div>
    </div>
  );
}

export default ProductionOrderDetailPage;
