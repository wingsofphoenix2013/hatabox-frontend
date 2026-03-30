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
      <Sider
        width={220}
        style={{
          height: "100vh",
          position: "relative",
        }}
      >
        {/* верхнее меню */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
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

      <Layout>
        <Content style={{ padding: 20 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;