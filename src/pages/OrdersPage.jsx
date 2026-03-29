import { useEffect, useState } from "react";
import { Table } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("orders/")
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Номер", dataIndex: "order_no" },
    { title: "Постачальник", dataIndex: "vendor_name" },
    { title: "Статус", dataIndex: "status_name" },
    { title: "Оплата", dataIndex: "payment_status_name" },
    {
      title: "Дата",
      dataIndex: "created_at",
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1>Замовлення</h1>

      <Table
        dataSource={orders}
        columns={columns}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => navigate(`/orders/${record.id}`),
        })}
      />
    </div>
  );
}

export default OrdersPage;