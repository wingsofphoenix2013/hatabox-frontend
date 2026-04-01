import { Layout, Menu, Divider, Typography, Button, Breadcrumb } from 'antd';
import {
  HomeOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  ToolOutlined,
  UserOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  ReadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);

  const mainMenuItems = [
    { key: '/home', icon: <HomeOutlined />, label: 'Головна' },
    { key: '/sales', icon: <ShoppingCartOutlined />, label: 'Продажі' },
    { key: '/production', icon: <BuildOutlined />, label: 'Виробництво' },
    { key: '/inventory', icon: <AppstoreOutlined />, label: 'Склад' },
    { key: '/orders', icon: <ShoppingOutlined />, label: 'Закупівлі' },
    { key: '/service', icon: <ToolOutlined />, label: 'Сервіс' },
  ];

  const bottomMenuItems = [
    { key: '/user', icon: <UserOutlined />, label: 'Користувач' },
  ];

  const moduleConfig = {
    '/orders': { pages: [], actions: [], dictionaries: [] },
    '/inventory': { pages: [], actions: [], dictionaries: [] },
    '/sales': { pages: [], actions: [], dictionaries: [] },
    '/user': { pages: [], actions: [], dictionaries: [] },
    '/production': {
      pages: [],
      actions: [],
      dictionaries: [
        {
          label: 'Каталог компонентів',
          path: '/production/components',
        },
      ],
    },
    '/service': { pages: [], actions: [], dictionaries: [] },
  };

  const breadcrumbMap = {
    '/home': ['Головна'],
    '/orders': ['Головна', 'Закупівлі'],
    '/production/components': ['Головна', 'Виробництво', 'Каталог компонентів'],
    '/user': ['Головна', 'Користувач'],
  };

  // helper: есть ли контент у модуля
  const hasModuleContent = (config) => {
    if (!config) return false;
    return (
      config.pages.length > 0 ||
      config.actions.length > 0 ||
      config.dictionaries.length > 0
    );
  };

  useEffect(() => {
    const moduleFromPath = Object.keys(moduleConfig).find((key) =>
      location.pathname.startsWith(key),
    );

    if (location.pathname === '/home') {
      setActiveModule(null);
      setPanelOpen(false);
      return;
    }

    if (moduleFromPath) {
      const config = moduleConfig[moduleFromPath];
      setActiveModule(moduleFromPath);
      setPanelOpen(hasModuleContent(config));
    }
  }, [location.pathname]);

  const mainSelectedKey =
    location.pathname === '/home' ? '/home' : activeModule || '';

  const currentConfig = activeModule ? moduleConfig[activeModule] : null;
  let breadcrumbItems = ['Головна'];

  if (location.pathname.startsWith('/production/components/')) {
    breadcrumbItems = [
      'Головна',
      'Виробництво',
      'Каталог компонентів',
      'Деталі',
    ];
  } else if (location.pathname === '/production/components') {
    breadcrumbItems = ['Головна', 'Виробництво', 'Каталог компонентів'];
  } else if (location.pathname === '/orders') {
    breadcrumbItems = ['Головна', 'Закупівлі'];
  } else if (location.pathname.startsWith('/orders/')) {
    breadcrumbItems = ['Головна', 'Закупівлі', 'Деталі замовлення'];
  } else if (location.pathname === '/user') {
    breadcrumbItems = ['Головна', 'Користувач'];
  }

  const hasContent = hasModuleContent(currentConfig);

  const handleMainMenuClick = ({ key }) => {
    if (key === '/home') {
      setActiveModule(null);
      setPanelOpen(false);
      navigate('/home');
      return;
    }

    const config = moduleConfig[key];

    setActiveModule(key);
    setPanelOpen(hasModuleContent(config));
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* sidebar-1 */}
      <Sider
        width={220}
        style={{
          height: '100vh',
          background: '#1f2937',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: '#1f2937', borderInlineEnd: 'none' }}
          selectedKeys={[mainSelectedKey]}
          onClick={handleMainMenuClick}
          items={mainMenuItems}
        />

        <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          <Menu
            theme="dark"
            mode="inline"
            style={{ background: '#1f2937', borderInlineEnd: 'none' }}
            selectedKeys={[activeModule === '/user' ? '/user' : '']}
            onClick={handleMainMenuClick}
            items={bottomMenuItems}
          />
        </div>
      </Sider>

      {/* sidebar-2 */}
      {panelOpen && hasContent && (
        <Sider
          width={260}
          style={{
            height: '100vh',
            background: '#2a3441',
            padding: 16,
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: 8, textAlign: 'right' }}>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setPanelOpen(false)}
              style={{ color: '#d1d5db' }}
            />
          </div>

          {currentConfig.pages.length > 0 && (
            <>
              <Text strong style={{ color: '#fff', paddingLeft: 12 }}>
                Сторінки
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => navigate(key)}
                items={currentConfig.pages.map((item, i) => ({
                  key: item.path || 'p' + i,
                  icon: <DatabaseOutlined />,
                  label: item.label || item,
                }))}
              />
              <Divider style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            </>
          )}

          {currentConfig.actions.length > 0 && (
            <>
              <Text strong style={{ color: '#fff', paddingLeft: 12 }}>
                Дії
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                onClick={({ key }) => navigate(key)}
                items={currentConfig.actions.map((item, i) => ({
                  key: item.path || 'a' + i,
                  icon: <FileAddOutlined />,
                  label: item.label || item,
                }))}
              />
              <Divider style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            </>
          )}

          {currentConfig.dictionaries.length > 0 && (
            <>
              <Text strong style={{ color: '#fff', paddingLeft: 12 }}>
                Довідники
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => navigate(key)}
                items={currentConfig.dictionaries.map((item, i) => ({
                  key: item.path || 'd' + i,
                  icon: <ReadOutlined />,
                  label: item.label || item,
                }))}
              />
            </>
          )}
        </Sider>
      )}

      {/* контент */}
      <Layout style={{ height: '100vh', overflow: 'hidden', minWidth: 0 }}>
        <Content
          style={{
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <Breadcrumb
              items={breadcrumbItems.map((label) => ({ title: label }))}
            />
          </div>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;
