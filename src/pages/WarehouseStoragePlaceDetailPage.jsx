import { useParams } from 'react-router-dom';

function WarehouseStoragePlaceDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Місце зберігання</h2>
      <div>Місце зберігання ID: {id}</div>
    </div>
  );
}

export default WarehouseStoragePlaceDetailPage;
