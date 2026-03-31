import { Layout, Menu, Divider, Typography } from 'antd';
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
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [panelOpen, setPanelOpen] = useState(false);

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
    '/orders': {
      pages: ['Замовлення', 'Повернення', 'Чернетки'],
      actions: ['Створити замовлення', 'Імпорт', 'Експорт'],
      dictionaries: ['Постачальники', 'Типи оплат', 'Статуси'],
    },
    '/inventory': {
      pages: ['Номенклатура', 'Залишки', 'Переміщення'],
      actions: ['Прийомка', 'Списання', 'Інвентаризація'],
      dictionaries: ['Склади', 'Категорії', 'Одиниці'],
    },
    '/sales': {
      pages: ['Продажі', 'Клієнти', 'Рахунки'],
      actions: ['Створити продаж', 'Знижки', 'Повернення'],
      dictionaries: ['Клієнти', 'Типи цін', 'Канали'],
    },
    '/user': {
      pages: ['Повідомлення', 'Налаштування'],
      actions: ['Вихід з системи'],
      dictionaries: [],
    },
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
  };

  const currentModule = Object.keys(moduleConfig).find((key) =>
    location.pathname.startsWith(key),
  );

  const currentConfig = moduleConfig[currentModule];

  return (
    <Layout
      style={{
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* левый sidebar */}
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
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            navigate(key);
            setPanelOpen(true);
          }}
          items={mainMenuItems}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          <Menu
            theme="dark"
            mode="inline"
            style={{ background: '#1f2937', borderInlineEnd: 'none' }}
            selectedKeys={[location.pathname]}
            onClick={({ key }) => {
              navigate(key);
              setPanelOpen(true);
            }}
            items={bottomMenuItems}
          />
        </div>
      </Sider>

      {/* второй sidebar */}
      {panelOpen && currentConfig && (
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
          <div style={{ marginBottom: 10, textAlign: 'right' }}>
            <a onClick={() => setPanelOpen(false)}>Закрити</a>
          </div>

          {currentConfig.pages.length > 0 && (
            <>
              <Text strong style={{ color: '#ffffff' }}>
                Сторінки
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                  navigate(key);
                  setPanelOpen(false);
                }}
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
              <Text strong style={{ color: '#ffffff' }}>
                Дії
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                  navigate(key);
                  setPanelOpen(false);
                }}
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
              <Text strong style={{ color: '#ffffff' }}>
                Довідники
              </Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441', borderInlineEnd: 'none' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                  navigate(key);
                  setPanelOpen(false);
                }}
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

      {/* правая часть */}
      <Layout
        style={{
          height: '100vh',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Content
          style={{
            height: '100vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: 20,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default ProtectedLayout;
