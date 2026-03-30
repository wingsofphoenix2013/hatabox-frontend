import { useState } from "react";
import { Input, Button, Card } from "antd";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await api.post("login/", {
        username,
        password,
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Невірний логін або пароль");
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh"
    }}>
      <Card title="Вхід" style={{ width: 300 }}>
        <Input
          placeholder="Логін"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <Input.Password
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <Button type="primary" block onClick={handleLogin}>
          Увійти
        </Button>
      </Card>
    </div>
  );
}

export default LoginPage;