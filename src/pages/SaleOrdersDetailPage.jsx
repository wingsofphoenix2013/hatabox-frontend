import { useParams } from 'react-router-dom';

function SaleOrdersDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Замовлення продажу</h2>
      <div>ID: {id}</div>
    </div>
  );
}

export default SaleOrdersDetailPage;
