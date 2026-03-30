import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/client";

import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import LoginPage from "./pages/LoginPage";

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
      {/* страница логина доступна всегда */}
      <Route path="/login" element={<LoginPage />} />

      {/* защищённые маршруты */}
      {isAuth && (
        <>
          <Route path="/" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </>
      )}

      {/* fallback */}
      {!isAuth && <Route path="*" element={<LoginPage />} />}
    </Routes>
  );
}

export default App;