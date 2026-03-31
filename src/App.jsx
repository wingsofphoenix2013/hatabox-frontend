import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/client";

import ProtectedLayout from "./layouts/ProtectedLayout";

import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import LoginPage from "./pages/LoginPage";
import ProductionComponentsPage from "./pages/ProductionComponentsPage";

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // не проверяем авторизацию на странице логина
    if (location.pathname === "/login") {
      setLoading(false);
      return;
    }

    api.get("me/")
      .then(() => {
        setIsAuth(true);
      })
      .catch(() => {
        setIsAuth(false);
        navigate("/login");
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
          <Route path="/" element={<Navigate to="/orders" />} />

          {/* layout */}
          <Route element={<ProtectedLayout />}>
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />

            <Route path="/inventory" element={<div>Склад</div>} />
            <Route path="/sales" element={<div>Продажі</div>} />
            
            <Route path="/production" element={<div>Виробництво</div>} />
            <Route path="/production/components" element={<ProductionComponentsPage />} />
            
            <Route path="/service" element={<div>Сервіс</div>} />
            <Route path="/home" element={<div>Головна</div>} />
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