import { useParams } from 'react-router-dom';

function SalesOrdersMaterialPlanPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h2>Собівартість закупівель</h2>
      <div>Замовлення продажу ID: {id}</div>
    </div>
  );
}

export default SalesOrdersMaterialPlanPage;
