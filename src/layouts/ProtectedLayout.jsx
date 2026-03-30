import { Layout, Menu, Divider, Typography } from "antd";
import {
  HomeOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  ToolOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [panelOpen, setPanelOpen] = useState(false);

  const mainMenuItems = [
    { key: "/home", icon: <HomeOutlined />, label: "Головна" },
    { key: "/sales", icon: <ShoppingCartOutlined />, label: "Продажі" },
    { key: "/production", icon: <BuildOutlined />, label: "Виробництво" },
    { key: "/inventory", icon: <AppstoreOutlined />, label: "Склад" },
    { key: "/orders", icon: <ShoppingOutlined />, label: "Закупівлі" },
    { key: "/service", icon: <ToolOutlined />, label: "Сервіс" },
  ];

  const bottomMenuItems = [
    { key: "/user", icon: <UserOutlined />, label: "Користувач" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* левый sidebar */}
      <Sider
        width={220}
        style={{
          height: "100vh",
          position: "relative",
          background: "#fff",
        }}
      >
        {/* верхнее меню */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            navigate(key);
            setPanelOpen(true);
          }}
          items={mainMenuItems}
        />

        {/* нижнее меню */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={bottomMenuItems}
          />
        </div>
      </Sider>

      {/* второй sidebar */}
      {panelOpen && (
        <Sider
          width={260}
          style={{
            background: "#fafafa",
            padding: 16,
            borderRight: "1px solid #f0f0f0",
          }}
        >
          {/* кнопка закрытия */}
          <div style={{ marginBottom: 10, textAlign: "right" }}>
            <a onClick={() => setPanelOpen(false)}>Закрити</a>
          </div>

          {/* Сторінки */}
          <Text strong>Сторінки</Text>
          <Menu
            mode="inline"
            onClick={() => setPanelOpen(false)}
            items={[
              { key: "p1", label: "Сторінка 1" },
              { key: "p2", label: "Сторінка 2" },
              { key: "p3", label: "Сторінка 3" },
            ]}
          />

          <Divider />

          {/* Дії */}
          <Text strong>Дії</Text>
          <Menu
            mode="inline"
            onClick={() => setPanelOpen(false)}
            items={[
              { key: "a1", label: "Дія 1" },
              { key: "a2", label: "Дія 2" },
              { key: "a3", label: "Дія 3" },
            ]}
          />

          <Divider />

          {/* Довідники */}
          <Text strong>Довідники</Text>
          <Menu
            mode="inline"
            onClick={() => setPanelOpen(false)}
            items={[
              { key: "d1", label: "Довідник 1" },
              { key: "d2", label: "Довідник 2" },
              { key: "d3", label: "Довідник 3" },
            ]}
          />
        </Sider>
      )}

      {/* контент */}
      <Layout>
        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;