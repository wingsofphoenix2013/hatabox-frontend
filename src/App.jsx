import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { setCsrfToken } from './api/client';

import LoginPage from './pages/LoginPage';
import ProtectedLayout from './layouts/ProtectedLayout';

import WarehouseRegisterPage from './pages/WarehouseRegisterPage';
import WarehouseLocationDetailPage from './pages/WarehouseLocationDetailPage';
import WarehouseStoragePlaceDetailPage from './pages/WarehouseStoragePlaceDetailPage';
import WarehousePendingIntakePage from './pages/WarehousePendingIntakePage';
import WarehouseTollingPendingIntakePage from './pages/WarehouseTollingPendingIntakePage';
import WarehouseStockRegisterPage from './pages/WarehouseStockRegisterPage';
import WarehouseMovementRegisterPage from './pages/WarehouseMovementRegisterPage';
import WarehouseMovementDetailPage from './pages/WarehouseMovementDetailPage';
import WarehouseStockDetailPage from './pages/WarehouseStockDetailPage';
import WarehouseProductionMovementRegisterPage from './pages/WarehouseProductionMovementRegisterPage';

import StoragePlacesRegisterPage from './pages/StoragePlacesRegisterPage';
import StoragePlaceDetailPage from './pages/StoragePlaceDetailPage';

import OrderDetailPage from './pages/OrderDetailPage';
import OrdersRegisterPage from './pages/OrdersRegisterPage';
import OrdersTollingRegisterPage from './pages/OrdersTollingRegisterPage';
import OrderTollingDetailsPage from './pages/OrderTollingDetailsPage';
import OrderCreatePage from './pages/OrderCreatePage';
import OrderEditPage from './pages/OrderEditPage';
import OrdersShortageRegisterPage from './pages/OrdersShortageRegisterPage';
import OrderReclamationPage from './pages/OrderReclamationPage';

import VendorsPage from './pages/VendorsPage';
import VendorDetailPage from './pages/VendorDetailPage';
import VendorEditPage from './pages/VendorEditPage';
import VendorCreatePage from './pages/VendorCreatePage';

import ProductionComponentsPage from './pages/ProductionComponentsPage';
import ProductionComponentCreatePage from './pages/ProductionComponentCreatePage';
import ProductionComponentDetailPage from './pages/ProductionComponentDetailPage';

import ProductionProductPage from './pages/ProductionProductPage';
import ProductionProductDetailPage from './pages/ProductionProductDetailPage';
import ProductionProductMaterialPlanPage from './pages/ProductionProductMaterialPlanPage';
import ProductionProductStepCreatePage from './pages/ProductionProductStepCreatePage';
import ProductionProductStepDetailPage from './pages/ProductionProductStepDetailPage';
import ProductionProductGalleryPage from './pages/ProductionProductGalleryPage';

import OrganisationsRegisterPage from './pages/OrganisationsRegisterPage';
import OrganizationDetailsPage from './pages/OrganizationDetailsPage';
import OrganizationContactsRegisterPage from './pages/OrganizationContactsRegisterPage';

import SaleOrdersRegisterPage from './pages/SaleOrdersRegisterPage';
import SaleOrdersDetailPage from './pages/SaleOrdersDetailPage';
import SalesOrdersMaterialPlanPage from './pages/SalesOrdersMaterialPlanPage';

