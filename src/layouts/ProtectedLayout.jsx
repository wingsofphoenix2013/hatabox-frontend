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
import { useState, useEffect } from 'react';

const { Sider, Content } = Layout;
const { Text } = Typography;

function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(() => {
    if (currentModule) {
      setPanelOpen(true);
    }
  }, [currentModule]);

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

  // конфигурация модулей
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
          label: 'Номенклатура компонентів',
          path: '/production/components',
        },
      ],
    },
  };

  // определяем текущий модуль
  const currentModule = Object.keys(moduleConfig).find((key) =>
    location.pathname.startsWith(key),
  );

  const currentConfig = moduleConfig[currentModule];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* левый sidebar */}
      <Sider
        width={220}
        style={{
          height: '100vh',
          position: 'relative',
          background: '#1f2937',
        }}
      >
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: '#1f2937' }}
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
            style={{ background: '#1f2937' }}
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
            background: '#2a3441',
            padding: 16,
            borderRight: '1px solid #e5e7eb',
          }}
        >
          {/* кнопка закрытия */}
          <div style={{ marginBottom: 10, textAlign: 'right' }}>
            <a onClick={() => setPanelOpen(false)}>Закрити</a>
          </div>

          {/* Сторінки */}
          {currentConfig.pages.length > 0 && (
            <>
              <Text strong>Сторінки</Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                  setPanelOpen(false);
                }}
                items={currentConfig.pages.map((item, i) => ({
                  key: item.path || 'p' + i,
                  icon: <DatabaseOutlined />,
                  label: item.label || item,
                }))}
              />
              <Divider />
            </>
          )}
          {/* Дії */}
          {currentConfig.actions.length > 0 && (
            <>
              <Text strong>Дії</Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441' }}
                selectedKeys={[location.pathname]}
                onClick={({ key }) => {
                  setPanelOpen(false);
                }}
                items={currentConfig.actions.map((item, i) => ({
                  key: item.path || 'a' + i,
                  icon: <FileAddOutlined />,
                  label: item.label || item,
                }))}
              />
              <Divider />
            </>
          )}
          {/* Довідники */}
          {currentConfig.dictionaries.length > 0 && (
            <>
              <Text strong>Довідники</Text>
              <Menu
                mode="inline"
                theme="dark"
                style={{ background: '#2a3441' }}
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
