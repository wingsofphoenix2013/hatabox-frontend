import {
  makeHomeItem,
  makeTextItem,
  makeLinkItem,
  getCurrentId,
} from './breadcrumbHelpers.jsx';

export const breadcrumbConfig = [
  {
    match: (pathname) => pathname.startsWith('/production/components/'),
    build: ({ pathname, search }) => {
      const currentId = getCurrentId(pathname);

      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/components${search}`, 'Каталог компонентів'),
        makeTextItem(`Компонент ID ${currentId}`),
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
    match: (pathname) => pathname === '/inventory/pending-intake',
    build: () => [
      makeHomeItem(),
      makeTextItem('Склад'),
      makeTextItem('Первинне отримання'),
    ],
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
    match: (pathname) => pathname === '/user',
    build: () => [makeHomeItem(), makeTextItem('Користувач')],
  },
];
