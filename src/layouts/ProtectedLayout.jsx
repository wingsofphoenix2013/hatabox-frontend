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
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredSidebar1Key, setHoveredSidebar1Key] = useState(null);
  const [previewModule, setPreviewModule] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [manuallyClosedModule, setManuallyClosedModule] = useState(null);

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

  const routeModule = useMemo(
    () => getModuleFromPath(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    if (location.pathname === '/home') {
      setPreviewModule(null);
      setPanelOpen(false);
      setManuallyClosedModule(null);
      return;
    }

    if (location.pathname === '/user') {
      setPreviewModule('/user');
      setPanelOpen(false);
      return;
    }

    if (!routeModule) {
      setPreviewModule(null);
      setPanelOpen(false);
      return;
    }

    setPreviewModule(routeModule);

    const config = moduleConfig[routeModule];
    const shouldOpen =
      hasModuleContent(config) && manuallyClosedModule !== routeModule;

    setPanelOpen(shouldOpen);
  }, [location.pathname]);

  const currentConfig = previewModule ? moduleConfig[previewModule] : null;
  const hasContent = hasModuleContent(currentConfig);

  const pathParts = location.pathname.split('/');
  const currentId = pathParts[pathParts.length - 1];

  const breadcrumbLinkStyle = {
    textDecoration: 'underline',
  };

  const productLabel = location.state?.productLabel;
  const stepLabel = location.state?.stepLabel;
  const vendorLabel = location.state?.vendorLabel;
  const isVendorEditPage = location.pathname.endsWith('/edit');

  let breadcrumbItems = [
    {
      title: (
        <Link to="/home" style={breadcrumbLinkStyle}>
          Головна
        </Link>
      ),
    },
  ];

  if (location.pathname.startsWith('/production/components/')) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      {
        title: (
          <Link
            to={`/production/components${location.search}`}
            style={breadcrumbLinkStyle}
          >
            Каталог компонентів
          </Link>
        ),
      },
      { title: `Компонент ID ${currentId}` },
    ];
  } else if (location.pathname === '/production/components') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      { title: 'Каталог компонентів' },
    ];
  } else if (
    location.pathname.startsWith('/production/products/') &&
    location.pathname.endsWith('/material-plan')
  ) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      {
        title: (
          <Link
            to={`/production/products${location.search}`}
            style={breadcrumbLinkStyle}
          >
            Каталог продукції
          </Link>
        ),
      },
      {
        title: productLabel ? (
          <Link
            to={`/production/products/${pathParts[pathParts.length - 2]}${location.search}`}
            style={breadcrumbLinkStyle}
            state={{ productLabel }}
          >
            {productLabel}
          </Link>
        ) : (
          `Продукт ID ${pathParts[pathParts.length - 2]}`
        ),
      },
      { title: 'Загальна комплектація' },
    ];
  } else if (
    location.pathname.startsWith('/production/products/') &&
    location.pathname.endsWith('/new-step')
  ) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      {
        title: (
          <Link
            to={`/production/products${location.search}`}
            style={breadcrumbLinkStyle}
          >
            Каталог продукції
          </Link>
        ),
      },
      {
        title: productLabel ? (
          <Link
            to={`/production/products/${pathParts[pathParts.length - 2]}${location.search}`}
            style={breadcrumbLinkStyle}
            state={{ productLabel }}
          >
            {productLabel}
          </Link>
        ) : (
          `Продукт ID ${pathParts[pathParts.length - 2]}`
        ),
      },
      { title: 'Новий етап' },
    ];
  } else if (location.pathname.startsWith('/production/product-steps/')) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      {
        title: (
          <Link
            to={`/production/products${location.search}`}
            style={breadcrumbLinkStyle}
          >
            Каталог продукції
          </Link>
        ),
      },
      {
        title: productLabel ? (
          <Link
            to={`/production/products/${location.state?.productId || ''}${location.search}`}
            style={breadcrumbLinkStyle}
            state={{ productLabel }}
          >
            {productLabel}
          </Link>
        ) : (
          'Продукт'
        ),
      },
      {
        title: stepLabel || `Етап ID ${currentId}`,
      },
    ];
  } else if (location.pathname.startsWith('/production/products/')) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      {
        title: (
          <Link
            to={`/production/products${location.search}`}
            style={breadcrumbLinkStyle}
          >
            Каталог продукції
          </Link>
        ),
      },
      { title: productLabel || `Продукт ID ${currentId}` },
    ];
  } else if (location.pathname === '/production/products') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Виробництво' },
      { title: 'Каталог продукції' },
    ];
  } else if (location.pathname === '/orders/register') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      { title: 'Реєстр замовлень' },
    ];
  } else if (location.pathname === '/orders/new') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      { title: 'Створити замовлення' },
    ];
  } else if (location.pathname === '/orders/vendors') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      { title: 'Каталог постачальників' },
    ];
  } else if (location.pathname === '/orders/vendors/new') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      {
        title: (
          <Link to="/orders/vendors" style={breadcrumbLinkStyle}>
            Каталог постачальників
          </Link>
        ),
      },
      { title: 'Новий постачальник' },
    ];
  } else if (location.pathname.startsWith('/orders/vendors/')) {
    const vendorId = isVendorEditPage
      ? pathParts[pathParts.length - 2]
      : currentId;

    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      {
        title: (
          <Link to="/orders/vendors" style={breadcrumbLinkStyle}>
            Каталог постачальників
          </Link>
        ),
      },
      {
        title: (
          <Link
            to={`/orders/vendors/${vendorId}`}
            style={breadcrumbLinkStyle}
            state={{ vendorLabel }}
          >
            {vendorLabel || `Постачальник ID ${vendorId}`}
          </Link>
        ),
      },
      ...(isVendorEditPage ? [{ title: 'Редагування' }] : []),
    ];
  } else if (
    location.pathname.startsWith('/orders/') &&
    location.pathname.endsWith('/edit')
  ) {
    const orderId = pathParts[pathParts.length - 2];

    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      {
        title: (
          <Link to="/orders/register" style={breadcrumbLinkStyle}>
            Реєстр замовлень
          </Link>
        ),
      },
      {
        title: (
          <Link to={`/orders/${orderId}`} style={breadcrumbLinkStyle}>
            {location.state?.orderLabel || `Замовлення ID ${orderId}`}
          </Link>
        ),
      },
      { title: 'Редагування' },
    ];
  } else if (
    location.pathname.startsWith('/orders/') &&
    pathParts.length === 3
  ) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      {
        title: (
          <Link to="/orders/register" style={breadcrumbLinkStyle}>
            Реєстр замовлень
          </Link>
        ),
      },
      {
        title: location.state?.orderLabel || `Замовлення ID ${currentId}`,
      },
    ];
  } else if (location.pathname.startsWith('/orders/')) {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Закупівлі' },
      { title: 'Деталі замовлення' },
    ];
  } else if (location.pathname === '/inventory/warehouses') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Склад' },
      { title: 'Каталог складів' },
    ];
  } else if (location.pathname === '/user') {
    breadcrumbItems = [
      {
        title: (
          <Link to="/home" style={breadcrumbLinkStyle}>
            Головна
          </Link>
        ),
      },
      { title: 'Користувач' },
    ];
  }

  const handleSidebar1Click = (key) => {
    if (key === '/home') {
      setPreviewModule(null);
      setPanelOpen(false);
      setManuallyClosedModule(null);
      navigate('/home');
      return;
    }

    if (key === '/user') {
      setPreviewModule('/user');
      setPanelOpen(false);
      setManuallyClosedModule(null);
      navigate('/user');
      return;
    }

    const config = moduleConfig[key];
    const moduleHasContent = hasModuleContent(config);

    if (previewModule === key) {
      if (!panelOpen && moduleHasContent) {
        setPanelOpen(true);
        setManuallyClosedModule(null);
      }
      return;
    }

    setPreviewModule(key);
    setManuallyClosedModule(null);
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
          }}
        >
          <IconComponent style={{ fontSize: 24, lineHeight: 1 }} />
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
                  setManuallyClosedModule(previewModule);
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
