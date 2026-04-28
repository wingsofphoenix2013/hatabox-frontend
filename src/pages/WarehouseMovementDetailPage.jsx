// srs/pages/WarehouseMovementDetailPage.jsx

import { useParams } from 'react-router-dom';

function WarehouseMovementDetailPage() {
  const { id } = useParams();

  return (
    <div>
      <h2>Переміщення товарів</h2>
      <div>Накладна №{id}</div>
    </div>
  );
}

export default WarehouseMovementDetailPage;
