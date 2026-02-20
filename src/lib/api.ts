import axios from 'axios';

// Replace with your actual backend URL
const API_BASE_URL = 'https://api.expertsec.in/api/'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach tokens automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vendor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle global auth errors (like 401/403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // If token is invalid/expired or access is forbidden, force re-login
    if (status === 401 || status === 403) {
      localStorage.removeItem('vendor_token');
      localStorage.removeItem('vendor_info');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