import ProductionOrderRegisterPage from './pages/ProductionOrderRegisterPage';
import ProductionOrderDetailPage from './pages/ProductionOrderDetailPage';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const initCSRF = async () => {
    try {
      const response = await api.get('csrf/');
      setCsrfToken(response.data.csrfToken);
    } catch (err) {
      console.error('Failed to init CSRF:', err);
    }
  };

  useEffect(() => {
    initCSRF();
  }, []);

  useEffect(() => {
    // не проверяем авторизацию на странице логина
    if (location.pathname === '/login') {
      setLoading(false);
      return;
    }

    api
      .get('me/')
      .then(() => {
        setIsAuth(true);
      })
      .catch(() => {
        setIsAuth(false);
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [location.pathname]);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* страница логина */}
      <Route path="/login" element={<LoginPage />} />

      {/* защищённые маршруты */}
      {isAuth && (
        <>
          {/* редирект с корня */}
          <Route path="/" element={<Navigate to="/home" />} />

          {/* layout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<div>Головна</div>} />

            <Route path="/sales/orders" element={<SaleOrdersRegisterPage />} />

            <Route
              path="/sales/orders/:id/material-plan"
              element={<SalesOrdersMaterialPlanPage />}
            />

            <Route
              path="/sales/orders/:id"
              element={<SaleOrdersDetailPage />}
            />

            <Route path="/orders/register" element={<OrdersRegisterPage />} />
            <Route path="/orders/new" element={<OrderCreatePage />} />
            <Route
              path="/orders/tolling"
              element={<OrdersTollingRegisterPage />}
            />
            <Route
              path="/orders/tolling/:id"
              element={<OrderTollingDetailsPage />}
            />

            <Route path="/orders/vendors" element={<VendorsPage />} />
            <Route path="/orders/vendors/new" element={<VendorCreatePage />} />
            <Route path="/orders/vendors/:id" element={<VendorDetailPage />} />
            <Route
              path="/orders/vendors/:id/edit"
              element={<VendorEditPage />}
            />

            <Route
              path="/orders/shortage"
              element={<OrdersShortageRegisterPage />}
            />

            <Route
              path="/orders/:id/reclamation"
              element={<OrderReclamationPage />}
            />

            <Route path="/orders/:id/edit" element={<OrderEditPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />

            <Route
              path="/production/orders"
              element={<ProductionOrderRegisterPage />}
            />
            <Route
              path="/production/orders/:id"
              element={<ProductionOrderDetailPage />}
            />
            <Route
              path="/production/products"
              element={<ProductionProductPage />}
            />
            <Route
              path="/production/products/:id/gallery"
              element={<ProductionProductGalleryPage />}
            />
            <Route
              path="/production/products/:id/material-plan"
              element={<ProductionProductMaterialPlanPage />}
            />
            <Route
              path="/production/products/:id/new-step"
              element={<ProductionProductStepCreatePage />}
            />
            <Route
              path="/production/product-steps/:id"
              element={<ProductionProductStepDetailPage />}
            />
            <Route
              path="/production/products/:id"
              element={<ProductionProductDetailPage />}
            />
            <Route
              path="/production/components"
              element={<ProductionComponentsPage />}
            />
            <Route
              path="/production/components/new"
              element={<ProductionComponentCreatePage />}
            />
            <Route
              path="/production/components/:id"
              element={<ProductionComponentDetailPage />}
            />

            <Route
              path="/inventory/pending-intake"
              element={<WarehousePendingIntakePage />}
            />

            <Route
              path="/inventory/tolling-pending-intake"
              element={<WarehouseTollingPendingIntakePage />}
            />

            <Route
              path="/inventory/stock"
              element={<WarehouseStockRegisterPage />}
            />

            <Route
              path="/inventory/movements"
              element={<WarehouseMovementRegisterPage />}
            />

            <Route
              path="/inventory/movements/:id"
              element={<WarehouseMovementDetailPage />}
            />
            <Route
              path="/inventory/production-movements"
              element={<WarehouseProductionMovementRegisterPage />}
            />

            <Route
              path="/inventory/stock/:id"
              element={<WarehouseStockDetailPage />}
            />

            <Route
              path="/inventory/warehouses"
              element={<WarehouseRegisterPage />}
            />
            <Route
              path="/inventory/warehouses/:id"
              element={<WarehouseLocationDetailPage />}
            />
            <Route
              path="/inventory/storage-places/:id"
              element={<WarehouseStoragePlaceDetailPage />}
            />
            <Route
              path="/inventory/storage-topology"
              element={<StoragePlacesRegisterPage />}
            />

            <Route
              path="/inventory/storage-topology/:id"
              element={<StoragePlaceDetailPage />}
            />
            <Route
              path="/organizations"
              element={<OrganisationsRegisterPage />}
            />

            <Route
              path="/organizations/contacts"
              element={<OrganizationContactsRegisterPage />}
            />

            <Route
              path="/organizations/:id"
              element={<OrganizationDetailsPage />}
            />

            <Route path="/user" element={<div>Користувач</div>} />
          </Route>
        </>
      )}

      {/* fallback */}
      {!isAuth && <Route path="*" element={<LoginPage />} />}
    </Routes>
  );
}

export default App;
