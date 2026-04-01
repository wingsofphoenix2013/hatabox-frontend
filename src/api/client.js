import axios from 'axios';

let csrfToken = '';

export function setCsrfToken(token) {
  csrfToken = token || '';
}

const api = axios.create({
  baseURL: 'https://hatabox-first.onrender.com/api/',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

export default api;
