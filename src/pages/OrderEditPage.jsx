import { useParams } from 'react-router-dom';

function OrderEditPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <h1>Редагування замовлення #{id}</h1>
    </div>
  );
}

export default OrderEditPage;
