import {
  makeHomeItem,
  makeTextItem,
  makeLinkItem,
  getCurrentId,
} from './breadcrumbHelpers.jsx';

export const breadcrumbConfig = [
  {
    match: (pathname) => pathname === '/sales/orders',
    build: () => [
      makeHomeItem(),
      makeTextItem('Продажі'),
      makeTextItem('Реєстр замовлень'),
    ],
  },
  {
    match: (pathname) =>
      pathname.startsWith('/sales/orders/') &&
      pathname.endsWith('/material-plan'),
    build: ({ pathname, state }) => {
      const pathParts = pathname.split('/');
      const orderId = pathParts[pathParts.length - 2];
      const orderLabel = state?.orderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Продажі'),
        makeLinkItem('/sales/orders', 'Реєстр замовлень'),
        makeLinkItem(
          `/sales/orders/${orderId}`,
          orderLabel || `Order ID ${orderId}`,
          { orderLabel },
        ),
        makeTextItem('Собівартість закупівель'),
      ];
    },
  },
  {
    match: (pathname) => pathname.startsWith('/sales/orders/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const orderLabel = state?.orderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Продажі'),
        makeLinkItem('/sales/orders', 'Реєстр замовлень'),
        makeTextItem(orderLabel || `Order ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/production/components/new',
    build: () => [
      makeHomeItem(),
      makeTextItem('Виробництво'),
      makeLinkItem('/production/components', 'Каталог компонентів'),
      makeTextItem('Новий компонент'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/production/components/'),
    build: ({ pathname, search, state }) => {
      const currentId = getCurrentId(pathname);
      const componentLabel = state?.componentLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/components${search}`, 'Каталог компонентів'),
        makeTextItem(componentLabel || `Компонент ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/production/components',
    build: () => [
      makeHomeItem(),
      makeTextItem('Виробництво'),
      makeTextItem('Каталог компонентів'),
    ],
  },
  {
    match: (pathname) =>
      pathname.startsWith('/production/products/') &&
      pathname.endsWith('/material-plan'),
    build: ({ pathname, search, state }) => {
      const pathParts = pathname.split('/');
      const productId = pathParts[pathParts.length - 2];
      const productLabel = state?.productLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${productId}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem(`Продукт ID ${productId}`),
        makeTextItem('Загальна комплектація'),
      ];
    },
  },
  {
    match: (pathname) =>
      pathname.startsWith('/production/products/') &&
      pathname.endsWith('/new-step'),
    build: ({ pathname, search, state }) => {
      const pathParts = pathname.split('/');
      const productId = pathParts[pathParts.length - 2];
      const productLabel = state?.productLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${productId}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem(`Продукт ID ${productId}`),
        makeTextItem('Новий етап'),
      ];
    },
  },
  {
    match: (pathname) =>
      pathname.startsWith('/production/products/') &&
      pathname.endsWith('/gallery'),
    build: ({ pathname, search, state }) => {
      const pathParts = pathname.split('/');
      const productId = pathParts[pathParts.length - 2];
      const productLabel = state?.productLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${productId}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem(`Продукт ID ${productId}`),
        makeTextItem('Галерея продукту'),
      ];
    },
  },
  {
    match: (pathname) => pathname.startsWith('/production/product-steps/'),
    build: ({ pathname, search, state }) => {
      const currentId = getCurrentId(pathname);
      const productLabel = state?.productLabel;
      const stepLabel = state?.stepLabel;
      const productId = state?.productId || '';

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${productId}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem('Продукт'),
        makeTextItem(stepLabel || `Етап ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname.startsWith('/production/products/'),
    build: ({ pathname, search, state }) => {
      const currentId = getCurrentId(pathname);
      const productLabel = state?.productLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        makeTextItem(productLabel || `Продукт ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/production/orders',
    build: () => [
      makeHomeItem(),
      makeTextItem('Виробництво'),
      makeTextItem('Карти виробництва'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/production/orders/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const productionOrderLabel = state?.productionOrderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem('/production/orders', 'Карти виробництва'),
        makeTextItem(productionOrderLabel || `Карта ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/production/products',
    build: () => [
      makeHomeItem(),
      makeTextItem('Виробництво'),
      makeTextItem('Каталог продукції'),
    ],
  },

  {
    match: (pathname) => pathname === '/orders/register',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Реєстр замовлень'),
    ],
  },
  {
    match: (pathname) => pathname === '/orders/tolling',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Давальчі поставки'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/orders/tolling/'),
    build: ({ pathname }) => {
      const currentId = getCurrentId(pathname);

      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/tolling', 'Давальчі поставки'),
        makeTextItem(currentId),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/orders/new',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Створити замовлення'),
    ],
  },
  {
    match: (pathname) => pathname === '/orders/vendors',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Каталог постачальників'),
    ],
  },
  {
    match: (pathname) => pathname === '/orders/vendors/new',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeLinkItem('/orders/vendors', 'Каталог постачальників'),
      makeTextItem('Новий постачальник'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/orders/vendors/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const isVendorEditPage = pathname.endsWith('/edit');
      const pathParts = pathname.split('/');
      const vendorId = isVendorEditPage
        ? pathParts[pathParts.length - 2]
        : currentId;
      const vendorLabel = state?.vendorLabel;

      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/vendors', 'Каталог постачальників'),
        makeLinkItem(
          `/orders/vendors/${vendorId}`,
          vendorLabel || `Постачальник ID ${vendorId}`,
          { vendorLabel },
        ),
        ...(isVendorEditPage ? [makeTextItem('Редагування')] : []),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/inventory/storage-topology',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Топологія складів'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/inventory/storage-topology/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const storagePlaceLabel = state?.storagePlaceLabel;

      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeLinkItem('/inventory/storage-topology', 'Топологія складів'),
        makeTextItem(storagePlaceLabel || `Точка зберігання ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/orders/shortage',
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Реєстр дефіциту'),
    ],
  },
  {
    match: (pathname) =>
      pathname.startsWith('/orders/') && pathname.endsWith('/reclamation'),
    build: ({ pathname, state }) => {
      const pathParts = pathname.split('/');
      const orderId = pathParts[pathParts.length - 2];
      const orderLabel = state?.orderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/register', 'Реєстр замовлень'),
        makeLinkItem(
          `/orders/${orderId}`,
          orderLabel || `Замовлення ID ${orderId}`,
          { orderLabel },
        ),
        makeTextItem('Повернення товару'),
      ];
    },
  },
  {
    match: (pathname) =>
      pathname.startsWith('/orders/') && pathname.endsWith('/edit'),
    build: ({ pathname, state }) => {
      const pathParts = pathname.split('/');
      const orderId = pathParts[pathParts.length - 2];
      const orderLabel = state?.orderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/register', 'Реєстр замовлень'),
        makeLinkItem(
          `/orders/${orderId}`,
          orderLabel || `Замовлення ID ${orderId}`,
        ),
        makeTextItem('Редагування'),
      ];
    },
  },
  {
    match: (pathname) => {
      const pathParts = pathname.split('/');
      return pathname.startsWith('/orders/') && pathParts.length === 3;
    },
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const orderLabel = state?.orderLabel;

      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/register', 'Реєстр замовлень'),
        makeTextItem(orderLabel || `Замовлення ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname.startsWith('/orders/'),
    build: () => [
      makeHomeItem(),
      makeTextItem('Закупівлі'),
      makeTextItem('Деталі замовлення'),
    ],
  },

  {
    match: (pathname) => pathname === '/inventory/stock',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Складські залишки'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/inventory/stock/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const inventoryItemLabel = state?.inventoryItemLabel;

      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeLinkItem('/inventory/stock', 'Складські залишки'),
        makeTextItem(inventoryItemLabel || `Inv item ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/inventory/production-movements',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Видача на виробництво'),
    ],
  },
  {
    match: (pathname) => pathname === '/inventory/movements',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Переміщення товарів'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/inventory/movements/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const movementLabel = state?.movementLabel;

      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeLinkItem('/inventory/movements', 'Переміщення товарів'),
        makeTextItem(movementLabel || `Накладна №${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/inventory/pending-intake',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Первинне отримання'),
    ],
  },
  {
    match: (pathname) => pathname === '/inventory/tolling-pending-intake',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Давальчі поставки'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/inventory/storage-places/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const locationLabel = state?.locationLabel;
      const storagePlaceLabel = state?.storagePlaceLabel;

      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeLinkItem('/inventory/warehouses', 'Каталог складів'),
        makeLinkItem(
          `/inventory/warehouses/${state?.locationId || ''}`,
          locationLabel || 'Location',
          { locationLabel },
        ),
        makeTextItem(storagePlaceLabel || `Storage place ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/inventory/warehouses',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Каталог складів'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/inventory/warehouses/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const locationLabel = state?.locationLabel;

      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeLinkItem('/inventory/warehouses', 'Каталог складів'),
        makeTextItem(locationLabel || `Location ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/organizations',
    build: () => [
      makeHomeItem(),
      makeTextItem('Організації'),
      makeTextItem('Каталог організацій'),
    ],
  },
  {
    match: (pathname) => pathname === '/organizations/contacts',
    build: () => [
      makeHomeItem(),
      makeTextItem('Організації'),
      makeTextItem('Адресна книга'),
    ],
  },
  {
    match: (pathname) => pathname.startsWith('/organizations/'),
    build: ({ pathname, state }) => {
      const currentId = getCurrentId(pathname);
      const organizationLabel = state?.organizationLabel;

      return [
        makeHomeItem(),
        makeTextItem('Організації'),
        makeLinkItem('/organizations', 'Каталог організацій'),
        makeTextItem(organizationLabel || `Organization ID ${currentId}`),
      ];
    },
  },
  {
    match: (pathname) => pathname === '/user',
    build: () => [makeHomeItem(), makeTextItem('Користувач')],
  },
];
