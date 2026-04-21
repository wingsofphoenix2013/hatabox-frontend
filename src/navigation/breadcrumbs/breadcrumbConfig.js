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
      const pathParts = pathname.split('/');
      const currentId = pathParts[pathParts.length - 1];

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
    key: 'orders-register',
    match: (pathname) => pathname === '/orders/register',
  },
  {
    key: 'orders-new',
    match: (pathname) => pathname === '/orders/new',
  },
  {
    key: 'orders-vendors',
    match: (pathname) => pathname === '/orders/vendors',
  },
  {
    key: 'orders-vendors-new',
    match: (pathname) => pathname === '/orders/vendors/new',
  },
  {
    key: 'orders-vendor-detail-or-edit',
    match: (pathname) => pathname.startsWith('/orders/vendors/'),
  },
  {
    key: 'orders-edit',
    match: (pathname) =>
      pathname.startsWith('/orders/') && pathname.endsWith('/edit'),
  },
  {
    key: 'orders-detail',
    match: (pathname) => {
      const pathParts = pathname.split('/');
      return pathname.startsWith('/orders/') && pathParts.length === 3;
    },
  },
  {
    key: 'orders-fallback',
    match: (pathname) => pathname.startsWith('/orders/'),
  },
  {
    key: 'inventory-warehouses',
    match: (pathname) => pathname === '/inventory/warehouses',
  },
  {
    key: 'user',
    match: (pathname) => pathname === '/user',
  },
];
