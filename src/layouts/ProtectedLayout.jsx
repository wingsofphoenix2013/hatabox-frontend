import { Layout, Menu, Divider, Typography, Button, Breadcrumb } from 'antd';
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
import { useEffect, useState } from 'react';

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [panelOpen, setPanelOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [panelManuallyClosed, setPanelManuallyClosed] = useState(false);
  const [hoveredSidebar1Key, setHoveredSidebar1Key] = useState(null);

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
      key: '/settings',
      label: 'Налаштування',
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
    '/sales': { pages: [], actions: [], dictionaries: [] },
    '/user': { pages: [], actions: [], dictionaries: [] },
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
    '/service': { pages: [], actions: [], dictionaries: [] },

    // подготовка под новые пункты sidebar-1
    '/organizations': { pages: [], actions: [], dictionaries: [] },
    '/settings': { pages: [], actions: [], dictionaries: [] },
  };

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
      setPanelManuallyClosed(false);
      return;
    }

    if (moduleFromPath) {
      const config = moduleConfig[moduleFromPath];
      setActiveModule(moduleFromPath);

      if (!panelManuallyClosed) {
        setPanelOpen(hasModuleContent(config));
      }
    }
  }, [location.pathname, panelManuallyClosed]);

  const mainSelectedKey =
    location.pathname === '/home'
      ? '/home'
      : location.pathname === '/user'
        ? '/user'
        : activeModule || '';

  const currentConfig = activeModule ? moduleConfig[activeModule] : null;
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

  const hasContent = hasModuleContent(currentConfig);

  const handleMainMenuClick = (key) => {
    if (key === '/home') {
      setActiveModule(null);
      setPanelOpen(false);
      setPanelManuallyClosed(false);
      navigate('/home');
      return;
    }

    if (key === '/user') {
      setActiveModule('/user');
      setPanelOpen(false);
      setPanelManuallyClosed(false);
      navigate('/user');
      return;
    }

    const config = moduleConfig[key];

    setActiveModule(key);
    setPanelManuallyClosed(false);
    setPanelOpen(hasModuleContent(config));
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

    const isActive = mainSelectedKey === item.key;
    const isHovered = hoveredSidebar1Key === item.key;

    const IconComponent = isActive ? item.filledIcon : item.outlinedIcon;

    const backgroundColor =
      isActive || isHovered ? 'rgba(255,255,255,0.12)' : 'transparent';

    const color = isActive ? '#ffffff' : '#d1d5db';

    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleMainMenuClick(item.key)}
        onMouseEnter={() => setHoveredSidebar1Key(item.key)}
        onMouseLeave={() => setHoveredSidebar1Key(null)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: '0 8px',
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
            transition: 'background-color 0.18s ease',
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

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider
        width={92}
        style={{
          height: '100vh',
          background: '#1f2937',
          position: 'relative',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
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
              onClick={() => {
                setPanelOpen(false);
                setPanelManuallyClosed(true);
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
                selectedKeys={
                  currentConfig.pages.some(
                    (item) => item.path === location.pathname,
                  )
                    ? [location.pathname]
                    : []
                }
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
                selectedKeys={
                  currentConfig.actions.some(
                    (item) => item.path === location.pathname,
                  )
                    ? [location.pathname]
                    : []
                }
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
                selectedKeys={
                  currentConfig.dictionaries.some(
                    (item) => item.path === location.pathname,
                  )
                    ? [location.pathname]
                    : []
                }
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
