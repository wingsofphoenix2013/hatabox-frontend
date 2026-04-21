import { breadcrumbConfig } from './breadcrumbConfig';
import {
  makeHomeItem,
  makeTextItem,
  makeLinkItem,
  getCurrentId,
} from './breadcrumbHelpers.jsx';

export function buildBreadcrumbs(location) {
  const { pathname, search, state } = location;

  const matchedEntry = breadcrumbConfig.find((entry) => entry.match(pathname));

  if (matchedEntry?.build) {
    return matchedEntry.build({ pathname, search, state });
  }

  const productLabel = state?.productLabel;
  const stepLabel = state?.stepLabel;
  const vendorLabel = state?.vendorLabel;
  const orderLabel = state?.orderLabel;

  const pathParts = pathname.split('/');
  const currentId = getCurrentId(pathname);
  const isVendorEditPage = pathname.endsWith('/edit');

  if (!matchedEntry) {
    return [makeHomeItem()];
  }

  switch (matchedEntry.key) {
    case 'production-product-material-plan':
      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${pathParts[pathParts.length - 2]}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem(`Продукт ID ${pathParts[pathParts.length - 2]}`),
        makeTextItem('Загальна комплектація'),
      ];

    case 'production-product-new-step':
      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${pathParts[pathParts.length - 2]}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem(`Продукт ID ${pathParts[pathParts.length - 2]}`),
        makeTextItem('Новий етап'),
      ];

    case 'production-product-step-detail':
      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        productLabel
          ? makeLinkItem(
              `/production/products/${state?.productId || ''}${search}`,
              productLabel,
              { productLabel },
            )
          : makeTextItem('Продукт'),
        makeTextItem(stepLabel || `Етап ID ${currentId}`),
      ];

    case 'production-product-detail':
      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeLinkItem(`/production/products${search}`, 'Каталог продукції'),
        makeTextItem(productLabel || `Продукт ID ${currentId}`),
      ];

    case 'production-products':
      return [
        makeHomeItem(),
        makeTextItem('Виробництво'),
        makeTextItem('Каталог продукції'),
      ];

    case 'orders-register':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeTextItem('Реєстр замовлень'),
      ];

    case 'orders-new':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeTextItem('Створити замовлення'),
      ];

    case 'orders-vendors':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeTextItem('Каталог постачальників'),
      ];

    case 'orders-vendors-new':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/vendors', 'Каталог постачальників'),
        makeTextItem('Новий постачальник'),
      ];

    case 'orders-vendor-detail-or-edit': {
      const vendorId = isVendorEditPage
        ? pathParts[pathParts.length - 2]
        : currentId;

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
    }

    case 'orders-edit': {
      const orderId = pathParts[pathParts.length - 2];

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
    }

    case 'orders-detail':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeLinkItem('/orders/register', 'Реєстр замовлень'),
        makeTextItem(orderLabel || `Замовлення ID ${currentId}`),
      ];

    case 'orders-fallback':
      return [
        makeHomeItem(),
        makeTextItem('Закупівлі'),
        makeTextItem('Деталі замовлення'),
      ];

    case 'inventory-warehouses':
      return [
        makeHomeItem(),
        makeTextItem('Склад'),
        makeTextItem('Каталог складів'),
      ];

    case 'user':
      return [makeHomeItem(), makeTextItem('Користувач')];

    default:
      return [makeHomeItem()];
  }
}
