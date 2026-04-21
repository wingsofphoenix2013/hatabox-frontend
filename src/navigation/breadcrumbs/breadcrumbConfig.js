export const breadcrumbConfig = [
  {
    key: 'production-component-detail',
    match: (pathname) => pathname.startsWith('/production/components/'),
  },
  {
    key: 'production-components',
    match: (pathname) => pathname === '/production/components',
  },
  {
    key: 'production-product-material-plan',
    match: (pathname) =>
      pathname.startsWith('/production/products/') &&
      pathname.endsWith('/material-plan'),
  },
  {
    key: 'production-product-new-step',
    match: (pathname) =>
      pathname.startsWith('/production/products/') &&
      pathname.endsWith('/new-step'),
  },
  {
    key: 'production-product-step-detail',
    match: (pathname) => pathname.startsWith('/production/product-steps/'),
  },
  {
    key: 'production-product-detail',
    match: (pathname) => pathname.startsWith('/production/products/'),
  },
  {
    key: 'production-products',
    match: (pathname) => pathname === '/production/products',
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
