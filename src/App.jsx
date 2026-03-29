import { useEffect } from "react";
import api from "./api/client";

function App() {
  useEffect(() => {
    api.get("orders/")
      .then(res => {
        console.log("Orders:", res.data);
      })
      .catch(err => {
        console.error("Error:", err);
      });
  }, []);

  return (
    <div>
      <h1>Hatabox Frontend</h1>
    </div>
  );
}

export default App;