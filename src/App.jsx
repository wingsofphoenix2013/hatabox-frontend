import { Routes, Route, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/client";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import LoginPage from "./pages/LoginPage";

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {!isAuth && <Route path="*" element={<LoginPage />} />}

      {isAuth && (
        <>
          <Route path="/" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </>
      )}
    </Routes>
  );
}

export default App;