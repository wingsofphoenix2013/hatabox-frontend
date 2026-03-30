import { Layout, Menu } from "antd";
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

const { Sider, Content } = Layout;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const mainMenuItems = [
    { key: "/home", icon: <HomeOutlined />, label: "Дуже головна" },
    { key: "/sales", icon: <ShoppingCartOutlined />, label: "Продажі" },
    { key: "/production", icon: <BuildOutlined />, label: "Виробництво" },
    { key: "/inventory", icon: <AppstoreOutlined />, label: "Склади" },
    { key: "/orders", icon: <ShoppingOutlined />, label: "Закупівлі" },
    { key: "/service", icon: <ToolOutlined />, label: "Сервіс" },
  ];

  const bottomMenuItems = [
    { key: "/user", icon: <UserOutlined />, label: "Користувач" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={220}
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ВАЖНО: этот div растягивает верхнее меню */}
        <div style={{ flex: 1 }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onClick={({ key }) => navigate(key)}
            items={mainMenuItems}
          />
        </div>

        {/* нижнее меню */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={bottomMenuItems}
        />
      </Sider>

      <Layout>
        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;