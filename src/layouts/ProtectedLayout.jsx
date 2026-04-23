import {
  Layout,
  Menu,
  Divider,
  Typography,
  Button,
  Breadcrumb,
  ConfigProvider,
} from 'antd';
import {
  HomeOutlined,
  HomeFilled,
  ShopOutlined,
  ShopFilled,
  ApiOutlined,
  ApiFilled,
  AppstoreOutlined,
  AppstoreFilled,
  ShoppingOutlined,
  ShoppingFilled,
  BankOutlined,
  BankFilled,
  ToolOutlined,
  ToolFilled,
  IdcardOutlined,
  IdcardFilled,
  DatabaseOutlined,
  FileAddOutlined,
  ReadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildBreadcrumbs } from '../navigation/breadcrumbs/buildBreadcrumbs.jsx';
import api from '../api/client';

const { Sider, Content } = Layout;
const { Text } = Typography;

const moduleConfig = {
  '/sales': {
    pages: [],
    actions: [],
    dictionaries: [],
  },

  '/production': {
    pages: [],
    actions: [],
    dictionaries: [
      {
        label: 'Каталог продукції',
        path: '/production/products',
      },
      {
        label: 'Каталог компонентів',
        path: '/production/components',
      },
    ],
  },

  '/inventory': {
    pages: [
      {
        label: 'Складські залишки',
        path: '/inventory/stock',
      },
      {
        label: 'Первинне отримання',
        path: '/inventory/pending-intake',
      },
      {
        label: 'Давальчі поставки',
        path: '/inventory/tolling-pending-intake',
      },
    ],
    actions: [],
    dictionaries: [
      {
        label: 'Каталог складів',
        path: '/inventory/warehouses',
      },
    ],
  },

  '/orders': {
    pages: [
      {
        label: 'Реєстр замовлень',
        path: '/orders/register',
      },
      {
        label: 'Давальчі поставки',
        path: '/orders/tolling',
      },
    ],
    actions: [
      {
        label: 'Створити замовлення',
        path: '/orders/new',
      },
    ],
    dictionaries: [
      {
        label: 'Каталог постачальників',
        path: '/orders/vendors',
      },
    ],
  },

  '/organizations': {
    pages: [],
    actions: [],
    dictionaries: [],
  },

  '/service': {
    pages: [],
    actions: [],
    dictionaries: [],
  },

  '/user': {
    pages: [],
    actions: [],
    dictionaries: [],
  },
};

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredSidebar1Key, setHoveredSidebar1Key] = useState(null);
  const [previewModule, setPreviewModule] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pendingIntakeCount, setPendingIntakeCount] = useState(0);

  const sidebar1TopItems = [
    {
      key: '/home',
      label: 'Головна',
      outlinedIcon: HomeOutlined,
      filledIcon: HomeFilled,
      type: 'item',
    },
    { key: 'divider-1', type: 'divider' },

    {
      key: '/sales',
      label: 'Продажі',
      outlinedIcon: ShopOutlined,
      filledIcon: ShopFilled,
      type: 'item',
    },
    {
      key: '/production',
      label: 'Виробництво',
      outlinedIcon: ApiOutlined,
      filledIcon: ApiFilled,
      type: 'item',
    },
    {
      key: '/inventory',
      label: 'Склад',
      outlinedIcon: AppstoreOutlined,
      filledIcon: AppstoreFilled,
      type: 'item',
    },
    {
      key: '/orders',
      label: 'Закупівлі',
      outlinedIcon: ShoppingOutlined,
      filledIcon: ShoppingFilled,
      type: 'item',
    },
    { key: 'divider-2', type: 'divider' },

    {
      key: '/organizations',
      label: 'Організації',
      outlinedIcon: BankOutlined,
      filledIcon: BankFilled,
      type: 'item',
    },
    { key: 'divider-3', type: 'divider' },

    {
      key: '/service',
      label: 'Сервіс',
      outlinedIcon: ToolOutlined,
      filledIcon: ToolFilled,
      type: 'item',
    },
  ];

  const sidebar1BottomItem = {
    key: '/user',
    label: 'Користувач',
    outlinedIcon: IdcardOutlined,
    filledIcon: IdcardFilled,
    type: 'item',
  };

  const getModuleFromPath = (pathname) => {
    const moduleKeys = Object.keys(moduleConfig);
    return moduleKeys.find((key) => pathname.startsWith(key)) || null;
  };

  const hasModuleContent = (config) => {
    if (!config) return false;
    return (
      config.pages.length > 0 ||
      config.actions.length > 0 ||
      config.dictionaries.length > 0
    );
  };

  const fetchPendingIntakeStatus = async () => {
    try {
      const response = await api.get('warehouse-pending-intake-items/status/');
      const count = Number(response.data?.count) || 0;
      setPendingIntakeCount(count);
    } catch (error) {
      console.error('Failed to fetch pending intake status:', error);
      setPendingIntakeCount(0);
    }
  };

  const routeModule = getModuleFromPath(location.pathname);
  const previousRouteModuleRef = useRef(routeModule);

  useEffect(() => {
    const previousRouteModule = previousRouteModuleRef.current;

    if (location.pathname === '/home') {
      setPreviewModule(null);
      setPanelOpen(false);
      previousRouteModuleRef.current = null;
      return;
    }

    if (location.pathname === '/user') {
      setPreviewModule('/user');
      setPanelOpen(false);
      previousRouteModuleRef.current = '/user';
      return;
    }

    if (!routeModule) {
      setPreviewModule(null);
      setPanelOpen(false);
      previousRouteModuleRef.current = null;
      return;
    }

    const isModuleChanged = previousRouteModule !== routeModule;
    const config = moduleConfig[routeModule];
    const moduleHasContent = hasModuleContent(config);

    setPreviewModule(routeModule);

    if (isModuleChanged) {
      setPanelOpen(moduleHasContent);
    }

    previousRouteModuleRef.current = routeModule;
  }, [location.pathname, routeModule]);

  useEffect(() => {
    fetchPendingIntakeStatus();

    const intervalId = window.setInterval(() => {
      fetchPendingIntakeStatus();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const currentConfig = previewModule ? moduleConfig[previewModule] : null;

  const hasContent = hasModuleContent(currentConfig);

  const breadcrumbItems = buildBreadcrumbs(location);

  const handleSidebar1Click = (key) => {
    if (key === '/home') {
      setPreviewModule(null);
      setPanelOpen(false);
      navigate('/home');
      return;
    }

    if (key === '/user') {
      setPreviewModule('/user');
      setPanelOpen(false);
      navigate('/user');
      return;
    }

    const config = moduleConfig[key];
    const moduleHasContent = hasModuleContent(config);

    if (previewModule === key) {
      if (!panelOpen && moduleHasContent) {
        setPanelOpen(true);
      }
      return;
    }

    setPreviewModule(key);
    setPanelOpen(moduleHasContent);
  };

  const renderSidebar1Item = (item) => {
    if (item.type === 'divider') {
      return (
        <div
          key={item.key}
          style={{
            margin: '10px 12px',
            borderTop: '1px dotted rgba(255,255,255,0.28)',
          }}
        />
      );
    }

    const isActive = routeModule === item.key || location.pathname === item.key;
    const isPreview = previewModule === item.key;
    const isHovered = hoveredSidebar1Key === item.key;
    const showInventoryBadge =
      item.key === '/inventory' && !!inventoryBadgeText;

    const IconComponent = isActive ? item.filledIcon : item.outlinedIcon;

    let backgroundColor = 'transparent';
    let color = '#d1d5db';

    if (isHovered) {
      backgroundColor = 'rgba(255,255,255,0.08)';
      color = '#f3f4f6';
    }

    if (isPreview) {
      backgroundColor = 'rgba(255,255,255,0.12)';
      color = '#f9fafb';
    }

    if (isActive) {
      backgroundColor = 'rgba(255,255,255,0.18)';
      color = '#ffffff';
    }

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleSidebar1Click(item.key)}
        onMouseEnter={() => setHoveredSidebar1Key(item.key)}
        onMouseLeave={() => setHoveredSidebar1Key(null)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: '0 8px',
          margin: '2px 0',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            minHeight: 72,
            borderRadius: 10,
            background: backgroundColor,
            color,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '8px 4px',
            transition: 'background-color 0.18s ease, color 0.18s ease',
            position: 'relative',
          }}
        >
          <IconComponent style={{ fontSize: 24, lineHeight: 1 }} />

          {showInventoryBadge && (
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 700,
                lineHeight: '16px',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            >
              {inventoryBadgeText}
            </span>
          )}

          <div
            style={{
              fontSize: 10,
              lineHeight: 1.15,
              textAlign: 'center',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {item.label}
          </div>
        </div>
      </button>
    );
  };

  const sidebar2SelectedKeys = useMemo(() => {
    if (!currentConfig) return [];

    if (currentConfig.pages.some((item) => item.path === location.pathname)) {
      return [location.pathname];
    }

    if (currentConfig.actions.some((item) => item.path === location.pathname)) {
      return [location.pathname];
    }

    if (
      currentConfig.dictionaries.some((item) => item.path === location.pathname)
    ) {
      return [location.pathname];
    }

    return [];
  }, [currentConfig, location.pathname]);

  const inventoryBadgeText =
    pendingIntakeCount > 9
      ? '9+'
      : pendingIntakeCount > 0
        ? String(pendingIntakeCount)
        : null;

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        width={92}
        style={{
          height: '100vh',
          background: '#1f2937',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px 0',
          }}
        >
          <div>{sidebar1TopItems.map((item) => renderSidebar1Item(item))}</div>

          <div style={{ marginTop: 'auto' }}>
            {renderSidebar1Item(sidebar1BottomItem)}
          </div>
        </div>
      </Sider>

      {panelOpen && hasContent && previewModule !== '/user' && (
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
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  darkItemBg: '#2a3441',
                  darkSubMenuItemBg: '#2a3441',
                  darkItemHoverBg: 'rgba(255,255,255,0.06)',
                  darkItemSelectedBg: '#475569',
                  darkItemSelectedColor: '#ffffff',
                  darkItemColor: '#d1d5db',
                  darkDangerItemSelectedBg: '#475569',
                  activeBarBorderWidth: 0,
                  itemBorderRadius: 8,
                  itemMarginBlock: 4,
                },
              },
            }}
          >
            <div style={{ marginBottom: 8, textAlign: 'right' }}>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  setPanelOpen(false);
                }}
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
                  selectedKeys={sidebar2SelectedKeys}
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
                  selectedKeys={sidebar2SelectedKeys}
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
                  selectedKeys={sidebar2SelectedKeys}
                  onClick={({ key }) => navigate(key)}
                  items={currentConfig.dictionaries.map((item, i) => ({
                    key: item.path || 'd' + i,
                    icon: <ReadOutlined />,
                    label: item.label || item,
                  }))}
                />
              </>
            )}
          </ConfigProvider>
        </Sider>
      )}

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
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;
