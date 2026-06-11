import { useParams } from 'react-router-dom';

function StoragePlaceDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Точка зберігання</h2>
      <div>ID: {id}</div>
    </div>
  );
}

export default StoragePlaceDetailPage;
