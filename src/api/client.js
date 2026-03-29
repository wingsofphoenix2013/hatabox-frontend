import axios from "axios";

const api = axios.create({
  baseURL: "https://hatabox-first.onrender.com/api/",
  withCredentials: true,
});

export default api;