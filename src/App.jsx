import { useEffect, useState } from "react";
import api from "./api/client";

function App() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("orders/")
      .then(res => {
        setOrders(res.data);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Замовлення</h1>

      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Номер</th>
            <th>Постачальник</th>
            <th>Статус</th>
            <th>Оплата</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.order_no}</td>
              <td>{order.vendor_name}</td>
              <td>{order.status_name}</td>
              <td>{order.payment_status_name}</td>
              <td>{new Date(order.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;