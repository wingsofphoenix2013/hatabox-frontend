import { useParams } from 'react-router-dom';

function WarehouseLocationDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Каталог складів</h2>
      <div>Локація ID: {id}</div>
    </div>
  );
}

export default WarehouseLocationDetailPage;
