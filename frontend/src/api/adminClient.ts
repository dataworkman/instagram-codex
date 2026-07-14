import axios from 'axios';

const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const adminApi = axios.create({ baseURL: `${serverBaseUrl}/api/admin`, timeout: 15_000 });
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
adminApi.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 || error.response?.status === 403) {
    localStorage.removeItem('admin_token');
    if (window.location.pathname !== '/admin/login') window.location.href = '/admin/login';
  }
  return Promise.reject(error);
});
export default adminApi;
