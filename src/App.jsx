import { useEffect, useState } from "react";
import api from "./api/client";
import { Table } from "antd";

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

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Номер",
      dataIndex: "order_no",
    },
    {
      title: "Постачальник",
      dataIndex: "vendor_name",
    },
    {
      title: "Статус",
      dataIndex: "status_name",
    },
    {
      title: "Оплата",
      dataIndex: "payment_status_name",
    },
    {
      title: "Дата",
      dataIndex: "created_at",
      render: (value) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1>Замовлення</h1>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
      />
    </div>
  );
}

export default App;