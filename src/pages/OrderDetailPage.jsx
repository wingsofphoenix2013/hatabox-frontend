import { useParams } from "react-router-dom";

function OrderDetailPage() {
  const { id } = useParams();

  return (
    <div style={{ padding: 20 }}>
      <h1>Замовлення #{id}</h1>
    </div>
  );
}

export default OrderDetailPage;