import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { setCsrfToken } from './api/client';

import ProtectedLayout from './layouts/ProtectedLayout';

import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LoginPage from './pages/LoginPage';

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

            <Route path="/orders/vendors" element={<VendorsPage />} />
            <Route path="/orders/vendors/new" element={<VendorCreatePage />} />
            <Route path="/orders/vendors/:id" element={<VendorDetailPage />} />
            <Route
              path="/orders/vendors/:id/edit"
              element={<VendorEditPage />}
            />

            <Route
              path="/production/products"
              element={<ProductionProductPage />}
            />
            <Route
              path="/production/products/:id"
              element={<ProductionProductDetailPage />}
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
